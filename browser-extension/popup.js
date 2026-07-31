const DIRECT_APPLY_KEY = "jobmatesDirectApply";
const directApply = document.querySelector("#direct-apply");

void Promise.all([
  chrome.storage.session.get(null),
  chrome.storage.local.get(DIRECT_APPLY_KEY),
]).then(([stored, settings]) => {
  const status = document.querySelector("#status");
  directApply.checked = settings[DIRECT_APPLY_KEY] !== false;
  const applicationPackage = Object.entries(stored)
    .filter(([key]) => key.startsWith("jobmatesApplicationPackage:"))
    .map(([, value]) => value)
    .filter((value) => Date.parse(value?.expiresAt) > Date.now())
    .at(-1);
  if (
    !applicationPackage ||
    Date.parse(applicationPackage.expiresAt) <= Date.now()
  ) {
    return;
  }
  status.textContent = `Working on ${applicationPackage.job.title} at ${applicationPackage.job.company}.`;
});

directApply.addEventListener("change", () => {
  void chrome.storage.local.set({
    [DIRECT_APPLY_KEY]: directApply.checked,
  });
});
