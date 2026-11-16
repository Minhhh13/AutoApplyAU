#!/usr/bin/env python3
"""Local application records only: this program never sends an application."""

import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import unicodedata
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

STATUSES = (
    "shortlisted", "researching", "needs-info", "drafting", "ready", "filled",
    "submission-pending", "submitted", "submission-unknown", "assessment",
    "interview", "offer", "rejected", "withdrawn", "closed",
)
EDITABLE = set(STATUSES[:6])
UNRESOLVED = {"submission-pending", "submission-unknown"}
FOLLOW_UP = {"assessment", "interview", "offer", "rejected", "withdrawn", "closed"}
STORE_NAME = "applications.json"
SHEET_COLUMNS = (
    ("Application ID", "id"), ("Employer", "employer"), ("Program", "program"),
    ("Intake", "intake"), ("Program type", "program_type"), ("Stream", "stream"),
    ("Location", "location"), ("Requisition ID", "requisition_id"), ("Status", "status"),
    ("Public listing URL", "public_url"), ("Created (UTC)", "created_at"), ("Updated (UTC)", "updated_at"),
)


class TrackerError(Exception):
    pass


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def normalise(value):
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def canonical_url(value):
    try:
        parts = urlsplit(value.strip())
        if parts.scheme.lower() not in {"http", "https"} or not parts.hostname:
            raise ValueError("expected an http(s) application URL")
        if parts.username is not None or parts.password is not None:
            raise ValueError("URLs must not contain credentials")
        parts.port  # Validate malformed ports as well.
    except ValueError as exc:
        raise TrackerError(f"Invalid URL: {exc}") from exc
    tracking = {"gclid", "fbclid", "msclkid", "_ga", "_gl"}
    query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
             if not k.casefold().startswith("utm_") and k.casefold() not in tracking]
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(),
                      parts.path or "/", urlencode(sorted(query)), parts.fragment))


def identity(employer, program, intake, stream="", location="", requisition_id=""):
    core = tuple(normalise(v) for v in (employer, program, intake))
    specifics = tuple(normalise(v) for v in (stream, location, requisition_id))
    return core + specifics if any(specifics) else core


def application_id(employer, program, intake, stream="", location="", requisition_id=""):
    payload = json.dumps(identity(employer, program, intake, stream, location, requisition_id), ensure_ascii=False)
    return "app-" + hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def spreadsheet_key(value):
    value = value.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]+", value):
        return value
    # Keep only the workbook ID. The gid for the verified tab is supplied separately.
    match = re.fullmatch(
        r"https://docs\.google\.com/spreadsheets/(?:u/\d+/)?d/([A-Za-z0-9_-]+)(?:[/?#][^\s]*)?",
        value,
    )
    if match:
        return match[1]
    raise TrackerError("Expected a Google spreadsheet ID or https://docs.google.com/spreadsheets/d/ link")


def validate_sheet_state(state, ids):
    if not isinstance(state, dict):
        raise ValueError("invalid Google Sheet binding")
    if not isinstance(state.get("spreadsheet_id"), str) or not re.fullmatch(r"[A-Za-z0-9_-]+", state["spreadsheet_id"]):
        raise ValueError("invalid bound spreadsheet ID")
    if type(state.get("sheet_id")) is not int or not 0 <= state["sheet_id"] <= 2147483647:
        raise ValueError("invalid bound sheet ID")
    if not isinstance(state.get("generation"), str) or not re.fullmatch(r"[a-f0-9]{32}", state["generation"]):
        raise ValueError("invalid Google Sheet binding generation")
    for key in ("deferred", "acknowledged"):
        versions = state.get(key)
        if not isinstance(versions, dict) or any(
            app not in ids or not isinstance(version, str) or not re.fullmatch(r"[a-f0-9]{64}", version)
            for app, version in versions.items()
        ):
            raise ValueError(f"invalid Google Sheet {key} revisions")


def read_store(directory):
    path = directory / STORE_NAME
    if not path.is_file():
        raise TrackerError("Tracker not found. Run init first; existing data will not be reset.")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or data.get("schema_version") != 1:
            raise ValueError("unsupported schema_version")
        records = data.get("applications")
        if not isinstance(records, list):
            raise ValueError("applications must be an array")
        seen = set()
        for record in records:
            if not isinstance(record, dict):
                raise ValueError("application must be an object")
            for field in ("id", "employer", "program", "intake", "url", "canonical_url",
                          "created_at", "updated_at"):
                if not isinstance(record.get(field), str) or not record[field].strip():
                    raise ValueError(f"missing or invalid application field: {field}")
            for field in ("location", "program_type", "stream", "requisition_id", "confirmation", "evidence_url", "public_url"):
                if field in record and not isinstance(record[field], str):
                    raise ValueError(f"invalid application field: {field}")
            if record["id"] in seen or not re.fullmatch(r"app-[a-f0-9]{16}", record["id"]):
                raise ValueError("duplicate or invalid application ID")
            seen.add(record["id"])
            if record.get("status") not in STATUSES or not isinstance(record.get("history"), list):
                raise ValueError("invalid status or history")
            if canonical_url(record["url"]) != record["canonical_url"]:
                raise ValueError("canonical URL does not match URL")
            if record.get("public_url"):
                canonical_url(record["public_url"])
            if record["status"] == "submitted" and not str(record.get("confirmation", "")).strip():
                raise ValueError("submitted record has no observed confirmation")
        if "google_sheet" in data:
            validate_sheet_state(data["google_sheet"], seen)
        return data
    except (ValueError, TypeError, TrackerError) as exc:
        raise TrackerError(f"Invalid tracker; left unchanged: {exc}") from exc


@contextmanager
def locked(directory):
    lock_path = directory / ".applications.lock"
    try:
        descriptor = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError as exc:
        raise TrackerError("Tracker is locked. Retry after the other writer finishes. If it crashed, "
                           "verify no writer is running before manually removing .applications.lock.") from exc
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump({"pid": os.getpid(), "created_at": now()}, handle)
        yield
    finally:
        lock_path.unlink()


def write_store(directory, data):
    temporary = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=directory,
                                         prefix=".applications-", suffix=".tmp", delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, directory / STORE_NAME)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def init(directory):
    directory.mkdir(parents=True, exist_ok=True)
    with locked(directory):
        if (directory / STORE_NAME).exists():
            data = read_store(directory)
            return {"created": False, "count": len(data["applications"])}
        write_store(directory, {"schema_version": 1, "applications": []})
        return {"created": True, "count": 0}


def add(directory, employer, program, intake, url, location="", program_type="", stream="", requisition_id="", public_url=""):
    for label, value in (("employer", employer), ("program", program), ("intake", intake)):
        if not value.strip():
            raise TrackerError(f"{label} must not be empty")
    canonical = canonical_url(url)
    public_url = canonical_url(public_url) if public_url else ""
    key = identity(employer, program, intake, stream, location, requisition_id)
    with locked(directory):
        data = read_store(directory)
        for record in data["applications"]:
            same_identity = identity(record["employer"], record["program"], record["intake"],
                                     record.get("stream", ""), record.get("location", ""),
                                     record.get("requisition_id", "")) == key
            same_intake_url = (normalise(record["intake"]) == normalise(intake)
                               and record["canonical_url"] == canonical)
            if same_identity or same_intake_url:
                if public_url and not record.get("public_url"):
                    record["public_url"] = public_url
                    record["updated_at"] = now()
                    write_store(directory, data)
                return {"created": False, "duplicate": True, "application": record}
        stamp = now()
        record = {
            "id": application_id(employer, program, intake, stream, location, requisition_id),
            "employer": employer.strip(),
            "program": program.strip(), "intake": intake.strip(), "url": url.strip(),
            "canonical_url": canonical, "location": location, "program_type": program_type,
            "stream": stream, "requisition_id": requisition_id,
            "status": "shortlisted", "created_at": stamp,
            "updated_at": stamp, "confirmation": "", "evidence_url": "",
            "history": [{"at": stamp, "status": "shortlisted"}],
        }
        if public_url:
            record["public_url"] = public_url
        data["applications"].append(record)
        write_store(directory, data)
        return {"created": True, "duplicate": False, "application": record}


def validate_transition(record, status, note, confirmation, evidence_url):
    previous = record["status"]
    if status == "submitted" and not (confirmation or record.get("confirmation", "")).strip():
        raise TrackerError("submitted requires --confirmation containing an observed receipt or "
                           "portal success message; a click or attempted submission is insufficient.")
    if previous in UNRESOLVED and status in EDITABLE and not (note.strip() and evidence_url.strip()):
        raise TrackerError("Unresolved submission: check the employer portal before retrying. "
                           "Returning to an editable status requires --note and --evidence-url "
                           "documenting that no application was received.")
    if previous in UNRESOLVED and status in FOLLOW_UP and not (note.strip() and evidence_url.strip()):
        raise TrackerError("Resolving an uncertain submission requires --note and --evidence-url.")
    if previous == "submitted" or previous in FOLLOW_UP:
        if status in EDITABLE or status in UNRESOLVED:
            raise TrackerError("A submitted or progressed application cannot be reset for resubmission.")
    if status == "submission-pending" and previous == "submission-pending":
        raise TrackerError("A submission attempt is already pending. Do not submit again; reconcile with the portal.")
    if status == "submission-pending" and previous not in {"ready", "filled"}:
        raise TrackerError("Mark ready or filled before recording a submission attempt.")
    if status == "submission-unknown" and previous not in UNRESOLVED:
        if previous not in EDITABLE or not note.strip():
            raise TrackerError("submission-unknown requires a recorded submission-pending attempt, "
                               "or --note documenting a known prior interrupted attempt.")


def update(directory, identifier, status, note="", confirmation="", evidence_url="", expect_status=None):
    if status not in STATUSES:
        raise TrackerError("Unknown application status")
    if evidence_url:
        canonical_url(evidence_url)  # Validate without changing the actual evidence link.
    with locked(directory):
        data = read_store(directory)
        record = next((r for r in data["applications"] if r["id"] == identifier), None)
        if record is None:
            raise TrackerError("Application ID not found")
        if expect_status is not None and record["status"] != expect_status:
            raise TrackerError(f"Expected {expect_status} but found {record['status']}. Re-read the application before acting.")
        validate_transition(record, status, note, confirmation, evidence_url)
        event = {"at": now(), "status": status}
        for key, value in (("note", note), ("confirmation", confirmation), ("evidence_url", evidence_url)):
            if value:
                event[key] = value
                if key != "note":
                    record[key] = value
        record["status"] = status
        record["updated_at"] = event["at"]
        record["history"].append(event)
        write_store(directory, data)
        return {"application": record}


def safe_csv(value):
    value = str(value)
    return "'" + value if value.lstrip().startswith(("=", "+", "-", "@")) or value.startswith(("\t", "\r")) else value


def export_csv(directory, output):
    records = read_store(directory)["applications"]
    fields = ["id", "employer", "program", "intake", "program_type", "stream", "location", "requisition_id",
              "status", "url", "confirmation", "evidence_url", "created_at", "updated_at"]
    if output.resolve() == (directory / STORE_NAME).resolve():
        raise TrackerError("CSV output must not replace the JSON tracker")
    # Exclusive creation protects previous exports and unrelated files.
    with output.open("x", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for record in records:
            writer.writerow({key: safe_csv(record.get(key, "")) for key in fields})
    return {"exported": len(records), "output": str(output.resolve())}


def sheet_destination(state):
    return {key: state[key] for key in ("spreadsheet_id", "sheet_id")}


def sheet_row(record, state):
    # Keep private notes, receipts, signed application links and applicant profile fields local.
    values = [record.get(field, "") for _, field in SHEET_COLUMNS]
    payload = json.dumps([state["generation"], values], ensure_ascii=False, separators=(",", ":"))
    revision = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return {"id": record["id"], "revision": revision, "values": values}


def sheet_bind(directory, spreadsheet_id, sheet_id, replace=False, include_existing=False, include_id=()):
    destination = {"spreadsheet_id": spreadsheet_key(spreadsheet_id), "sheet_id": sheet_id}
    if type(sheet_id) is not int or not 0 <= sheet_id <= 2147483647:
        raise TrackerError("Expected the non-negative numeric Google tab ID (gid)")
    with locked(directory):
        data = read_store(directory)
        records = data["applications"]
        selected = set(include_id)
        if selected.difference(record["id"] for record in records):
            raise TrackerError("Application ID not found")
        state = data.get("google_sheet")
        changed = state is None or sheet_destination(state) != destination
        if changed:
            if state is not None and not replace:
                raise TrackerError("A different Google Sheet is bound; use --replace to change the destination")
            state = dict(destination, generation=uuid.uuid4().hex, acknowledged={}, deferred={})
            data["google_sheet"] = state
            if not include_existing:
                state["deferred"] = {r["id"]: sheet_row(r, state)["revision"] for r in records}
        if include_existing:
            selected.update(state["deferred"])
        for identifier in selected:
            if identifier in state["deferred"]:
                del state["deferred"][identifier]
                changed = True
        if changed:
            write_store(directory, data)
        return {"binding": destination, "changed": changed}


def sheet_unbind(directory):
    with locked(directory):
        data = read_store(directory)
        changed = data.pop("google_sheet", None) is not None
        if changed:
            write_store(directory, data)
        return {"binding": None, "changed": changed}


def sheet_pending(directory, identifier=None, audit=False):
    data = read_store(directory)
    state = data.get("google_sheet")
    result = {"binding": sheet_destination(state) if state else None,
              "headers": [title for title, _ in SHEET_COLUMNS], "rows": []}
    if state is None:
        return result
    records = data["applications"]
    if identifier:
        records = [r for r in records if r["id"] == identifier]
        if not records:
            raise TrackerError("Application ID not found")
    for record in records:
        row = sheet_row(record, state)
        deferred = state["deferred"].get(row["id"]) == row["revision"]
        acknowledged = state["acknowledged"].get(row["id"]) == row["revision"]
        if not deferred and (audit or not acknowledged):
            result["rows"].append(row)
    return result


def sheet_ack(directory, identifier, revision):
    if not re.fullmatch(r"[a-f0-9]{64}", revision):
        raise TrackerError("Expected a sheet revision returned by sheet-pending")
    with locked(directory):
        data = read_store(directory)
        state = data.get("google_sheet")
        if not state:
            raise TrackerError("No Google Sheet is bound")
        record = next((r for r in data["applications"] if r["id"] == identifier), None)
        if record is None:
            raise TrackerError("Application ID not found")
        current = sheet_row(record, state)["revision"]
        if revision != current:
            # A late remote write could have overwritten even a previously verified row.
            if state["acknowledged"].pop(identifier, None) is not None:
                write_store(directory, data)
            raise TrackerError("Stale sheet revision or changed binding; re-read the pending row and verify the target")
        if state["deferred"].get(identifier) == revision:
            raise TrackerError("Existing application has not been selected for Google Sheets")
        if state["acknowledged"].get(identifier) != revision:
            state["acknowledged"][identifier] = revision
            state["deferred"].pop(identifier, None)
            write_store(directory, data)
        return {"id": identifier, "acknowledged": True}


def parser():
    cli = argparse.ArgumentParser(description=__doc__)
    subcommands = cli.add_subparsers(dest="command", required=True)
    for name, help_text in (("init", "Create an empty tracker without overwriting existing data"),
                            ("add", "Add a listing; return existing record on a duplicate"),
                            ("list", "Read applications, optionally filtered by status"),
                            ("update", "Record status and observed evidence; never submits forms"),
                            ("export", "Create a new CSV file; existing files are preserved"),
                            ("sheet-bind", "Bind the workspace to a verified Google spreadsheet and tab"),
                            ("sheet-unbind", "Stop mirroring this workspace; keep local applications and existing sheet rows"),
                            ("sheet-pending", "List literal sheet rows that still need remote verification"),
                            ("sheet-ack", "Acknowledge one revision after remote readback")):
        command = subcommands.add_parser(name, help=help_text)
        command.add_argument("--directory", required=True, type=Path, help="Local application workspace")
        if name == "add":
            for field in ("employer", "program", "intake", "url"):
                command.add_argument("--" + field, required=True)
            for field in ("location", "program-type", "stream", "requisition-id"):
                command.add_argument("--" + field, default="")
            command.add_argument("--public-url", default="", help="Verified public job listing URL for Google Sheets")
        elif name == "list":
            command.add_argument("--status", choices=STATUSES)
        elif name == "update":
            command.add_argument("--id", dest="identifier", required=True)
            command.add_argument("--status", choices=STATUSES, required=True)
            command.add_argument("--expect-status", choices=STATUSES, help="Update only if the stored status still matches")
            command.add_argument("--note", default="", help="Observed change, known prior interrupted attempt, or reconciliation details")
            command.add_argument("--confirmation", default="", help="Actual observed submission receipt/success text")
            command.add_argument("--evidence-url", default="", help="Employer portal or confirmation page URL")
        elif name == "export":
            command.add_argument("--output", type=Path, required=True)
        elif name == "sheet-bind":
            command.add_argument("--spreadsheet-id", required=True, help="Google spreadsheet ID or link")
            command.add_argument("--sheet-id", required=True, type=int, help="Numeric tab ID (gid)")
            command.add_argument("--replace", action="store_true", help="Switch this workspace to a different destination")
            command.add_argument("--include-existing", action="store_true", help="Backfill all historical applications")
            command.add_argument("--include-id", action="append", default=[], help="Include an existing application by ID")
        elif name == "sheet-pending":
            command.add_argument("--id", dest="identifier", help="Only inspect pending work for this application")
            command.add_argument("--audit", action="store_true", help="Include previously acknowledged rows for remote reconciliation")
        elif name == "sheet-ack":
            command.add_argument("--id", dest="identifier", required=True)
            command.add_argument("--revision", required=True)
    return cli


def main(argv=None):
    args = vars(parser().parse_args(argv))
    command = args.pop("command")
    try:
        if command == "list":
            records = read_store(args["directory"])["applications"]
            if args["status"]:
                records = [r for r in records if r["status"] == args["status"]]
            result = {"applications": records}
        else:
            operation = {"init": init, "add": add, "update": update, "export": export_csv,
                         "sheet-bind": sheet_bind, "sheet-unbind": sheet_unbind,
                         "sheet-pending": sheet_pending, "sheet-ack": sheet_ack}[command]
            result = operation(**args)
        print(json.dumps(result, ensure_ascii=True))
        return 0
    except (TrackerError, OSError) as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=True), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
