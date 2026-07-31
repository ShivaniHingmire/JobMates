const DIRECT_APPLY_KEY = "jobmatesDirectApply";
const RESULT_KEY = "jobmatesApplicationResult";

function isValidPackage(value) {
  if (!value || value.version !== 1 || typeof value.packageId !== "string")
    return false;
  if (!value.job || typeof value.job.applyUrl !== "string") return false;
  if (!value.applicant || typeof value.applicant.email !== "string")
    return false;
  const expiresAt = Date.parse(value.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

window.addEventListener("message", (event) => {
  if (
    event.source === window &&
    event.origin === window.location.origin &&
    event.data?.type === "JOBMATES_EXTENSION_PING"
  ) {
    chrome.storage.local.get(DIRECT_APPLY_KEY, (settings) => {
      window.postMessage(
        {
          type: "JOBMATES_EXTENSION_PONG",
          requestId: event.data.requestId,
          directApplyEnabled: settings[DIRECT_APPLY_KEY] !== false,
        },
        window.location.origin,
      );
    });
    return;
  }

  if (
    event.source !== window ||
    event.origin !== window.location.origin ||
    event.data?.type !== "JOBMATES_APPLICATION_PACKAGE" ||
    !isValidPackage(event.data.package)
  )
    return;

  const applicationPackage = event.data.package;
  const acknowledge = (directApplyEnabled) => {
    window.postMessage(
      {
        type: "JOBMATES_EXTENSION_ACK",
        packageId: applicationPackage.packageId,
        directApplyEnabled,
      },
      window.location.origin,
    );
  };

  if (event.data.openPortal) {
    chrome.runtime.sendMessage(
      {
        type: "JOBMATES_START_APPLICATION",
        package: applicationPackage,
      },
      (response) => {
        if (chrome.runtime.lastError || !response?.ok) return;
        acknowledge(response.directApplyEnabled === true);
      },
    );
    return;
  }

});

window.addEventListener("message", (event) => {
  if (
    event.source !== window ||
    event.origin !== window.location.origin ||
    event.data?.type !== "JOBMATES_APPLICATION_ANSWERS" ||
    typeof event.data.packageId !== "string" ||
    !Array.isArray(event.data.answers)
  )
    return;
  chrome.runtime.sendMessage({
    type: "JOBMATES_APPLICATION_ANSWERS",
    packageId: event.data.packageId,
    answers: event.data.answers,
    sensitiveQuestionKeys: Array.isArray(event.data.sensitiveQuestionKeys)
      ? event.data.sensitiveQuestionKeys
      : [],
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "session" || !changes[RESULT_KEY]?.newValue) return;
  window.postMessage(
    {
      type: "JOBMATES_APPLICATION_RESULT",
      result: changes[RESULT_KEY].newValue,
    },
    window.location.origin,
  );
});
