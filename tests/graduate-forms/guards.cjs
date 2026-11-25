const assert = require("node:assert/strict");

// Additional regression tests sit outside the frozen 25-form scorecard.
module.exports = [
  {
    name: "Exact contact and education labels preserve ownership and ambiguity checks",
    html: `
      <label>Residential suburb <input id="current-locality"></label>
      <label>Previous residential postcode <input id="former-postal" autocomplete="postal-code"></label>
      <fieldset><legend>Emergency contact</legend>
        <label>Contact phone number <input id="other-phone" type="tel"></label>
      </fieldset>
      <label>Residential suburb <input id="conflicting-id" name="familyName"></label>
      <fieldset><legend>Primary qualification</legend>
        <label>Degree title <input id="first-award"></label>
      </fieldset>
      <fieldset><legend>Additional qualification</legend>
        <label>Degree title <input id="second-award"></label>
      </fieldset>
      <label>University / institution postal address <input id="school-address"></label>`,
    async verify(page) {
      assert.equal(await page.locator("#current-locality").inputValue(), "Darwin");
      for (const id of ["former-postal", "other-phone", "conflicting-id", "first-award", "second-award", "school-address"]) {
        assert.equal(await page.locator("#" + id).inputValue(), "", id);
      }
    },
  },
  {
    name: "Geographic choices require one consistent full name and code",
    html: `
      <label>State <select id="mismatched-label"><option value="">Choose</option>
        <option value="NT">Northern Territory (VIC)</option></select></label>
      <label>Country of residence <select id="mismatched-country"><option value="">Choose</option>
        <option value="AU">Austria (AU)</option><option value="AT">Australia (AT)</option>
      </select></label>
      <label>State <select id="duplicate-pairs"><option value="">Choose</option>
        <option value="R1">Northern Territory (NT)</option>
        <option value="R2">NT - Northern Territory</option></select></label>
      <label>State <select id="mismatched-value"><option value="">Choose</option>
        <option value="AU-VIC">NT - Northern Territory</option></select></label>
      <label>Country of residence <select id="one-country"><option value="">Choose</option>
        <option value="R8">AUS - Australia</option><option value="R9">Austria</option></select></label>`,
    async verify(page) {
      for (const id of ["mismatched-label", "mismatched-country", "duplicate-pairs", "mismatched-value"]) {
        assert.equal(await page.locator(`#${id}`).inputValue(), "", id);
      }
      assert.equal(await page.locator("#one-country").inputValue(), "R8");
    },
  },
  {
    name: "native selects distinguish disabled prompts from existing answers and skip unavailable options",
    html: `
      <label>State <select id="empty-state">
        <option selected disabled value="">Pick a jurisdiction…</option>
        <option value="nt">Northern Territory</option>
      </select></label>
      <label>Country of residence <select id="declined-country">
        <option value="au">Australia</option>
        <option selected value="">Prefer not to say</option>
      </select></label>
      <label>Country of residence <select id="withheld-country">
        <option selected disabled value="">Withheld by applicant</option>
        <option value="au">Australia</option>
      </select></label>
      <label>City <select id="unavailable-city">
        <option selected disabled value="">Pick your location…</option>
        <option disabled value="darwin-closed">Darwin</option>
      </select></label>
      <label>City <select id="closed-locations">
        <option selected disabled value="">Pick your location…</option>
        <optgroup disabled label="Closed locations"><option value="darwin-retired">Darwin</option></optgroup>
      </select></label>`,
    async verify(page) {
      assert.equal(await page.locator("#empty-state").inputValue(), "nt");
      assert.equal(await page.locator("#declined-country option:checked").innerText(), "Prefer not to say");
      assert.equal(await page.locator("#withheld-country option:checked").innerText(), "Withheld by applicant");
      assert.equal(await page.locator("#unavailable-city").inputValue(), "");
      assert.equal(await page.locator("#closed-locations").inputValue(), "");
    },
  },
];
