# AutoApply AU graduate form scorecard

25 November 2026. The Chromium suite loaded the unpacked extension, imported a fictional Australian graduate profile through the popup and clicked the extension’s Fill button on 25 intercepted application forms. The baseline used Git revision `be9bc89`. Replaying that revision reproduced every recorded field outcome.

| Measure | Before | After |
|---|---:|---:|
| Forms passing every check | 14/25 | 25/25 |
| Confirmed profile fields filled correctly | 51/63 | 63/63 |
| Fields appropriately left for review | 65/65 | 65/65 |
| All field checks | 116/128 | 128/128 |
| Application submissions | 0 | 0 |

There were 39 Fill actions and 118 distinct controls. The 128 checks include repeat observations when a hidden control became visible or the applicant made a choice. A fill passed when the initially unfilled control held the expected value after the click. Review passed when the control retained the expected state, such as a blank visa subclass, a chosen date or a previously attached file. The custom calendars also recorded whether they had been opened. All portal requests were intercepted. The results describe these synthetic forms in Chromium.

## The 12 baseline misses

| Cause | Missed before | Missed after | Change |
|---|---:|---:|---|
| Unrecognised applicant and education labels | 6 | 0 | Added exact matches for “Contact phone number”, “Residential postcode”, “Residential suburb”, “Degree title” and “University / institution”. “Degree title” occurred twice. |
| State and country options with a name and code | 3 | 0 | Recognised pairs such as “Northern Territory (NT)”, “NT - Northern Territory” and “Australia (AU)”. The extension still requires one matching option. |
| Disabled, empty dropdown prompts | 3 | 0 | Recognised field-specific prompts such as “Start by choosing your university”. The tests also cover existing answers such as “Prefer not to say”. |

## Results by form

The first nine forms have multiple steps. Forms 10–17 focus on pickers and forms 18–25 include document uploads. The fictional applicant chose branches and advanced steps through Playwright. The extension’s Fill action left navigation and submission under applicant control.

| Form | Graduate application | Correct fills before | Correct fills after | Review passes before | Review passes after |
|---|---|---:|---:|---:|---:|
| 01 | Top End Water – engineering graduate | 4/5 | 5/5 | 2/2 | 2/2 |
| 02 | Red Centre Transit – transport planning intake | 2/2 | 2/2 | 5/5 | 5/5 |
| 03 | Coral Analytics – data science graduate | 5/5 | 5/5 | 3/3 | 3/3 |
| 04 | Arafura Ports – operations graduate | 4/5 | 5/5 | 2/2 | 2/2 |
| 05 | Bass Strait Research – laboratory intake | 2/2 | 2/2 | 4/4 | 4/4 |
| 06 | Mallee Energy – sustainability graduate | 2/2 | 2/2 | 4/4 | 4/4 |
| 07 | Gulf Health Services – business graduate | 3/3 | 3/3 | 3/3 | 3/3 |
| 08 | Riverland Rail – civil graduate rotations | 1/2 | 2/2 | 3/3 | 3/3 |
| 09 | Wattle Insurance – actuarial graduate | 2/2 | 2/2 | 4/4 | 4/4 |
| 10 | Top End Water – civil engineering | 1/2 | 2/2 | 1/1 | 1/1 |
| 11 | Laneway Materials – research | 1/1 | 1/1 | 2/2 | 2/2 |
| 12 | Red Gum Ecology – field science | 2/2 | 2/2 | 1/1 | 1/1 |
| 13 | Paperbark Consulting – digital advisory | 1/1 | 1/1 | 3/3 | 3/3 |
| 14 | Saltmarsh Transit – network planning | 1/2 | 2/2 | 1/1 | 1/1 |
| 15 | Wattle Learning – graduate analytics | 1/1 | 1/1 | 2/2 | 2/2 |
| 16 | Coral Inlet Ports – infrastructure | 1/2 | 2/2 | 1/1 | 1/1 |
| 17 | Ochre Ridge Health – data operations | 2/2 | 2/2 | 2/2 | 2/2 |
| 18 | Darwin catchment science graduate | 2/4 | 4/4 | 2/2 | 2/2 |
| 19 | Perth inclusive design graduate | 2/2 | 2/2 | 3/3 | 3/3 |
| 20 | Hobart marine research graduate | 1/1 | 1/1 | 5/5 | 5/5 |
| 21 | Adelaide rail planning graduate | 2/3 | 3/3 | 2/2 | 2/2 |
| 22 | Brisbane coastal audit graduate | 3/4 | 4/4 | 2/2 | 2/2 |
| 23 | Melbourne performing arts graduate | 2/2 | 2/2 | 3/3 | 3/3 |
| 24 | Canberra archives graduate | 2/3 | 3/3 | 3/3 | 3/3 |
| 25 | Newcastle renewables analysis graduate | 2/3 | 3/3 | 2/2 | 2/2 |

## Field-level results

Control IDs match the fixture source. “Pass” means the observed result matched the expected value shown. A missed field shows its actual baseline value. Checkbox values are booleans. Uploads use the number of selected files, except the preattached writing sample, which is checked by filename and contents.

<details>
<summary>All 128 field checks</summary>

| Form | Fill action on form | Control ID | Expected action | Expected value after Fill | Before | After |
|---|---:|---|---|---|---|---|
| 01 | 1 | `given` | Fill | `Alex Kim` | Pass | Pass |
| 01 | 1 | `family` | Fill | `Tran` | Pass | Pass |
| 01 | 1 | `preferred` | Fill | `Alex` | Pass | Pass |
| 01 | 1 | `contact` | Leave for review | *empty* | Pass | Pass |
| 01 | 2 | `contact` | Fill | `0400 000 019` | **Miss** · *empty* | Pass |
| 01 | 2 | `mail` | Fill | `alex@example.invalid` | Pass | Pass |
| 01 | 2 | `sms` | Leave for review | `false` | Pass | Pass |
| 02 | 1 | `applicant` | Fill | `Alex Kim Tran` | Pass | Pass |
| 02 | 1 | `mail` | Fill | `alex@example.invalid` | Pass | Pass |
| 02 | 2 | `rights` | Leave for review | *empty* | Pass | Pass |
| 02 | 2 | `subclass` | Leave for review | *empty* | Pass | Pass |
| 02 | 3 | `rights` | Leave for review | `temporary` | Pass | Pass |
| 02 | 3 | `subclass` | Leave for review | *empty* | Pass | Pass |
| 02 | 3 | `expiry` | Leave for review | *empty* | Pass | Pass |
| 03 | 1 | `first_name` | Fill | `Alex Kim` | Pass | Pass |
| 03 | 1 | `last_name` | Fill | `Tran` | Pass | Pass |
| 03 | 1 | `mail` | Leave for review | `candidate-edited@example.invalid` | Pass | Pass |
| 03 | 1 | `uni` | Leave for review | *empty* | Pass | Pass |
| 03 | 2 | `uni` | Fill | `Example University` | Pass | Pass |
| 03 | 2 | `qualification` | Fill | `Bachelor of Science` | Pass | Pass |
| 03 | 2 | `subject` | Fill | `Mathematics` | Pass | Pass |
| 03 | 2 | `graduation` | Leave for review | *empty* | Pass | Pass |
| 04 | 1 | `mail` | Fill | `alex@example.invalid` | Pass | Pass |
| 04 | 1 | `mobile` | Fill | `0400 000 019` | Pass | Pass |
| 04 | 1 | `postal` | Leave for review | *empty* | Pass | Pass |
| 04 | 2 | `street` | Fill | `18 Example Street` | Pass | Pass |
| 04 | 2 | `postal` | Fill | `0800` | **Miss** · *empty* | Pass |
| 04 | 2 | `region` | Fill | `north` | Pass | Pass |
| 04 | 2 | `mailing` | Leave for review | `false` | Pass | Pass |
| 05 | 1 | `applicant` | Fill | `Alex Kim Tran` | Pass | Pass |
| 05 | 1 | `locality` | Fill | `Darwin` | Pass | Pass |
| 05 | 2 | `add-referee` | Leave for review | `false` | Pass | Pass |
| 05 | 3 | `add-referee` | Leave for review | `true` | Pass | Pass |
| 05 | 3 | `other-name` | Leave for review | *empty* | Pass | Pass |
| 05 | 3 | `other-mail` | Leave for review | *empty* | Pass | Pass |
| 06 | 1 | `candidate` | Fill | `Alex Kim Tran` | Pass | Pass |
| 06 | 1 | `residence` | Fill | `AU` | Pass | Pass |
| 06 | 2 | `show-sponsor` | Leave for review | `false` | Pass | Pass |
| 06 | 3 | `show-sponsor` | Leave for review | `true` | Pass | Pass |
| 06 | 3 | `document-country` | Leave for review | *empty* | Pass | Pass |
| 06 | 3 | `support` | Leave for review | *empty* | Pass | Pass |
| 07 | 1 | `candidate-given` | Fill | `Alex Kim` | Pass | Pass |
| 07 | 1 | `candidate-family` | Fill | `Tran` | Pass | Pass |
| 07 | 1 | `own-phone` | Leave for review | *empty* | Pass | Pass |
| 07 | 2 | `own-phone` | Fill | `0400 000 019` | Pass | Pass |
| 07 | 2 | `other-mail` | Leave for review | *empty* | Pass | Pass |
| 07 | 2 | `other-phone` | Leave for review | *empty* | Pass | Pass |
| 08 | 1 | `home-locality` | Fill | `Darwin` | **Miss** · *empty* | Pass |
| 08 | 1 | `zip` | Fill | `0800` | Pass | Pass |
| 08 | 2 | `office` | Leave for review | *empty* | Pass | Pass |
| 08 | 3 | `office` | Leave for review | `other` | Pass | Pass |
| 08 | 3 | `preferred-office` | Leave for review | *empty* | Pass | Pass |
| 09 | 1 | `candidate` | Fill | `Alex Kim Tran` | Pass | Pass |
| 09 | 1 | `called` | Fill | `Alex` | Pass | Pass |
| 09 | 2 | `has-history` | Leave for review | *empty* | Pass | Pass |
| 09 | 3 | `has-history` | Leave for review | `yes` | Pass | Pass |
| 09 | 3 | `work-city` | Leave for review | *empty* | Pass | Pass |
| 09 | 3 | `work-phone` | Leave for review | *empty* | Pass | Pass |
| 10 | 1 | `candidate` | Fill | `Alex Kim Tran` | Pass | Pass |
| 10 | 1 | `home-region` | Fill | `Northern Territory (NT)` | **Miss** · `Select one` | Pass |
| 10 | 1 | `assessment-day` | Leave for review | `Choose a date` | Pass | Pass |
| 11 | 1 | `residence` | Fill | `Australia` | Pass | Pass |
| 11 | 1 | `dial-code` | Leave for review | `Select one` | Pass | Pass |
| 11 | 1 | `completion` | Leave for review | *empty* | Pass | Pass |
| 12 | 1 | `contact` | Fill | `alex@example.invalid` | Pass | Pass |
| 12 | 1 | `major-picker` | Fill | `Mathematics` | Pass | Pass |
| 12 | 1 | `available` | Leave for review | `2027-03-01` | Pass | Pass |
| 13 | 1 | `residential-city` | Leave for review | `Brisbane` | Pass | Pass |
| 13 | 1 | `mobile-contact` | Fill | `0400 000 019` | Pass | Pass |
| 13 | 1 | `work-authority` | Leave for review | `Select one` | Pass | Pass |
| 13 | 1 | `expiry-date` | Leave for review | `Choose a date` | Pass | Pass |
| 14 | 1 | `home-nation` | Fill | `Australia (AU)` | **Miss** · *empty* | Pass |
| 14 | 1 | `postal` | Fill | `0800` | Pass | Pass |
| 14 | 1 | `commencement` | Leave for review | `Choose a date` | Pass | Pass |
| 15 | 1 | `award` | Leave for review | *empty* | Pass | Pass |
| 15 | 1 | `provider` | Fill | `Example University` | Pass | Pass |
| 15 | 1 | `completion-month` | Leave for review | *empty* | Pass | Pass |
| 16 | 1 | `region` | Fill | `A2` | **Miss** · *empty* | Pass |
| 16 | 1 | `town` | Fill | `Darwin` | Pass | Pass |
| 16 | 1 | `stream` | Leave for review | `Select one` | Pass | Pass |
| 17 | 1 | `usual-name` | Fill | `Alex` | Pass | Pass |
| 17 | 1 | `prior-study` | Leave for review | *empty* | Pass | Pass |
| 17 | 1 | `today-city` | Fill | `Darwin` | Pass | Pass |
| 17 | 1 | `interview` | Leave for review | `Choose a date` | Pass | Pass |
| 18 | 1 | `applicant-given` | Fill | `Alex Kim` | Pass | Pass |
| 18 | 1 | `applicant-surname` | Fill | `Tran` | Pass | Pass |
| 18 | 1 | `award-title` | Fill | `Bachelor of Science` | **Miss** · *empty* | Pass |
| 18 | 1 | `awarding-body` | Fill | `Example University` | **Miss** · *empty* | Pass |
| 18 | 1 | `weighted-mark` | Leave for review | *empty* | Pass | Pass |
| 18 | 1 | `official-results` | Leave for review | `0` | Pass | Pass |
| 19 | 1 | `designer-name` | Fill | `Alex Kim Tran` | Pass | Pass |
| 19 | 1 | `designer-email` | Fill | `alex@example.invalid` | Pass | Pass |
| 19 | 1 | `portfolio-page` | Leave for review | `https://example.invalid/design-work` | Pass | Pass |
| 19 | 1 | `design-sample` | Leave for review | `fictional-design-sample.txt:Sample by Alex.` | Pass | Pass |
| 19 | 1 | `access-needs` | Leave for review | *empty* | Pass | Pass |
| 20 | 1 | `candidate-preferred` | Fill | `Alex` | Pass | Pass |
| 20 | 1 | `first-school` | Leave for review | *empty* | Pass | Pass |
| 20 | 1 | `second-school` | Leave for review | *empty* | Pass | Pass |
| 20 | 1 | `first-award` | Leave for review | *empty* | Pass | Pass |
| 20 | 1 | `second-award` | Leave for review | *empty* | Pass | Pass |
| 20 | 1 | `research-summary` | Leave for review | `0` | Pass | Pass |
| 21 | 1 | `mobile-contact` | Fill | `0400 000 019` | Pass | Pass |
| 21 | 1 | `award` | Fill | `sci` | **Miss** · *empty* | Pass |
| 21 | 1 | `course-area` | Fill | `Mathematics` | Pass | Pass |
| 21 | 1 | `rail-cv` | Leave for review | `0` | Pass | Pass |
| 21 | 1 | `licence-expires` | Leave for review | *empty* | Pass | Pass |
| 22 | 1 | `street` | Fill | `18 Example Street` | Pass | Pass |
| 22 | 1 | `locality` | Fill | `Darwin` | Pass | Pass |
| 22 | 1 | `region` | Fill | `nt` | **Miss** · *empty* | Pass |
| 22 | 1 | `zip` | Fill | `0800` | Pass | Pass |
| 22 | 1 | `letter` | Leave for review | `0` | Pass | Pass |
| 22 | 1 | `relocate` | Leave for review | `false` | Pass | Pass |
| 23 | 1 | `performer-email` | Fill | `alex@example.invalid` | Pass | Pass |
| 23 | 1 | `professional-url` | Fill | `https://example.invalid/alex` | Pass | Pass |
| 23 | 1 | `contact-name` | Leave for review | *empty* | Pass | Pass |
| 23 | 1 | `contact-address` | Leave for review | *empty* | Pass | Pass |
| 23 | 1 | `stage-samples` | Leave for review | `0` | Pass | Pass |
| 24 | 1 | `archive-surname` | Fill | `Tran` | Pass | Pass |
| 24 | 1 | `course-name` | Fill | `Bachelor of Science` | **Miss** · *empty* | Pass |
| 24 | 1 | `awarding-institution` | Leave for review | `Example Institute of Archives` | Pass | Pass |
| 24 | 1 | `archive-major` | Fill | `Mathematics` | Pass | Pass |
| 24 | 1 | `archive-results` | Leave for review | `0` | Pass | Pass |
| 24 | 1 | `archive-declaration` | Leave for review | `false` | Pass | Pass |
| 25 | 1 | `analyst-email` | Fill | `alex@example.invalid` | Pass | Pass |
| 25 | 1 | `attended` | Fill | `example` | **Miss** · *empty* | Pass |
| 25 | 1 | `study` | Fill | `maths` | Pass | Pass |
| 25 | 1 | `finish-month` | Leave for review | *empty* | Pass | Pass |
| 25 | 1 | `enrolment` | Leave for review | `0` | Pass | Pass |

</details>

## Reproduce the comparison

Run `npm ci`, `npx playwright install chromium` and `npm run test:browser` from the repository root. The suite includes these 25 forms, 27 existing tests and three additional tests for ambiguous labels, conflicting dropdown options and existing selections.

Set `AUTOAPPLY_SCORECARD` to an output JSON path to record the initial, expected and observed value for each field check. To reproduce the baseline, extract the `browser-extension` directory from `be9bc89`, set `AUTOAPPLY_EXTENSION_PATH` to the extracted directory’s absolute path and rerun the current tests. Use the current extension and a second output path for the after run. The baseline run exits with failed assertions for the recorded misses.

[Multi-step fixtures](../tests/graduate-forms/steps.cjs) · [Picker fixtures](../tests/graduate-forms/pickers.cjs) · [Document fixtures](../tests/graduate-forms/documents.cjs) · [Field scoring](../tests/graduate-forms/score.cjs)
