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

## Browser extension coverage

The Chromium tests load the unpacked extension, import a fictional profile through its popup and click its visible fill control. Each of the ten upstream portal families, plus Oracle Taleo and PageUp, has a simulated application route with a representative contact field. The tests check the entered values and browser input events, preserve existing answers and repeat the fill. The fixtures intercept network requests. [Browser tests](../tests/extension.test.cjs) · [Portal guide](../auto-au-applications/references/ats-platforms.md)

Other browser tests cover a Workday dropdown, an Oracle Recruiting Cloud selection grid and an employer page with an embedded Greenhouse form. They check that the extension preserves existing answers and leaves unrelated fields and frames alone.

On 25 November 2026, the same 25 synthetic Australian graduate forms ran before and after three autofill fixes. Correct profile fills rose from 51/63 to 63/63. All 65 checks for fields left for review passed in both runs. [Per-form and field-level scorecard](graduate-form-scorecard.md)

An offline replay of 25 real Australian graduate applications measured contact and phone handling across 438 controls. The comparison records each field’s original state, the value produced by each extension version and the choices that needed applicant review. [Real-form contact scorecard](autofill-contact-scorecard.md)

On 16 November 2026 we also opened public employer pages in a signed-out browser. We saved the rendered forms for Deputy on Lever and Fivetran on Greenhouse, then filled fictional details in **offline copies** with external requests blocked. The extension filled six fields on the Lever copy, including LinkedIn, GitHub and portfolio links, and twelve on the Greenhouse copy. The Workday and Oracle Recruiting Cloud checks reached public listings. Those visits did not exercise authenticated application steps or send applications.

For a local run, use Node.js 22+, then run `npm ci`, `npx playwright install chromium` and `npm run test:browser` from the repository root. The test dependencies are separate from the released extension.

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
