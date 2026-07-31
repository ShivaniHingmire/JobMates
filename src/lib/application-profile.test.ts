import { describe, expect, it } from "vitest";
import { EditableApplicationProfileSchema } from "@/lib/application-profile";

const completeProfile = {
  firstName: "Taylor",
  lastName: "Morgan",
  preferredName: "Taylor",
  phone: "+1 (212) 555-0134",
  addressLine1: "100 Main Street",
  addressLine2: "",
  city: "New York",
  region: "NY",
  postalCode: "10001",
  countryCode: "US",
  linkedinUrl: "https://www.linkedin.com/in/taylor-morgan",
  websiteUrl: "https://taylor.example",
  githubUrl: "https://github.com/taylor",
  currentTitle: "Software Engineer",
  currentCompany: "Acme",
  yearsExperience: "4",
  workAuthorized: true,
  requiresSponsorship: false,
  over18: true,
  willingToRelocate: false,
  willingToTravel: true,
  availableStartDate: "2026-08-17",
  noticePeriod: "Two weeks",
  salaryExpectation: "150000",
  salaryCurrency: "USD",
  referralSource: "Company careers page",
  whyInterested: "I enjoy building useful products.",
  proudAchievement: "Led a successful platform migration.",
  additionalInformation: "",
  employmentHistory: [
    {
      employer: "Acme",
      title: "Software Engineer",
      location: "New York, NY",
      startMonth: "2022-01",
      endMonth: "",
      current: true,
      summary: "Builds customer-facing products.",
    },
  ],
  educationHistory: [
    {
      school: "State University",
      degree: "BS",
      fieldOfStudy: "Computer Science",
      startYear: "2018",
      endYear: "2022",
    },
  ],
  demographicAnswers: {
    genderIdentity: "Prefer not to answer",
    transgenderIdentity: "Prefer not to answer",
    sexualOrientation: "Prefer not to answer",
    raceEthnicity: ["Prefer not to answer"],
    veteranStatus: "I do not wish to answer",
    disabilityStatus: "I do not wish to answer",
    firstGenerationProfessional: "Prefer not to answer",
    governmentGender: "I do not wish to answer",
    hispanicLatino: "I do not wish to answer",
  },
  protectedDataConsent: true,
  directApplyConsent: true,
};

describe("EditableApplicationProfileSchema", () => {
  it("accepts a complete autofill profile", () => {
    expect(EditableApplicationProfileSchema.parse(completeProfile)).toEqual(
      completeProfile,
    );
  });

  it("requires secure profile links", () => {
    const parsed = EditableApplicationProfileSchema.safeParse({
      ...completeProfile,
      linkedinUrl: "http://linkedin.com/in/taylor",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects letters in phone numbers", () => {
    const parsed = EditableApplicationProfileSchema.safeParse({
      ...completeProfile,
      phone: "call-me",
    });

    expect(parsed.success).toBe(false);
  });
});
