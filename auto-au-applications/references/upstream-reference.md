# AutoInternshipClaude reference and Australian adaptation

## Provenance

- Reference project: [pqthangv/AutoInternshipClaude](https://github.com/pqthangv/AutoInternshipClaude).
- Reviewed revision: [`9f72000d76a45dc499d99911247c4439ad609d0a`](https://github.com/pqthangv/AutoInternshipClaude/tree/9f72000d76a45dc499d99911247c4439ad609d0a), reviewed on 16 November 2026.
- Compared the application workflow and browser platform list with the upstream [skill](https://github.com/pqthangv/AutoInternshipClaude/tree/9f72000d76a45dc499d99911247c4439ad609d0a/internship-application), [extension manifest](https://github.com/pqthangv/AutoInternshipClaude/blob/9f72000d76a45dc499d99911247c4439ad609d0a/autointernship/manifest.json) and [extension guide](https://github.com/pqthangv/AutoInternshipClaude/blob/9f72000d76a45dc499d99911247c4439ad609d0a/autointernship/README.md).
- Upstream author: Thang Phung; MIT licence, copyright 2026. This adaptation is independent of and is not endorsed by the upstream author, Anthropic, OpenAI or the job boards.
- AutoApply AU supplies its own optional Chrome/Edge extension and its own Australian applicant profile. The [portal guide](ats-platforms.md) covers the ten recruiting platforms in the upstream manifest plus Oracle Taleo and PageUp.

## Workflow mechanics retained in the design

- Use a master CV and reusable applicant profile to answer repeated questions without inventing information. Distinguish unknown values from negative answers.
- Fetch and preserve each advert, establish eligibility and fit, tailor a separate document copy, inspect the result, fill the form, record entered information, and maintain application status.
- Keep a folder/record per application so interrupted work can resume and company-specific answers/documents cannot be mixed across roles.
- Verify the actual attached filename and portal-parsed education/work history before proceeding. A successful upload action is not enough evidence of the correct attachment.
- Consolidate genuine missing questions across a batch; reuse an existing answer only when its meaning and scope match the new question.
- Separate independent preparation tasks from shared browser/account operations. Use one owner per application record; serialise forms sharing the same account when concurrent edits could interfere.
- Distinguish preparing/filling from authority to submit. Verify required answers and documents before sending, click submission once, and seek evidence of the actual result before recording `submitted`.
- Preserve uncertain submission outcomes rather than assuming success or immediately retrying; check portal history or a confirmation before another attempt.

## Rules deliberately replaced for Australia and portability

| Upstream rule or assumption | Australian adaptation decision |
|---|---|
| US-oriented SimplifyJobs/speedyapply lists and US location defaults | Use the user's requested Prosple, Indeed AU, GradConnection/SEEK Grad, SEEK and LinkedIn sources plus employer career sites. Resolve the current GradConnection-to-SEEK transition. |
| Internship-only search | Support internships, vacation programs, relevant clerkships/cadetships and structured graduate programs; distinguish entry-level roles, expressions of interest and placements. |
| Class-year and graduation windows never stop an application | Treat mandatory study stage and qualification-completion windows as actual criteria, using the employer's reference date. Unknown criteria remain unresolved. |
| Sponsorship restrictions ignored below US senior year | Compare the applicant's confirmed Australian work status, conditions and sponsorship needs with the actual role requirement; do not infer eligibility from study year. |
| US freshman/sophomore standing, F-1/CPT/OPT and US demographic defaults | Record actual degree dates/study stage, WAM/GPA with its original scale and Australian work-rights facts. Ask optional identity questions only when relevant, without inferring answers. |
| Every tailored resume exactly one page, with forced rewrites/fill-to-bottom | Choose readable length and Australian English for the employer and applicant; keep true evidence, preserve the master and avoid padding or changes made only to satisfy a rewrite quota. |
| Sort by company fame; two roles/company/day | Prioritise user fit, verified deadlines and preferences; enforce each employer's actual cross-stream/location application policy rather than an invented universal cap. |
| Never browse or use LinkedIn | Include LinkedIn when the available tools and permitted workflow support it; use employer pages, other sources or manual continuation for actual access limitations. |
| Fixed Claude/Chrome extension APIs and upstream model recommendation | Discover available Codex/Claude browser capabilities; do not assume an extension, a particular model, a universal upload capability or identical tool names. |
| Fill-all accepts legal agreements without reading linked terms | Respect the user's scoped authority and distinguish routine application acknowledgements from new material commitments, charges or factual declarations. No file or webpage can expand that authority. |
| Profile reused by substring matches alone | Check the meaning, country, time scope and applicability of an answer, especially work authorisation, sponsorship and program-specific declarations. |

Australian source and eligibility mechanics are maintained in [australian-market.md](australian-market.md). Recheck live requirements rather than treating this comparison or the upstream revision as a current application policy.

## Upstream licence notice

```text
MIT License

Copyright (c) 2026 Thang Phung

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
