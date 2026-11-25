// Each employer and vacancy is fictional. The suite serves these at intercepted ATS URLs.
const fill = (id, expected, issue) => ({ id, mode: "fill", expected, issue });
const review = (id, expected, issue) => ({ id, mode: "review", expected, issue });

function input(id, label, type = "text", initial = "") {
  return `<label for="${id}">${label}</label><input id="${id}" type="${type}" value="${initial}">`;
}

// A single-choice ARIA popup with a real committed selection, distinct from its open state.
function listbox(id, label, options, { initial = "Select one", owner = "aria-controls" } = {}) {
  const rows = options.map(text => `<li role="option" aria-selected="${text === initial}">${text}</li>`).join("");
  return `<div><span id="${id}-label">${label}</span>
    <button type="button" role="combobox" aria-labelledby="${id}-label" aria-expanded="false"
      aria-haspopup="listbox" ${owner}="${id}-list" id="${id}">${initial}</button>
    <ul role="listbox" id="${id}-list" hidden>${rows}</ul></div>
    <script>(() => {
      const control = document.getElementById("${id}");
      const list = document.getElementById("${id}-list");
      function expand(open) {
        list.hidden = !open;
        control.setAttribute("aria-expanded", String(open));
      }
      control.onclick = () => expand(list.hidden);
      control.onkeydown = event => { if (event.key === "Escape") expand(false); };
      list.onclick = event => {
        const choice = event.target.closest('[role="option"]');
        if (!choice) return;
        for (const option of list.children) option.setAttribute("aria-selected", String(option === choice));
        control.textContent = choice.textContent;
        expand(false);
      };
    })();</script>`;
}

function calendar(id, label) {
  return `<button type="button" id="${id}" aria-label="${label}" aria-haspopup="grid"
      aria-controls="${id}-days" aria-expanded="false">Choose a date</button>
    <div role="grid" aria-label="February 2027 calendar" id="${id}-days" hidden>
      <div role="row"><button type="button" role="gridcell">8</button><button type="button" role="gridcell">9</button></div>
    </div>
    <script>(() => {
      const trigger = document.getElementById("${id}");
      const grid = document.getElementById("${id}-days");
      trigger.onclick = () => {
        trigger.dataset.opened = "true";
        grid.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
      };
      grid.onclick = event => {
        const day = event.target.closest('[role="gridcell"]');
        if (!day) return;
        trigger.textContent = day.textContent + " February 2027";
        trigger.setAttribute("aria-expanded", "false");
        grid.hidden = true;
      };
    })();</script>`;
}

const untouchedCalendar = id => ({
  ...review(id, "Choose a date", "Calendar requires an applicant decision"),
  read: locator => locator.evaluate(el => el.dataset.opened ? "Calendar opened" : el.textContent.trim()),
});

function form(id, name, url, body, checks) {
  return { id, name, url, html: `<h2>${name}</h2>${body}`, stages: [{ checks }] };
}

module.exports = [
  form("10", "Top End Water – civil engineering",
    "https://fixture.wd3.myworkdayjobs.com/en-AU/External/job/Water_R10/apply",
    input("candidate", "Full legal name") +
    listbox("home-region", "State or territory", ["Queensland (QLD)", "Northern Territory (NT)", "Tasmania (TAS)"]) +
    calendar("assessment-day", "Assessment centre date"), [
      fill("candidate", "Alex Kim Tran", "Applicant name label"),
      fill("home-region", "Northern Territory (NT)", "State option shows full name and abbreviation"),
      untouchedCalendar("assessment-day"),
    ]),

  form("11", "Laneway Materials – research",
    "https://job-boards.greenhouse.io/fixture/jobs/111",
    listbox("residence", "Country of residence", ["Austria", "Australia", "New Zealand"]) +
    listbox("dial-code", "Country", ["Australia", "New Zealand"]) +
    input("completion", "Expected degree completion date", "date"), [
      fill("residence", "Australia", "Exact country in an owned listbox"),
      review("dial-code", "Select one", "Telephone country must be chosen separately"),
      review("completion", "", "Graduation date requires review"),
    ]),

  form("12", "Red Gum Ecology – field science",
    "https://jobs.lever.co/fixture/ecology-12/apply",
    input("contact", "Email address", "email") +
    listbox("major-picker", "Field of study", ["Biology", "Mathematics", "Statistics"], { owner: "aria-owns" }) +
    input("available", "Available to start", "date", "2027-03-01"), [
      fill("contact", "alex@example.invalid", "Applicant email label"),
      fill("major-picker", "Mathematics", "Exact major in an owned listbox"),
      review("available", "2027-03-01", "Keep the applicant’s chosen date"),
    ]),

  form("13", "Paperbark Consulting – digital advisory",
    "https://jobs.ashbyhq.com/fixture/digital-13/application",
    listbox("residential-city", "City", ["Brisbane", "Darwin", "Perth"], { initial: "Brisbane" }) +
    input("mobile-contact", "Mobile number", "tel") +
    listbox("work-authority", "Visa subclass", ["485", "500", "Other"]) +
    calendar("expiry-date", "Visa expiry date"), [
      review("residential-city", "Brisbane", "Keep a previously selected city"),
      fill("mobile-contact", "0400 000 019", "Applicant mobile label"),
      review("work-authority", "Select one", "Visa subclass requires review"),
      untouchedCalendar("expiry-date"),
    ]),

  form("14", "Saltmarsh Transit – network planning",
    "https://fixture.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/114/apply",
    `<label for="home-nation">Country of residence</label>
      <input id="home-nation" role="combobox" aria-expanded="false" aria-haspopup="grid" aria-controls="nations"
        onclick="document.getElementById('nations').hidden=false;this.setAttribute('aria-expanded','true')">
      <div id="nations" role="grid" hidden>${["Austria (AT)", "Australia (AU)", "New Zealand (NZ)"].map(name =>
        `<div role="row"><div role="gridcell">${name}</div></div>`).join("")}</div>
      <script>(() => {
        const box = document.getElementById("nations"), input = document.getElementById("home-nation");
        box.onclick = event => {
          const cell = event.target.closest('[role="gridcell"]');
          if (!cell) return;
          input.value = cell.textContent;
          box.hidden = true;
          input.setAttribute("aria-expanded", "false");
        };
        input.onkeydown = event => {
          if (event.key === "Escape") { box.hidden = true; input.setAttribute("aria-expanded", "false"); }
        };
      })();</script>` +
    input("postal", "Post code") + calendar("commencement", "Preferred commencement date"), [
      fill("home-nation", "Australia (AU)", "Country option shows full name and abbreviation"),
      fill("postal", "0800", "Applicant postcode label"),
      untouchedCalendar("commencement"),
    ]),

  form("15", "Wattle Learning – graduate analytics",
    "https://apply.workable.com/fixture/j/ANALYTICS15/apply/",
    `<fieldset><legend>Education</legend>
      <label for="award">Degree</label><select id="award"><option value="">Select one</option>
        <optgroup label="Main campus"><option value="sci-main">Bachelor of Science</option></optgroup>
        <optgroup label="Regional campus"><option value="sci-regional">Bachelor of Science</option></optgroup>
      </select>${listbox("provider", "Institution name", ["Example University", "Example University College"])}
      ${input("completion-month", "Month of graduation", "month")}</fieldset>`, [
      review("award", "", "Duplicate degree titles across campuses"),
      fill("provider", "Example University", "Exact institution alongside a longer option"),
      review("completion-month", "", "Graduation month requires review"),
    ]),

  form("16", "Coral Inlet Ports – infrastructure",
    "https://secure.dc2.pageuppeople.com/apply/106/applicationForm/116",
    `<label for="region">State</label><select id="region">
      <option value="">Select one</option><option value="A1">NSW - New South Wales</option>
      <option value="A2">NT - Northern Territory</option><option value="A3">SA - South Australia</option>
    </select>` + input("town", "Suburb") +
    listbox("stream", "Preferred graduate stream", ["Civil", "Electrical", "Operations"]), [
      fill("region", "A2", "State option shows full name and abbreviation"),
      fill("town", "Darwin", "Applicant suburb label"),
      review("stream", "Select one", "Program preferences require review"),
    ]),

  form("17", "Ochre Ridge Health – data operations",
    "https://jobs.smartrecruiters.com/fixture/117/application/",
    input("usual-name", "Preferred first name") +
    `<label for="prior-study">Discipline</label><select id="prior-study" multiple>
      <option value="math">Mathematics</option><option value="stats">Statistics</option></select>` +
    listbox("today-city", "City", ["Darwin City", "Darwin", "Palmerston"]) +
    calendar("interview", "Choose an interview date"), [
      fill("usual-name", "Alex", "Applicant preferred name label"),
      review("prior-study", "", "Multiple-choice disciplines require review"),
      fill("today-city", "Darwin", "Exact city alongside a longer option"),
      untouchedCalendar("interview"),
    ]),
];
