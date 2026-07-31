import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startApplicationHandoff } from "@/features/applications/application-handoff";

const packageData = {
  version: 1 as const,
  packageId: "2aa88976-d9e8-4f25-b260-470cef608970",
  expiresAt: "2099-07-30T12:00:00.000Z",
  job: {
    id: "job-1",
    title: "Product Manager",
    company: "Acme",
    applyUrl: "https://jobs.lever.co/acme/job-1",
  },
  applicant: {
    firstName: "Taylor",
    lastName: "Morgan",
    preferredName: "Taylor",
    email: "taylor@example.com",
    phone: "+12125550134",
    addressLine1: "100 Main Street",
    addressLine2: "",
    city: "New York",
    region: "NY",
    postalCode: "10001",
    countryCode: "US",
    linkedinUrl: "https://linkedin.com/in/taylor",
    websiteUrl: "",
    githubUrl: "",
    currentTitle: "Product Manager",
    currentCompany: "Acme",
    yearsExperience: "5",
    workAuthorized: true,
    requiresSponsorship: false,
    over18: true,
    willingToRelocate: false,
    willingToTravel: true,
    availableStartDate: "",
    noticePeriod: "Two weeks",
    salaryExpectation: "",
    salaryCurrency: "USD",
    referralSource: "Company careers page",
    whyInterested: "",
    proudAchievement: "",
    additionalInformation: "",
    employmentHistory: [],
    educationHistory: [],
    demographicAnswers: {
      genderIdentity: "",
      transgenderIdentity: "",
      sexualOrientation: "",
      raceEthnicity: [],
      veteranStatus: "",
      disabilityStatus: "",
      firstGenerationProfessional: "",
      governmentGender: "",
      hispanicLatino: "",
    },
    protectedDataConsent: false,
    directApplyConsent: true,
  },
  answerBank: [] as Array<{
    questionKey: string;
    questionText: string;
    answer: string;
  }>,
  resume: null,
  missingFields: [] as string[],
};

beforeEach(() => {
  vi.stubGlobal("open", vi.fn());
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockPackage(data = packageData) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((input: RequestInfo | URL) =>
      Promise.resolve(
        String(input).endsWith("/api/applications/package")
          ? {
              ok: true,
              json: async () => ({ ok: true, data }),
            }
          : { ok: true },
      ),
    ),
  );
}

describe("startApplicationHandoff", () => {
  it("does not open an employer tab when the extension is unavailable", async () => {
    mockPackage();

    const result = await startApplicationHandoff(
      packageData.job.id,
      packageData.job.applyUrl,
      false,
    );

    expect(window.open).not.toHaveBeenCalled();
    expect(result).toEqual({
      extensionDetected: false,
      mode: "extension_required",
      trackingStarted: false,
      missingFields: [],
    });
  });

  it("requires the questionnaire before starting an application", async () => {
    mockPackage({ ...packageData, missingFields: ["phone", "résumé file"] });

    const result = await startApplicationHandoff(
      packageData.job.id,
      packageData.job.applyUrl,
      true,
    );

    expect(window.open).not.toHaveBeenCalled();
    expect(result.mode).toBe("profile_required");
    expect(result.missingFields).toEqual(["phone", "résumé file"]);
  });

  it("lets the extension open a background direct-apply tab", async () => {
    mockPackage();
    vi.stubGlobal(
      "postMessage",
      vi.fn((message: unknown) => {
        if (
          typeof message === "object" &&
          message !== null &&
          "type" in message &&
          message.type === "JOBMATES_APPLICATION_PACKAGE"
        )
          window.dispatchEvent(
            new MessageEvent("message", {
              source: window,
              origin: window.location.origin,
              data: {
                type: "JOBMATES_EXTENSION_ACK",
                packageId: packageData.packageId,
                directApplyEnabled: true,
              },
            }),
          );
      }),
    );

    const result = await startApplicationHandoff(
      packageData.job.id,
      packageData.job.applyUrl,
      true,
    );

    expect(window.open).not.toHaveBeenCalled();
    expect(window.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ openPortal: true }),
      window.location.origin,
    );
    expect(result.mode).toBe("direct");
    expect(result.trackingStarted).toBe(true);
  });
});
