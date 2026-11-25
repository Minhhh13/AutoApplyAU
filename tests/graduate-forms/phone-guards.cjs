const assert = require("node:assert/strict");

module.exports = [
  {
    name: "whole phone fields retain the confirmed number in the requested format, while split fields remain blank",
    html: `
      <label>Phone <input type="tel" id="area-part" autocomplete="section-candidate tel-area-code"></label>
      <label>Phone number <input type="tel" id="local-part" autocomplete="section-candidate tel-local"></label>
      <li><label>Mobile <input type="tel" id="compact-mobile"></label>
        <p class="inline-hints">Digits only or add + for international numbers</p></li>
      <label>Phone number with country code <input type="tel" id="international-phone"></label>
      <label>Phone <input type="tel" id="formatting-phone" oninput="this.value=this.value.replaceAll(' ', '')"></label>
      <label>Mobile <input type="tel" id="truncating-mask" oninput="this.value=this.value.slice(0, 4)"></label>
      <label>Mobile <input type="tel" id="rejecting-field" pattern="[1-9]{6}"></label>
      <label>Phone <input type="tel" id="short-phone" maxlength="6"></label>`,
    async verify(page) {
      for (const id of ["area-part", "local-part", "short-phone", "truncating-mask", "rejecting-field"]) {
        assert.equal(await page.locator("#" + id).inputValue(), "");
      }
      assert.equal(await page.locator("#compact-mobile").inputValue(), "0400000019");
      assert.equal(await page.locator("#international-phone").inputValue(), "+61400000019");
      assert.equal(await page.locator("#formatting-phone").inputValue(), "0400000019");
      assert.match(await page.locator("#autoapply-au-toolbar [role=status]").innerText(), /Filled 3 fields/);
    },
  },
  {
    name: "phone widgets keep an existing overseas dial selection and recognise an Australian national display",
    html: `
      <div class="iti"><button type="button" class="iti__selected-country" aria-label="United States (+1)">
        <span class="iti__flag iti__us">+1</span></button>
        <label>Phone <input type="tel" id="overseas-phone"
          oninput="this.dataset.touched='true'"></label></div>
      <div class="iti"><button type="button" class="iti__selected-country" aria-label="Australia (+61)">
        <span class="iti__flag iti__au">+61</span></button>
        <label>Phone <input type="tel" id="national-phone"
          oninput="if(this.value.startsWith('+61')) this.value=this.value.slice(3)"></label></div>`,
    async verify(page) {
      assert.equal(await page.locator("#overseas-phone").inputValue(), "");
      assert.equal(await page.locator("#overseas-phone").getAttribute("data-touched"), null);
      assert.equal(await page.locator("#national-phone").inputValue(), "400000019");
      assert.match(await page.locator("#autoapply-au-toolbar [role=status]").innerText(), /Filled 1 field\b/);
    },
  },
];
