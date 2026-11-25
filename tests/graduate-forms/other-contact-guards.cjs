const assert = require("node:assert/strict");

module.exports = [
  {
    name: "Numbered third-party contact sections are skipped while later applicant fields still fill",
    html: `
      <div>
        <h3>Applicant details</h3>
        <div class="formfieldDiv"><span class="formFieldLabel">First name</span><input id="entry-a"></div>
        <h3>Professional referee 1</h3>
        <h4>Contact details</h4>
        <ul><li class="application-question"><div>
          <div class="application-label">E-mail</div>
          <div class="application-field"><input id="entry-b"></div>
        </div></li></ul>
        <h3>Additional contacts</h3>
        <section>
          <h4>Previous employer 2 contact details</h4>
          <div class="formfieldDiv"><span class="formFieldLabel">Phone</span><input id="entry-c"></div>
          <h4>Emergency contact #1</h4>
          <div class="formfieldDiv"><span class="formFieldLabel">Email</span><input id="entry-d"></div>
        </section>
        <h3>Applicant correspondence</h3>
        <div class="formfieldDiv"><span class="formFieldLabel">Email</span><input id="entry-e"></div>
      </div>`,
    async verify(page) {
      assert.equal(await page.locator("#entry-a").inputValue(), "Alex Kim");
      assert.equal(await page.locator("#entry-e").inputValue(), "alex@example.invalid");
      for (const id of ["entry-b", "entry-c", "entry-d"])
        assert.equal(await page.locator("#" + id).inputValue(), "", id);
    },
  },
  {
    name: "Adjacent applicant captions identify a single field and exclude a contact footer",
    html: `
      <div class="formfieldDiv"><span class="formFieldLabel">First Name*</span>
        <input id="applicant-first" placeholder="Please Enter Your First Name*"></div>
      <div class="formfieldDiv"><span class="formFieldLabel">Email</span>
        <input id="shared-one"><input id="shared-two"></div>
      <input id="placeholder-only" placeholder="Please Enter Your First Name*">
      <footer><div class="formfieldDiv"><span class="formFieldLabel">Email</span>
        <input id="footer-field" placeholder="Email"></div></footer>
      <li class="application-question"><div>
        <div class="application-label">Which university do you currently attend (or most recently attended)?</div>
        <div class="application-field"><textarea id="candidate-college"></textarea></div>
      </div></li>
      <li class="application-question"><div>
        <div class="application-label">What is your current average mark or WAM/GPA as recorded by your university?</div>
        <div class="application-field"><textarea id="candidate-grade"></textarea></div>
      </div></li>`,
    async verify(page) {
      assert.equal(await page.locator("#applicant-first").inputValue(), "Alex Kim");
      assert.equal(await page.locator("#candidate-college").inputValue(), "Example University");
      for (const id of ["shared-one", "shared-two", "placeholder-only", "footer-field", "candidate-grade"])
        assert.equal(await page.locator("#" + id).inputValue(), "", id);
    },
  },
  {
    name: "Split name labels, example email and written location preserve surrounding field semantics",
    html: `
      <fieldset><legend>Name (Required)</legend><label>Last <input id="applicant-last"></label></fieldset>
      <fieldset><legend>Preference</legend><label>Last <input id="last-preference"></label></fieldset>
      <label for="contact-address" id="contact-question">E-mail*</label>
      <input type="email" id="contact-address" aria-labelledby="contact-question contact-example">
      <label for="contact-address" id="contact-example">example@example.com</label>
      <fieldset><legend>Referee</legend><label>E-mail <input id="ref-address"></label></fieldset>
      <label>Where are you currently located?<input id="written-answer"></label>
      <label>Where are you currently located?<input id="location-picker" list="places"></label>
      <datalist id="places"><option value="Darwin, Australia"></datalist>
      <label>Where would you like to be located?<input id="future-location"></label>`,
    async verify(page) {
      assert.equal(await page.locator("#applicant-last").inputValue(), "Tran");
      assert.equal(await page.locator("#contact-address").inputValue(), "alex@example.invalid");
      assert.equal(await page.locator("#written-answer").inputValue(), "Darwin");
      for (const id of ["last-preference", "ref-address", "location-picker", "future-location"])
        assert.equal(await page.locator("#" + id).inputValue(), "", id);
    },
  },
];
