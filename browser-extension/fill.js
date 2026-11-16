(() => {
  if (globalThis.AutoApplyFill) return;
  const names = {
    fullName: ["full name", "legal name", "full legal name", "name as shown on identification"],
    givenName: ["first name", "given name", "legal first name", "first name legal", "given names"],
    familyName: ["last name", "surname", "family name", "legal last name"],
    preferredName: ["preferred name", "preferred first name"],
    email: ["email", "email address", "personal email", "personal email address", "contact email"],
    phone: [
      "phone",
      "phone number",
      "mobile",
      "mobile number",
      "mobile phone",
      "mobile phone number",
      "telephone number",
    ],
    addressLine1: ["address line 1", "street address", "address 1"],
    addressLine2: ["address line 2", "address 2"],
    city: ["city", "town", "suburb", "city or suburb", "city suburb", "city town", "location city"],
    state: [
      "state",
      "state or territory",
      "state territory",
      "state province",
      "province state",
      "state province region",
    ],
    postcode: ["postcode", "post code", "postal code", "zip code", "zip postal code", "postal zip code"],
    country: ["country", "country of residence", "country region of residence"],
    linkedin: ["linkedin", "linkedin url", "linkedin profile", "linkedin profile url"],
    website: ["website", "personal website", "portfolio", "portfolio url", "portfolio website"],
    github: ["github", "github url", "github profile", "github profile url"],
    institution: [
      "school",
      "university",
      "school or university",
      "university name",
      "institution",
      "institution name",
    ],
    degree: ["degree", "degree name", "qualification name"],
    major: ["major", "field of study", "discipline", "major field of study"],
  };
  const autocompleteKeys = {
    name: "fullName",
    "given-name": "givenName",
    "family-name": "familyName",
    nickname: "preferredName",
    email: "email",
    tel: "phone",
    "address-line1": "addressLine1",
    "address-line2": "addressLine2",
    "address-level2": "city",
    "address-level1": "state",
    "postal-code": "postcode",
    "country-name": "country",
  };
  const educationKeys = new Set(["institution", "degree", "major"]);
  const states = {
    nsw: "new south wales",
    vic: "victoria",
    qld: "queensland",
    wa: "western australia",
    sa: "south australia",
    tas: "tasmania",
    act: "australian capital territory",
    nt: "northern territory",
  };
  const sensitive =
    /\b(password|passcode|verify|verification|otp|one time|sign in|log in|authenticat\w*|consent|certif\w*|signature|declare|declaration|attest\w*|disclos\w*|sponsor\w*|work rights|right to work|visa|citizenship|nationality|birth|gender|pronouns?|veteran|disabilit\w*|diversity|ethnic\w*|race|marital|religion|tax|bank|passport|marketing|subscribe|emergency|referee|reference|recommender|supervisor|manager|previous employer|assessment)\b/;
  const otherParty =
    /\b(reference[s]?|referee[s]?|recommender|recruiter|emergency contact|supervisor|work experience|work history|employment history|previous employer|former employer|employment record|job history)\b/;
  const sector = /\b(education|institution|university|school|qualification|academic history)\b/;
  const ancillary =
    /\b(newsletter|talent (?:community|pool|network)|job alerts?|job search|search jobs|live chat|chatbot|contact us|mailing list|subscribe)\b/;
  const fieldSelector =
    "input, textarea, select, [role=combobox], [aria-haspopup=listbox], [aria-haspopup=grid]";
  const normal = (value) =>
    String(value ?? "")
      .normalize("NFKC")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\blinked in\b/g, "linkedin")
      .replace(/\bgit hub\b/g, "github")
      .trim();
  const labelKey = new Map(
    Object.entries(names).flatMap(([key, labels]) => labels.map((label) => [label, key])),
  );
  const placeholder = (value) =>
    /^(?:|none selected|select|choose|please (?:select|choose)|(?:please )?(?:select|choose) (?:one|an option|a value|an item|from (?:the )?list)|(?:please )?(?:select|choose)(?: a| an| your)? (?:country|state|degree|university|institution|major))$/.test(
      normal(value),
    );
  const textOf = (el) => el?.innerText?.trim() || el?.textContent?.trim() || "";

  function fieldLabels(el) {
    const ids = (el.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean);
    const labels = [...(el.labels || [])].map((label) => {
      const clone = label.cloneNode(true);
      clone
        .querySelectorAll("input,textarea,select,button,[role=combobox],[role=listbox],script,style")
        .forEach((c) => c.remove());
      return clone.textContent;
    });
    const raw = [
      ids.map((id) => textOf(document.getElementById(id))).join(" "),
      el.getAttribute("aria-label"),
      ...labels,
    ];
    return raw
      .filter(Boolean)
      .map((value) =>
        normal(value)
          .replace(/\b(?:optional|required)\b/g, "")
          .trim(),
      )
      .filter(Boolean);
  }

  function contextOf(el) {
    const parts = [];
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      parts.push(
        node.id || "",
        node.getAttribute("data-automation-id") || "",
        node.getAttribute("name") || "",
      );
      if (node.tagName === "FORM") {
        const purpose = [
          node.getAttribute("action"),
          node.getAttribute("aria-label"),
          textOf(node.querySelector("h1,h2,h3,h4")),
          ...[...node.querySelectorAll("button[type=submit],input[type=submit]")].map(
            (b) => textOf(b) || b.value,
          ),
        ];
        if (purpose.some((label) => ancillary.test(normal(label)))) parts.push("ancillary form");
      }
      if (node.tagName === "DIV") {
        const title = normal(
          textOf(node.querySelector(":scope > h2,:scope > h3,:scope > h4,:scope > [role=heading]")),
        );
        if (
          /^(?:(?:professional|personal) )?(?:references?|referees?|recommender|emergency contact|work experience|employment history|education)(?: details| information| history)?$/.test(
            title,
          )
        )
          parts.push(title);
        if (ancillary.test(title)) parts.push("ancillary form");
      }
      if (
        node !== el &&
        (node.tagName === "FIELDSET" || node.tagName === "SECTION" || node.getAttribute("role") === "group")
      ) {
        parts.push(
          node.getAttribute("aria-label") || "",
          textOf(node.querySelector(":scope > legend, :scope > h2, :scope > h3, :scope > h4")),
        );
        for (const id of (node.getAttribute("aria-labelledby") || "").split(/\s+/)) {
          if (id) parts.push(textOf(document.getElementById(id)));
        }
      }
    }
    return normal(parts.join(" "));
  }

  function visible(el) {
    if (!el.isConnected || el.closest("[hidden], [inert], [aria-hidden=true]")) return false;
    const rect = el.getBoundingClientRect();
    if (
      rect.width < 2 ||
      rect.height < 2 ||
      rect.right + window.scrollX <= 0 ||
      rect.bottom + window.scrollY <= 0
    )
      return false;
    if (typeof el.checkVisibility === "function")
      return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    return getComputedStyle(el).visibility !== "hidden";
  }
  function editable(el) {
    if (!visible(el) || el.matches(":disabled, [aria-disabled=true], [aria-readonly=true]") || el.readOnly)
      return false;
    if (el.tagName === "INPUT" && !["text", "email", "tel", "url", "radio"].includes(el.type)) return false;
    if (el.matches("select[multiple]") || el.closest("a[href]")) return false;
    if (el.tagName === "BUTTON" && el.form && el.type === "submit") return false;
    return true;
  }

  const authText =
    /\b(sign in|log in|login|sign up|register an account|create (?:an? |your )?(?:candidate )?account|reset (?:your )?password|verify (?:your )?(?:account|identity|email|phone)|verification code|one time (?:code|passcode)|authentication code)\b/;
  function authFlow(el) {
    const path = normal(location.pathname);
    if (
      /\b(login|signin|sign in|log in|signup|sign up|register|registration|authenticate|password|verification)\b/.test(
        path,
      )
    )
      return true;
    if (
      [...document.querySelectorAll("h1, [role=dialog] h2")].some(
        (h) => visible(h) && authText.test(normal(textOf(h))),
      )
    )
      return true;
    const scope = el.closest("form, [role=dialog]") || document;
    if ([...scope.querySelectorAll('input[type=password],input[autocomplete="one-time-code"]')].some(visible))
      return true;
    return [...scope.querySelectorAll("button[type=submit],input[type=submit]")].some(
      (b) => visible(b) && authText.test(normal(textOf(b) || b.value)),
    );
  }

  function resolveKey(el, platformId, labels, context) {
    const descriptive = [context, ...labels, normal(el.getAttribute("placeholder")), normal(el.autocomplete)];
    if (descriptive.some((text) => sensitive.test(text) || otherParty.test(text))) return null;
    if (ancillary.test(context) || context.includes("ancillary form")) return null;
    if (globalThis.AutoApplyPlatforms.isHistoryContact?.(el, platformId)) return null;
    const mapped = globalThis.AutoApplyPlatforms.fieldKey(el, platformId);
    const recognised = labels.map((label) => labelKey.get(label)).filter(Boolean);
    // Unknown wording can materially change an otherwise familiar vendor identifier.
    if (
      labels.length &&
      !recognised.length &&
      !labels.every((label) => label === "name" && mapped === "fullName")
    )
      return null;
    if (mapped) recognised.push(mapped);
    // A named field whose label we do not understand may describe a different person's details.
    if (!labels.length && !mapped) {
      const hint = (el.getAttribute("autocomplete") || "").split(/\s+/).pop();
      if (Object.hasOwn(autocompleteKeys, hint)) recognised.push(autocompleteKeys[hint]);
      const idKey = labelKey.get(normal(el.name)) || labelKey.get(normal(el.id));
      if (idKey) recognised.push(idKey);
    }
    if (new Set(recognised).size !== 1) return null;
    const key = recognised[0];
    if (sector.test(context) && !educationKeys.has(key)) return null;
    // Greenhouse's phone-country picker is labelled simply "Country". Its value depends on the phone number.
    if (
      platformId === "greenhouse" &&
      key === "country" &&
      !labels.some((label) => label.includes("residence"))
    )
      return null;
    return key;
  }

  function exactChoice(key, label, value) {
    const actual = normal(label),
      expected = normal(value);
    if (actual === expected) return true;
    if (key === "state") return (states[actual] || actual) === (states[expected] || expected);
    if (key === "country") return [actual, expected].every((v) => ["au", "australia", "aus"].includes(v));
    return false;
  }

  function writeNative(el, value) {
    // Use the native setter so reactive form libraries observe the input event.
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
    if (!setter) return false;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return el.isConnected && el.value === value;
  }

  function custom(el) {
    return (
      el.tagName !== "SELECT" && el.matches("[role=combobox],[aria-haspopup=listbox],[aria-haspopup=grid]")
    );
  }
  function ownerIds(el) {
    return [el.getAttribute("aria-controls"), el.getAttribute("aria-owns")]
      .filter(Boolean)
      .join(" ")
      .split(/\s+/)
      .filter(Boolean);
  }
  function ownedPopups(el) {
    return ownerIds(el)
      .map((id) => document.getElementById(id))
      .filter((box) => box?.matches("[role=listbox],[role=grid]") && visible(box));
  }
  function popupOptions(box, allowGrid) {
    if (box.matches("[role=listbox]"))
      return [...box.querySelectorAll("[role=option]")].filter((o) => o.closest("[role=listbox]") === box);
    if (
      !allowGrid ||
      box.matches("[aria-multiselectable=true]") ||
      box.querySelector("[role=columnheader], time, [aria-current=date]") ||
      /\b(?:calendar|datepicker|date picker)\b/.test(normal(box.getAttribute("aria-label")))
    )
      return [];
    // Oracle can expose a single-choice dropdown as rows with one cell each.
    // A calendar or a table with several columns has a different interaction.
    const cells = [...box.querySelectorAll("[role=gridcell]")].filter(visible);
    const rows = cells.map((cell) => cell.closest("[role=row]"));
    if (rows.some((row) => !row || row.closest("[role=grid]") !== box) || new Set(rows).size !== cells.length)
      return [];
    return cells;
  }
  const renderedSelection =
    '[class*="singleValue" i],[class*="single-value" i],[class*="multiValue" i],[class*="multi-value" i]';
  function renderedValues(el) {
    const container =
      el.closest('[class*="value-container" i], [class*="valueContainer" i], [class*="control" i]') ||
      el.parentElement;
    return container
      ? [...container.querySelectorAll(renderedSelection)].filter(visible).map(textOf).filter(Boolean)
      : [];
  }
  function hasCustomValue(el) {
    if (el.getAttribute("aria-valuetext") && !placeholder(el.getAttribute("aria-valuetext"))) return true;
    if (el.tagName === "INPUT") {
      if (el.value.trim()) return true;
      // React Select stores the current selection in a sibling even when its search input is empty.
      if (renderedValues(el).length) return true;
    } else if (!placeholder(textOf(el))) return true;
    return ownedPopups(el).some((box) => box.querySelector("[aria-selected=true]"));
  }

  async function pickCustom(el, key, value, platformId, startUrl) {
    if (hasCustomValue(el) || el.getAttribute("aria-multiselectable") === "true") return false;
    const allowGrid =
      platformId === "oracle" &&
      ["state", "country", "city", "postcode", "institution", "degree", "major"].includes(key) &&
      el.getAttribute("aria-haspopup") === "grid";
    if (el.getAttribute("aria-haspopup") === "grid" && !allowGrid) return false;
    // Only activate explicit listbox controls; never guess which nearby popup belongs to a field.
    if (
      !el.matches("input,button,[role=combobox]") ||
      (!ownerIds(el).length && !el.matches("[role=combobox],[aria-haspopup=listbox],[aria-haspopup=grid]"))
    )
      return false;
    const opened = el.getAttribute("aria-expanded") !== "true";
    if (opened) {
      // React Select opens on mouse down. A synthetic click alone skips its control handler.
      if (el.tagName === "INPUT") {
        el.dispatchEvent(
          new MouseEvent("mousedown", { button: 0, buttons: 1, bubbles: true, cancelable: true }),
        );
        if (location.href !== startUrl || !el.isConnected) return false;
      }
      if (el.getAttribute("aria-expanded") !== "true" && !ownedPopups(el).length) el.click();
    }
    let box;
    for (let tick = 0; tick < 8; tick++) {
      const boxes = ownedPopups(el);
      if (boxes.length === 1 && popupOptions(boxes[0], allowGrid).length) {
        box = boxes[0];
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (
      box &&
      location.href === startUrl &&
      editable(el) &&
      !authFlow(el) &&
      resolveKey(el, platformId, fieldLabels(el), contextOf(el)) === key &&
      ownedPopups(el).includes(box) &&
      !box.matches("[aria-multiselectable=true]") &&
      !box.querySelector("[aria-selected=true]")
    ) {
      const choices = popupOptions(box, allowGrid).filter(
        (item) =>
          visible(item) &&
          !item.closest("[aria-disabled=true],:disabled") &&
          !item.closest("a[href]") &&
          !(item.tagName === "BUTTON" && item.form && item.type === "submit") &&
          exactChoice(key, textOf(item), value),
      );
      if (choices.length === 1) {
        const choice = choices[0];
        choice.click();
        await new Promise((resolve) => setTimeout(resolve, 35));
        const echoed = [el.value, el.getAttribute("aria-valuetext"), textOf(el)].filter(Boolean);
        echoed.push(...renderedValues(el));
        if (
          echoed.some((e) => exactChoice(key, e, value)) ||
          (choice.isConnected &&
            (choice.getAttribute("aria-selected") === "true" ||
              choice.closest("[role=row]")?.getAttribute("aria-selected") === "true"))
        )
          return true;
      }
    }
    if (opened && el.isConnected && el.getAttribute("aria-expanded") === "true")
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
    return false;
  }

  function hasValue(el) {
    if (el.tagName === "SELECT") {
      const selected = el.options[el.selectedIndex];
      return !!selected && !placeholder(selected.label);
    }
    if (custom(el)) return hasCustomValue(el);
    if (el.type === "radio") return el.checked;
    return !!el.value?.trim();
  }

  let running = false;
  async function run(profile) {
    if (running) throw new Error("A fill is already running in this tab.");
    const platform = globalThis.AutoApplyPlatforms.detect(location, document);
    const startUrl = location.href;
    const filled = [];
    let review = 0;
    running = true;
    try {
      const fields = [...document.querySelectorAll(fieldSelector)].filter(editable);
      const pending = [],
        educationCounts = new Map();
      for (const el of fields) {
        if (el.type === "radio") continue;
        const labels = fieldLabels(el);
        const key = resolveKey(el, platform.id, labels, contextOf(el));
        if (educationKeys.has(key)) educationCounts.set(key, 1 + (educationCounts.get(key) || 0));
        if (hasValue(el)) continue;
        if (
          !key ||
          authFlow(el) ||
          !Object.hasOwn(profile, key) ||
          typeof profile[key] !== "string" ||
          !profile[key].trim()
        ) {
          review++;
          continue;
        }
        pending.push({ el, key });
      }
      for (const { el, key } of pending) {
        if (location.href !== startUrl) break;
        if (!editable(el) || hasValue(el) || authFlow(el)) continue;
        if (resolveKey(el, platform.id, fieldLabels(el), contextOf(el)) !== key) {
          review++;
          continue;
        }
        // A single profile qualification cannot identify multiple education entries on the same page.
        if (educationCounts.get(key) > 1) {
          review++;
          continue;
        }
        const value = profile[key];
        let ok = false;
        if (el.tagName === "SELECT") {
          const choices = [...el.options].filter(
            (o) =>
              !o.disabled &&
              !o.parentElement?.matches("optgroup:disabled") &&
              exactChoice(key, o.label, value),
          );
          if (choices.length === 1) {
            const choice = choices[0];
            if ([...el.options].filter((o) => o.value === choice.value).length === 1)
              ok = writeNative(el, choice.value);
          }
        } else if (custom(el)) {
          ok = await pickCustom(el, key, value, platform.id, startUrl);
        } else if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          if (el.maxLength < 0 || value.length <= el.maxLength) ok = writeNative(el, value);
        }
        if (ok) filled.push(key);
        else review++;
      }
      const groups = new Set(
        fields
          .filter((el) => el.type === "radio")
          .map((el) => el.closest("fieldset, [role=radiogroup]"))
          .filter(Boolean),
      );
      for (const group of groups) {
        if (location.href !== startUrl) break;
        const radios = [...group.querySelectorAll("input[type=radio]")];
        if (
          !radios.length ||
          !radios[0].name ||
          radios.some((el) => el.checked || el.name !== radios[0].name)
        )
          continue;
        const companions = [...document.querySelectorAll("input[type=radio]")].filter(
          (el) => el.form === radios[0].form && el.name === radios[0].name,
        );
        if (companions.length !== radios.length) {
          review++;
          continue;
        }
        const caption = textOf(group.querySelector(":scope > legend")) || group.getAttribute("aria-label");
        const label = normal(caption)
          .replace(/\b(required|optional)\b/g, "")
          .trim();
        const key = resolveKey(radios[0], platform.id, [label], contextOf(radios[0]));
        if (!key || !profile[key] || authFlow(radios[0])) {
          review++;
          continue;
        }
        const opts = radios.filter(
          (el) => editable(el) && fieldLabels(el).some((text) => exactChoice(key, text, profile[key])),
        );
        if (opts.length === 1) {
          opts[0].click();
          if (opts[0].checked) {
            filled.push(key);
            continue;
          }
        }
        review++;
      }
      return { platform: platform.name, platformId: platform.id, filled, review };
    } finally {
      running = false;
    }
  }
  function describe(result) {
    const labels = [...new Set(result.filled)].map((key) => names[key]?.[0] || key);
    const summary =
      result.platform +
      " · Filled " +
      result.filled.length +
      " field" +
      (result.filled.length === 1 ? "" : "s");
    return (
      summary +
      (labels.length ? " (" + labels.join(", ") + ")" : "") +
      ". " +
      result.review +
      " candidate field(s) left for review. Check the full page before continuing."
    );
  }
  function hasApplicantField(platformId) {
    return [...document.querySelectorAll(fieldSelector)].some((el) => {
      if (!editable(el) || authFlow(el)) return false;
      if (el.type === "radio") {
        const group = el.closest("fieldset, [role=radiogroup]");
        if (!group) return false;
        const caption = textOf(group.querySelector(":scope > legend")) || group.getAttribute("aria-label");
        return resolveKey(el, platformId, [normal(caption)], contextOf(el));
      }
      return resolveKey(el, platformId, fieldLabels(el), contextOf(el));
    });
  }
  globalThis.AutoApplyFill = Object.freeze({ run, describe, hasApplicantField });
})();
