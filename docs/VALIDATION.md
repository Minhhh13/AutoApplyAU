# Validation and current limits

This is an early release. Distinguish tested local behaviour from browser/portal support that still needs field testing.

## Local helper checks

The application helpers have behavioural tests covering:

- Duplicate detection across tracking parameters, intakes, locations, streams and requisitions.
- Existing records, malformed stores, exclusive writer locks and preservation of prior data.
- Observed confirmation requirements and interrupted-submission recovery.
- CSV formula neutralisation and preservation of previous exports.
- Required answers, word/character limits and explicit template tokens.
- Verified evidence references, inconsistent eligibility and incomplete draft templates.
- Readiness reports that omit applicant answer text.
- Google Sheets destination binding, which records are pending and acknowledgement of verified row revisions.

The public distribution adds tests for installation and ZIP packaging. The [CI workflow](../.github/workflows/ci.yml) shows the exact Python/OS matrix and the results for each commit. A green CI result establishes these checks, not compatibility with every employer portal.

## Independent fictional dry run

The first workflow evaluation used supplied fictional adverts and applicant facts without accessing any real accounts. It:

- Preserved unknown citizenship/work-rights information instead of treating it as eligible.
- Identified a qualification-completion date conflicting with a mandatory internship window.
- Recorded a user-reported interrupted attempt as `submission-unknown` without fabricating readiness or receipt.
- Rejected a retry/reset without reconciliation evidence.
- Produced local profiles, packets, tracker records and factual preparation briefs.

No website was filled or submitted during that evaluation. The fixtures and execution files are not included as a real applicant profile.

A later browser test used Edge and a local fictional employer form. Selecting the applicant's study stage revealed a required completion-month field. The agent filled it, uploaded the fictional CV, checked the displayed answers and filename, and recorded a pending attempt. The test server received one submission with the expected fields and file bytes. The browser displayed a role-specific receipt, which the agent recorded in the tracker.

## Google Sheets and batch tracking

A live test wrote one fictional application to a native Google Sheet, read it back, changed its status, and verified that the same application ID still occupied exactly one row. The requisition ID retained its leading zeros. The private portal URL stayed local. The test row was removed afterwards.

An isolated local exercise added 400 fictional roles and replayed all 400 as duplicate listings. Each record advanced through a simulated submission with a synthetic receipt. The tracker rejected 400 duplicate submission attempts and 20 retries with an unresolved outcome. After a simulated Sheets sync stopped with 128 acknowledgements, a fresh tracker process found the remaining 272. The final CSV contained 400 distinct records. This exercise measured local record handling. Live employer throughput and the number of applications an applicant can complete without help remain unmeasured.

## What remains to verify in real use

- Discovery coverage under actual board sign-in and access restrictions.
- Live behaviour on individual employer/ATS forms and conditional questions.
- Document exports and uploads using the chosen host's tools.
- Final submission and receipt detection for each portal.
- Tool availability and permissions in each supported product surface.

The skill records these limitations and saves work for handoff. Submit reproducible feedback with fictional/redacted information so coverage can improve without publishing an applicant's details.
