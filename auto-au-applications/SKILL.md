---
name: auto-au-applications
description: Find, assess, prepare, fill and track Australian internship, vacationer and graduate program applications using Prosple, Indeed, GradConnection, SEEK, LinkedIn and employer careers sites. Use for an Australian early-careers search, a supplied application URL, application batches, tailored CVs and answers, or updates to an existing application tracker.
license: MIT
---

# AutoApply AU

Run an Australian early-careers application workflow using the user's confirmed background and the tools available in this session. Support both internships and graduate programs; include vacationer programs, placements, clerkships or cadetships when relevant. AutoApply AU is a portable skill for Codex and Claude Code. It uses the host's configured model and tools; its local helpers require no API keys or third-party Python packages.

## Start from the requested outcome

Interpret natural language; do not require a command syntax:

| Request | Work to complete |
|---|---|
| Find / shortlist | Discover current opportunities, check eligibility and rank useful matches. |
| Prepare / tailor | Build the application documents and question responses. |
| Apply / fill / fill all | Prepare and fill available application forms; present the final review before submission unless the user also authorises submission. |
| Submit / apply and submit | Submit the specified applications within the user's authorised scope and verify receipt. |
| Track / resume | Read existing records, reconcile interrupted attempts and continue the requested stage. |
| Practise assessments | Generate original practice exercises and feedback; see the assessment section in [application-workflow.md](references/application-workflow.md). |

Keep existing user preferences and authorisation across the conversation. An explicit instruction to submit a named application or a bounded batch is sufficient: do the preparation and verification and proceed without asking again. Creating or invoking this skill alone does not authorise transmitting an application. If submission scope is genuinely unspecified, prepare reviewable work before asking for that missing decision. User instructions take precedence over the defaults here; host permissions still apply.

For broad batches, establish the program types, locations, disciplines, target intake/availability, maximum count and exclusions from the request or saved preferences. Ask only for missing details that materially affect the work. Continue independent research while awaiting facts. Do not invent a default discipline, nationality or graduation date.

## Tools and local working data

Use available search tools for discovery and the environment's supported browser/computer-use tools for forms. Prefer a connected service tool when it covers the requested action. Follow the host's tool and skill instructions. Do not invent browser APIs, claim an unavailable integration works, or install an extension merely because upstream used one. If browser access is absent, finish the shortlist and documents and provide a field-by-field handoff.

Choose one application working directory, use it for both agents/products, and keep it outside this installed skill. Reuse an existing directory when provided; otherwise use `./application-data` under the user's working folder. See [application-workflow.md](references/application-workflow.md) for the data layout and CLI. Identify a working Python 3.10+ interpreter once (`python3`, `py -3` on Windows, or `python` when it resolves to a supported version). Quote paths with spaces and resolve helper paths relative to this SKILL.md.

Copy [profile.template.json](assets/profile.template.json) to the working directory as `profile.json` if no profile exists. Preserve an existing profile; import compatible facts from an older profile rather than replacing it. Use the CV, transcript and user-confirmed examples to fill it, keeping unknowns null. Save no passwords, MFA tokens, passport numbers or unrelated sensitive documents. Do not put applicant data in the skill package or commit it to source control.

Initialise/read the [application tracker](scripts/application_tracker.py) before creating application records. Use the returned application ID as the per-application folder name. A duplicate response means inspect the existing record, not create a second folder or overwrite it. The tracker stores statuses; keep detailed sources, eligibility and deadlines in each application's `packet.json`.

## Discover and assess

Read [australian-market.md](references/australian-market.md) for Australian sources, intake/date interpretation and eligibility checks. Search the user's usual sources: **Prosple, Indeed Australia, GradConnection, SEEK and LinkedIn Jobs**, plus employer careers pages. Recheck live destinations and access; GradConnection migration information is a dated lead, not a permanent assumption.

Use current employer/ATS evidence to verify the opportunity, live application state, program intake, deadline and mandatory requirements. Distinguish EOI/pre-registration from open applications. Preserve source URLs, exact deadline wording and checked-at timestamps. A cached job-board result is insufficient to call a role open.

Compare each mandatory criterion with confirmed applicant facts: degree/discipline, completion window, academic scale, work rights/citizenship, availability and location. Return **eligible / ineligible / needs clarification** with the evidence for each criterion. Unknown requirements or facts do not count as eligible. Keep preferences separate from hard requirements. Do not infer identity attributes or convert WAM/GPA scales without accepted evidence.

Deduplicate across boards, requisitions, programs and intakes; check employer-wide restrictions before selecting multiple streams or offices. Rank by eligibility, the user's fit/preferences, verified closing urgency and application readiness. Do not substitute company prestige or a fixed applications-per-employer quota for the user's goals or current employer policy.

## Prepare factual, tailored applications

Read the profile and [application-workflow.md](references/application-workflow.md). Create a per-application `packet.json` from [packet.template.json](assets/packet.template.json), recording sources, eligibility, document paths, exact prompts and limits, draft answers and unresolved issues. Ground applicant claims in verified profile evidence IDs; keep source references in the local packet rather than adding internal citation IDs to form answers.

Tailor emphasis and ordering to the actual role. Preserve employers, titles, dates, qualifications, skills, metrics and the applicant's contribution. Reword for clarity without upgrading exposure into proficiency, teamwork into leadership, or aspirations into completed experience. Ask for missing examples instead of inventing STAR stories. Resolve contradictions with the user before using the affected fact.

Use Australian English. Preserve the user's chosen CV format; a US-style one-page resume is not a default requirement. Follow the advertised document type, length and page-size requirements. Produce usable files with available document tools, inspect their rendered layout when creating DOCX/PDF, and verify text extraction and contact details before upload. Keep the master CV intact and save tailored copies under the application folder. If a compiler/exporter is unavailable, provide the editable draft and state that limitation.

Run [check_packet.py](scripts/check_packet.py) against the packet and profile after drafting and again after material changes. Resolve reported issues before marking ready. It checks structure, known evidence IDs and word/character limits; it does not prove truth, eligibility or submission permission. Compare its counts with the portal's own counter and inspect the final answers manually.

## Fill and submit

Read [browser-workflow.md](references/browser-workflow.md) before operating an application form. Work from live observed controls and verified packet answers. Inspect after uploads, parsed-CV autofill, navigation and conditional questions. Ask once for genuinely missing facts and proceed with unrelated applications. Keep one writer per portal session; research and document preparation can run in parallel.

Before any authorised submission, recheck the employer's application policy, live deadline, eligibility, required answers, uploaded document identity and the portal review screen. The packet must contain no unresolved blockers. Record `submission-pending` **before** activating Submit. Record `submitted` only after observing an actual receipt, confirmation number or unambiguous portal success state; retain the confirmation evidence.

After a timeout or ambiguous result, record `submission-unknown` and inspect portal history/receipts before retrying. On resume, treat an existing `submission-pending` the same way. Never resubmit on the assumption that a missing screenshot means failure. If a job is blocked by authentication, an unanswered mandatory field or unavailable tools, preserve its state and continue other authorised work.

## Finish with an accurate handoff

Report the actual result for each application: shortlisted, needs information, ready, filled, confirmed submitted, uncertain submission or the later recruitment stage. Link the relevant employer/application and local documents. Distinguish source coverage and access gaps, list only decisions the user must make, and state any next deadline with its timezone uncertainty. Never describe drafts, form fills or attempted clicks as submitted applications.

For installation and example prompts, see [setup.md](references/setup.md). For the reference project's provenance and Australian changes, see [upstream-reference.md](references/upstream-reference.md).
