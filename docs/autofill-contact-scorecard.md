# AutoApply AU contact and phone scorecard

25 November 2026. This comparison covers the same 25 archived Australian graduate applications, the same 438 applicant-facing controls and the same fictional Alex Kim Tran profile. The original extension at commit `65b8d0c` reproduced every previously recorded field value and outcome.

| Outcome | Before | After |
|---|---:|---:|
| Correct fill | 83 | 125 |
| Missed fill | 33 | 0 |
| Wrong fill | 4 | 0 |
| Partial fill | 3 | 0 |
| Left for review | 304 | 302 |
| Lookup unverified | 11 | 11 |
| Application submissions | 0 | 0 |

[Download the field-by-field comparison](autofill-contact-fields.csv)

## Changes visible on the forms

- **Breezy HR.** The baseline filled none of the 14 confirmed contact fields across the four applications. The extension now fills all 14, including complete street addresses where requested. On CSE Global, entering a phone number carries SMS consent, so the extension leaves that number for the applicant.
- **Scout Talent.** Both applications now receive the email, street, suburb, postcode and state. Selecting Australia exposes the available state options, and the extension selects Northern Territory. Both mobile inputs receive the digits-only value `0400000019`.
- **Telephone widgets.** All four Greenhouse forms now show Australia (+61) alongside the mobile number. Three forms require the country selection. Brattle makes it optional. The five Workable forms keep their existing Australian dial selection and now count the formatted number in the extension summary. Superloop receives `+6140000019`. McInnes Wilson’s area-code and local-number fields are left for review because the profile contains one whole mobile number.
- **Other contact and education fields.** Bennett + Bennett now receives first name, surname, email and phone while its footer contact fields stay untouched. Partum Engineering receives the surname, McInnes Wilson receives the email, Axon receives the current city in its written-response field, and Macquarie Technology Group receives the confirmed university.

## Results by employer or recruiter

| Employer or recruiter | Graduate role or program | Correct fills | Missed fills | Wrong fills | Partial fills | Left for review | Unverified lookup |
|---|---|---:|---:|---:|---:|---:|---:|
| Appian Corporation | [Associate Consultant](https://job-boards.greenhouse.io/appian/jobs/8063920) | 5 → 7 | 0 → 0 | 0 → 0 | 1 → 0 | 18 → 17 | 4 → 4 |
| Axon | [Graduate Site Reliability Engineer (Australia)](https://job-boards.greenhouse.io/axon/jobs/8001665003) | 5 → 8 | 1 → 0 | 0 → 0 | 1 → 0 | 7 → 6 | 1 → 1 |
| The Brattle Group | [Research Analyst Graduate Program - Sydney](https://job-boards.greenhouse.io/thebrattlegroup/jobs/4732401005) | 6 → 7 | 0 → 0 | 0 → 0 | 0 → 0 | 12 → 11 | 3 → 3 |
| Nimbus Health | [2027 Physiotherapy Graduate Program (Northern suburbs of Melbourne)](https://job-boards.anz.greenhouse.io/nimbushealth/jobs/4009542201) | 5 → 7 | 0 → 0 | 0 → 0 | 1 → 0 | 8 → 7 | 0 → 0 |
| BlueRock | [Graduate Accounting Program 2027](https://apply.workable.com/the-blue-rock/j/3875315B12/) | 4 → 4 | 0 → 0 | 0 → 0 | 0 → 0 | 11 → 11 | 0 → 0 |
| Datacom | [Networks Graduate](https://apply.workable.com/datacom1/j/5CC1C0EC22/) | 4 → 4 | 0 → 0 | 0 → 0 | 0 → 0 | 23 → 23 | 0 → 0 |
| Mediix (recruiter) | [New Graduate Paediatric Occupational Therapist](https://apply.workable.com/mediix-recruitment/j/2FF207614B/) | 4 → 4 | 0 → 0 | 0 → 0 | 0 → 0 | 7 → 7 | 0 → 0 |
| Proactive Health | [New Grad Physiotherapist \| $80k-$90K + \| Nationwide \| 12 month program](https://apply.workable.com/proactive-health/j/5A1F9C398E/) | 4 → 4 | 0 → 0 | 0 → 0 | 0 → 0 | 10 → 10 | 0 → 0 |
| Brighte | [Customer Support Officer — Graduate Opportunity](https://jobs.lever.co/brighte/a341517f-9f32-43f6-9592-b1be2e235931) | 4 → 4 | 0 → 0 | 0 → 0 | 0 → 0 | 13 → 13 | 1 → 1 |
| Kogan.com | [Graduate Product Tester](https://jobs.lever.co/kogan/ef7bc25b-2238-468b-a48a-d335bbe9b1d2) | 4 → 4 | 0 → 0 | 0 → 0 | 0 → 0 | 23 → 23 | 1 → 1 |
| Macquarie Technology Group | [2026 Cloud Networking and Cyber Graduate Program](https://jobs.lever.co/macquarietechnologygroup/d2da8d92-a2e2-4702-95b5-02a06d0eb0f3) | 3 → 4 | 1 → 0 | 0 → 0 | 0 → 0 | 41 → 41 | 1 → 1 |
| BVN Architecture | [Graduate](https://bvn.breezy.hr/p/792e32ff4c93-graduate) | 0 → 4 | 4 → 0 | 0 → 0 | 0 → 0 | 6 → 6 | 0 → 0 |
| CSE Global | [Electrical Engineering - Graduate](https://cse-global.breezy.hr/p/4d5f396047d6-electrical-engineering-graduate) | 0 → 3 | 3 → 0 | 0 → 0 | 0 → 0 | 16 → 16 | 0 → 0 |
| Elafent | [Graduate Software Engineer](https://elafent.breezy.hr/p/7d7c510fbe49-graduate-software-engineer) | 0 → 3 | 3 → 0 | 0 → 0 | 0 → 0 | 5 → 5 | 0 → 0 |
| swipejobs | [Graduate Software Engineer](https://swipejobs.breezy.hr/p/389eb1b8c3ef-graduate-software-engineer) | 0 → 4 | 4 → 0 | 0 → 0 | 0 → 0 | 6 → 6 | 0 → 0 |
| Relationships Australia South Australia | [Graduate Policy Officer](https://rasa.applynow.net.au/jobs/R202680-graduate-policy-officer) | 4 → 10 | 5 → 0 | 1 → 0 | 0 → 0 | 14 → 14 | 0 → 0 |
| Altius Group | [Graduate Occupational Therapist](https://apply.workable.com/altius-group/j/A137948ABC/) | 4 → 4 | 0 → 0 | 0 → 0 | 0 → 0 | 9 → 9 | 0 → 0 |
| KINNECT | [Workplace Rehabilitation Consultant 2027 Graduate Program](https://applynow.net.au/jobs/KIP1320) | 4 → 10 | 5 → 0 | 1 → 0 | 0 → 0 | 17 → 17 | 0 → 0 |
| Superloop | [Graduate AI Engineer](https://superloop-1733718881.teamtailor.com/jobs/8778175-graduate-ai-engineer) | 3 → 4 | 1 → 0 | 0 → 0 | 0 → 0 | 10 → 10 | 0 → 0 |
| DFK Gooding Partners | [Graduate accounting intake](https://www.dfkgoodingpartners.com.au/careers/graduate-careers/) | 4 → 4 | 0 → 0 | 0 → 0 | 0 → 0 | 11 → 11 | 0 → 0 |
| Partum Engineering | [Graduate application](https://www.partumengineering.com.au/careers/graduate-application/) | 3 → 4 | 1 → 0 | 0 → 0 | 0 → 0 | 5 → 5 | 0 → 0 |
| Everyday Independence | [Graduate Occupational Therapist – Hobart](https://www.everydayind.com.au/work-with-us/current-opportunities/apply/?jobadder_ad_id=1126281&jobtitle=Graduate+Occupational+Therapist+%E2%80%93+Hobart) | 5 → 5 | 0 → 0 | 0 → 0 | 0 → 0 | 7 → 7 | 0 → 0 |
| GO.FARM Australia | [2027 Graduate Program, video introduction stage](https://gofarmaustralia.com.au/2027-graduate-program/) | 2 → 2 | 0 → 0 | 0 → 0 | 0 → 0 | 1 → 1 | 0 → 0 |
| Bennett + Bennett | [Surveying graduate program application](https://bennettandbennett.com.au/careers/graduate-opportunities) | 0 → 4 | 4 → 0 | 0 → 0 | 0 → 0 | 3 → 3 | 0 → 0 |
| McInnes Wilson Lawyers | [Application for Graduate and Clerkship Employment](https://form.jotform.com/220397398842064) | 6 → 7 | 1 → 0 | 2 → 0 | 0 → 0 | 21 → 23 | 0 → 0 |

## How to interpret the results

The unpacked extension ran from the on-page toolbar on 11 forms and from the browser-action popup on 14. Chromium was offline before profile import. Every page replayed from its original HTTP Archive. Submission handlers, network writes and WebSockets were blocked. Three Lever pages tried to initialize a LinkedIn widget on page load. The replay intercepted all three calls before the extension filled anything. A second Fill on every page preserved the answers. No file was uploaded and neither Fill attempted an application submission.

A correct fill requires a persisted value matching the field’s meaning and format. Existing answers, consent, uploads and personal declarations are scored for preservation. Radio and checkbox options are counted individually. The CSV names each control, the initial state, the two observed results and their grades.

The baseline counted four blank Greenhouse dial selectors as left for review and three numbers as partial because the dial selector was mandatory. With Australia and a ten-digit mobile starting with 04 in the profile, the extension now supplies the international form of the number. The checker verifies the committed +61 choice, the telephone widget’s Australian country indicator and the number together. Those four selections count as correct fills. The two McInnes Wilson telephone components move from wrong fills to left for review.

The 11 remaining lookup controls ask for a city, school, degree or discipline. Separate offline probes entered the confirmed search terms and found no selectable match in the archives. The extension left those controls blank. Live lookup availability and server-side acceptance were outside this test.
