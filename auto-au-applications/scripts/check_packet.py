#!/usr/bin/env python3
"""Check local application content; never fills or submits an application."""

import argparse
import json
from pathlib import Path
import re
import sys

PLACEHOLDER = re.compile(r"\[TODO\]|\[INSERT[^\]]*\]|\{\{[\s\S]*?\}\}|<YOUR[^>]*>", re.I)
KINDS = {"factual", "competency", "motivation", "self-report", "other"}
VERDICTS = {"met", "not-met", "unknown"}
ELIGIBILITY = {"eligible", "ineligible", "needs-clarification"}


class SchemaError(Exception):
    def __init__(self, location, code):
        self.location, self.code = location, code


def require(condition, location, code):
    if not condition:
        raise SchemaError(location, code)


def field(obj, name, kind, location):
    require(isinstance(obj, dict), location, "expected_object")
    require(name in obj, f"{location}.{name}", "missing_field")
    value = obj[name]
    require(type(value) is kind, f"{location}.{name}", f"expected_{kind.__name__}")
    return value


def nonempty(value, location):
    require(bool(value.strip()), location, "empty_string")
    return value


def string_ids(obj, name, location):
    values = field(obj, name, list, location)
    seen = set()
    for index, value in enumerate(values):
        item_location = f"{location}.{name}[{index}]"
        require(type(value) is str, item_location, "expected_str")
        nonempty(value, item_location)
        require(value not in seen, item_location, "duplicate_id")
        seen.add(value)
    return values


def version(obj, location):
    require(field(obj, "schema_version", int, location) == 1,
            f"{location}.schema_version", "unsupported_schema_version")


def validate_profile(profile):
    version(profile, "profile")
    evidence = field(profile, "evidence", list, "profile")
    by_id = {}
    for index, item in enumerate(evidence):
        location = f"profile.evidence[{index}]"
        identifier = nonempty(field(item, "id", str, location), location + ".id")
        require(identifier not in by_id, location + ".id", "duplicate_id")
        source = field(item, "source", str, location)
        summary = field(item, "summary", str, location)
        verified = field(item, "verified", bool, location)
        if verified:
            nonempty(source, location + ".source")
            nonempty(summary, location + ".summary")
        by_id[identifier] = item
    return by_id


def validate_packet(packet):
    version(packet, "packet")
    require("application_id" in packet, "packet.application_id", "missing_field")
    require(packet["application_id"] is None or type(packet["application_id"]) is str,
            "packet.application_id", "expected_str_or_null")
    eligibility = field(packet, "eligibility", dict, "packet")
    status = field(eligibility, "status", str, "packet.eligibility")
    require(status in ELIGIBILITY, "packet.eligibility.status", "unsupported_status")
    criteria = field(eligibility, "criteria", list, "packet.eligibility")
    for index, item in enumerate(criteria):
        location = f"packet.eligibility.criteria[{index}]"
        nonempty(field(item, "criterion", str, location), location + ".criterion")
        require(field(item, "verdict", str, location) in VERDICTS,
                location + ".verdict", "unsupported_verdict")
        string_ids(item, "applicant_evidence_ids", location)
        field(item, "source_url", str, location)
    blockers = field(packet, "blockers", list, "packet")
    for index, value in enumerate(blockers):
        require(type(value) is str, f"packet.blockers[{index}]", "expected_str")
        nonempty(value, f"packet.blockers[{index}]")
    questions = field(packet, "questions", list, "packet")
    seen = set()
    for index, item in enumerate(questions):
        location = f"packet.questions[{index}]"
        identifier = nonempty(field(item, "id", str, location), location + ".id")
        require(identifier not in seen, location + ".id", "duplicate_id")
        seen.add(identifier)
        nonempty(field(item, "prompt", str, location), location + ".prompt")
        require(field(item, "kind", str, location) in KINDS, location + ".kind", "unsupported_kind")
        field(item, "required", bool, location)
        field(item, "needs_user_input", bool, location)
        require("answer" in item, location + ".answer", "missing_field")
        require(item["answer"] is None or type(item["answer"]) is str,
                location + ".answer", "expected_str_or_null")
        for name in ("max_words", "max_characters"):
            require(name in item, location + "." + name, "missing_field")
            limit = item[name]
            require(limit is None or (type(limit) is int and limit >= 0),
                    location + "." + name, "expected_nonnegative_int_or_null")
        string_ids(item, "evidence_ids", location)
    return eligibility, blockers, questions


def check(packet, profile):
    evidence = validate_profile(profile)
    eligibility, blockers, questions = validate_packet(packet)
    issues = []

    def issue(location, code):
        issues.append({"location": location, "code": code})

    def check_evidence(identifiers, location):
        for index, identifier in enumerate(identifiers):
            code = "unknown_evidence" if identifier not in evidence else (
                "unverified_evidence" if not evidence[identifier]["verified"] else None)
            if code:
                issue(f"{location}[{index}]", code)

    if not (packet["application_id"] or "").strip():
        issue("packet.application_id", "missing_application_id")
    criteria = eligibility["criteria"]
    if eligibility["status"] != "eligible":
        issue("packet.eligibility.status", "eligibility_unresolved_or_ineligible")
    if not criteria:
        issue("packet.eligibility.criteria", "eligibility_checklist_missing")
    for index, item in enumerate(criteria):
        location = f"packet.eligibility.criteria[{index}]"
        if item["verdict"] != "met":
            issue(location + ".verdict", "criterion_not_met_or_unknown")
            if eligibility["status"] == "eligible":
                issue("packet.eligibility.status", "eligibility_inconsistent")
        if item["verdict"] == "met":
            if not item["source_url"].strip():
                issue(location + ".source_url", "criterion_source_missing")
            if not item["applicant_evidence_ids"]:
                issue(location + ".applicant_evidence_ids", "criterion_evidence_missing")
        check_evidence(item["applicant_evidence_ids"], location + ".applicant_evidence_ids")
    if blockers:
        issue("packet.blockers", "blockers_present")
    counts = []
    for index, item in enumerate(questions):
        location = f"packet.questions[{index}]"
        answer = item["answer"] or ""
        characters, words = len(answer), len(answer.split())
        counts.append({"id": item["id"], "characters": characters, "words": words})
        if item["required"] and not answer.strip():
            issue(location + ".answer", "required_answer_missing")
        if item["needs_user_input"]:
            issue(location + ".needs_user_input", "user_input_needed")
        if item["max_words"] is not None and words > item["max_words"]:
            issue(location + ".answer", "word_limit_exceeded")
        if item["max_characters"] is not None and characters > item["max_characters"]:
            issue(location + ".answer", "character_limit_exceeded")
        if PLACEHOLDER.search(answer):
            issue(location + ".answer", "template_token_present")
        check_evidence(item["evidence_ids"], location + ".evidence_ids")
        if answer.strip() and item["kind"] in {"factual", "competency"} and not item["evidence_ids"]:
            issue(location + ".evidence_ids", "answer_evidence_missing")
    return {
        "mechanically_ready": not issues, "issues": issues, "question_counts": counts,
        "counting": "Characters are Unicode code points; words are whitespace-delimited tokens. Portal rules may differ.",
        "scope": "Mechanical content checks only; does not verify truth, applicant consent, portal completion or submission.",
    }


def read_json(path, location):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise SchemaError(location, "io_error") from exc
    except (ValueError, UnicodeError) as exc:
        raise SchemaError(location, "invalid_json") from exc


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("packet", metavar="PACKET", type=Path)
    parser.add_argument("--profile", required=True, metavar="PROFILE", type=Path)
    args = parser.parse_args(argv)
    try:
        result = check(read_json(args.packet, "packet"), read_json(args.profile, "profile"))
        code = 0 if result["mechanically_ready"] else 1
    except SchemaError as exc:
        result = {"mechanically_ready": False, "issues": [{"location": exc.location, "code": exc.code}]}
        code = 2
    print(json.dumps(result, ensure_ascii=True))
    return code


if __name__ == "__main__":
    sys.exit(main())
