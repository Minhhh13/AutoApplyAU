// Playwright exposes ordinary tabs as Page objects. Chromium exposes the transient
// extension action popup as a separate DevTools target.
const assert = require("node:assert/strict");
const { setTimeout: delay } = require("node:timers/promises");

async function clickPopupFill(page, popupUrl) {
  const browserSession = await page.context().browser().newBrowserCDPSession();
  try {
    await page.bringToFront();
    const extensionId = new URL(popupUrl).hostname;
    const tabs = await browserSession.send("Target.getTargets", { filter: [{ type: "tab" }] });
    const tab = tabs.targetInfos.find(target => target.url === page.url());
    assert(tab, "Fictional employer tab is open");
    // Chrome can retain a previous action popup briefly after its application tab closes.
    // A normal extension settings tab can also have this URL. Only attach to the new target.
    const existing = await browserSession.send("Target.getTargets");
    const existingIds = new Set(existing.targetInfos.map(target => target.targetId));
    await browserSession.send("Extensions.triggerAction", { id: extensionId, targetId: tab.targetId });
    let popup;
    for (let i = 0; i < 50 && !popup; i++) {
      const targets = await browserSession.send("Target.getTargets");
      popup = targets.targetInfos.find(target =>
        target.type === "page" && target.url === popupUrl && !existingIds.has(target.targetId));
      if (!popup) await delay(30);
    }
    assert(popup, "The real browser action opened its popup");
    const { sessionId } = await browserSession.send("Target.attachToTarget", { targetId: popup.targetId });
    let sequence = 0;
    async function send(method, params) {
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => fail(new Error("Browser popup command timed out: " + method)), 5000);
        function finish() {
          clearTimeout(timeout);
          browserSession.off("Target.receivedMessageFromTarget", receive);
        }
        function fail(error) {
          finish();
          reject(error);
        }
        const receive = event => {
          if (event.sessionId !== sessionId) return;
          const message = JSON.parse(event.message);
          if (message.id !== id) return;
          finish();
          if (message.error) reject(new Error(message.error.message));
          else resolve(message.result);
        };
        browserSession.on("Target.receivedMessageFromTarget", receive);
        browserSession.send("Target.sendMessageToTarget", {
          sessionId, message: JSON.stringify({ id, method, params }),
        }).catch(fail);
      });
    }
    let button;
    for (let i = 0; i < 50 && !button; i++) {
      const { result } = await send("Runtime.evaluate", {
        expression: "document.querySelector('#fill:not(:disabled)')?.getBoundingClientRect().toJSON()",
        returnByValue: true,
      });
      button = result.value;
      if (!button) await delay(30);
    }
    assert(button, "The popup enabled Fill for the active application tab");
    for (const type of ["mousePressed", "mouseReleased"]) {
      await send("Input.dispatchMouseEvent", {
        type, x: button.x + button.width / 2, y: button.y + button.height / 2,
        button: "left", clickCount: 1,
      });
    }
    for (let i = 0; i < 160; i++) {
      const { result } = await send("Runtime.evaluate", {
        expression: "document.querySelector('#fill:enabled') && document.querySelector('#status')?.textContent.trim()",
        returnByValue: true,
      });
      if (result.value) return result.value;
      await delay(30);
    }
    assert.fail("The popup did not report a completed fill");
  } finally {
    await browserSession.detach();
  }
}

module.exports = clickPopupFill;
