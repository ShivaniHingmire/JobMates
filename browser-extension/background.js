const DIRECT_APPLY_KEY = "jobmatesDirectApply";
const RESULT_KEY = "jobmatesApplicationResult";
const SESSION_INDEX_KEY = "jobmatesApplicationSessionIndex";
const packageKey = (tabId) => `jobmatesApplicationPackage:${tabId}`;
const expirationAlarm = (tabId) => `jobmatesApplicationExpires:${tabId}`;

const exposeSessionStorage = () =>
  chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
  });

async function readSessionIndex() {
  const stored = await chrome.storage.session.get(SESSION_INDEX_KEY);
  return stored[SESSION_INDEX_KEY] ?? {};
}

async function writeSessionIndex(index) {
  await chrome.storage.session.set({ [SESSION_INDEX_KEY]: index });
}

async function packageForTab(tabId) {
  const stored = await chrome.storage.session.get(packageKey(tabId));
  return stored[packageKey(tabId)] ?? null;
}

async function tabForPackage(packageId) {
  const index = await readSessionIndex();
  const tabId = index[packageId];
  return Number.isInteger(tabId) ? tabId : null;
}

async function removeSession(tabId, packageId) {
  await chrome.alarms.clear(expirationAlarm(tabId));
  await chrome.storage.session.remove(packageKey(tabId));
  const index = await readSessionIndex();
  if (packageId) delete index[packageId];
  else {
    for (const [id, indexedTabId] of Object.entries(index))
      if (indexedTabId === tabId) delete index[id];
  }
  await writeSessionIndex(index);
}

async function injectApplicationAssistant(tabId) {
  const applicationPackage = await packageForTab(tabId);
  if (!applicationPackage) return;
  try {
    await chrome.scripting.insertCSS({
      target: { tabId, allFrames: true },
      files: ["autofill.css"],
    });
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["autofill-core.js"],
    });
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["autofill.js"],
    });
  } catch {
    await removeSession(tabId, applicationPackage.packageId);
    await chrome.tabs.update(tabId, { active: true }).catch(() => {});
    await chrome.storage.session.set({
      [RESULT_KEY]: {
        packageId: applicationPackage.packageId,
        jobId: applicationPackage.job.id,
        applyUrl: applicationPackage.job.applyUrl,
        status: "review_required",
        reason: "extension_injection_failed",
        occurredAt: new Date().toISOString(),
      },
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void exposeSessionStorage();
  void chrome.storage.local.get(DIRECT_APPLY_KEY).then((settings) => {
    if (settings[DIRECT_APPLY_KEY] === undefined)
      return chrome.storage.local.set({ [DIRECT_APPLY_KEY]: true });
  });
});
chrome.runtime.onStartup.addListener(() => void exposeSessionStorage());
void exposeSessionStorage().catch(() => {});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;
  void packageForTab(tabId).then((applicationPackage) => {
    if (applicationPackage) return injectApplicationAssistant(tabId);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void removeSession(tabId);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith("jobmatesApplicationExpires:")) return;
  const tabId = Number(alarm.name.split(":").at(-1));
  if (!Number.isInteger(tabId)) return;
  void packageForTab(tabId).then(async (applicationPackage) => {
    if (!applicationPackage) return;
    await removeSession(tabId, applicationPackage.packageId);
    await chrome.tabs.remove(tabId).catch(() => {});
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "JOBMATES_START_APPLICATION") {
    void (async () => {
      const applicationPackage = message.package;
      if (!applicationPackage?.job?.applyUrl) {
        sendResponse({ ok: false });
        return;
      }
      const url = new URL(applicationPackage.job.applyUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        sendResponse({ ok: false });
        return;
      }
      const settings = await chrome.storage.local.get(DIRECT_APPLY_KEY);
      const directApplyEnabled = settings[DIRECT_APPLY_KEY] !== false;
      const tab = await chrome.tabs.create({
        url: url.href,
        active: !directApplyEnabled,
      });
      if (!tab.id) {
        sendResponse({ ok: false });
        return;
      }
      const index = await readSessionIndex();
      index[applicationPackage.packageId] = tab.id;
      await Promise.all([
        writeSessionIndex(index),
        chrome.storage.session.set({
          [packageKey(tab.id)]: applicationPackage,
        }),
        chrome.alarms.create(expirationAlarm(tab.id), {
          when: Date.parse(applicationPackage.expiresAt),
        }),
      ]);
      if (tab.status === "complete") void injectApplicationAssistant(tab.id);
      sendResponse({
        ok: true,
        directApplyEnabled,
        tabId: tab.id,
      });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "JOBMATES_GET_APPLICATION_PACKAGE") {
    void (async () => {
      if (!sender.tab?.id) {
        sendResponse({ ok: false });
        return;
      }
      const applicationPackage = await packageForTab(sender.tab.id);
      sendResponse({ ok: Boolean(applicationPackage), package: applicationPackage });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "JOBMATES_APPLICATION_ANSWERS") {
    void (async () => {
      const tabId = await tabForPackage(message.packageId);
      if (tabId === null) {
        sendResponse({ ok: false });
        return;
      }
      const applicationPackage = await packageForTab(tabId);
      if (!applicationPackage) {
        sendResponse({ ok: false });
        return;
      }
      const merged = new Map(
        (applicationPackage.answerBank ?? []).map((answer) => [
          answer.questionKey,
          answer,
        ]),
      );
      const sensitiveKeys = new Set(message.sensitiveQuestionKeys ?? []);
      const sessionAnswers = {
        ...(applicationPackage.sessionAnswers ?? {}),
      };
      for (const answer of message.answers ?? []) {
        if (sensitiveKeys.has(answer.questionKey))
          sessionAnswers[answer.questionKey] = answer.answer;
        else merged.set(answer.questionKey, answer);
      }
      applicationPackage.answerBank = Array.from(merged.values());
      applicationPackage.sessionAnswers = sessionAnswers;
      await chrome.storage.session.set({
        [packageKey(tabId)]: applicationPackage,
      });
      await chrome.tabs
        .sendMessage(tabId, {
          type: "JOBMATES_APPLICATION_ANSWERS",
          packageId: message.packageId,
          answers: message.answers,
          sensitiveQuestionKeys: message.sensitiveQuestionKeys ?? [],
        })
        .catch(() => injectApplicationAssistant(tabId));
      sendResponse({ ok: true });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "JOBMATES_APPLICATION_RESULT") {
    void (async () => {
      const result = {
        packageId: message.packageId,
        jobId: message.jobId,
        applyUrl: message.applyUrl,
        status: message.status,
        reason: message.reason ?? null,
        questions: Array.isArray(message.questions) ? message.questions : [],
        occurredAt: new Date().toISOString(),
      };
      await chrome.storage.session.set({ [RESULT_KEY]: result });
      if (sender.tab?.id && message.status === "applied") {
        await removeSession(sender.tab.id, message.packageId);
        await chrome.tabs.remove(sender.tab.id);
      }
      if (sender.tab?.id && message.status === "review_required")
        await Promise.all([
          removeSession(sender.tab.id, message.packageId),
          chrome.tabs.update(sender.tab.id, { active: true }),
        ]);
      sendResponse({ ok: true });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }
});
