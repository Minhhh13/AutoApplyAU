# Australian opportunity discovery and eligibility

Use this reference when finding Australian internships, vacation programs, clerkships, cadetships or graduate programs. The source notes below were checked on 16 November 2026; recheck current pages during each search. They are starting points, not a list of currently open vacancies.

## Requested discovery sources

Search all sources the user requests and report meaningful access gaps. These are the user's usual sources:

| Source | Starting point | Use |
|---|---|---|
| Prosple Australia | https://au.prosple.com/ | Degree/discipline, internship and graduate discovery; follow the actual application link. |
| Indeed Australia | https://au.indeed.com/ | Keyword plus Australian city/state; distinguish employer roles from placement services and duplicate adverts. |
| GradConnection / SEEK Grad | https://au.gradconnection.com/ | Resolve live redirects. Treat surviving search results as leads requiring fresh verification. |
| SEEK | https://au.seek.com/graduates | Current graduate and internship hub; also use ordinary SEEK job searches for smaller employers. |
| LinkedIn Jobs | https://www.linkedin.com/jobs/ | Set the location to Australia or the user's cities; use internship/entry-level and posting-date filters when available. |

**GradConnection transition:** the official [SEEK Grad notice](https://au.gradconnection.com/career-advice/article/seek-grad-is-moving-to-seek/) announced that GradConnection/SEEK Grad sites would retire from 8 November 2026 and graduate hiring would move onto SEEK. The notice was published on 8 October 2026. Prefer the live SEEK destination when a GradConnection link redirects or is unavailable; do not count the same migrated advert as a second vacancy. Recheck this routing rather than assuming the old site still provides a working application flow. If the notice itself cannot be fetched, identify it as search-index evidence and retain that uncertainty.

Use available search, connected tools or browser access. A sign-in wall, CAPTCHA or blocked automation path is a source-specific limitation: use other accessible sources, the employer page, or a user-provided listing. Supply a usable source/search link for manual continuation when necessary. Do not claim a board was searched if only a search-engine snippet was available, bypass access controls, or blanket-exclude a source that can be used normally.

## Search strategy

Start with the user's discipline, expected completion month/year, location preferences, availability and internship/graduate preference. Search both broad program terms and discipline-specific roles; a normal entry-level vacancy is not automatically a structured graduate program.

Useful term families:

- `intern`, `internship`, `summer intern`, `vacation program`, `vacationer`, `industrial placement`, `work integrated learning`.
- `graduate program`, `graduate programme`, `graduate analyst`, `graduate engineer`, `early careers`, `cadetship`, `clerkship` when relevant to the discipline.
- City/state, discipline, employer and **verified target intake year**. For summer programs, consider both calendar years in a label such as `2027/28` without assuming the dates.

Adapt these search-engine patterns; replace angle-bracket values with known preferences:

```text
site:au.prosple.com <discipline> internship <city>
site:au.indeed.com <discipline> (internship OR graduate) <city>
site:au.gradconnection.com <discipline> (internship OR graduate)
site:au.seek.com <discipline> ("graduate program" OR internship) <city>
site:linkedin.com/jobs <discipline> internship Australia
<employer> Australia <program> eligibility <intake-year>
<employer> graduate program "applications close"
```

Some engines do not support every operator. Simplify rather than repeatedly sending a query that produces poor results. Search official employer career pages for promising leads and for firms the user names. Search-result ranking and a fresh crawl date do not establish that a vacancy is still open.

## Verify before recommending or applying

Keep the discovery URL and the canonical employer/ATS application URL. For each candidate opportunity, establish:

- Employer, program/role, stream, requisition ID where available, location(s), and actual intake/start dates.
- Whether it is an open application, expression of interest, pre-registration, closed advert, virtual experience or placement-provider service. Keep these categories distinct.
- Application opening/closing evidence, exact deadline wording, stated timezone, rolling-recruitment or early-close wording, and the live application state.
- Degree/discipline requirements, expected or completed qualification dates, academic threshold and grading scale, work-rights/citizenship requirements, availability and any role-specific requirements.
- Paid/unpaid/unspecified remuneration; distinguish an employer internship from a program charging placement or training fees. Flag a disclosed fee or unpaid placement for the user's decision rather than representing it as paid employment.

Use the employer's current role advert and application instructions as primary evidence; use its program FAQ to clarify general rules. Board information is discovery evidence. If the advert, FAQ and portal disagree, preserve the conflict and mark the affected item unresolved. Do not silently choose the more permissive requirement.

For a board-hosted application without an employer ATS page, verify the employer identity and the advert itself; do not invent a canonical employer URL. A source blocked from inspection cannot establish a verified criterion.

## Dates and Australian locations

- Keep application year, intake year, study completion date and graduation ceremony date separate. Use the qualification-completion date required by the employer; do not substitute ceremony dates.
- Do not hard-code a national application season. Programs and off-cycle openings vary by employer and stream; use current dated evidence.
- Store the original deadline text, source URL and an ISO 8601 `checked_at` timestamp with offset. Keep an exact deadline timestamp only when the source supports its time and timezone.
- A date-only deadline is date-only evidence: do not manufacture `23:59`. If timezone is missing, label it unspecified and seek clarification only if the decision depends on it.
- Preserve the employer's named timezone. Australia has multiple zones and daylight-saving rules; `AEST` and `AEDT` are different. Use the user's configured zone for display, not to reinterpret an unspecified employer deadline.
- Treat `closing in N days/hours` and cached snippets as provisional; confirm an absolute deadline or live availability before acting.
- Record metro/regional, on-site/hybrid/remote, travel and relocation requirements accurately. A remote advert is not automatically open to every Australian location.

## Eligibility decisions

Assess every mandatory criterion against the user's confirmed facts. Return `eligible`, `ineligible` or `needs clarification`, with criterion-level evidence. An unknown criterion is not a pass. Keep mandatory requirements separate from preferences and explain a ranking without turning preferences into eligibility rules.

Do not infer citizenship, residency, disability, Aboriginal or Torres Strait Islander identity, age or other personal attributes from names, location, university, appearance or documents unrelated to the question. Ask only when a required field or relevant eligibility decision needs the answer; preserve any user choice not to disclose optional information.

For work rights, compare the user's confirmed status/conditions and availability with the employer's exact requirement. Employer sponsorship and citizenship rules are separate from general permission to work. `Accepts international students` on a board is not proof that this applicant meets every requirement. Do not determine visa rights from a visa label, assume future visa approval, or convert a conditional future entitlement into current unrestricted rights. Where needed, direct the user to current [Home Affairs information and VEVO](https://immi.homeaffairs.gov.au/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online/visa-holders) and use their confirmed evidence; do not access VEVO or collect passport identifiers merely to shortlist jobs.

Read study-stage rules literally. `Penultimate year`, `final year` and `graduated within N months/years` can use different reference dates. Check the advertised reference date and the user's course end date, including double degrees or changed completion dates. Do not assume every internship requires penultimate-year study.

Keep the university's actual WAM/GPA and scale. Do not invent a WAM-to-GPA conversion or label an international qualification equivalent without accepted supporting evidence. If a portal forces a conversion or an ambiguous eligibility answer, flag that field for clarification while progressing unrelated preparation.

Public-sector citizenship and security-clearance requirements are program-specific. For example, the [APSC program page](https://www.apsc.gov.au/about-us/working-commission/apsc-graduate-opportunities/graduate-program) lists citizenship and clearance conditions; this does not establish an identical rule for every Australian public-sector role.

## Duplicate and employer-wide application rules

Deduplicate across boards and migrated GradConnection/SEEK adverts using the employer's requisition ID and canonical application URL where available. Otherwise compare employer, program, stream, intake and locations. Retain all discovery URLs on one opportunity record. Shared job titles or employer names alone do not establish a duplicate.

Check the employer's live policy before applying to multiple streams or offices. Some permit ranked preferences within one application; others permit separate applications. Never assume either rule universally. The [EY Australian graduate opportunity page](https://www.ey.com/en_au/careers/2027-graduate-program-student-opportunities), for example, asks for one application and describes rolling recruitment. Recheck the relevant current-cycle page; an old rule is a lead to verify, not continuing permission or a universal restriction.

Compare against the local tracker and any authorised accessible portal history before sending. An existing submission, expression of interest, withdrawn application or unclear prior attempt needs to remain distinguishable. Do not resubmit merely because the same advert was found on a different board.

## Shortlist output

For each useful result, provide employer/program, location, intake, live application state, deadline and timezone certainty, eligibility result, fit explanation, application link and source-check date. Include missing facts and source conflicts alongside the relevant result. Avoid unsupported numeric match percentages and do not list inaccessible/unverified results as confirmed open roles.

State source coverage briefly: sources actually inspected, snippet-only leads, and sources unavailable during this run. Finish with the best next action supported by the user's requested mode and existing authorisation.

## Supporting primary sources

- [Prosple Australia](https://au.prosple.com/): Australian graduate and internship discovery.
- [Indeed Australia](https://au.indeed.com/): Australian keyword and location search.
- [SEEK graduate hub](https://au.seek.com/graduates): graduate and internship discovery after the announced SEEK Grad transition.
- [LinkedIn job filters](https://www.linkedin.com/help/linkedin/answer/a511259): location, posting-date, job-type and experience filters; use the controls actually available in the user's session.
- [ANZ graduate program](https://www.anz.com.au/careers/career-programs/graduate-program/): an example of employer-specific degree and work-status requirements; recheck instead of copying its rules to other employers.
- [CommBank graduate and intern programs](https://www.commbank.com.au/about-us/careers/graduate-intern-programs.html): an example of distinct graduate/internship eligibility and dated intake/application information.
