import { z } from "zod";

const optionalHttpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => value === "" || /^https:\/\/[^\s]+$/i.test(value),
    "Use a complete https:// URL.",
  );

const optionalMonth = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d{4}-(0[1-9]|1[0-2])$/.test(value),
    "Use a valid month.",
  );

const EmploymentEntrySchema = z
  .object({
    employer: z.string().trim().min(1).max(160),
    title: z.string().trim().min(1).max(160),
    location: z.string().trim().max(160),
    startMonth: optionalMonth,
    endMonth: optionalMonth,
    current: z.boolean(),
    summary: z.string().trim().max(3000),
  })
  .refine((entry) => entry.current || entry.endMonth !== "", {
    message: "Add an end month or mark the role as current.",
    path: ["endMonth"],
  });

const EducationEntrySchema = z.object({
  school: z.string().trim().min(1).max(200),
  degree: z.string().trim().min(1).max(160),
  fieldOfStudy: z.string().trim().max(160),
  startYear: z.string().trim().regex(/^$|^(19|20|21)\d{2}$/),
  endYear: z.string().trim().regex(/^$|^(19|20|21)\d{2}$/),
});

const DemographicAnswersSchema = z.object({
  genderIdentity: z.string().trim().max(160),
  transgenderIdentity: z.string().trim().max(160),
  sexualOrientation: z.string().trim().max(160),
  raceEthnicity: z.array(z.string().trim().min(1).max(160)).max(12),
  veteranStatus: z.string().trim().max(240),
  disabilityStatus: z.string().trim().max(240),
  firstGenerationProfessional: z.string().trim().max(160),
  governmentGender: z.string().trim().max(160),
  hispanicLatino: z.string().trim().max(160),
});

export const EditableApplicationProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  preferredName: z.string().trim().max(80),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine(
      (value) => value === "" || /^[+()\d.\-\s]+$/.test(value),
      "Enter a valid phone number.",
    ),
  addressLine1: z.string().trim().max(160),
  addressLine2: z.string().trim().max(160),
  city: z.string().trim().max(100),
  region: z.string().trim().max(100),
  postalCode: z.string().trim().max(24),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/),
  linkedinUrl: optionalHttpsUrl,
  websiteUrl: optionalHttpsUrl,
  githubUrl: optionalHttpsUrl,
  currentTitle: z.string().trim().max(160),
  currentCompany: z.string().trim().max(160),
  yearsExperience: z.string().trim().max(40),
  workAuthorized: z.boolean().nullable(),
  requiresSponsorship: z.boolean().nullable(),
  over18: z.boolean().nullable(),
  willingToRelocate: z.boolean().nullable(),
  willingToTravel: z.boolean().nullable(),
  availableStartDate: z.string().trim().regex(/^$|^\d{4}-\d{2}-\d{2}$/),
  noticePeriod: z.string().trim().max(120),
  salaryExpectation: z.string().trim().max(120),
  salaryCurrency: z.string().trim().regex(/^[A-Z]{3}$/),
  referralSource: z.string().trim().max(240),
  whyInterested: z.string().trim().max(3000),
  proudAchievement: z.string().trim().max(3000),
  additionalInformation: z.string().trim().max(3000),
  employmentHistory: z.array(EmploymentEntrySchema).max(12),
  educationHistory: z.array(EducationEntrySchema).max(8),
  demographicAnswers: DemographicAnswersSchema,
  protectedDataConsent: z.boolean(),
  directApplyConsent: z.boolean(),
});

export const ApplicationProfileSchema =
  EditableApplicationProfileSchema.extend({
    email: z.string().email(),
  });

export type EditableApplicationProfile = z.infer<
  typeof EditableApplicationProfileSchema
>;
export type ApplicationProfile = z.infer<typeof ApplicationProfileSchema>;
export type EmploymentEntry = z.infer<typeof EmploymentEntrySchema>;
export type EducationEntry = z.infer<typeof EducationEntrySchema>;

export const emptyEmploymentEntry: EmploymentEntry = {
  employer: "",
  title: "",
  location: "",
  startMonth: "",
  endMonth: "",
  current: false,
  summary: "",
};

export const emptyEducationEntry: EducationEntry = {
  school: "",
  degree: "",
  fieldOfStudy: "",
  startYear: "",
  endYear: "",
};

export const emptyDemographicAnswers: z.infer<
  typeof DemographicAnswersSchema
> = {
  genderIdentity: "",
  transgenderIdentity: "",
  sexualOrientation: "",
  raceEthnicity: [],
  veteranStatus: "",
  disabilityStatus: "",
  firstGenerationProfessional: "",
  governmentGender: "",
  hispanicLatino: "",
};

export const ApplicationQuestionSchema = z.object({
  questionKey: z.string().min(1).max(180),
  questionText: z.string().min(1).max(1000),
  fieldType: z.enum([
    "text",
    "textarea",
    "select",
    "multiselect",
    "radio",
    "checkbox",
  ]),
  options: z.array(z.string().min(1).max(500)).max(50),
  required: z.boolean(),
  sensitive: z.boolean().default(false),
});

export const SavedApplicationAnswerSchema = z.object({
  questionKey: z.string().min(1).max(180),
  questionText: z.string().min(1).max(1000),
  answer: z.string().min(1).max(8000),
});

export type ApplicationQuestion = z.infer<typeof ApplicationQuestionSchema>;
export type SavedApplicationAnswer = z.infer<
  typeof SavedApplicationAnswerSchema
>;
