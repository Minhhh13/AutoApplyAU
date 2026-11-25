const assert = require("node:assert/strict");

module.exports = [
  {
    name: "Breezy uses candidate-bound contact fields and leaves SMS consent to the applicant",
    url: "https://fixture.breezy.hr/p/graduate-intake/apply",
    html: `
      <h3>Full Name*</h3><input id="candidate-name" name="cName" ng-model="candidate.name" placeholder="Full Name">
      <h3>Email Address*</h3><input id="candidate-email" name="cEmail" ng-model="candidate.email_address">
      <h3>Phone Number*</h3><input id="candidate-phone" name="cPhoneNumber" ng-model="candidate.phone_number">
      <label><input id="sms" type="checkbox" name="smsConsent">Providing a phone number means you agree to SMS updates.</label>
      <h3>Address</h3><input id="candidate-address" name="cAddress" ng-model="candidate.address">
      <h3>Referee email</h3><input id="other-email" name="cEmail" ng-model="candidate.email_address">
      <label>Full Name <input id="other-name" name="cName" ng-model="referee.name"></label>
      <label>Degree <input id="other-degree" ng-model="referee.degree"></label>
      <h3>Applicant education</h3>
      <label>Degree <input id="degree" ng-model="candidate.degree"></label>
      <div hidden><h3>Full Name</h3><input id="hidden-name" name="cName" ng-model="candidate.name"></div>`,
    async verify(page) {
      assert.equal(await page.locator("#candidate-name").inputValue(), "Alex Kim Tran");
      assert.equal(await page.locator("#candidate-email").inputValue(), "alex@example.invalid");
      assert.equal(await page.locator("#candidate-address").inputValue(), "18 Example Street, Darwin NT 0800, Australia");
      assert.equal(await page.locator("#sms").isChecked(), false);
      assert.equal(await page.locator("#degree").inputValue(), "Bachelor of Science");
      for (const id of ["candidate-phone", "other-email", "other-name", "other-degree", "hidden-name"]) {
        assert.equal(await page.locator("#" + id).inputValue(), "", id);
      }
    },
  },
  {
    name: "Breezy respects the visible SMS agreement label of a transparent consent checkbox",
    url: "https://fixture.breezy.hr/p/sms-notice/apply",
    html: `
      <h3>Full Name</h3><input id="candidate-name" name="cName" ng-model="candidate.name">
      <h3>Phone Number</h3><input id="candidate-phone" name="cPhoneNumber" ng-model="candidate.phone_number">
      <input id="sms" name="smsConsent" type="checkbox" style="opacity:0">
      <label for="sms">By providing a phone number you agree to receive SMS updates.</label>`,
    async verify(page) {
      assert.equal(await page.locator("#candidate-name").inputValue(), "Alex Kim Tran");
      assert.equal(await page.locator("#candidate-phone").inputValue(), "");
      assert.equal(await page.locator("#sms").isChecked(), false);
    },
  },
  {
    name: "Scout fills candidate address components after the country reveals its state options",
    url: "https://fictional.applynow.net.au/jobs/graduate-intake",
    html: `
      <label>Street <input id="street" name="application[candidate_attributes][address_attributes][street1]"></label>
      <label>Street <input id="unrelated" name="application[previous_employer][street1]"></label>
      <label>City, Town or Suburb <input id="suburb" name="application[candidate_attributes][address_attributes][suburb]"></label>
      <label>Postcode or Zipcode <input id="postcode" name="application[candidate_attributes][address_attributes][postcode]"></label>
      <label>State, Region or Province <select disabled id="state" name="application[candidate_attributes][address_attributes][state_id]">
        <option value="">Please choose...</option></select></label>
      <label>Country <select id="country" name="application[candidate_attributes][address_attributes][country_id]">
        <option value="">Please choose...</option><option value="1">AUSTRALIA</option></select></label>
      <script>
        document.querySelector('#country').addEventListener('change', () => setTimeout(() => {
          const old = document.querySelector('#state');
          const replacement = old.cloneNode(true);
          replacement.disabled = false;
          replacement.add(new Option('Northern Territory', '6'));
          old.replaceWith(replacement);
        }, 60));
      </script>`,
    async verify(page) {
      assert.equal(await page.locator("#street").inputValue(), "18 Example Street");
      assert.equal(await page.locator("#unrelated").inputValue(), "");
      assert.equal(await page.locator("#suburb").inputValue(), "Darwin");
      assert.equal(await page.locator("#postcode").inputValue(), "0800");
      assert.equal(await page.locator("#country").inputValue(), "1");
      assert.equal(await page.locator("#state").inputValue(), "6");
    },
  },
  {
    name: "Scout preserves a candidate-selected country and its dependent state",
    url: "https://fictional.applynow.net.au/jobs/other-intake",
    html: `
      <label>Country <select id="country" name="application[candidate_attributes][address_attributes][country_id]">
        <option value="nz" selected>New Zealand</option><option value="au">Australia</option></select></label>
      <label>State, Region or Province <select id="state" name="application[candidate_attributes][address_attributes][state_id]">
        <option value="">Please choose...</option><option value="6">Northern Territory</option></select></label>`,
    async verify(page) {
      assert.equal(await page.locator("#country").inputValue(), "nz");
      assert.equal(await page.locator("#state").inputValue(), "");
    },
  },
];
