const assert = require("node:assert/strict");
const { writeFile } = require("node:fs/promises");
const { after, test } = require("node:test");
const forms = [
  ...require("./steps.cjs"),
  ...require("./pickers.cjs"),
  ...require("./documents.cjs"),
];

function fieldValue(locator) {
  return locator.evaluate(el => {
    if (el.type === "checkbox" || el.type === "radio") return el.checked;
    if (el.type === "file") return String(el.files.length);
    if (el.tagName === "BUTTON" || !("value" in el)) return el.textContent.trim();
    return el.value;
  });
}

async function clickAndWait(page, fillButton) {
  await fillButton(page).click();
  // The trusted click disables the toolbar synchronously, including on later wizard steps.
  await page.locator("#autoapply-fill:enabled").waitFor();
  const status = page.locator("#autoapply-au-toolbar [role=status]:not(:empty)");
  await status.waitFor();
  assert.match(await status.innerText(), /Filled \d+ field|Open an application step/);
}

module.exports = function registerGraduateForms(loadFixture, fillButton) {
  const observations = [];
  assert.deepEqual(forms.map(form => form.id),
    Array.from({ length: 25 }, (_, i) => String(i + 1).padStart(2, "0")));
  assert.equal(new Set(forms.map(form => form.url)).size, forms.length);

  for (const form of forms) {
    test(`Graduate form ${form.id} — ${form.name}`, async t => {
      const page = await loadFixture(t, form.url, form.html);
      const failures = [];
      for (const [index, stage] of form.stages.entries()) {
        if (stage.before) await stage.before(page);
        const startUrl = page.url();
        const checks = [];
        for (const check of stage.checks) {
          const locator = page.locator(`[id="${check.id}"]`);
          assert.equal(await locator.count(), 1, `Expected one control with id ${check.id}`);
          const read = () => (check.read || fieldValue)(locator);
          const initial = await read();
          if (check.mode === "review") assert.equal(initial, check.expected, check.id);
          else {
            assert.equal(check.mode, "fill");
            assert.notEqual(initial, check.expected, check.id);
          }
          checks.push({ check, read, initial });
        }
        await clickAndWait(page, fillButton);
        assert.equal(page.url(), startUrl, "Fill navigated the application");
        assert.equal(await page.evaluate(() => window.submits), 0, "Fill submitted the application");
        for (const { check, read, initial } of checks) {
          const actual = await read();
          const row = { form: form.id, name: form.name, stage: index + 1, field: check.id,
            mode: check.mode, issue: check.issue, initial, expected: check.expected, actual };
          observations.push(row);
          if (actual !== check.expected) failures.push(row);
        }
      }
      assert.deepEqual(failures, [], "Field outcomes differed from the fixture expectations");
    });
  }
  const guards = require("./guards.cjs");
  for (const guard of guards) {
    test(guard.name, async t => {
      const page = await loadFixture(t, "https://fixture.wd3.myworkdayjobs.com/en-AU/External/job/Guard/apply", guard.html);
      await clickAndWait(page, fillButton);
      await guard.verify(page);
      assert.equal(await page.evaluate(() => window.submits), 0);
    });
  }
  after(async () => {
    if (process.env.AUTOAPPLY_SCORECARD) {
      await writeFile(process.env.AUTOAPPLY_SCORECARD, JSON.stringify(observations, null, 2) + "\n");
    }
  });
};
