# Track applications in Google Sheets

The applicant can say “Link my application tracker to this Google Sheet” or “Create a Google Sheet for my applications”. Once linked, “Apply to this job and track it” uses the saved destination for this applicant workspace. The agent runs the helper commands and makes the Sheets calls. The applicant supplies a sheet link or connects their account when needed.

## Connect a destination

1. Use an authenticated Google Sheets integration that can read and edit native spreadsheets. If it has read-only access or is disconnected, keep tracking locally and report the connection needed. Keep OAuth credentials in the host integration.
2. For a supplied link, inspect the workbook metadata and resolve the numeric spreadsheet tab ID (`gid`). In a new workbook, use a tab named `Applications`. In an existing workbook reuse a compatible tracker tab or create a dedicated tab without changing other data. If a specifically requested tab contains an incompatible table, leave it intact and resolve the destination with the user. A request to create a fresh tracker calls for a private workbook in the user's connected account. Keep its existing sharing permissions.
3. Use the [local tracker](../scripts/application_tracker.py) in the applicant's existing data directory. Run `init` first for a new directory. Bind only after verifying the workbook and tab. If the workspace already has a different binding, use `--replace` only when the user chose to switch destinations. A renamed tab can still be located by its numeric ID.

```text
python3 "<skill-dir>/scripts/application_tracker.py" sheet-bind --directory "<data-dir>" --spreadsheet-id "<verified workbook ID>" --sheet-id <gid>
python3 "<skill-dir>/scripts/application_tracker.py" sheet-pending --directory "<data-dir>"
```

Use `py -3` on Windows. Binding covers new and subsequently updated records. Use `--include-id <application-id>` with `sheet-bind` for one existing record or `--include-existing` when the applicant wants their existing history in this workbook. Match the scope they requested.

4. Use the exact `headers` returned by `sheet-pending` for the managed columns, A1:L1, and verify the header row. On a new tab, freeze this row. The columns cover application ID, employer, program, intake, program type, stream, location, requisition ID, status, public listing URL, and creation/update times. The sheet can have additional user-maintained columns to the right. Return the verified native link including its tab ID.

When the applicant asks to stop Google Sheets tracking, finish or stop the active sheet writer, then run `sheet-unbind --directory "<data-dir>"`. Future changes stay local. The existing workbook and tracker records remain available.

## Write and verify each application

Save the actual stage with `application_tracker.py` first. Use `add --public-url` for a job advert found on the employer's public careers site or a public board. Leave this field blank when the only URL is a personal invitation, signed link or candidate portal page, even when it opens without a password. Use the helper's `values` projection for the sheet. Contact details, work rights, CVs, form answers, portal links, confirmation references and notes stay in the applicant workspace.

When starting a role from a fresh local record against an existing tracker tab, check for a prior row before filling or syncing. Look for the stable ID and, if needed, the same employer, requisition and intake under another ID. A row showing a possible prior submission or later stage calls for portal-history reconciliation. Preserve that row while the outcome is uncertain. If the portal shows a receipt, record the observed confirmation locally and sync the verified outcome. If two IDs appear to refer to one role, resolve their identity before adding a row.

1. Run `sheet-pending --directory "<data-dir>" --id <application-id>` after a material status change. For a catch-up, omit `--id`. For an explicit reconciliation of deleted or changed rows, add `--audit` to include previously acknowledged records within scope. Each row includes its stable `id`, `revision` and ordered string `values`. The workbook and tab in `binding` are the write destination. Coordinate a single Sheets writer per tracker tab across sessions. Looking up an ID and creating a row are two separate operations.
2. On that tab, confirm the headers. Look up the **exact** application ID in column A, paging through bounded ranges to cover all used rows. A filtered or partially read list cannot establish absence. Keep an ID-to-row index within a batch and recheck the target before a write if the sheet moved. Sorting can change row numbers.
3. With **one match**, update changed managed values on that row. With **zero matches**, write one new row after the existing data and retain its ID. With **multiple matches**, leave those rows in place and report their locations so the user can reconcile them. Preserve user columns, notes, formatting and filters. If a formula or incompatible validation occupies a managed target, flag the affected row.
4. Write strings with `valueInputOption=RAW` or a cell batch update using `userEnteredValue.stringValue`. This keeps requisition IDs such as `0012` intact and prevents listing text beginning with `=` from becoming a formula. [Google Sheets value input options](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueInputOption)
5. Read back the managed cells and verify their literal contents against `values` (treat an empty cell as an empty string). If a previous write already matches, the same read-back verifies it. Acknowledge only verified rows using the **revision from that write**.

```text
python3 "<skill-dir>/scripts/application_tracker.py" sheet-ack --directory "<data-dir>" --id <application-id> --revision <verified-revision>
```

If the helper reports a stale revision, get the current pending row and sync it to the current binding. If the connector times out mid-write, look up the ID and read back the row before retrying. Acknowledged and still-pending rows can be reported separately after a partial batch. If access is lost, preserve the local status and pick up the pending rows when access returns. A failed sheet write never calls for another employer submission.

Report the portal result and the sheet result independently, for example “Employer confirmed submission. Google Sheets sync is pending because the connection expired.” The local tracker and observed employer confirmation determine submission status. Treat manual spreadsheet edits as annotations unless the applicant requests and substantiates a local status change.
