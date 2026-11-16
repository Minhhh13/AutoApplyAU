import copy
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from contextlib import redirect_stdout

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "check_packet.py"
spec = importlib.util.spec_from_file_location("check_packet", SCRIPT)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class CheckPacketTests(unittest.TestCase):
    def setUp(self):
        self.profile = {"schema_version": 1, "evidence": [
            {"id": "education", "source": "Applicant transcript", "summary": "Verified education", "verified": True}
        ]}
        self.packet = {"schema_version": 1, "application_id": "app-example",
                       "eligibility": {"status": "eligible", "criteria": [
                           {"criterion": "Degree", "verdict": "met", "applicant_evidence_ids": ["education"],
                            "source_url": "https://example.com/program"}]}, "blockers": [], "questions": [
                           {"id": "degree", "prompt": "Which degree?", "kind": "factual", "required": True,
                            "answer": "Example degree", "max_words": 2, "max_characters": 14,
                            "evidence_ids": ["education"], "needs_user_input": False}]}

    def result(self):
        return checker.check(self.packet, self.profile)

    def codes(self):
        return {issue["code"] for issue in self.result()["issues"]}

    def test_complete_grounded_packet_is_mechanically_ready(self):
        self.assertTrue(self.result()["mechanically_ready"])
        self.assertEqual([{"id": "degree", "characters": 14, "words": 2}], self.result()["question_counts"])

    def test_minimal_template_is_not_ready(self):
        self.packet["eligibility"] = {"status": "needs-clarification", "criteria": []}
        self.packet["questions"][0].update(answer=None, evidence_ids=[], needs_user_input=True)
        self.assertFalse(self.result()["mechanically_ready"])
        self.assertTrue({"eligibility_checklist_missing", "required_answer_missing", "user_input_needed"} <= self.codes())

    def test_missing_application_id_is_unresolved_but_other_types_are_malformed(self):
        for identifier in (None, "", " "):
            with self.subTest(identifier=identifier):
                self.packet["application_id"] = identifier
                self.assertIn("missing_application_id", self.codes())
        for identifier in (True, 3, [], {}):
            self.packet["application_id"] = identifier
            with self.subTest(identifier=identifier), self.assertRaises(checker.SchemaError):
                self.result()

    def test_distributed_templates_are_valid_unresolved_drafts(self):
        assets = SCRIPT.parents[1] / "assets"
        output = io.StringIO()
        with redirect_stdout(output):
            code = checker.main([str(assets / "packet.template.json"),
                                 "--profile", str(assets / "profile.template.json")])
        result = json.loads(output.getvalue())
        self.assertEqual(1, code)
        self.assertFalse(result["mechanically_ready"])
        codes = {issue["code"] for issue in result["issues"]}
        self.assertTrue({"missing_application_id", "eligibility_checklist_missing", "blockers_present"} <= codes)

    def test_unicode_counts_and_limits_are_explicit(self):
        question = self.packet["questions"][0]
        question.update(answer="A 😀 é", max_words=2, max_characters=4)
        self.assertEqual(5, self.result()["question_counts"][0]["characters"])
        self.assertEqual(3, self.result()["question_counts"][0]["words"])
        self.assertTrue({"word_limit_exceeded", "character_limit_exceeded"} <= self.codes())

    def test_unverified_and_unknown_evidence_block_readiness(self):
        self.profile["evidence"][0]["verified"] = False
        self.assertIn("unverified_evidence", self.codes())
        self.packet["questions"][0]["evidence_ids"] = ["missing"]
        self.assertIn("unknown_evidence", self.codes())
        self.packet["eligibility"]["criteria"][0]["applicant_evidence_ids"] = ["absent"]
        self.assertIn("unknown_evidence", self.codes())

    def test_factual_and_competency_answers_need_evidence(self):
        for kind in ("factual", "competency"):
            with self.subTest(kind=kind):
                self.packet["questions"][0].update(kind=kind, evidence_ids=[])
                self.assertIn("answer_evidence_missing", self.codes())

    def test_self_report_needs_user_input_flag_honoured(self):
        self.packet["questions"][0].update(kind="self-report", evidence_ids=[], needs_user_input=True)
        self.assertIn("user_input_needed", self.codes())
        self.packet["questions"][0]["needs_user_input"] = False
        self.assertTrue(self.result()["mechanically_ready"])
        self.assertIn("does not verify", self.result()["scope"])

    def test_eligibility_contradictions_and_missing_support_block(self):
        criterion = self.packet["eligibility"]["criteria"][0]
        criterion["verdict"] = "unknown"
        self.assertIn("eligibility_inconsistent", self.codes())
        criterion.update(verdict="met", applicant_evidence_ids=[], source_url="")
        self.assertTrue({"criterion_evidence_missing", "criterion_source_missing"} <= self.codes())
        self.packet["eligibility"]["status"] = "ineligible"
        self.assertIn("eligibility_unresolved_or_ineligible", self.codes())

    def test_explicit_template_tokens_but_not_angle_comparisons(self):
        question = self.packet["questions"][0]
        question.update(max_words=None, max_characters=None)
        for answer in ("[TODO]", "[INSERT NAME]", "{{example}}", "<YOUR ANSWER>"):
            with self.subTest(answer=answer):
                question["answer"] = answer
                self.assertIn("template_token_present", self.codes())
        question["answer"] = "2 < 3 and 4 > 1"
        self.assertNotIn("template_token_present", self.codes())

    def test_missing_fields_invalid_types_and_duplicate_ids_are_schema_errors(self):
        mutations = [lambda p: p.pop("blockers"), lambda p: p.update(schema_version=True),
                     lambda p: p["questions"][0].update(required=1),
                     lambda p: p["questions"][0].update(max_words=True),
                     lambda p: p["questions"][0].update(needs_user_input="false"),
                     lambda p: p["questions"].append(copy.deepcopy(p["questions"][0]))]
        for mutation in mutations:
            packet = copy.deepcopy(self.packet)
            mutation(packet)
            with self.subTest(packet=packet), self.assertRaises(checker.SchemaError):
                checker.check(packet, self.profile)
        for verified in ("true", 1, None):
            self.profile["evidence"][0]["verified"] = verified
            with self.subTest(verified=verified), self.assertRaises(checker.SchemaError):
                self.result()

    def test_duplicate_evidence_and_empty_verified_sources_are_schema_errors(self):
        self.profile["evidence"].append(copy.deepcopy(self.profile["evidence"][0]))
        with self.assertRaises(checker.SchemaError):
            self.result()
        self.profile["evidence"].pop()
        for name in ("source", "summary"):
            profile = copy.deepcopy(self.profile)
            profile["evidence"][0][name] = " "
            with self.subTest(field=name), self.assertRaises(checker.SchemaError):
                checker.check(self.packet, profile)

    def test_report_omits_answers_prompts_and_blocker_text(self):
        secret = "PRIVATE-APPLICANT-DETAIL"
        self.packet["questions"][0].update(answer=secret, prompt=secret)
        self.packet["blockers"] = [secret]
        self.profile["evidence"][0].update(source=secret, summary=secret)
        self.assertNotIn(secret, json.dumps(self.result()))

    def test_cli_exit_codes_and_no_submission_side_effects(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            packet_path, profile_path = directory / "packet.json", directory / "profile.json"
            profile_path.write_text(json.dumps(self.profile), encoding="utf-8")
            for expected, mutate in ((0, lambda p: None), (1, lambda p: p.update(blockers=["Missing input"])),
                                     (2, lambda p: p.pop("questions"))):
                packet = copy.deepcopy(self.packet)
                mutate(packet)
                packet_path.write_text(json.dumps(packet), encoding="utf-8")
                original = packet_path.read_bytes()
                output = io.StringIO()
                with redirect_stdout(output):
                    code = checker.main([str(packet_path), "--profile", str(profile_path)])
                self.assertEqual(expected, code)
                self.assertIn("mechanically_ready", json.loads(output.getvalue()))
                self.assertEqual(original, packet_path.read_bytes())
                self.assertEqual({"packet.json", "profile.json"}, {p.name for p in directory.iterdir()})


if __name__ == "__main__":
    unittest.main()
