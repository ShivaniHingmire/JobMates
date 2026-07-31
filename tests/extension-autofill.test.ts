import "../browser-extension/autofill-core.js";
import { describe, expect, it } from "vitest";

type AutofillCore = {
  normalize: (value: unknown) => string;
  providerForHost: (hostname: string) => string;
  isSensitiveDescriptor: (descriptor: string) => boolean;
  isAttestationDescriptor: (descriptor: string) => boolean;
  sensitiveFieldKeyForDescriptor: (descriptor: string) => string | null;
  fieldKeyForDescriptor: (descriptor: string) => string | null;
  questionKeyForDescriptor: (descriptor: string) => string;
  portalMatchesPackage: (currentUrl: string, applyUrl: string) => boolean;
  supportsDirectSubmission: (hostname: string) => boolean;
  directSubmissionDecision: (input: {
    directApplyEnabled: boolean;
    supportedProvider: boolean;
    missingProfileFields: number;
    requiredUnfilled: number;
    sensitiveRequired: boolean;
    attestationRequired: boolean;
    hasCaptcha: boolean;
    hasSubmitButton: boolean;
  }) => { eligible: boolean; reason: string | null };
};

const core = (
  globalThis as typeof globalThis & { JobMatesAutofill: AutofillCore }
).JobMatesAutofill;

describe("Apply Assistant field mapping", () => {
  it("recognizes supported application portals", () => {
    expect(core.providerForHost("boards.greenhouse.io")).toBe("Greenhouse");
    expect(core.providerForHost("jobs.lever.co")).toBe("Lever");
    expect(core.providerForHost("jobs.ashbyhq.com")).toBe("Ashby");
    expect(core.providerForHost("jobs.smartrecruiters.com")).toBe(
      "SmartRecruiters",
    );
    expect(core.providerForHost("apply.workable.com")).toBe("Workable");
    expect(core.providerForHost("canny.breezy.hr")).toBe("Breezy HR");
    expect(core.providerForHost("ats.rippling.com")).toBe("Rippling");
    expect(core.providerForHost("recruiting.ultipro.com")).toBe("UKG");
  });

  it("maps ordinary contact fields", () => {
    expect(core.fieldKeyForDescriptor("Candidate First Name")).toBe(
      "firstName",
    );
    expect(core.fieldKeyForDescriptor("LinkedIn Profile URL")).toBe(
      "linkedinUrl",
    );
    expect(core.fieldKeyForDescriptor("ZIP / Postal Code")).toBe("postalCode");
    expect(core.fieldKeyForDescriptor("Current company")).toBe(
      "currentCompany",
    );
    expect(core.fieldKeyForDescriptor("How did you hear about us?")).toBe(
      "referralSource",
    );
  });

  it("does not map sensitive demographic fields", () => {
    expect(core.isSensitiveDescriptor("Gender identity")).toBe(true);
    expect(core.fieldKeyForDescriptor("Veteran status")).toBeNull();
    expect(core.fieldKeyForDescriptor("Date of birth")).toBeNull();
    expect(core.isAttestationDescriptor("I certify this is accurate")).toBe(
      true,
    );
    expect(
      core.sensitiveFieldKeyForDescriptor(
        "Will you identify as a protected veteran?",
      ),
    ).toBe("veteranStatus");
    expect(
      core.sensitiveFieldKeyForDescriptor("I have a disability"),
    ).toBe("disabilityStatus");
    expect(
      core.sensitiveFieldKeyForDescriptor(
        "How would you describe your gender identity?",
      ),
    ).toBe("genderIdentity");
  });

  it("creates stable reusable keys for employer questions", () => {
    expect(
      core.questionKeyForDescriptor("  Are you willing to relocate? * "),
    ).toBe(core.questionKeyForDescriptor("Are you willing to relocate?"));
    expect(
      core.questionKeyForDescriptor("Describe a project you are proud of"),
    ).not.toBe(
      core.questionKeyForDescriptor("Why are you interested in this role?"),
    );
  });

  it("accepts redirects within the same supported portal", () => {
    expect(
      core.portalMatchesPackage(
        "https://boards.greenhouse.io/company/jobs/123",
        "https://job-boards.greenhouse.io/company/jobs/123",
      ),
    ).toBe(true);
    expect(
      core.portalMatchesPackage(
        "https://jobs.lever.co/company/123",
        "https://jobs.ashbyhq.com/company/123",
      ),
    ).toBe(false);
  });

  it("allows direct submission only for complete safe forms", () => {
    const complete = {
      directApplyEnabled: true,
      supportedProvider: true,
      missingProfileFields: 0,
      requiredUnfilled: 0,
      sensitiveRequired: false,
      attestationRequired: false,
      hasCaptcha: false,
      hasSubmitButton: true,
    };

    expect(core.directSubmissionDecision(complete)).toEqual({
      eligible: true,
      reason: null,
    });
    expect(
      core.directSubmissionDecision({ ...complete, hasCaptcha: true }),
    ).toEqual({ eligible: false, reason: "captcha_required" });
    expect(
      core.directSubmissionDecision({
        ...complete,
        attestationRequired: true,
      }),
    ).toEqual({ eligible: false, reason: "attestation_required" });
  });
});
