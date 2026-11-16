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

    def test_only_first_submission_claim_succeeds_and_stale_updates_cannot_rewind(self):
        identifier = self.add()["application"]["id"]
        tracker.update(self.directory, identifier, "filled", expect_status="shortlisted")
        tracker.update(self.directory, identifier, "submission-pending", expect_status="filled")
        with self.assertRaisesRegex(tracker.TrackerError, "already pending"):
            tracker.update(self.directory, identifier, "submission-pending")
        with self.assertRaisesRegex(tracker.TrackerError, "Expected filled"):
            tracker.update(self.directory, identifier, "submission-pending", expect_status="filled")
        tracker.update(self.directory, identifier, "submitted", confirmation="Application received",
                       expect_status="submission-pending")
        tracker.update(self.directory, identifier, "interview", expect_status="submitted")
        with self.assertRaisesRegex(tracker.TrackerError, "found interview"):
            tracker.update(self.directory, identifier, "submitted", expect_status="submission-pending")
        self.assertEqual("interview", tracker.read_store(self.directory)["applications"][0]["status"])

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

    def test_sheet_binding_preserves_old_tracker_and_defers_unchanged_history(self):
        old = self.add()["application"]["id"]
        old_store = (self.directory / tracker.STORE_NAME).read_bytes()
        unbound = tracker.sheet_pending(self.directory)
        self.assertIsNone(unbound["binding"])
        self.assertEqual([], unbound["rows"])
        self.assertEqual(old_store, (self.directory / tracker.STORE_NAME).read_bytes())
        bound = tracker.sheet_bind(self.directory, "https://docs.google.com/spreadsheets/d/book_1-2/edit#gid=123", 123)
        self.assertEqual({"spreadsheet_id": "book_1-2", "sheet_id": 123}, bound["binding"])
        self.assertEqual([], tracker.sheet_pending(self.directory, audit=True)["rows"])
        fresh = self.add(intake="2031")["application"]["id"]
        self.assertEqual([fresh], [r["id"] for r in tracker.sheet_pending(self.directory)["rows"]])
        tracker.update(self.directory, old, "researching")
        self.assertEqual([old], [r["id"] for r in tracker.sheet_pending(self.directory, old)["rows"]])
        self.assertFalse(tracker.sheet_bind(self.directory, "book_1-2", 123)["changed"])

    def test_sheet_rows_only_expose_allowlisted_values_and_opt_in_listing_links(self):
        tracker.sheet_bind(self.directory, "book", 0)
        role = dict(url="https://example.com/candidate/private-a", employer="=literal", requisition_id="000123")
        identifier = self.add(**role)["application"]["id"]
        tracker.update(self.directory, identifier, "submitted", note="private-note",
                       confirmation="private-receipt", evidence_url="https://example.com/private-b")
        initial = tracker.sheet_pending(self.directory)
        row = dict(zip(initial["headers"], initial["rows"][0]["values"]))
        self.assertEqual("submitted", row["Status"])
        self.assertEqual("=literal", row["Employer"])  # Must be written as RAW or stringValue remotely.
        self.assertEqual("000123", row["Requisition ID"])
        self.assertEqual("", row["Public listing URL"])
        self.assertNotIn("private-", json.dumps(initial))
        self.assertTrue(self.add(public_url="https://example.com/jobs/123?utm_source=board", **role)["duplicate"])
        updated = tracker.sheet_pending(self.directory)
        row = dict(zip(updated["headers"], updated["rows"][0]["values"]))
        self.assertEqual("https://example.com/jobs/123", row["Public listing URL"])
        self.assertEqual(identifier, row["Application ID"])
        self.assertNotIn("private-", json.dumps(updated))

    def test_sheet_retry_replays_latest_snapshot_and_rejects_stale_ack(self):
        tracker.sheet_bind(self.directory, "book", 0)
        identifier = self.add()["application"]["id"]
        first, = tracker.sheet_pending(self.directory)["rows"]
        self.assertEqual([first], tracker.sheet_pending(self.directory)["rows"])
        tracker.update(self.directory, identifier, "submission-unknown", note="Earlier interrupted attempt")
        second, = tracker.sheet_pending(self.directory)["rows"]
        self.assertNotEqual(first["revision"], second["revision"])
        with self.assertRaisesRegex(tracker.TrackerError, "Stale"):
            tracker.sheet_ack(self.directory, identifier, first["revision"])
        self.assertEqual([second], tracker.sheet_pending(self.directory)["rows"])
        tracker.sheet_ack(self.directory, identifier, second["revision"])
        self.assertEqual([], tracker.sheet_pending(self.directory)["rows"])
        self.assertEqual([second], tracker.sheet_pending(self.directory, audit=True)["rows"])
        self.assertTrue(tracker.sheet_ack(self.directory, identifier, second["revision"])["acknowledged"])
        # A stale writer reporting a late write after a newer ACK must queue reconciliation.
        with self.assertRaisesRegex(tracker.TrackerError, "Stale"):
            tracker.sheet_ack(self.directory, identifier, first["revision"])
        self.assertEqual([second], tracker.sheet_pending(self.directory)["rows"])

    def test_sheet_destination_switch_rejects_old_acks_even_after_returning_to_original_tab(self):
        identifier = self.add()["application"]["id"]
        tracker.sheet_bind(self.directory, "bookA", 0, include_existing=True)
        first, = tracker.sheet_pending(self.directory)["rows"]
        with self.assertRaisesRegex(tracker.TrackerError, "--replace"):
            tracker.sheet_bind(self.directory, "bookB", 0)
        tracker.sheet_bind(self.directory, "bookB", 0, replace=True, include_existing=True)
        with self.assertRaisesRegex(tracker.TrackerError, "Stale"):
            tracker.sheet_ack(self.directory, identifier, first["revision"])
        tracker.sheet_bind(self.directory, "bookA", 0, replace=True, include_existing=True)
        with self.assertRaisesRegex(tracker.TrackerError, "Stale"):
            tracker.sheet_ack(self.directory, identifier, first["revision"])
        current, = tracker.sheet_pending(self.directory)["rows"]
        self.assertEqual(first["values"], current["values"])
        self.assertNotEqual(first["revision"], current["revision"])

    def test_sheet_selective_enrolment_and_explicit_historical_backfill(self):
        a = self.add(intake="2027")["application"]["id"]
        b = self.add(intake="2028")["application"]["id"]
        tracker.sheet_bind(self.directory, "book", 2, include_id=[b])
        selected, = tracker.sheet_pending(self.directory)["rows"]
        self.assertEqual(b, selected["id"])
        tracker.sheet_ack(self.directory, b, selected["revision"])
        self.assertEqual([], tracker.sheet_pending(self.directory)["rows"])
        tracker.sheet_bind(self.directory, "book", 2, include_existing=True)
        selected, = tracker.sheet_pending(self.directory)["rows"]
        self.assertEqual(a, selected["id"])
        self.assertEqual([a, b], [r["id"] for r in tracker.sheet_pending(self.directory, audit=True)["rows"]])
        self.assertFalse(tracker.sheet_bind(self.directory, "book", 2, include_existing=True)["changed"])

    def test_invalid_sheet_destination_and_damaged_sync_state_never_overwrite_tracker(self):
        path = self.directory / tracker.STORE_NAME
        original = path.read_bytes()
        for book, tab in (("", 0), ("https://docs.google.com.attacker.test/spreadsheets/d/x", 0),
                          ("https://token@docs.google.com/spreadsheets/d/x", 0), ("book", -1), ("book", True)):
            with self.subTest(book=book, tab=tab), self.assertRaises(tracker.TrackerError):
                tracker.sheet_bind(self.directory, book, tab)
        with self.assertRaisesRegex(tracker.TrackerError, "Application ID"):
            tracker.sheet_bind(self.directory, "book", 0, include_id=["missing"])
        self.assertEqual(original, path.read_bytes())
        tracker.sheet_bind(self.directory, "book", 0)
        data = tracker.read_store(self.directory)
        data["google_sheet"]["acknowledged"] = None
        path.write_text(json.dumps(data), encoding="utf-8")
        damaged = path.read_bytes()
        with self.assertRaisesRegex(tracker.TrackerError, "left unchanged"):
            self.add()
        self.assertEqual(damaged, path.read_bytes())

    def test_sheet_unbind_cli_preserves_all_applications_and_cancels_pending_sync(self):
        self.add(intake="2026")
        tracker.sheet_bind(self.directory, "book", 2)
        synced = self.add(intake="2027")["application"]["id"]
        self.add(intake="2028")
        row, = tracker.sheet_pending(self.directory, synced)["rows"]
        tracker.sheet_ack(self.directory, synced, row["revision"])
        expected = tracker.read_store(self.directory)
        del expected["google_sheet"]

        output = io.StringIO()
        with redirect_stdout(output):
            self.assertEqual(0, tracker.main(["sheet-unbind", "--directory", str(self.directory)]))
        self.assertEqual({"binding": None, "changed": True}, json.loads(output.getvalue()))
        self.assertEqual(expected, tracker.read_store(self.directory))
        self.assertEqual([], tracker.sheet_pending(self.directory, audit=True)["rows"])
        with self.assertRaisesRegex(tracker.TrackerError, "No Google Sheet"):
            tracker.sheet_ack(self.directory, synced, row["revision"])
        store = self.directory / tracker.STORE_NAME
        original = store.read_bytes()
        self.assertEqual({"binding": None, "changed": False}, tracker.sheet_unbind(self.directory))
        self.assertEqual(original, store.read_bytes())


if __name__ == "__main__":
    unittest.main()
