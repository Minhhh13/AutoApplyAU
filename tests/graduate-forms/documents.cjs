// Single-page graduate applications with document and qualification requirements.
const fill = (id, expected, issue) => ({ id, mode: "fill", expected, issue });
const review = (id, expected, issue) => ({ id, mode: "review", expected, issue });
const emptyFile = id => review(id, "0", "manual document upload");

module.exports = [
  {
    id: "18", name: "Darwin catchment science graduate",
    url: "https://secure.dc2.pageuppeople.com/apply/918/applicationForm/18",
    html: `
      <fieldset><legend>Applicant details</legend>
        <label>Given names <input id="applicant-given"></label>
        <label>Surname <input id="applicant-surname"></label>
      </fieldset>
      <fieldset><legend>University qualification</legend>
        <label>Degree title <input id="award-title"></label>
        <label>University / institution <input id="awarding-body"></label>
        <label>Weighted average mark <input id="weighted-mark" inputmode="decimal"></label>
        <label>Academic transcript (PDF) <input type="file" accept=".pdf" id="official-results"></label>
      </fieldset>`,
    stages: [{ checks: [
      fill("applicant-given", "Alex Kim", "given name"),
      fill("applicant-surname", "Tran", "family name"),
      fill("award-title", "Bachelor of Science", "education label wording"),
      fill("awarding-body", "Example University", "education label wording"),
      review("weighted-mark", "", "unconfirmed academic result"),
      emptyFile("official-results"),
    ] }],
  },
  {
    id: "19", name: "Perth inclusive design graduate",
    url: "https://jobs.lever.co/example-studio/graduate-design-19/apply",
    html: `
      <label>Full name <input id="designer-name"></label>
      <label>Contact email <input id="designer-email" type="email"></label>
      <label>Portfolio URL <input id="portfolio-page" type="url" value="https://example.invalid/design-work"></label>
      <label>Writing sample <input id="design-sample" type="file" accept=".txt"></label>
      <label>Interview adjustments (optional) <textarea id="access-needs"></textarea></label>`,
    stages: [{
      before: page => page.locator("#design-sample").setInputFiles({
        name: "fictional-design-sample.txt", mimeType: "text/plain", buffer: Buffer.from("Sample by Alex."),
      }),
      checks: [
        fill("designer-name", "Alex Kim Tran", "full name"),
        fill("designer-email", "alex@example.invalid", "contact email"),
        review("portfolio-page", "https://example.invalid/design-work", "existing applicant answer"),
        {
          ...review("design-sample", "fictional-design-sample.txt:Sample by Alex.", "existing document"),
          read: locator => locator.evaluate(async input => {
            const files = await Promise.all(Array.from(input.files, async file => file.name + ":" + await file.text()));
            return files.join(",");
          }),
        },
        review("access-needs", "", "applicant-specific adjustments"),
      ],
    }],
  },
  {
    id: "20", name: "Hobart marine research graduate",
    url: "https://example-science.bamboohr.com/careers/20",
    html: `
      <label>Preferred name <input id="candidate-preferred"></label>
      <fieldset><legend>Undergraduate qualification</legend>
        <label>University <input id="first-school"></label>
        <label>Degree <input id="first-award"></label>
      </fieldset>
      <fieldset><legend>Postgraduate qualification, if applicable</legend>
        <label>University <input id="second-school"></label>
        <label>Degree <input id="second-award"></label>
      </fieldset>
      <label>Attach research summary <input type="file" id="research-summary"></label>`,
    stages: [{ checks: [
      fill("candidate-preferred", "Alex", "preferred name"),
      review("first-school", "", "multiple qualification entries"),
      review("second-school", "", "multiple qualification entries"),
      review("first-award", "", "multiple qualification entries"),
      review("second-award", "", "multiple qualification entries"),
      emptyFile("research-summary"),
    ] }],
  },
  {
    id: "21", name: "Adelaide rail planning graduate",
    url: "https://example-transit.wd3.myworkdayjobs.com/en-AU/careers/job/rail-graduate_21/apply",
    html: `
      <label>Mobile phone <input id="mobile-contact" type="tel"></label>
      <fieldset><legend>Education</legend>
        <label>Degree <select id="award">
          <option value="" selected disabled>Select your qualification…</option>
          <option value="eng">Bachelor of Engineering</option><option value="sci">Bachelor of Science</option>
        </select></label>
        <label>Field of study <input id="course-area"></label>
      </fieldset>
      <label>Upload your CV <input type="file" id="rail-cv"></label>
      <label>Driver licence expiry <input type="date" id="licence-expires"></label>`,
    stages: [{ checks: [
      fill("mobile-contact", "0400 000 019", "mobile number"),
      fill("award", "sci", "native select placeholder"),
      fill("course-area", "Mathematics", "major"),
      emptyFile("rail-cv"),
      review("licence-expires", "", "unconfirmed date"),
    ] }],
  },
  {
    id: "22", name: "Brisbane coastal audit graduate",
    url: "https://jobs.smartrecruiters.com/ExampleAudit/graduate-22/application/",
    html: `
      <section><h2>Residential address</h2>
        <label>Street address <input id="street"></label>
        <label>Suburb <input id="locality"></label>
        <label>State / territory <select id="region" required>
          <option value="" selected disabled>Choose your state or territory</option>
          <option value="act">Australian Capital Territory</option><option value="nt">Northern Territory</option>
        </select></label>
        <label>Postcode <input id="zip" inputmode="numeric" maxlength="4"></label>
      </section>
      <label>Upload a cover letter <input type="file" id="letter" accept=".pdf,.docx"></label>
      <label><input type="checkbox" id="relocate">I am willing to relocate to Brisbane.</label>`,
    stages: [{ checks: [
      fill("street", "18 Example Street", "street address"),
      fill("locality", "Darwin", "city"),
      fill("region", "nt", "native select placeholder"),
      fill("zip", "0800", "postcode"),
      emptyFile("letter"),
      review("relocate", false, "relocation preference"),
    ] }],
  },
  {
    id: "23", name: "Melbourne performing arts graduate",
    url: "https://apply.workable.com/example-arts/j/GRAD23/apply/",
    html: `
      <label>Email address <input id="performer-email" type="email"></label>
      <label>LinkedIn profile <input id="professional-url" type="url"></label>
      <fieldset><legend>Referee details</legend>
        <label>Full name <input id="contact-name"></label>
        <label>Email address <input id="contact-address" type="email"></label>
      </fieldset>
      <label>Attach performance samples <input id="stage-samples" type="file" multiple></label>`,
    stages: [{ checks: [
      fill("performer-email", "alex@example.invalid", "contact email"),
      fill("professional-url", "https://example.invalid/alex", "LinkedIn address"),
      review("contact-name", "", "referee details"),
      review("contact-address", "", "referee details"),
      emptyFile("stage-samples"),
    ] }],
  },
  {
    id: "24", name: "Canberra archives graduate",
    url: "https://example-archives.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/24/apply",
    html: `
      <label>Family name <input id="archive-surname"></label>
      <fieldset><legend>Education</legend>
        <label>Degree title <input id="course-name"></label>
        <label>Institution name <input id="awarding-institution" value="Example Institute of Archives"></label>
        <label>Major <input id="archive-major"></label>
      </fieldset>
      <label>Upload your university results <input type="file" id="archive-results"></label>
      <label><input type="checkbox" id="archive-declaration">I certify that the documents are accurate.</label>`,
    stages: [{ checks: [
      fill("archive-surname", "Tran", "family name"),
      fill("course-name", "Bachelor of Science", "education label wording"),
      review("awarding-institution", "Example Institute of Archives", "existing applicant answer"),
      fill("archive-major", "Mathematics", "major"),
      emptyFile("archive-results"),
      review("archive-declaration", false, "declaration"),
    ] }],
  },
  {
    id: "25", name: "Newcastle renewables analysis graduate",
    url: "https://job-boards.greenhouse.io/example-energy/jobs/25025",
    html: `
      <label>Personal email <input id="analyst-email" type="email"></label>
      <fieldset><legend>Education</legend>
        <label>University <select id="attended" required>
          <option value="" disabled selected>Start by choosing your university</option>
          <option value="regional">Example Regional University</option><option value="example">Example University</option>
        </select></label>
        <label>Field of study <select id="study">
          <option value="">Select</option><option value="maths">Mathematics</option>
          <option value="eng">Engineering</option>
        </select></label>
      </fieldset>
      <label>Predicted graduation date <input type="month" id="finish-month"></label>
      <label>Proof of enrolment <input type="file" id="enrolment"></label>`,
    stages: [{ checks: [
      fill("analyst-email", "alex@example.invalid", "contact email"),
      fill("attended", "example", "native select placeholder"),
      fill("study", "maths", "major"),
      review("finish-month", "", "unconfirmed date"),
      emptyFile("enrolment"),
    ] }],
  },
];
