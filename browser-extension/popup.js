(() => {
  const el = (id) => document.getElementById(id);
  const status = el("status"),
    fill = el("fill"),
    remove = el("forget"),
    file = el("profile-file");
  let tab;
  async function refresh() {
    const { confirmedFields = {} } = await chrome.storage.local.get("confirmedFields");
    const count = Object.keys(confirmedFields).length;
    el("profile-summary").textContent = count
      ? count + " saved fields in this browser."
      : "No saved profile yet.";
    remove.disabled = !count;
    fill.disabled = !(count && tab?.id && /^https?:\/\//i.test(tab.url || ""));
  }
  async function start() {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    el("site").textContent = /^https?:\/\//i.test(tab?.url || "")
      ? new URL(tab.url).hostname
      : "Open the application in a browser tab.";
    await refresh();
  }
  start().catch(() => {
    status.textContent = "Could not open the browser profile or tab.";
  });
  file.addEventListener("change", async () => {
    try {
      const selected = file.files[0];
      if (!selected) return;
      const fields = globalThis.AutoApplyProfile.fromProfile(JSON.parse(await selected.text()));
      if (!Object.keys(fields).length)
        throw new Error("This profile contains no supported contact or education fields.");
      await chrome.storage.local.set({ confirmedFields: fields });
      status.textContent = "Your confirmed fields are ready.";
      await refresh();
    } catch (error) {
      status.textContent =
        error instanceof SyntaxError ? "This file could not be read as JSON." : error.message;
    } finally {
      file.value = "";
    }
  });
  remove.addEventListener("click", async () => {
    await chrome.storage.local.remove("confirmedFields");
    await refresh();
    status.textContent = "Saved fields removed from this browser.";
  });
  fill.addEventListener("click", async () => {
    fill.disabled = true;
    try {
      const { confirmedFields } = await chrome.storage.local.get("confirmedFields");
      if (!confirmedFields || !tab) throw new Error("Choose a profile and an application tab first.");
      const target = { tabId: tab.id };
      await chrome.scripting.executeScript({ target, files: ["platforms.js", "fill.js"] });
      const results = await chrome.scripting.executeScript({
        target,
        args: [tab.url, confirmedFields],
        func: async (url, fields) => {
          if (location.href !== url) return "The page changed. Reopen the extension on the application.";
          const result = await globalThis.AutoApplyFill.run(fields);
          return globalThis.AutoApplyFill.describe(result);
        },
      });
      status.textContent = results[0]?.result || "The page changed. Check the application and try again.";
    } catch {
      status.textContent =
        "Could not access this form. Open the employer’s application directly and try again.";
    } finally {
      await refresh();
    }
  });
})();
