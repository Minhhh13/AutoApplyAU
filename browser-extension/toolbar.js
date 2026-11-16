(() => {
  const id = "autoapply-au-toolbar";
  const platform = globalThis.AutoApplyPlatforms.detect(location, document);
  if (platform.id === "generic") return;
  let dismissed = false;
  function mount() {
    if (dismissed || document.getElementById(id) || !document.body) return;
    if (!globalThis.AutoApplyFill.hasApplicantField(platform.id)) return;
    const host = document.createElement("div");
    host.id = id;
    host.style.cssText =
      "all:initial!important;position:fixed!important;bottom:14px!important;right:14px!important;z-index:2147483646!important";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent =
      ":host{color-scheme:light} section{box-sizing:border-box;max-width:min(330px,90vw);font:13px/1.45 Arial,sans-serif;color:#16392f} button{border:1px solid #215b47;border-radius:6px;background:#205e49;color:white;padding:8px 12px;font:600 13px Arial,sans-serif;cursor:pointer} button:focus-visible{outline:3px solid #f5bd59;outline-offset:2px} button:disabled{opacity:.7} output:not(:empty){display:block;background:white;border:1px solid #a4bdb1;padding:9px;margin-top:4px;border-radius:5px}";
    const panel = document.createElement("section");
    const button = document.createElement("button");
    button.id = "autoapply-fill";
    button.type = "button";
    button.textContent = "Fill with AutoApply AU";
    const report = document.createElement("output");
    report.setAttribute("role", "status");
    const hide = document.createElement("button");
    hide.type = "button";
    hide.textContent = "×";
    hide.title = "Hide the autofill toolbar on this page";
    hide.setAttribute("aria-label", hide.title);
    hide.style.marginLeft = "3px";
    hide.addEventListener("click", (event) => {
      if (!event.isTrusted) return;
      dismissed = true;
      observer.disconnect();
      host.remove();
    });
    button.addEventListener("click", async (event) => {
      if (!event.isTrusted || button.disabled) return;
      event.stopPropagation();
      button.disabled = true;
      try {
        const startUrl = location.href;
        const current = globalThis.AutoApplyPlatforms.detect(location, document);
        if (current.id !== platform.id || !globalThis.AutoApplyFill.hasApplicantField(current.id)) {
          report.textContent = "Open an application step with applicant fields.";
          return;
        }
        const { confirmedFields } = await chrome.storage.local.get("confirmedFields");
        if (location.href !== startUrl) {
          report.textContent = "The page changed. Check the application step before filling.";
          return;
        }
        if (!confirmedFields || !Object.keys(confirmedFields).length) {
          report.textContent = "Open the AutoApply AU extension and import your confirmed profile.json.";
          return;
        }
        const result = await globalThis.AutoApplyFill.run(confirmedFields);
        report.textContent = globalThis.AutoApplyFill.describe(result);
      } catch {
        report.textContent = "Could not finish this fill. Inspect the fields before trying again.";
      } finally {
        button.disabled = false;
      }
    });
    panel.append(button, hide, report);
    shadow.append(style, panel);
    document.body.append(host);
  }
  mount();
  // A portal can replace its entire form while switching steps. Only rescan when a host is missing.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (document.getElementById(id) || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      mount();
    });
  });
  observer.observe(document.documentElement, { subtree: true, childList: true });
})();
