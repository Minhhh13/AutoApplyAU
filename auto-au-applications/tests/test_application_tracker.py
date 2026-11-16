import csv
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "application_tracker.py"
spec = importlib.util.spec_from_file_location("application_tracker", SCRIPT)
tracker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tracker)


class ApplicationTrackerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        tracker.init(self.directory)

    def add(self, **kwargs):
        defaults = dict(employer="Example Australia", program="Graduate Program", intake="2027",
                        url="https://example.com/jobs?id=12")
        defaults.update(kwargs)
        return tracker.add(self.directory, **defaults)

    def test_init_is_idempotent_without_overwrite(self):
        self.add()
        original = (self.directory / tracker.STORE_NAME).read_bytes()
        self.assertFalse(tracker.init(self.directory)["created"])
        self.assertEqual(original, (self.directory / tracker.STORE_NAME).read_bytes())

    def test_identity_duplicates_return_original_without_mutation(self):
        first = self.add()["application"]
        original = (self.directory / tracker.STORE_NAME).read_bytes()
        duplicate = self.add(employer=" EXAMPLE  Australia ", program="graduate program")
        self.assertTrue(duplicate["duplicate"])
        self.assertEqual(first, duplicate["application"])
        self.assertEqual(original, (self.directory / tracker.STORE_NAME).read_bytes())

    def test_tracking_parameters_deduplicate_but_job_ids_are_preserved(self):
        first = self.add(url="https://example.com/jobs?id=12&utm_source=board")["application"]
        duplicate = self.add(program="Graduate scheme", url="https://EXAMPLE.com/jobs?utm_campaign=x&id=12")
        self.assertEqual(first["id"], duplicate["application"]["id"])
        distinct = self.add(program="Internship", url="https://example.com/jobs?id=13")
        self.assertTrue(distinct["created"])
        self.assertNotEqual(first["id"], distinct["application"]["id"])
        self.assertNotEqual(tracker.canonical_url("https://example.com/jobs#12"),
                            tracker.canonical_url("https://example.com/jobs#13"))

    def test_new_intake_is_distinct_and_id_is_stable(self):
        first = self.add()["application"]
        second = self.add(intake="2028", url="https://example.com/jobs?id=14")["application"]
        self.assertNotEqual(first["id"], second["id"])
        self.assertEqual(first["id"], tracker.application_id("EXAMPLE AUSTRALIA", "Graduate Program", "2027"))

    def test_annual_url_can_be_reused_by_a_new_intake(self):
        first = self.add(intake="2027", url="https://example.com/graduates")["application"]
        second = self.add(intake="2028", url="https://example.com/graduates")
        self.assertTrue(second["created"])
        self.assertNotEqual(first["id"], second["application"]["id"])
        duplicate = self.add(program="Graduate opportunities", intake=" 2028 ",
                             url="https://example.com/graduates?utm_source=board")
        self.assertTrue(duplicate["duplicate"])
        self.assertEqual(second["application"]["id"], duplicate["application"]["id"])
        self.assertEqual(2, len(tracker.read_store(self.directory)["applications"]))

    def test_distinct_locations_streams_and_requisitions_are_trackable(self):
        first = self.add(location="Sydney", stream="Engineering", requisition_id="SYD-1",
                         url="https://example.com/jobs?id=101")["application"]
        second = self.add(location="Melbourne", stream="Engineering", requisition_id="MEL-1",
                          url="https://example.com/jobs?id=102")
        third = self.add(location="Sydney", stream="Data", requisition_id="SYD-2",
                         url="https://example.com/jobs?id=103")
        self.assertTrue(second["created"])
        self.assertTrue(third["created"])
        self.assertEqual(3, len({first["id"], second["application"]["id"], third["application"]["id"]}))
        duplicate = self.add(location=" SYDNEY ", stream="engineering", requisition_id="syd-1",
                             url="https://example.com/jobs?id=201")
        self.assertTrue(duplicate["duplicate"])
        self.assertEqual(first["id"], duplicate["application"]["id"])
        changed_title = self.add(program="Engineering graduate opportunities", location="Sydney",
                                 stream="Engineering", requisition_id="SYD-1",
                                 url="https://example.com/jobs?id=101&utm_source=board")
        self.assertTrue(changed_title["duplicate"])
        self.assertEqual(first["id"], changed_title["application"]["id"])

    def test_old_records_keep_ids_when_requisition_field_is_absent(self):
        old = self.add(location="Sydney")["application"]
        data = tracker.read_store(self.directory)
        data["applications"][0].pop("requisition_id")
        tracker.write_store(self.directory, data)
        duplicate = self.add(location="Sydney", url="https://example.com/jobs?id=999")
        self.assertTrue(duplicate["duplicate"])
        self.assertEqual(old["id"], duplicate["application"]["id"])

    def test_malformed_and_empty_store_are_preserved(self):
        for invalid in ("", "{", "{}", '{"schema_version":1,"applications":[{}]}'):
            with self.subTest(invalid=invalid):
                path = self.directory / tracker.STORE_NAME
                path.write_text(invalid, encoding="utf-8")
                with self.assertRaises(tracker.TrackerError):
                    tracker.init(self.directory)
                self.assertEqual(invalid, path.read_text(encoding="utf-8"))

    def test_malformed_optional_identity_fields_are_preserved(self):
        self.add()
        path = self.directory / tracker.STORE_NAME
        data = tracker.read_store(self.directory)
        data["applications"][0]["requisition_id"] = None
        path.write_text(json.dumps(data), encoding="utf-8")
        original = path.read_bytes()
        with self.assertRaises(tracker.TrackerError):
            self.add()
        self.assertEqual(original, path.read_bytes())

    def test_submitted_requires_observed_confirmation(self):
        identifier = self.add()["application"]["id"]
        original = (self.directory / tracker.STORE_NAME).read_bytes()
        with self.assertRaises(tracker.TrackerError):
            tracker.update(self.directory, identifier, "submitted")
        self.assertEqual(original, (self.directory / tracker.STORE_NAME).read_bytes())
        result = tracker.update(self.directory, identifier, "submitted", confirmation="Application received: TEST-1")
        self.assertEqual("submitted", result["application"]["status"])
        with self.assertRaises(tracker.TrackerError):
            tracker.update(self.directory, identifier, "filled")

    def test_pending_and_unknown_attempts_need_reconciliation(self):
        identifier = self.add()["application"]["id"]
        tracker.update(self.directory, identifier, "filled")
        tracker.update(self.directory, identifier, "submission-pending")
        with self.assertRaises(tracker.TrackerError):
            tracker.update(self.directory, identifier, "ready")
        tracker.update(self.directory, identifier, "submission-unknown")
        with self.assertRaises(tracker.TrackerError):
            tracker.update(self.directory, identifier, "filled", note="retry")
        result = tracker.update(self.directory, identifier, "ready",
                                note="Employer portal confirms no application was received",
                                evidence_url="https://example.com/my-applications")
        self.assertEqual("ready", result["application"]["status"])

    def test_uncertain_submission_can_be_confirmed_without_retry(self):
        identifier = self.add()["application"]["id"]
        tracker.update(self.directory, identifier, "ready")
        tracker.update(self.directory, identifier, "submission-pending")
        tracker.update(self.directory, identifier, "submission-unknown")
        confirmed = tracker.update(self.directory, identifier, "submitted",
                                   confirmation="Portal shows submitted 2026-11-16")
        self.assertEqual("submitted", confirmed["application"]["status"])
        self.assertEqual(5, len(confirmed["application"]["history"]))

    def test_prior_interrupted_attempt_can_be_imported_without_invented_progress(self):
        identifier = self.add()["application"]["id"]
        with self.assertRaises(tracker.TrackerError):
            tracker.update(self.directory, identifier, "submission-unknown")
        uncertain = tracker.update(self.directory, identifier, "submission-unknown",
                                   note="Applicant reports submitting before the browser crashed")
        self.assertEqual(["shortlisted", "submission-unknown"],
                         [event["status"] for event in uncertain["application"]["history"]])
        self.assertEqual("", uncertain["application"]["evidence_url"])
        with self.assertRaises(tracker.TrackerError):
            tracker.update(self.directory, identifier, "ready", note="Try again")
        with self.assertRaises(tracker.TrackerError):
            tracker.update(self.directory, identifier, "submission-pending", note="Try again")

    def test_exclusive_lock_blocks_a_second_writer(self):
        with tracker.locked(self.directory):
            with self.assertRaises(tracker.TrackerError):
                self.add()
            self.assertTrue((self.directory / ".applications.lock").exists())
        self.assertFalse((self.directory / ".applications.lock").exists())
        self.assertTrue(self.add()["created"])

    def test_export_neutralises_formula_injection_and_preserves_files(self):
        self.add(employer=" =HYPERLINK(\"https://example.com\")", location="@SUM(1,1)")
        output = self.directory / "export.csv"
        tracker.export_csv(self.directory, output)
        with output.open(encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
        self.assertTrue(rows[0]["employer"].startswith("'"))
        self.assertTrue(rows[0]["location"].startswith("'"))
        original = output.read_bytes()
        with self.assertRaises(FileExistsError):
            tracker.export_csv(self.directory, output)
        self.assertEqual(original, output.read_bytes())
        with self.assertRaises(tracker.TrackerError):
            tracker.export_csv(self.directory, self.directory / tracker.STORE_NAME)

    def test_invalid_urls_and_credentials_rejected(self):
        for value in ("file:///tmp/x", "https://user:secret@example.com/job", "https://example.com:no/job"):
            with self.subTest(value=value), self.assertRaises(tracker.TrackerError):
                self.add(url=value)

    def test_cli_returns_json_for_success_and_error(self):
        output = io.StringIO()
        with redirect_stdout(output):
            code = tracker.main(["list", "--directory", str(self.directory)])
        self.assertEqual(0, code)
        self.assertEqual({"applications": []}, json.loads(output.getvalue()))
        errors = io.StringIO()
        with redirect_stderr(errors):
            code = tracker.main(["list", "--directory", str(self.directory / "missing")])
        self.assertEqual(2, code)
        self.assertIn("error", json.loads(errors.getvalue()))


if __name__ == "__main__":
    unittest.main()
