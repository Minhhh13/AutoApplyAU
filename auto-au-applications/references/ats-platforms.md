# Employer application portals

Start with the actual requisition. When the applicant asks to find roles, use the [Australian source guide](australian-market.md) to search Prosple, SEEK, Indeed Australia, LinkedIn Jobs or other relevant sources. Follow the selected role's Apply link and verify the employer, intake and requisition again after a redirect. When a board handles the application itself, inspect that board's form with the host browser.

## Working through the form

When the optional AutoApply AU browser extension is installed and its fill control is available, use it on the current application step to enter routine profile fields. Inspect which values stuck, including any pre-existing values from a CV upload. Use the host's browser and the verified packet for the remaining questions, file uploads and review. Repeat after a conditional section opens or a new step loads. A custom employer domain or an embedded frame can expose a different set of controls. Follow the employer-provided hosted application link when available, or operate the frame with the host's supported browser tools.

Before leaving each step, check the live required markers, inline errors and uploaded filename. On a form that asks for a referee's name or a former employer's address, use evidence specific to that person or employer. Re-read the question when a dropdown determines which follow-up fields appear. Keep authentication, declarations and submission within the [browser workflow](browser-workflow.md).

## Portal guide

These ten portal families also appear in the reference extension's [published host list](https://github.com/pqthangv/AutoInternshipClaude/blob/9f72000d76a45dc499d99911247c4439ad609d0a/autointernship/manifest.json). Employer configuration determines the actual controls, steps and confirmation.

| Portal | Working with an employer's application |
|---|---|
| **Workday** | Use the employer's candidate site on `myworkdayjobs.com` or its Workday recruiting route. After CV parsing, compare each job and education entry with the original. Check the committed option in searchable lists, then inspect the next step after Save and Continue. Each employer may use a separate candidate account. |
| **Oracle Recruiting Cloud** | Follow the named requisition into Candidate Experience on `oraclecloud.com` or Oracle's own careers site. Check whether the email step starts sign-in or verification. On address or education lookups, inspect the chosen result and all dependent fields after selection. |
| **Greenhouse** | If the application is embedded, use the hosted application link for the same job when available. Hosted boards can expose standard contact fields, searchable school or location controls, uploads and employer-specific questions. Confirm each selection and attachment in the form. |
| **Lever** | Open the posting's `/apply` page. Map the full-name field and individually labelled LinkedIn, GitHub and portfolio fields. Treat company questions and the additional-information box according to their actual prompts. |
| **Ashby** | Open the Application tab for the role. Map standard fields such as name and email, then read the employer's custom prompts. After uploading the CV, compare any parsed values with the saved profile. |
| **iCIMS** | Inspect the active candidate profile or application frame. Check for an existing CV and verify the file shown after a replacement. Keep personal address fields separate from work-history addresses. A step called Submit or Submit Profile can transmit information early. Use the actual page wording and observed result to decide whether to continue or stop for review. |
| **SmartRecruiters** | Open the employer's Apply or Easy Apply route and verify the posting after a handoff to the OneClick form. Check imported contact, work-history and education sections before continuing to screening or optional questions. |
| **Workable** | Follow the hosted listing into its Application section. Referrals, talent pools and an employer's job application can have similar contact fields. Match the job first, then inspect the profile and employer questions. |
| **Jobvite** | A Jobvite short link may redirect to a branded posting or application. Check the requisition after that redirect. After uploading or reusing a CV, inspect the populated details before opening the next step. |
| **BambooHR** | Verify the employer's careers posting and check for prefilled contact details and CV when arriving from SEEK. Inspect custom questions and the attached filename before the final action. |

AutoApply AU also recognises two additional candidate routes.

| Portal | Working with an employer's application |
|---|---|
| **Oracle Taleo** | Identify the employer's `taleo.net/careersection/` route. Resume the matching requisition in the candidate account. Check the displayed choices and saved state across configurable steps such as personal information, attachments and questionnaires. |
| **PageUp** | Follow the advertised job to the employer's `pageuppeople.com/apply/` route. Check which vacancy the applicant account is opening, distinguish Save from Submit, and verify the attachment list on the last accessible step. |

Record submission only after the intended employer portal shows a receipt, a confirmation number or a matching application-history entry. A populated form, a closed window or a new screening step still requires an outcome check.

## Reference material

The extension identifies a portal from its HTTPS candidate host and, on shared services such as Oracle Cloud, the recruiting path. It recognises some portal-specific field identifiers and also uses form labels. Guidance for unexpected controls belongs to the browser workflow above. The [validation notes](https://github.com/Minhhh13/AutoApplyAU/blob/main/docs/VALIDATION.md) describe the tests performed.

- [Ashby application fields](https://developers.ashbyhq.com/docs/creating-a-custom-careers-page) and [Lever posting and application fields](https://github.com/lever/postings-api#apply-to-a-job-posting)
- [Oracle Taleo application flows](https://docs.oracle.com/en/cloud/saas/taleo-enterprise/20b/otcug/application-flow.html) and [Oracle Careers](https://careers.oracle.com/en/sites/jobsearch/)
- [Workable hosted application links](https://help.workable.com/hc/en-us/articles/115012771647-Using-the-Workable-API-to-create-a-careers-page) and [SmartRecruiters postings](https://developers.smartrecruiters.com/docs/posting-api)
- [SEEK applications on BambooHR](https://www.bamboohr.com/product-updates/post-to-seek-and-manage-applicants-in-bamboohr)
