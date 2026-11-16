# Profile, application packets and tracking

## Working directory

Keep one shared directory for the applicant's data when switching between Codex and Claude. Installed skill directories contain reusable instructions and blank templates only.

```text
application-data/
  profile.json
  applications.json
  documents/                 master CV, transcript and approved supporting files
  applications/
    <application-id>/
      packet.json
      tailored-cv.docx        actual requested format may differ
      cover-letter.docx      only when appropriate/requested
      review.md              field mapping, unresolved items, actual result
      confirmation.txt       only after observed confirmation
```

Use the complete returned tracker ID as the folder name. Do not store a fabricated confirmation file before submission. Prefer actual document filenames that identify the employer and candidate when uploading. Avoid copying unnecessary personal material into every application folder.

## Applicant profile

Start with [profile.template.json](../assets/profile.template.json). A blank template is deliberately incomplete. Populate only verified information and keep unknown fields null. Ask for minimum missing facts once, in a consolidated request. For discovery, contact details are unnecessary; discipline, completion date, location preferences, availability and relevant work-rights facts usually matter sooner.

The standard fields are:

- `person`: strings for names, contact details and links, supplied by the user. Phone numbers and postcodes remain strings.
- `education`: one object per qualification, with `institution`, `degree`, `major`, `qualification_level`, `start_date`, `expected_completion_date`, `actual_completion_date`, `graduation_ceremony_date`, `academic_result`, `academic_scale`, and `evidence_ids`. Use ISO dates when known and month precision when only the month is known. Dates with different meanings are not interchangeable.
- `work_rights`: the applicant's own confirmed status, present conditions, relevant expiry and separate sponsorship-now/later answers. A null citizenship list means unknown, not no citizenship. Do not infer work permission from country of residence or predict future visa approval.
- `preferences`: Australian market, target program types, disciplines, locations, intakes, availability, relocation, remote/hybrid preferences, exclusions and display timezone. These are preferences, not demographic facts or submission authorisation.
- `documents`: absolute paths or paths relative to the data directory. Confirm files exist before treating a path as an available document.
- `evidence`: unique objects `{ "id": "ev-education", "source": "documents/transcript.pdf page 1", "summary": "User-confirmed qualification completion date and result", "verified": true }`. Sources may be a local document location or a dated user confirmation. `verified` is true only after checking that source. An evidence ID proves traceability, not that any sentence citing it is accurate; check entailment manually.
- `experience_examples`: objects with `id`, `topic`, `situation`, `task`, `action`, `result`, `skills`, and `evidence_ids`. Record the applicant's own contribution and only confirmed metrics.
- `standard_answers`: objects with `prompt`, `answer`, `context`, `evidence_ids`, and `confirmed_at`. Apply only to materially equivalent questions; a previous sponsorship answer is not a universal work-rights answer.
- `optional_disclosures`: only the applicant's stated choices; leave absent when unknown. `unresolved_facts`: conflicting or missing details, with their source and affected applications.

If importing the reference project's extension profile, map each field by meaning. Reconfirm US-specific academic standing, visa/sponsorship, demographic and legal answers rather than mechanically renaming them. Do not send the entire profile to a board or unknown autofill service.

## Opportunity and packet

Use [packet.template.json](../assets/packet.template.json) as the base. Create a tracker record first, then set `application_id` to its returned ID.

`opportunity` records the employer/program, type, stream, requisition, location, intake, discovery and application URLs, live state and checked-at time. `deadline` preserves original wording, source, known date/time/timezone and rolling/early-close wording. Unknown time/timezone stays null. The employer multiple-application policy needs a source and check date; if no policy is stated, record that rather than inventing permission or a limit.

`eligibility.status` is `eligible`, `ineligible` or `needs-clarification`. Each criterion contains:

```json
{
  "criterion": "The employer's actual mandatory criterion, with its reference date",
  "verdict": "met",
  "applicant_evidence_ids": ["ev-education"],
  "source_url": "https://employer.example/careers/verified-role"
}
```

Use `not-met` or `unknown` when appropriate. A met criterion requires the actual employer requirement source and verified applicant evidence. Cover every mandatory criterion from the advert/portal; do not create an empty checklist or selectively omit work rights. State any contradictory sources. A profile checkbox cannot overrule an employer requirement.

`documents` contains the purpose, real saved path, version and any layout/export issues. `questions` contains the exact prompts and limits from the form:

```json
{
  "id": "q-leadership",
  "prompt": "Exact observed question",
  "kind": "competency",
  "required": true,
  "answer": null,
  "max_words": 250,
  "max_characters": null,
  "evidence_ids": [],
  "needs_user_input": true
}
```

Kinds: `factual`, `competency`, `motivation`, `self-report`, `other`. Nonempty factual and competency answers require at least one verified profile evidence ID. Motivation responses should reflect the applicant's stated interests and researched employer facts, not invented enthusiasm or experiences. Self-report answers require the applicant's actual choice; do not optimise a fictional personality. Copy the real portal limits; do not assume a universal 250-word allowance.

Keep `blockers` explicit and update `review` after inspecting the form and uploads. Leave questions undiscovered until the portal is inspected; an empty questions list does not prove there are no required questions. Save submission attempt/receipt details only when they occur. A portal requiring a new unsupported question returns the packet to preparation.

## Mechanical packet check

All helpers use only the Python standard library and do not send network requests. Resolve the script location from the skill directory and use a working Python 3.10+ interpreter. Example commands use `python3`; on Windows, `py -3` is an alternative where the Python launcher is installed.

```text
python3 <skill-dir>/scripts/check_packet.py <data-dir>/applications/<id>/packet.json --profile <data-dir>/profile.json
```

Exit 0: the implemented structural, evidence-reference and answer-length checks passed. Exit 1: unresolved content/readiness problems. Exit 2: malformed input or IO problem. Results contain question IDs/counts/issues rather than applicant answer text. The checker counts whitespace-separated words and Unicode characters; the portal's actual counting/validation controls take precedence. It cannot establish completeness, truth, employer-policy compliance, browser state or authorisation. An agent must still verify those.

## Tracker commands

```text
python3 <skill-dir>/scripts/application_tracker.py init --directory <data-dir>
python3 <skill-dir>/scripts/application_tracker.py add --directory <data-dir> --employer "Employer" --program "Program and stream" --intake "2027" --url "https://employer.example/careers/role"
python3 <skill-dir>/scripts/application_tracker.py list --directory <data-dir>
python3 <skill-dir>/scripts/application_tracker.py update --directory <data-dir> --id <id> --status drafting
python3 <skill-dir>/scripts/application_tracker.py update --directory <data-dir> --id <id> --status ready
python3 <skill-dir>/scripts/application_tracker.py update --directory <data-dir> --id <id> --status filled
python3 <skill-dir>/scripts/application_tracker.py update --directory <data-dir> --id <id> --status submission-pending
python3 <skill-dir>/scripts/application_tracker.py update --directory <data-dir> --id <id> --status submitted --confirmation "Actual observed receipt text/reference" --evidence-url "https://employer.example/candidate/applications"
python3 <skill-dir>/scripts/application_tracker.py export --directory <data-dir> --output <new-export-path>.csv
```

Quote all paths and text in actual shell invocations. Optional add flags: `--location`, `--program-type`, `--stream`, `--requisition-id`. Supply the verified location, stream and requisition consistently for distinct permitted applications. Optional update flags: `--note`, `--confirmation`, `--evidence-url`. The evidence URL must be HTTP(S); local screenshot/receipt paths can be recorded in the packet and referenced in the note. Do not put credentials or token-bearing session URLs in records.

Statuses: `shortlisted`, `researching`, `needs-info`, `drafting`, `ready`, `filled`, `submission-pending`, `submitted`, `submission-unknown`, `assessment`, `interview`, `offer`, `rejected`, `withdrawn`, `closed`.

The helper deduplicates normalised employer/program/intake identities including supplied stream, location and requisition, and canonical application URLs within the same intake. It strips known tracking parameters while preserving requisition parameters and fragments. Check duplicate records and employer policies manually too: title variations, URL aliases and multiple-office policies require judgement. Reused annual URLs can represent a new verified intake. A generic landing page shared by multiple jobs is insufficient to identify their individual application flows; retain requisition-specific evidence and inspect a duplicate return before deciding whether it is truly the same application.

Updates use an exclusive lock and atomic file replacement. A locked store requires waiting for the actual writer or verifying a crashed writer before manually clearing its lock; never delete the store to resolve a lock. Malformed records are reported without reset. A duplicate addition returns the existing record unchanged. CSV exports never replace an existing output and neutralise spreadsheet formulas; CSV is a view, not the canonical tracker. The tracker is local plaintext: protect it like application documents and keep it out of shared repositories.

`submitted` requires observed confirmation text. Pending/unknown attempts require reconciliation evidence before returning to an editable status. For a user-reported historic interrupted attempt absent from the tracker, record `submission-unknown` with a note documenting their report; do not invent a previous ready/filled state merely to import it. A submitted/progressed record cannot be reset for another submission. These checks prevent common accidental retries; they do not create user authorisation or verify that a supplied confirmation is true.

## Assessments and later stages

For preparation, generate original numerical, verbal, abstract-reasoning or situational-judgement exercises; run timed practice where feasible, explain errors and track weak areas. Do not claim these are leaked or authentic employer questions. For personality questionnaires, help the user understand wording and reflect on their real preferences.

Treat a real scored assessment as a separate stage from submitting an application. Read that assessment's permitted-assistance rules. Where AI assistance is expressly permitted and the user requests it, operate within that scope and validate the particular format; never promise a passing score. Where independent completion is required, prepare beforehand and hand the live assessment to the applicant. Do not bypass proctoring, identity checks or access controls. The application skill does not automatically take tests or recorded interviews when a portal launches them.

Only read email/calendar or create reminders when the user's request covers those actions and the host provides the appropriate tools. Do not send employer messages or create recurring automations merely because an application exists. For a status update, record the actual received stage and evidence. Interview preparation can reuse the verified example bank and current employer research.
