// Install the dev dependency and full Chromium with npm ci && npx playwright install chromium.
// All portal requests in these tests are intercepted and served as fictional forms.
const assert = require("node:assert/strict");
const path = require("node:path");
const { before, after, test } = require("node:test");
const { chromium } = require("playwright");
const clickPopupFill = require("./extension-action.cjs");

const extensionPath = path.resolve(__dirname, "../browser-extension");
const profile = {
  schema_version: 1,
  person: {
    legal_name: "Alex Kim Tran", given_name: "Alex Kim", family_name: "Tran",
    email: "alex@example.invalid", city: "Darwin", state_or_territory: "NT",
    postcode: "0800", country: "Australia", linkedin_url: "https://example.invalid/alex",
  },
  education: [{ institution: "Example University", degree: "Bachelor of Science" }],
  work_rights: { status_in_users_words: "Private example" },
  documents: { master_cv: "private-cv.pdf" },
};
const fixtures = new Map();
let context, extensionUrl;

function fixture(body, adjacent = "") {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Example graduate application</title>
    <h1>Apply for the graduate program</h1>
    <form id="application-form"><fieldset><legend>Personal information</legend>
    ${body}
    </fieldset><button type="submit">Submit application</button></form>${adjacent}
    <script>
      window.submits = 0;
      document.querySelector('form').addEventListener('submit', e => { e.preventDefault(); window.submits++; });
      window.eventsSeen = [];
      for (const name of ['input', 'change']) document.addEventListener(name, e => {
        if (e.target.dataset.check) window.eventsSeen.push(e.target.dataset.check + ':' + name);
      });
    </script></html>`;
}

async function loadFixture(t, url, content, adjacent = "") {
  fixtures.set(url, fixture(content, adjacent));
  const page = await context.newPage();
  t.after(() => page.close());
  await page.goto(url);
  return page;
}

async function importProfile() {
  const settings = await context.newPage();
  try {
    await settings.goto(extensionUrl);
    await settings.locator("#profile-file").setInputFiles({
      name: "profile.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(profile)),
    });
    await settings.waitForFunction(async () =>
      (await chrome.storage.local.get("confirmedFields")).confirmedFields?.givenName === "Alex Kim");
    const stored = await settings.evaluate(async () => (await chrome.storage.local.get("confirmedFields")).confirmedFields);
    assert.equal(stored.fullName, profile.person.legal_name);
    assert.equal(stored.postcode, "0800");
    assert(!JSON.stringify(stored).includes("private-cv"));
    assert(!JSON.stringify(stored).includes("Private example"));
  } finally {
    await settings.close();
  }
}

before(async () => {
  context = await chromium.launchPersistentContext("", {
    headless: true,
    channel: process.env.AUTOAPPLY_BROWSER_CHANNEL || "chromium",
    ignoreDefaultArgs: ["--disable-extensions"],
    args: ["--enable-unsafe-extension-debugging"],
  });
  context.setDefaultTimeout(6000);
  const control = await context.browser().newBrowserCDPSession();
  const { id } = await control.send("Extensions.loadUnpacked", { path: extensionPath });
  extensionUrl = `chrome-extension://${id}/popup.html`;
  await control.detach();
  await context.route(/^https?:\/\//, route => {
    const html = fixtures.get(route.request().url());
    if (html && route.request().method() === "GET" && route.request().isNavigationRequest()) {
      return route.fulfill({ status: 200, contentType: "text/html", body: html });
    }
    return route.abort();
  });
  await importProfile();
});

after(async () => { if (context) await context.close(); });

const portals = [
  ["Workday", "https://fixture.wd3.myworkdayjobs.com/en-AU/External/job/Graduate_R1/apply", 'data-automation-id="legalNameSection_firstName"', "Alex Kim"],
  ["Greenhouse", "https://job-boards.greenhouse.io/fixture/jobs/12", 'id="first_name"', "Alex Kim"],
  ["Lever", "https://jobs.lever.co/fixture/123/apply", 'name="urls[LinkedIn]"', profile.person.linkedin_url],
  ["Ashby", "https://jobs.ashbyhq.com/fixture/123/application", 'name="_systemfield_name"', profile.person.legal_name],
  ["Oracle Recruiting Cloud", "https://fixture.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/12/apply", 'id="firstName"', "Alex Kim"],
  ["Oracle Taleo", "https://fixture.taleo.net/careersection/1/jobapply.ftl", 'id="careersection:personalInformation:firstName"', "Alex Kim"],
  ["iCIMS", "https://fixture.icims.com/jobs/12/job", 'name="PersonProfileFields.AddressCity"', "Darwin"],
  ["SmartRecruiters", "https://jobs.smartrecruiters.com/fixture/123/application/", 'name="firstName"', "Alex Kim"],
  ["Workable", "https://apply.workable.com/fixture/j/ABC/apply/", 'data-ui="firstname"', "Alex Kim"],
  ["Jobvite", "https://jobs.jobvite.com/fixture/job/12/apply", 'name="firstName"', "Alex Kim"],
  ["BambooHR", "https://fixture.bamboohr.com/careers/12", 'name="firstName"', "Alex Kim"],
  ["PageUp", "https://secure.dc2.pageuppeople.com/apply/123/applicationForm/42", 'name="firstName"', "Alex Kim"],
];

const fillButton = page => page.locator("#autoapply-au-toolbar #autoapply-fill");
const field = (page, key) => page.locator(`[data-check="${key}"]`);

for (const [name, url, attributes, expected] of portals) {
  test(`${name} fills its portal control from the imported profile and preserves existing answers`, async t => {
    const page = await loadFixture(t, url, `
      <input data-check="candidate" ${attributes}>
      <label>Email address <input type="email" name="email" data-check="email" value="my-edit@example.invalid"></label>
    `);
    const fill = fillButton(page);
    await fill.waitFor();
    assert.equal(await field(page, "candidate").inputValue(), "");
    await fill.click();
    await page.waitForFunction(expected =>
      document.querySelector('[data-check="candidate"]').value === expected, expected);
    const report = page.locator("#autoapply-au-toolbar [role=status]").filter({ hasText: name });
    await report.waitFor();
    assert(!(await report.innerText()).includes(expected), "The report lists field names, not private values");
    assert.equal(await field(page, "email").inputValue(), "my-edit@example.invalid");
    const events = await page.evaluate(() => window.eventsSeen);
    assert(events.includes("candidate:input"));
    assert(events.includes("candidate:change"));
    await fill.click();
    assert.deepEqual(await page.evaluate(() => window.eventsSeen), events);
    assert.equal(await page.evaluate(() => window.submits), 0);
  });
}

test("Workday preserves protected, hidden, history and manually entered values", async t => {
  const page = await loadFixture(t, portals[0][1], `
    <label>Postcode <input name="postalCode" data-check="postcode"></label>
    <label>Given name <input data-check="readonly" readonly></label>
    <label hidden>Email address <input name="email" data-check="hidden"></label>
    <label>Family name <input disabled name="lastName" data-check="disabled"></label>
    <fieldset><legend>Work experience</legend><label>City
      <input name="workExperience-1-city" data-check="history"></label></fieldset>
    <label>Do you require visa sponsorship? <select data-check="sponsor">
      <option value="">Select</option><option>Yes</option><option>No</option></select></label>
    <label><input type="checkbox" data-check="consent">I agree</label>
    <label>Resume <input type="file" data-check="file"></label>
  `);
  await fillButton(page).waitFor();
  // A page script cannot use the extension's public button to trigger a fill.
  await fillButton(page).evaluate(el => el.click());
  assert.equal(await field(page, "postcode").inputValue(), "");
  await fillButton(page).click();
  await page.waitForFunction(() => document.querySelector('[data-check="postcode"]').value === "0800");
  for (const key of ["readonly", "hidden", "disabled", "history", "sponsor", "file"]) {
    assert.equal(await field(page, key).inputValue(), "", key);
  }
  assert.equal(await field(page, "consent").isChecked(), false);
  assert.equal(await page.evaluate(() => window.submits), 0);
});

test("a sign-in form keeps its contact and verification fields empty", async t => {
  const page = await loadFixture(t, portals[4][1], `
    <label>Email address <input name="email" data-check="email"></label>
    <label>Password <input type="password" data-check="password"></label>
    <label>One-time code <input autocomplete="one-time-code" data-check="code"></label>
  `);
  // A recognised employer portal may still display the toolbar on this form.
  await page.waitForLoadState("networkidle");
  if (await fillButton(page).isVisible()) await fillButton(page).click();
  for (const key of ["email", "password", "code"]) assert.equal(await field(page, key).inputValue(), "", key);
});

test("Oracle uses the matching Australian state and leaves ambiguous choices alone", async t => {
  const page = await loadFixture(t, portals[4][1], `
    <label>State <select id="state" data-check="state">
      <option value="">Select</option><option value="VIC">Victoria</option>
      <option value="AU-NT">Northern Territory</option></select></label>
    <label>State <select data-check="ambiguous">
      <option value="">Select</option><option value="a">Northern Territory</option>
      <option value="b">Northern Territory</option></select></label>
  `);
  await fillButton(page).click();
  await page.waitForFunction(() => document.querySelector("#state").value === "AU-NT");
  assert.equal(await field(page, "ambiguous").inputValue(), "");
});

test("Oracle Recruiting chooses one country from its owned grid and ignores the calendar and other grids", async t => {
  const page = await loadFixture(t, portals[4][1], `
    <label>Country of residence
      <input role="combobox" aria-haspopup="grid" aria-controls="country-grid" aria-expanded="false"
        id="country-picker" onclick="document.getElementById('country-grid').hidden=false;this.setAttribute('aria-expanded','true')">
    </label>
    <div role="grid" id="country-grid" hidden>
      <div role="row"><div role="gridcell">Austria</div></div>
      <div role="row" onclick="const el=document.getElementById('country-picker');el.value='Australia';
           el.setAttribute('aria-expanded','false'); this.parentNode.hidden=true;">
        <div role="gridcell">Australia</div></div>
    </div>
    <button type="button" role="combobox" aria-label="Availability date" aria-controls="calendar"
      aria-haspopup="grid" onclick="this.dataset.opened='true'" data-check="date">Choose</button>
    <div role="grid" id="calendar"><div role="row"><div role="gridcell">16</div></div></div>
    <div role="grid" id="other-grid"><div role="row" onclick="this.dataset.clicked='true'">
      <div role="gridcell">Australia</div></div></div>`);
  await fillButton(page).click();
  await page.waitForFunction(() => document.querySelector("#country-picker").value === "Australia");
  assert.equal(await field(page, "date").getAttribute("data-opened"), null);
  assert.equal(await page.locator("#other-grid [data-clicked]").count(), 0);
  assert.equal(await page.evaluate(() => window.submits), 0);
});

test("Workday selects the exact option from the combobox's own listbox", async t => {
  const page = await loadFixture(t, portals[0][1], `
    <button type="button" role="combobox" aria-label="State" aria-controls="state-list" aria-expanded="false"
      id="state-picker" onclick="document.getElementById('state-list').hidden=false; this.setAttribute('aria-expanded','true')">Select one</button>
    <ul role="listbox" id="state-list" hidden>
      <li role="option">Victoria</li>
      <li role="option" onclick="const el=document.getElementById('state-picker'); el.textContent=this.textContent;
        el.setAttribute('aria-expanded','false'); this.parentNode.hidden=true;">Northern Territory</li>
    </ul>
    <ul role="listbox" aria-label="Unrelated question">
      <li role="option" onclick="this.setAttribute('aria-selected','true')">Northern Territory</li>
    </ul>`);
  await fillButton(page).click();
  await page.waitForFunction(() => document.querySelector("#state-picker").textContent === "Northern Territory");
  assert.equal(await page.locator('[aria-label="Unrelated question"] [aria-selected]').count(), 0);
  assert.equal(await page.evaluate(() => window.submits), 0);
});

test("a conditional question that changes meaning during a fill is rechecked", async t => {
  const page = await loadFixture(t, portals[4][1], `
    <label>First name <input id="firstName" onchange="
      document.getElementById('next-label').textContent='Recruiter email';
      document.getElementById('next').name='recruiterEmail';"></label>
    <label for="next" id="next-label">Email address</label><input id="next" name="email" data-check="repurposed">
  `);
  await fillButton(page).click();
  await page.waitForFunction(() => document.querySelector("#next").name === "recruiterEmail");
  await page.locator("#autoapply-au-toolbar [role=status]").filter({ hasText: /\S/ }).waitFor();
  assert.equal(await field(page, "repurposed").inputValue(), "");
});

test("only the applicant's details are filled beside references, job alerts and an offscreen honeypot", async t => {
  const page = await loadFixture(t, portals[2][1], `
    <h2>Application details</h2>
    <label>LinkedIn URL <input data-check="linkedin"></label>
    <div><h3>Reference details</h3><label>Email address <input name="email" data-check="referee"></label></div>
    <label style="position:absolute;left:-10000px">Email address <input name="email" data-check="trap"></label>
    <label style="display:block;margin-top:130vh">Full name <input name="name" data-check="below"></label>
  `, `<form><h2>Job alerts</h2><label>Email address <input name="email" data-check="alert"></label>
    <button type="submit">Sign me up</button></form>`);
  await fillButton(page).click();
  await page.locator("#autoapply-au-toolbar [role=status]").filter({ hasText: /\S/ }).waitFor();
  assert.equal(await field(page, "linkedin").inputValue(), profile.person.linkedin_url);
  assert.equal(await field(page, "below").inputValue(), profile.person.legal_name);
  for (const key of ["referee", "trap", "alert"]) assert.equal(await field(page, key).inputValue(), "", key);
});

test("a single-page portal changing job requisition ends the active fill", async t => {
  const page = await loadFixture(t, portals[4][1], `
    <label>First name <input id="firstName" onchange="history.pushState({},'',location.pathname.replace('/12/', '/98/'))"></label>
    <label>Email address <input name="email" data-check="other-role"></label>
  `);
  await fillButton(page).click();
  await page.waitForURL(/\/job\/98\//);
  await page.locator("#autoapply-au-toolbar [role=status]").filter({ hasText: /\S/ }).waitFor();
  assert.equal(await field(page, "other-role").inputValue(), "");
  assert.equal(await page.evaluate(() => window.submits), 0);
});

test("iCIMS distinguishes a personal contact field from a work-history field with the same label", async t => {
  const page = await loadFixture(t, portals[6][1], `
    <label>City <input name="PersonProfileFields.AddressCity" data-check="current"></label>
    <fieldset><legend>Employer address</legend><label>City
      <input name="PersonProfileFields.rcf3216" data-check="previous"></label></fieldset>
  `);
  await fillButton(page).click();
  await page.waitForFunction(() => document.querySelector('[data-check="current"]').value === "Darwin");
  assert.equal(await field(page, "previous").inputValue(), "");
});

test("Greenhouse keeps the telephone country separate from country of residence", async t => {
  const page = await loadFixture(t, portals[1][1], `
    <label>Country <select name="country" data-check="calling">
      <option value="">Select</option><option value="61">Australia</option></select></label>
    <label>Country of residence <select name="residence" data-check="residence">
      <option value="">Select</option><option value="AU">Australia</option></select></label>
  `);
  await fillButton(page).click();
  await page.waitForFunction(() => document.querySelector('[data-check="residence"]').value === "AU");
  assert.equal(await field(page, "calling").inputValue(), "");
});

test("a Greenhouse-style React Select opens on mousedown and preserves a rendered selection beside an empty search input", async t => {
  const page = await loadFixture(t, portals[1][1], `
    <div class="select__control" id="open-control">
      <div class="select__value-container"><span id="selected-city"></span>
        <div class="select__input-container"><input role="combobox" aria-label="City" aria-expanded="false"></div>
      </div>
    </div>
    <div role="listbox" id="cities" hidden><div role="option">Darlington</div>
      <div role="option" id="darwin">Darwin</div></div>
    <div class="select__control" id="existing-control">
      <div class="select__value-container"><span class="select__single-value">Victoria</span>
        <div class="select__input-container"><input role="combobox" aria-label="State" aria-expanded="false"></div>
      </div>
    </div>
    <script>
      const open = document.querySelector("#open-control input");
      document.getElementById("open-control").addEventListener("mousedown", () => {
        open.setAttribute("aria-controls", "cities"); open.setAttribute("aria-expanded", "true");
        document.getElementById("cities").hidden = false;
      });
      document.getElementById("darwin").addEventListener("click", () => {
        const selected = document.getElementById("selected-city");
        selected.textContent = "Darwin"; selected.className = "select__single-value";
        open.setAttribute("aria-expanded", "false"); document.getElementById("cities").hidden = true;
      });
      document.getElementById("existing-control").addEventListener("mousedown", e => { e.currentTarget.dataset.opened = "true"; });
    </script>
  `);
  await fillButton(page).click();
  await page.locator("#autoapply-au-toolbar [role=status]").filter({ hasText: /\S/ }).waitFor();
  assert.equal(await page.locator("#selected-city").innerText(), "Darwin");
  assert.equal(await page.locator("#existing-control .select__single-value").innerText(), "Victoria");
  assert.equal(await page.locator("#existing-control").getAttribute("data-opened"), null);
});

test("an unrelated hostname resembling a portal does not receive the extension toolbar", async t => {
  const page = await loadFixture(t, "https://jobs.lever.co.example.invalid/fixture/apply",
    '<label>Full name <input autocomplete="name" data-check="fullName"></label>');
  await page.waitForLoadState("load");
  assert.equal(await page.locator("#autoapply-au-toolbar").count(), 0);
  assert.equal(await field(page, "fullName").inputValue(), "");
});

test("clicking Fill in an embedded Greenhouse form leaves its parent and a sibling frame alone", async t => {
  const atsUrl = "https://boards.greenhouse.io/embed/job_app?token=123";
  const otherUrl = "https://other.example.invalid/preferences";
  const contactInput = '<label>Email address <input name="email" data-check="contact"></label>';
  fixtures.set(atsUrl, fixture(contactInput));
  fixtures.set(otherUrl, fixture(contactInput));
  const page = await loadFixture(t, "https://employer.example.invalid/early-careers", contactInput,
    `<iframe title="Application" src="${atsUrl}" width="650" height="350"></iframe>
     <iframe title="Other" src="${otherUrl}" width="650" height="150"></iframe>`);
  const child = page.frameLocator('iframe[title="Application"]');
  const other = page.frameLocator('iframe[title="Other"]');
  await fillButton(child).click();
  await child.locator("#autoapply-au-toolbar [role=status]").filter({ hasText: "Greenhouse" }).waitFor();
  assert.equal(await field(child, "contact").inputValue(), profile.person.email);
  assert.equal(await field(page, "contact").inputValue(), "");
  assert.equal(await field(other, "contact").inputValue(), "");
  assert.equal(await page.locator("#autoapply-au-toolbar").count(), 0);
  assert.equal(await other.locator("#autoapply-au-toolbar").count(), 0);
});

test("a user can explicitly fill labelled fields on a custom employer domain from the real extension popup", async t => {
  const page = await loadFixture(t, "https://careers.example.invalid/graduate/apply",
    '<label>Email address <input type="email" data-check="contact"></label>');
  assert.equal(await page.locator("#autoapply-au-toolbar").count(), 0);
  await clickPopupFill(page, extensionUrl);
  await page.waitForFunction(expected => document.querySelector("input").value === expected, profile.person.email);
  assert.equal(await page.evaluate(() => window.submits), 0);
});

test("forgetting the profile removes it from the next application", async t => {
  const settings = await context.newPage();
  try {
    await settings.goto(extensionUrl);
    await settings.locator("#forget").click();
    await settings.waitForFunction(async () => !(await chrome.storage.local.get("confirmedFields")).confirmedFields);
    const page = await loadFixture(t, portals[1][1], '<input id="first_name" data-check="candidate">');
    await fillButton(page).click();
    await page.locator("#autoapply-au-toolbar [role=status]").filter({ hasText: "import" }).waitFor();
    assert.equal(await field(page, "candidate").inputValue(), "");
  } finally {
    await settings.close();
    await importProfile();
  }
});
