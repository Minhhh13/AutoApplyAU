// Each page change is an applicant action. The extension only gets to fill the visible step.
const fill = (id, expected, issue) => ({ id, mode: "fill", expected, issue });
const review = (id, expected, issue) => ({ id, mode: "review", expected, issue });
const next = page => page.getByRole("button", { name: "Continue application" }).click();
const click = id => page => page.locator("#" + id).click();

function wizard(firstTitle, first, secondTitle, second) {
  return `
    <section id="first-step" aria-labelledby="first-title">
      <h2 id="first-title">${firstTitle}</h2>
      ${first}
      <button type="button" onclick="this.closest('section').hidden=true;document.getElementById('second-step').hidden=false">Continue application</button>
    </section>
    <section id="second-step" hidden aria-labelledby="second-title">
      <h2 id="second-title">${secondTitle}</h2>
      ${second}
    </section>`;
}

module.exports = [
  {
    id: "01", name: "Top End Water – engineering graduate",
    url: "https://fictional.wd3.myworkdayjobs.com/en-AU/External/job/Engineering_R01/apply",
    html: wizard("Candidate details", `
      <label>Given names <input id="given" data-automation-id="legalNameSection_firstName"></label>
      <label>Family name <input id="family"></label>
      <label>Preferred first name <input id="preferred"></label>`,
    "Contact information", `
      <label for="contact">Contact phone number</label><input id="contact" type="tel">
      <label>Email address <input id="mail" type="email"></label>
      <label>May we send you SMS updates? <input id="sms" type="checkbox"></label>`),
    stages: [
      { checks: [fill("given", "Alex Kim", "Given names"), fill("family", "Tran", "Family name"),
        fill("preferred", "Alex", "Preferred name"), review("contact", "", "Hidden wizard step")] },
      { before: next, checks: [fill("contact", "0400 000 019", "Contact phone number label"),
        fill("mail", "alex@example.invalid", "Email address"), review("sms", false, "SMS opt-in")] },
    ],
  },
  {
    id: "02", name: "Red Centre Transit – transport planning intake",
    url: "https://secure.dc2.pageuppeople.com/apply/999/applicationForm/2002",
    html: wizard("Your application", `
      <label>Full legal name <input id="applicant"></label>
      <label>Personal email address <input id="mail" type="email"></label>`,
    "Employment eligibility", `
      <label>Australian work rights
        <select id="rights" onchange="document.getElementById('permit-details').hidden=this.value!=='temporary'">
          <option value="">Please select</option><option value="unrestricted">Unrestricted rights</option>
          <option value="temporary">Temporary visa</option>
        </select>
      </label>
      <fieldset id="permit-details" hidden><legend>Visa details</legend>
        <label>Visa subclass <input id="subclass"></label>
        <label>Visa expiry date <input id="expiry" type="date"></label>
      </fieldset>`),
    stages: [
      { checks: [fill("applicant", "Alex Kim Tran", "Full name"), fill("mail", "alex@example.invalid", "Email address")] },
      { before: next, checks: [review("rights", "", "Work rights selection"), review("subclass", "", "Unexposed visa details")] },
      { before: page => page.locator("#rights").selectOption("temporary"), checks: [
        review("rights", "temporary", "Applicant's work rights selection"), review("subclass", "", "Visa subclass"),
        review("expiry", "", "Visa expiry date")] },
    ],
  },
  {
    id: "03", name: "Coral Analytics – data science graduate",
    url: "https://job-boards.greenhouse.io/fictional/jobs/2003",
    html: wizard("Applicant information", `
      <label>First name <input id="first_name"></label>
      <label>Surname <input id="last_name"></label>
      <label>Personal email <input id="mail" type="email" value="candidate-edited@example.invalid"></label>`,
    "Academic qualifications", `
      <label>University <input id="uni"></label>
      <label>Degree name <input id="qualification"></label>
      <label>Field of study <input id="subject"></label>
      <label>Expected graduation date <input id="graduation" type="month"></label>`),
    stages: [
      { checks: [fill("first_name", "Alex Kim", "Given names"), fill("last_name", "Tran", "Surname"),
        review("mail", "candidate-edited@example.invalid", "Existing candidate edit"), review("uni", "", "Hidden wizard step")] },
      { before: next, checks: [fill("uni", "Example University", "University"), fill("qualification", "Bachelor of Science", "Degree"),
        fill("subject", "Mathematics", "Major"), review("graduation", "", "Unconfirmed graduation date")] },
    ],
  },
  {
    id: "04", name: "Arafura Ports – operations graduate",
    url: "https://fictional.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/2004/apply",
    html: wizard("Your contact details", `
      <span id="contact-label">Email address</span><input id="mail" type="email" aria-labelledby="contact-label">
      <label>Mobile number <input id="mobile" type="tel"></label>`,
    "Residential address", `
      <label>Street address <input id="street"></label>
      <label>Residential postcode <input id="postal" type="text" inputmode="numeric" maxlength="4"></label>
      <label>State or territory <select id="region"><option value="">Select</option>
        <option value="north">Northern Territory</option><option value="south">South Australia</option></select></label>
      <label>Mailing address is the same as this address <input type="checkbox" id="mailing"></label>`),
    stages: [
      { checks: [fill("mail", "alex@example.invalid", "ARIA-labelled email"), fill("mobile", "0400 000 019", "Mobile number"),
        review("postal", "", "Hidden wizard step")] },
      { before: next, checks: [fill("street", "18 Example Street", "Residential street address"),
        fill("postal", "0800", "Residential postcode label"), fill("region", "north", "State name exact match"),
        review("mailing", false, "Mailing address declaration")] },
    ],
  },
  {
    id: "05", name: "Bass Strait Research – laboratory intake",
    url: "https://jobs.lever.co/fictional/graduate-lab-2005/apply",
    html: wizard("Application details", `
      <label>Full name <input id="applicant" name="name"></label>
      <label>City or suburb <input id="locality"></label>`,
    "Supporting information", `
      <label>List a professional referee now <input id="add-referee" type="checkbox"
        onchange="document.getElementById('third-party').hidden=!this.checked"></label>
      <fieldset id="third-party" hidden><legend>Professional referee</legend>
        <label>Full name <input id="other-name"></label>
        <label>Email address <input id="other-mail" type="email"></label>
      </fieldset>`),
    stages: [
      { checks: [fill("applicant", "Alex Kim Tran", "Full name"), fill("locality", "Darwin", "Applicant city")] },
      { before: next, checks: [review("add-referee", false, "Optional referee choice")] },
      { before: click("add-referee"), checks: [review("add-referee", true, "Applicant's referee choice"),
        review("other-name", "", "Referee name"), review("other-mail", "", "Referee email")] },
    ],
  },
  {
    id: "06", name: "Mallee Energy – sustainability graduate",
    url: "https://jobs.ashbyhq.com/fictional/graduate-energy-2006/application",
    html: wizard("Graduate applicant", `
      <label>Legal name <input id="candidate" name="_systemfield_name"></label>
      <label>Country of residence <select id="residence"><option value="">Select one</option>
        <option value="AU">Australia</option><option value="NZ">New Zealand</option></select></label>`,
    "Working arrangements", `
      <label><input id="show-sponsor" type="checkbox"
        onchange="document.getElementById('support-details').hidden=!this.checked">I require visa sponsorship</label>
      <fieldset hidden id="support-details"><legend>Visa sponsorship details</legend>
        <label>Country <input id="document-country"></label>
        <label>Describe the support you require <textarea id="support"></textarea></label>
      </fieldset>`),
    stages: [
      { checks: [fill("candidate", "Alex Kim Tran", "Full name"), fill("residence", "AU", "Country of residence")] },
      { before: next, checks: [review("show-sponsor", false, "Visa sponsorship declaration")] },
      { before: click("show-sponsor"), checks: [review("show-sponsor", true, "Applicant's sponsorship selection"),
        review("document-country", "", "Country in visa section"), review("support", "", "Sponsorship narrative")] },
    ],
  },
  {
    id: "07", name: "Gulf Health Services – business graduate",
    url: "https://fictional.icims.com/jobs/2007/job",
    html: wizard("Personal information", `
      <label>First name <input id="candidate-given" name="PersonProfileFields.FirstName"></label>
      <label>Last name <input id="candidate-family" name="PersonProfileFields.LastName"></label>`,
    "Contacts", `
      <label>Mobile phone <input id="own-phone" type="tel"></label>
      <div role="group" aria-labelledby="contact-person"><h3 id="contact-person">Emergency contact</h3>
        <label>Email address <input id="other-mail" type="email"></label>
        <label>Phone number <input id="other-phone" type="tel"></label>
      </div>`),
    stages: [
      { checks: [fill("candidate-given", "Alex Kim", "Given names"), fill("candidate-family", "Tran", "Surname"),
        review("own-phone", "", "Hidden wizard step")] },
      { before: next, checks: [fill("own-phone", "0400 000 019", "Applicant mobile"), review("other-mail", "", "Emergency contact email"),
        review("other-phone", "", "Emergency contact phone")] },
    ],
  },
  {
    id: "08", name: "Riverland Rail – civil graduate rotations",
    url: "https://apply.workable.com/fictional/j/CIVIL2008/apply/",
    html: wizard("Your current location", `
      <label>Residential suburb <input id="home-locality"></label>
      <label>Postcode <input id="zip" type="text" maxlength="4"></label>`,
    "Office preferences", `
      <label>Preferred office <select id="office" onchange="document.getElementById('office-explanation').hidden=this.value!=='other'">
        <option value="">Choose</option><option value="darwin">Darwin</option><option value="other">Other location</option></select></label>
      <label id="office-explanation" hidden>Preferred office location <input id="preferred-office"></label>`),
    stages: [
      { checks: [fill("home-locality", "Darwin", "Residential suburb label"), fill("zip", "0800", "Postcode with leading zero")] },
      { before: next, checks: [review("office", "", "Office preference selection")] },
      { before: page => page.locator("#office").selectOption("other"), checks: [review("office", "other", "Applicant's office preference"),
        review("preferred-office", "", "Preferred office differs from residence")] },
    ],
  },
  {
    id: "09", name: "Wattle Insurance – actuarial graduate",
    url: "https://jobs.smartrecruiters.com/Fictional/2009/application/",
    html: wizard("Applicant identity", `
      <label>Full name <input id="candidate"></label>
      <label>Preferred name <input id="called"></label>`,
    "Employment history", `
      <label>Have you previously held a paid role? <select id="has-history"
        onchange="document.getElementById('prior-job').hidden=this.value!=='yes'">
        <option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option></select></label>
      <fieldset id="prior-job" hidden><legend>Previous employer</legend>
        <label>City <input id="work-city"></label>
        <label>Phone <input id="work-phone" type="tel"></label>
      </fieldset>`),
    stages: [
      { checks: [fill("candidate", "Alex Kim Tran", "Full name"), fill("called", "Alex", "Preferred name")] },
      { before: next, checks: [review("has-history", "", "Employment history declaration")] },
      { before: page => page.locator("#has-history").selectOption("yes"), checks: [review("has-history", "yes", "Applicant's employment history selection"),
        review("work-city", "", "Previous employer city"), review("work-phone", "", "Previous employer phone")] },
    ],
  },
];
