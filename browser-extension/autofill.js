(() => {
  if (globalThis.__jobmatesApplyAssistantLoaded) return;
  globalThis.__jobmatesApplyAssistantLoaded = true;

  const core = globalThis.JobMatesAutofill;
  const state = {
    filled: new Set(),
    resumeUploaded: false,
    submissionAttempted: false,
    terminalResultReported: false,
    lastQuestionSignature: "",
    navigationSteps: 0,
    analysisPasses: 0,
    employmentRowsAdded: 0,
    educationRowsAdded: 0,
    applicationPackage: null,
    answerBank: new Map(),
    sessionAnswers: new Map(),
  };

  const delay = (milliseconds) =>
    new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  async function getApplicationPackage() {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const response = await chrome.runtime
        .sendMessage({ type: "JOBMATES_GET_APPLICATION_PACKAGE" })
        .catch(() => null);
      const applicationPackage = response?.package;
      if (
        applicationPackage &&
        Date.parse(applicationPackage.expiresAt) > Date.now() &&
        core.portalMatchesPackage(
          window.location.href,
          applicationPackage.job.applyUrl,
        )
      )
        return applicationPackage;
      await delay(250);
    }
    return null;
  }

  function groupFor(element) {
    return element.closest(
      "fieldset, [role='radiogroup'], [role='group'], .application-question, .field, .form-group, [data-automation-id*='formField']",
    );
  }

  function questionTextFor(element) {
    const labels = Array.from(element.labels ?? [])
      .map((label) => label.textContent)
      .filter(Boolean);
    const group = groupFor(element);
    const legend = group?.querySelector("legend")?.textContent;
    const groupLabel =
      group?.querySelector(
        "label, [data-automation-id='formLabel'], [class*='label']",
      )?.textContent ?? "";
    const groupAriaLabel = group?.getAttribute("aria-label");
    const isChoice =
      element instanceof HTMLInputElement &&
      ["radio", "checkbox"].includes(element.type);
    const candidates = isChoice
      ? [groupAriaLabel, legend, groupLabel, ...labels]
      : [
          element.getAttribute("aria-label"),
          ...labels,
          groupAriaLabel,
          legend,
          groupLabel,
        ];
    return [
      ...candidates,
      element.getAttribute("placeholder"),
      element.name,
    ]
      .filter(Boolean)
      .map((value) => String(value).replace(/\s+/g, " ").trim())
      .find((value) => value.length > 1)
      ?.slice(0, 1000) ?? "Required application question";
  }

  function descriptorFor(element) {
    return [
      questionTextFor(element),
      element.name,
      element.id,
      element.getAttribute("aria-label"),
      element.getAttribute("autocomplete"),
      element.getAttribute("placeholder"),
    ]
      .filter(Boolean)
      .join(" ");
  }

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      !element.disabled &&
      element.type !== "hidden"
    );
  }

  function setTextValue(element, value) {
    if (value === undefined || value === null || value === "") return false;
    if (!isVisible(element) || element.value) return false;
    const prototype =
      element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(element, String(value));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dataset.jobmatesFilled = "true";
    return true;
  }

  function setSelectValue(element, value) {
    if (value === undefined || value === null || value === "") return false;
    if (!isVisible(element) || element.value) return false;
    const normalizedValue = core.normalize(value);
    const options = Array.from(element.options).filter(
      (candidate) => candidate.value !== "",
    );
    const option =
      options.find((candidate) => {
        const optionText = core.normalize(
          `${candidate.value} ${candidate.textContent}`,
        );
        return optionText === normalizedValue;
      }) ??
      options.find((candidate) => {
        const optionText = core.normalize(
          `${candidate.value} ${candidate.textContent}`,
        );
        return (
          optionText.includes(normalizedValue) ||
          normalizedValue.includes(optionText)
        );
      });
    if (!option) return false;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )?.set;
    setter?.call(element, option.value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dataset.jobmatesFilled = "true";
    return true;
  }

  function firstEducation(applicant) {
    return applicant.educationHistory?.[0] ?? {};
  }

  function valuesForApplicant(applicant) {
    const education = firstEducation(applicant);
    return {
      ...applicant,
      fullName: `${applicant.firstName} ${applicant.lastName}`.trim(),
      educationSchool: education.school ?? "",
      educationDegree: education.degree ?? "",
      educationField: education.fieldOfStudy ?? "",
      educationStartYear: education.startYear ?? "",
      educationEndYear: education.endYear ?? "",
    };
  }

  function customFieldKey(descriptor) {
    const text = core.normalize(descriptor);
    if (/\b(school|university|college|institution)\b/.test(text))
      return "educationSchool";
    if (/\bdegree\b/.test(text)) return "educationDegree";
    if (/\b(field|area).{0,20}\b(study|major)\b|\bmajor\b/.test(text))
      return "educationField";
    if (/\b(start|from).{0,20}\byear\b/.test(text))
      return "educationStartYear";
    if (/\b(end|graduation|completion).{0,20}\byear\b/.test(text))
      return "educationEndYear";
    return null;
  }

  function fillStandardFields(applicationPackage) {
    const values = valuesForApplicant(applicationPackage.applicant);
    for (const field of document.querySelectorAll("input, textarea, select")) {
      if (
        field instanceof HTMLInputElement &&
        ["file", "radio", "checkbox", "submit", "button", "password"].includes(
          field.type,
        )
      )
        continue;
      const descriptor = descriptorFor(field);
      const key =
        core.fieldKeyForDescriptor(descriptor) ?? customFieldKey(descriptor);
      if (
        !key ||
        core.isSensitiveDescriptor(descriptor) ||
        core.isAttestationDescriptor(descriptor)
      )
        continue;
      const filled =
        field instanceof HTMLSelectElement
          ? setSelectValue(field, values[key])
          : setTextValue(field, values[key]);
      if (filled) state.filled.add(key);
    }
  }

  function setFieldValue(field, value) {
    return field instanceof HTMLSelectElement
      ? setSelectValue(field, value)
      : setTextValue(field, value);
  }

  function fillRepeatedValues(pattern, values, key) {
    const fields = Array.from(
      document.querySelectorAll("input, textarea, select"),
    ).filter((field) => {
      if (!isVisible(field)) return false;
      if (
        field instanceof HTMLInputElement &&
        ["file", "radio", "checkbox", "submit", "button", "password"].includes(
          field.type,
        )
      )
        return false;
      const descriptor = descriptorFor(field);
      return (
        pattern.test(core.normalize(descriptor)) &&
        !core.isSensitiveDescriptor(descriptor) &&
        !core.isAttestationDescriptor(descriptor)
      );
    });
    fields.forEach((field, index) => {
      const value = values[index];
      if (value && setFieldValue(field, value)) state.filled.add(key);
    });
    return fields.length;
  }

  function fillStructuredHistory(applicationPackage) {
    const employment = applicationPackage.applicant.employmentHistory ?? [];
    const education = applicationPackage.applicant.educationHistory ?? [];
    if (employment.length) {
      fillRepeatedValues(
        /\b(employer|company name|organization)\b/,
        employment.map((entry) => entry.employer),
        "employmentEmployer",
      );
      fillRepeatedValues(
        /\b(job title|position title|role title)\b/,
        employment.map((entry) => entry.title),
        "employmentTitle",
      );
      fillRepeatedValues(
        /\b(work|employment).{0,30}\blocation\b/,
        employment.map((entry) => entry.location),
        "employmentLocation",
      );
      fillRepeatedValues(
        /\b(start|from).{0,20}\b(date|month)\b/,
        employment.map((entry) => entry.startMonth),
        "employmentStart",
      );
      fillRepeatedValues(
        /\b(end|to).{0,20}\b(date|month)\b/,
        employment.map((entry) => entry.endMonth),
        "employmentEnd",
      );
      fillRepeatedValues(
        /\b(responsibilities|achievements|role description|job description)\b/,
        employment.map((entry) => entry.summary),
        "employmentSummary",
      );
    }
    if (education.length) {
      fillRepeatedValues(
        /\b(school|university|college|institution)\b/,
        education.map((entry) => entry.school),
        "educationSchool",
      );
      fillRepeatedValues(
        /\bdegree\b/,
        education.map((entry) => entry.degree),
        "educationDegree",
      );
      fillRepeatedValues(
        /\b(field|area).{0,20}\b(study|major)\b|\bmajor\b/,
        education.map((entry) => entry.fieldOfStudy),
        "educationField",
      );
      fillRepeatedValues(
        /\b(start|from).{0,20}\byear\b/,
        education.map((entry) => entry.startYear),
        "educationStart",
      );
      fillRepeatedValues(
        /\b(end|graduation|completion).{0,20}\byear\b/,
        education.map((entry) => entry.endYear),
        "educationEnd",
      );
    }
  }

  function maybeAddHistoryRows(applicationPackage) {
    const employmentTarget =
      applicationPackage.applicant.employmentHistory?.length ?? 0;
    const employerFieldCount = Array.from(
      document.querySelectorAll("input, textarea, select"),
    ).filter(
      (field) =>
        isVisible(field) &&
        /\b(employer|company name|organization)\b/.test(
          core.normalize(descriptorFor(field)),
        ),
    ).length;
    if (
      employmentTarget > employerFieldCount &&
      state.employmentRowsAdded < employmentTarget - 1
    ) {
      const addEmployment = findButton(
        /^add (?:another )?(?:work experience|employment|position|role)$/,
      );
      if (addEmployment) {
        state.employmentRowsAdded += 1;
        addEmployment.click();
      }
    }

    const educationTarget =
      applicationPackage.applicant.educationHistory?.length ?? 0;
    const schoolFieldCount = Array.from(
      document.querySelectorAll("input, textarea, select"),
    ).filter(
      (field) =>
        isVisible(field) &&
        /\b(school|university|college|institution)\b/.test(
          core.normalize(descriptorFor(field)),
        ),
    ).length;
    if (
      educationTarget > schoolFieldCount &&
      state.educationRowsAdded < educationTarget - 1
    ) {
      const addEducation = findButton(
        /^add (?:another )?(?:education|school|degree)$/,
      );
      if (addEducation) {
        state.educationRowsAdded += 1;
        addEducation.click();
      }
    }
  }

  function labelForChoice(choice) {
    return core.normalize(
      [
        choice.value,
        choice.getAttribute("aria-label"),
        ...(Array.from(choice.labels ?? []).map((label) => label.textContent)),
      ].join(" "),
    );
  }

  function fillBooleanQuestion(pattern, answer, key) {
    if (answer === null || answer === undefined) return;
    const groups = document.querySelectorAll(
      "fieldset, [role='radiogroup'], [role='group'], .application-question, .form-group",
    );
    for (const group of groups) {
      const text = core.normalize(group.textContent);
      if (
        !pattern.test(text) ||
        core.isSensitiveDescriptor(text) ||
        core.isAttestationDescriptor(text)
      )
        continue;
      const radios = Array.from(
        group.querySelectorAll("input[type='radio']"),
      ).filter(isVisible);
      const expected = answer ? /\b(yes|true)\b/ : /\b(no|false)\b/;
      const radio = radios.find((candidate) =>
        expected.test(labelForChoice(candidate)),
      );
      if (radio && !radio.checked) {
        radio.click();
        radio.dataset.jobmatesFilled = "true";
        state.filled.add(key);
      }
      for (const select of group.querySelectorAll("select"))
        if (setSelectValue(select, answer ? "yes" : "no"))
          state.filled.add(key);
    }
    for (const select of document.querySelectorAll("select")) {
      const descriptor = descriptorFor(select);
      if (
        pattern.test(core.normalize(descriptor)) &&
        !core.isSensitiveDescriptor(descriptor) &&
        !core.isAttestationDescriptor(descriptor) &&
        setSelectValue(select, answer ? "yes" : "no")
      )
        state.filled.add(key);
    }
  }

  function fillProfileBooleans(applicationPackage) {
    const applicant = applicationPackage.applicant;
    fillBooleanQuestion(
      /\b(authori[sz]ed|legally eligible).{0,60}\bwork\b|\bwork authorization\b/,
      applicant.workAuthorized,
      "workAuthorized",
    );
    fillBooleanQuestion(
      /\b(sponsor|sponsorship|visa)\b/,
      applicant.requiresSponsorship,
      "requiresSponsorship",
    );
    fillBooleanQuestion(
      /\b(18|legal age|age of majority)\b/,
      applicant.over18,
      "over18",
    );
    fillBooleanQuestion(
      /\b(relocate|relocation)\b/,
      applicant.willingToRelocate,
      "willingToRelocate",
    );
    fillBooleanQuestion(
      /\b(travel|working away)\b/,
      applicant.willingToTravel,
      "willingToTravel",
    );
  }

  function answerParts(answer) {
    return (Array.isArray(answer) ? answer : String(answer).split(/\s*\|\|\s*/))
      .map(core.normalize)
      .filter(Boolean);
  }

  function choiceMatchesAnswer(choice, answer) {
    const option = core.normalize(choice);
    return answerParts(answer).some((part) => {
      if (/\b(prefer not|do not wish|decline|not disclose)\b/.test(part))
        return /\b(prefer not|do not wish|decline|not disclose)\b/.test(option);
      if (part === "yes") return /\byes\b/.test(option);
      if (part === "no")
        return (
          /\bno\b/.test(option) &&
          !/\b(do not wish|prefer not|decline)\b/.test(option)
        );
      if (part === "woman") return /\b(woman|female)\b/.test(option);
      if (part === "man") return /\b(man|male)\b/.test(option);
      if (part === "female") return /\b(female|woman)\b/.test(option);
      if (part === "male") return /\b(male|man)\b/.test(option);
      if (part === "non binary")
        return /\b(non binary|nonbinary)\b/.test(option);
      if (part.includes("straight") || part.includes("heterosexual"))
        return /\b(straight|heterosexual)\b/.test(option);
      return option === part || option.includes(part) || part.includes(option);
    });
  }

  function explicitProtectedAnswer(field, key) {
    const oneTime = state.sessionAnswers.get(questionKeyForElement(field));
    if (oneTime) return oneTime;
    const applicant = state.applicationPackage?.applicant;
    if (!applicant?.protectedDataConsent) return null;
    const answer = applicant.demographicAnswers?.[key];
    if (Array.isArray(answer)) return answer.length ? answer : null;
    return answer || null;
  }

  function fillProtectedFields() {
    for (const field of document.querySelectorAll("input, select")) {
      if (!isVisible(field)) continue;
      const descriptor = descriptorFor(field);
      const key = core.sensitiveFieldKeyForDescriptor(descriptor);
      if (!key) continue;
      const answer = explicitProtectedAnswer(field, key);
      if (!answer) continue;

      if (field instanceof HTMLSelectElement) {
        const options = Array.from(field.options).filter(
          (option) => option.value,
        );
        if (field.multiple) {
          let changed = false;
          for (const option of options) {
            const selected = choiceMatchesAnswer(
              `${option.value} ${option.textContent}`,
              answer,
            );
            if (option.selected !== selected) {
              option.selected = selected;
              changed = true;
            }
          }
          if (changed) {
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));
            field.dataset.jobmatesFilled = "true";
            state.filled.add(key);
          }
          continue;
        }
        const option = options.find((candidate) =>
          choiceMatchesAnswer(
            `${candidate.value} ${candidate.textContent}`,
            answer,
          ),
        );
        if (option && !field.value) {
          const setter = Object.getOwnPropertyDescriptor(
            HTMLSelectElement.prototype,
            "value",
          )?.set;
          setter?.call(field, option.value);
          field.dispatchEvent(new Event("input", { bubbles: true }));
          field.dispatchEvent(new Event("change", { bubbles: true }));
          field.dataset.jobmatesFilled = "true";
          state.filled.add(key);
        }
        continue;
      }

      if (
        field instanceof HTMLInputElement &&
        ["radio", "checkbox"].includes(field.type) &&
        choiceMatchesAnswer(labelForChoice(field), answer) &&
        !field.checked
      ) {
        field.click();
        field.dataset.jobmatesFilled = "true";
        state.filled.add(key);
      }
    }
  }

  function questionKeyForElement(element) {
    return core.questionKeyForDescriptor(questionTextFor(element));
  }

  function choicesForField(field) {
    if (field instanceof HTMLSelectElement)
      return Array.from(field.options)
        .filter((option) => option.value)
        .map((option) => String(option.textContent ?? option.value).trim())
        .filter(Boolean);
    if (field instanceof HTMLInputElement && field.type === "radio") {
      const name = CSS.escape(field.name);
      return Array.from(
        document.querySelectorAll(`input[type='radio'][name='${name}']`),
      )
        .map(labelForChoice)
        .filter(Boolean);
    }
    if (field instanceof HTMLInputElement && field.type === "checkbox")
      return ["Yes", "No"];
    return [];
  }

  function fillAnswerBank() {
    for (const field of document.querySelectorAll("input, textarea, select")) {
      if (!isVisible(field)) continue;
      const descriptor = descriptorFor(field);
      if (
        core.isSensitiveDescriptor(descriptor) ||
        core.isAttestationDescriptor(descriptor)
      )
        continue;
      const answer = state.answerBank.get(questionKeyForElement(field));
      if (!answer) continue;
      if (field instanceof HTMLSelectElement) {
        if (setSelectValue(field, answer)) state.filled.add("savedAnswer");
        continue;
      }
      if (field instanceof HTMLInputElement && field.type === "radio") {
        if (field.checked) continue;
        if (labelForChoice(field).includes(core.normalize(answer))) {
          field.click();
          field.dataset.jobmatesFilled = "true";
          state.filled.add("savedAnswer");
        }
        continue;
      }
      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        const wantsChecked = /\b(yes|true|checked|agree)\b/.test(
          core.normalize(answer),
        );
        if (field.checked !== wantsChecked) field.click();
        field.dataset.jobmatesFilled = "true";
        state.filled.add("savedAnswer");
        continue;
      }
      if (
        !(field instanceof HTMLInputElement) ||
        !["file", "submit", "button", "password"].includes(field.type)
      )
        if (setTextValue(field, answer)) state.filled.add("savedAnswer");
    }
  }

  async function uploadResume(applicationPackage) {
    if (state.resumeUploaded || !applicationPackage.resume) return;
    const fileInput = Array.from(
      document.querySelectorAll("input[type='file']"),
    ).find((input) => {
      const descriptor = core.normalize(descriptorFor(input));
      return !input.disabled && /\b(resume|résumé|cv)\b/.test(descriptor);
    });
    if (!fileInput || fileInput.files?.length) {
      if (fileInput?.files?.length) state.resumeUploaded = true;
      return;
    }

    try {
      const response = await fetch(applicationPackage.resume.downloadUrl);
      if (!response.ok) return;
      const blob = await response.blob();
      const file = new File([blob], applicationPackage.resume.filename, {
        type: applicationPackage.resume.mimeType,
      });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.files = transfer.files;
      fileInput.dispatchEvent(new Event("input", { bubbles: true }));
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      fileInput.dataset.jobmatesFilled = "true";
      state.resumeUploaded = true;
    } catch {
      state.resumeUploaded = false;
    }
  }

  function isEmptyRequiredField(field) {
    if (field instanceof HTMLInputElement && field.type === "checkbox")
      return !field.checked;
    if (field instanceof HTMLInputElement && field.type === "radio") {
      if (!field.name) return !field.checked;
      return !Array.from(
        document.querySelectorAll(
          `input[type='radio'][name='${CSS.escape(field.name)}']`,
        ),
      ).some((radio) => radio.checked);
    }
    if (field instanceof HTMLInputElement && field.type === "file")
      return !field.files?.length;
    return !field.value;
  }

  function fieldTypeFor(field) {
    if (field instanceof HTMLTextAreaElement) return "textarea";
    if (field instanceof HTMLSelectElement)
      return field.multiple ? "multiselect" : "select";
    if (
      field instanceof HTMLInputElement &&
      ["radio", "checkbox"].includes(field.type)
    )
      return field.type;
    return "text";
  }

  function collectRequiredIssues() {
    const questions = new Map();
    const radioGroups = new Set();
    let sensitiveRequired = false;
    let attestationRequired = false;
    let resumeRequired = false;
    let loginRequired = Array.from(
      document.querySelectorAll("input[type='password']"),
    ).some(isVisible);

    for (const field of document.querySelectorAll(
      "input[required], textarea[required], select[required], [aria-required='true']",
    )) {
      if (!isVisible(field) || !isEmptyRequiredField(field)) continue;
      const descriptor = descriptorFor(field);
      const sensitive = core.isSensitiveDescriptor(descriptor);
      if (
        sensitive &&
        !core.sensitiveFieldKeyForDescriptor(descriptor)
      ) {
        sensitiveRequired = true;
        continue;
      }
      if (core.isAttestationDescriptor(descriptor)) {
        attestationRequired = true;
        continue;
      }
      if (field instanceof HTMLInputElement && field.type === "password") {
        loginRequired = true;
        continue;
      }
      if (field instanceof HTMLInputElement && field.type === "file") {
        if (/\b(resume|résumé|cv)\b/i.test(descriptor)) resumeRequired = true;
        continue;
      }
      if (
        field instanceof HTMLInputElement &&
        field.type === "radio" &&
        radioGroups.has(field.name)
      )
        continue;
      if (field instanceof HTMLInputElement && field.type === "radio")
        radioGroups.add(field.name);

      const questionText = questionTextFor(field);
      const questionKey = core.questionKeyForDescriptor(questionText);
      questions.set(questionKey, {
        questionKey,
        questionText,
        fieldType: fieldTypeFor(field),
        options: choicesForField(field).slice(0, 50),
        required: true,
        sensitive,
      });
    }

    return {
      questions: Array.from(questions.values()),
      sensitiveRequired,
      attestationRequired,
      resumeRequired,
      loginRequired,
    };
  }

  function findButton(pattern) {
    return Array.from(
      document.querySelectorAll(
        "button, input[type='submit'], input[type='button'], a[href]",
      ),
    ).find((button) => {
      if (!isVisible(button)) return false;
      const text = core.normalize(
        `${button.textContent ?? ""} ${button.value ?? ""} ${
          button.getAttribute("aria-label") ?? ""
        }`,
      );
      return pattern.test(text);
    });
  }

  function findSubmitButton() {
    return findButton(/\bsubmit(?: application)?\b|\bsend application\b/);
  }

  function findContinueButton() {
    return findButton(
      /^(?:continue|next|save and continue|review application|apply now|i'?m interested|start application)$/,
    );
  }

  function hasCaptcha() {
    const bodyText = core.normalize(document.body?.innerText);
    return Boolean(
      document.querySelector(
        ".g-recaptcha, [data-sitekey], iframe[src*='captcha'], iframe[title*='captcha' i]",
      ) ||
        /\b(confirm you are not a robot|security code|verification code)\b/.test(
          bodyText,
        ),
    );
  }

  function submissionConfirmed() {
    const text = core.normalize(document.body?.innerText);
    return /\b(thank(?:s| you) for applying|thank you.{0,80}(?:application|interest)|application (?:was |has been )?submitted|application received|your application has been received|we (?:have|'ve) received your application)\b/.test(
      text,
    );
  }

  function hasRecognizableApplicationForm() {
    const fields = Array.from(
      document.querySelectorAll("input, textarea, select"),
    ).filter(isVisible);
    return (
      fields.some((field) =>
        /\b(e-?mail|resume|résumé|cv|first name|full name)\b/i.test(
          descriptorFor(field),
        ),
      ) && Boolean(document.querySelector("form"))
    );
  }

  function hasApplicationIframe() {
    return Array.from(document.querySelectorAll("iframe")).some((frame) =>
      /\b(greenhouse|lever|ashby|workday|smartrecruiters|workable|icims|jobvite|bamboohr|breezy|recruitee|teamtailor|applytojob|rippling|ultipro|adp|taleo|successfactors|oraclecloud|eightfold|pinpoint|personio)\b/i.test(
        frame.src,
      ),
    );
  }

  function reportResult(status, reason = null, questions = []) {
    const applicationPackage = state.applicationPackage;
    if (!applicationPackage) return;
    if (status !== "questions_required") {
      if (state.terminalResultReported) return;
      state.terminalResultReported = true;
    }
    chrome.runtime.sendMessage({
      type: "JOBMATES_APPLICATION_RESULT",
      packageId: applicationPackage.packageId,
      jobId: applicationPackage.job.id,
      applyUrl: applicationPackage.job.applyUrl,
      status,
      reason,
      questions,
    });
  }

  async function fillApplication() {
    const applicationPackage = state.applicationPackage;
    if (!applicationPackage) return;
    maybeAddHistoryRows(applicationPackage);
    fillStructuredHistory(applicationPackage);
    fillStandardFields(applicationPackage);
    fillProfileBooleans(applicationPackage);
    fillProtectedFields();
    fillAnswerBank();
    await uploadResume(applicationPackage);
  }

  async function analyzeAndAdvance() {
    if (
      state.terminalResultReported ||
      !state.applicationPackage ||
      state.submissionAttempted
    )
      return;
    if (submissionConfirmed()) {
      reportResult("applied");
      return;
    }

    await fillApplication();
    await delay(350);
    state.analysisPasses += 1;
    const issues = collectRequiredIssues();
    if (issues.sensitiveRequired) {
      reportResult("review_required", "unsupported_sensitive_question");
      return;
    }
    if (issues.attestationRequired) {
      reportResult("review_required", "attestation_required");
      return;
    }
    if (issues.loginRequired) {
      reportResult("review_required", "portal_login_required");
      return;
    }
    if (issues.resumeRequired) {
      reportResult("review_required", "resume_upload_failed");
      return;
    }
    if (hasCaptcha()) {
      reportResult("review_required", "captcha_required");
      return;
    }
    if (issues.questions.length) {
      const signature = issues.questions
        .map((question) => question.questionKey)
        .sort()
        .join("|");
      if (signature !== state.lastQuestionSignature) {
        state.lastQuestionSignature = signature;
        reportResult(
          "questions_required",
          "required_fields_unanswered",
          issues.questions,
        );
      }
      return;
    }

    const submitButton = findSubmitButton();
    const providerSupported =
      core.supportsDirectSubmission(window.location.hostname) ||
      hasRecognizableApplicationForm();
    if (submitButton && providerSupported) {
      state.submissionAttempted = true;
      submitButton.click();
      await delay(5_000);
      if (submissionConfirmed()) {
        reportResult("applied");
        return;
      }
      state.submissionAttempted = false;
      await fillApplication();
      const validationIssues = collectRequiredIssues();
      if (validationIssues.questions.length) {
        state.lastQuestionSignature = "";
        void analyzeAndAdvance();
        return;
      }
      if (hasCaptcha()) {
        reportResult("review_required", "captcha_required");
        return;
      }
      reportResult("review_required", "portal_validation");
      return;
    }

    const continueButton = findContinueButton();
    if (continueButton && state.navigationSteps < 8) {
      state.navigationSteps += 1;
      continueButton.click();
      window.setTimeout(() => void analyzeAndAdvance(), 1_200);
      return;
    }

    if (
      window.top === window &&
      (hasApplicationIframe() || document.readyState !== "complete")
    )
      return;
    if (hasRecognizableApplicationForm())
      reportResult("review_required", "submit_button_not_found");
    else if (state.analysisPasses < 10)
      window.setTimeout(() => void analyzeAndAdvance(), 1_000);
    else if (window.top === window)
      reportResult("review_required", "application_form_not_found");
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (
      message?.type !== "JOBMATES_APPLICATION_ANSWERS" ||
      message.packageId !== state.applicationPackage?.packageId
    )
      return;
    const sensitiveKeys = new Set(message.sensitiveQuestionKeys ?? []);
    for (const answer of message.answers ?? [])
      if (answer?.questionKey && typeof answer.answer === "string") {
        state.sessionAnswers.set(answer.questionKey, answer.answer);
        if (!sensitiveKeys.has(answer.questionKey))
          state.answerBank.set(answer.questionKey, answer.answer);
      }
    state.lastQuestionSignature = "";
    void fillApplication().then(() =>
      window.setTimeout(() => void analyzeAndAdvance(), 500),
    );
  });

  void (async () => {
    const applicationPackage = await getApplicationPackage();
    if (!applicationPackage) return;
    state.applicationPackage = applicationPackage;
    state.answerBank = new Map(
      (applicationPackage.answerBank ?? []).map((answer) => [
        answer.questionKey,
        answer.answer,
      ]),
    );
    state.sessionAnswers = new Map(
      Object.entries(applicationPackage.sessionAnswers ?? {}),
    );
    if (submissionConfirmed()) {
      reportResult("applied");
      return;
    }
    await fillApplication();
    window.setTimeout(() => void analyzeAndAdvance(), 1_000);

    let attempts = 0;
    const observer = new MutationObserver(() => {
      if (submissionConfirmed()) {
        reportResult("applied");
        return;
      }
      if (attempts >= 30 || state.terminalResultReported) return;
      attempts += 1;
      window.setTimeout(() => void fillApplication(), 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 30_000);
  })();
})();
