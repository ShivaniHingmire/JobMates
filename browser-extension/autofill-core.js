(function exposeAutofillCore(global) {
  const sensitivePattern =
    /\b(gender|sex|race|ethnicity|disability|veteran|date of birth|birth date|ssn|social security|religion|marital|sexual orientation|transgender|hispanic|latino|first[- ]generation|national origin)\b/i;
  const attestationPattern =
    /\b(certify|attest|acknowledge|electronic signature|terms|privacy policy|truthful|accurate|arbitration|consent to|i agree|signature)\b/i;

  const providers = [
    ["Greenhouse", (host) => host.endsWith("greenhouse.io")],
    ["Lever", (host) => host === "jobs.lever.co"],
    ["Ashby", (host) => host === "jobs.ashbyhq.com"],
    ["Workday", (host) => host.endsWith("myworkdayjobs.com")],
    ["SmartRecruiters", (host) => host.endsWith("smartrecruiters.com")],
    ["Workable", (host) => host === "apply.workable.com"],
    ["iCIMS", (host) => host.endsWith("icims.com")],
    ["Jobvite", (host) => host.endsWith("jobvite.com")],
    ["BambooHR", (host) => host.endsWith("bamboohr.com")],
    ["Breezy HR", (host) => host.endsWith("breezy.hr")],
    ["Recruitee", (host) => host.endsWith("recruitee.com")],
    ["Teamtailor", (host) => host.endsWith("teamtailor.com")],
    ["JazzHR", (host) => host.endsWith("applytojob.com")],
    ["Rippling", (host) => host === "ats.rippling.com"],
    ["UKG", (host) => host === "recruiting.ultipro.com"],
    ["ADP", (host) => host === "workforcenow.adp.com"],
    ["Taleo", (host) => host.endsWith("taleo.net")],
    ["SuccessFactors", (host) => host.endsWith("successfactors.com")],
    ["Oracle Recruiting", (host) => host.endsWith("oraclecloud.com")],
    ["Eightfold", (host) => host.endsWith("eightfold.ai")],
    ["Pinpoint", (host) => host.endsWith("pinpointhq.com")],
    ["Personio", (host) => host.endsWith("jobs.personio.com")],
  ];

  function normalize(value) {
    return String(value ?? "")
      .replace(/[_-]+/g, " ")
      .replace(/[✱*]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function providerForHost(hostname) {
    const host = normalize(hostname);
    return providers.find(([, matches]) => matches(host))?.[0] ?? "Employer portal";
  }

  function isSensitiveDescriptor(descriptor) {
    return sensitivePattern.test(normalize(descriptor));
  }

  function isAttestationDescriptor(descriptor) {
    return attestationPattern.test(normalize(descriptor));
  }

  function sensitiveFieldKeyForDescriptor(descriptor) {
    const text = normalize(descriptor);
    if (/\btransgender\b/.test(text)) return "transgenderIdentity";
    if (/\bsexual orientation\b/.test(text)) return "sexualOrientation";
    if (/\bfirst generation (?:professional|college|graduate)\b/.test(text))
      return "firstGenerationProfessional";
    if (/\b(veteran|vevraa)\b/.test(text)) return "veteranStatus";
    if (/\b(disability|disabled|cc 305)\b/.test(text))
      return "disabilityStatus";
    if (/\b(hispanic|latino|spanish origin)\b/.test(text))
      return "hispanicLatino";
    if (/\b(race|ethnicity|ethnic origin)\b/.test(text))
      return "raceEthnicity";
    if (/\bgender identity\b/.test(text)) return "genderIdentity";
    if (/\b(gender|sex)\b/.test(text)) return "governmentGender";
    return null;
  }

  function fieldKeyForDescriptor(descriptor) {
    const text = normalize(descriptor);
    if (!text || isSensitiveDescriptor(text) || isAttestationDescriptor(text))
      return null;
    if (/\b(preferred|chosen)\s*name\b/.test(text)) return "preferredName";
    if (/\b(first|given)\s*name\b/.test(text)) return "firstName";
    if (/\b(last|family|surname)\s*name\b/.test(text)) return "lastName";
    if (
      /\b(full|candidate|applicant)\s*name\b/.test(text) ||
      text === "name"
    )
      return "fullName";
    if (/\be-?mail\b/.test(text)) return "email";
    if (/\b(phone|mobile|telephone|tel)\b/.test(text)) return "phone";
    if (/\b(address line 2|address 2|apartment|suite|unit)\b/.test(text))
      return "addressLine2";
    if (/\b(street|address line 1|address 1|mailing address)\b/.test(text))
      return "addressLine1";
    if (/\b(city|town|current location)\b/.test(text)) return "city";
    if (/\b(state|province|region)\b/.test(text)) return "region";
    if (/\b(zip|postal)\b/.test(text)) return "postalCode";
    if (/\bcountry\b/.test(text)) return "countryCode";
    if (/\blinked\s*in\b/.test(text)) return "linkedinUrl";
    if (/\bgithub\b/.test(text)) return "githubUrl";
    if (/\b(portfolio|personal website|website)\b/.test(text))
      return "websiteUrl";
    if (/\b(current|most recent).{0,30}(job )?title\b|\bheadline\b/.test(text))
      return "currentTitle";
    if (/\b(current|most recent).{0,30}(company|employer)\b/.test(text))
      return "currentCompany";
    if (/\b(years?).{0,30}\b(experience|professional)\b/.test(text))
      return "yearsExperience";
    if (/\b(available|earliest).{0,30}\b(start|date)\b/.test(text))
      return "availableStartDate";
    if (/\bnotice period\b/.test(text)) return "noticePeriod";
    if (/\b(salary|compensation).{0,30}\b(expect|desired|require)\b/.test(text))
      return "salaryExpectation";
    if (/\bhow did you hear\b|\breferral source\b/.test(text))
      return "referralSource";
    if (
      /\bwhy (?:are you interested|this role|do you want|join)\b|\binterest in this (?:role|position)\b/.test(
        text,
      )
    )
      return "whyInterested";
    if (/\b(proud|greatest|notable).{0,30}\b(achievement|project)\b/.test(text))
      return "proudAchievement";
    if (/\badditional (?:information|comments)\b/.test(text))
      return "additionalInformation";
    return null;
  }

  function shortHash(value) {
    let hash = 2166136261;
    for (const character of value) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function questionKeyForDescriptor(descriptor) {
    const normalized = normalize(descriptor)
      .replace(/\b(required|optional)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const prefix = normalized.slice(0, 155);
    return `${prefix}:${shortHash(normalized)}`.slice(0, 180);
  }

  function portalMatchesPackage(currentUrl, applyUrl) {
    try {
      const current = new URL(currentUrl);
      const target = new URL(applyUrl);
      const currentProvider = providerForHost(current.hostname);
      const targetProvider = providerForHost(target.hostname);
      return (
        current.hostname === target.hostname ||
        (currentProvider !== "Employer portal" &&
          (currentProvider === targetProvider ||
            targetProvider === "Employer portal"))
      );
    } catch {
      return false;
    }
  }

  function supportsDirectSubmission(hostname) {
    return providerForHost(hostname) !== "Employer portal";
  }

  function directSubmissionDecision(input) {
    if (!input.directApplyEnabled)
      return { eligible: false, reason: "direct_apply_disabled" };
    if (!input.supportedProvider)
      return { eligible: false, reason: "unsupported_provider" };
    if (input.missingProfileFields > 0)
      return { eligible: false, reason: "incomplete_profile" };
    if (input.requiredUnfilled > 0)
      return { eligible: false, reason: "required_fields_unanswered" };
    if (input.sensitiveRequired)
      return { eligible: false, reason: "protected_question" };
    if (input.attestationRequired)
      return { eligible: false, reason: "attestation_required" };
    if (input.hasCaptcha)
      return { eligible: false, reason: "captcha_required" };
    if (!input.hasSubmitButton)
      return { eligible: false, reason: "submit_button_not_found" };
    return { eligible: true, reason: null };
  }

  global.JobMatesAutofill = {
    normalize,
    providerForHost,
    isSensitiveDescriptor,
    isAttestationDescriptor,
    sensitiveFieldKeyForDescriptor,
    fieldKeyForDescriptor,
    questionKeyForDescriptor,
    portalMatchesPackage,
    supportsDirectSubmission,
    directSubmissionDecision,
  };
})(globalThis);
