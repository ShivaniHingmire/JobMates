import { z } from "zod";

export const EvidenceSkillSchema = z.object({
  name: z.string().min(1),
  years: z.number().nonnegative().nullable(),
  confidence: z.number().min(0).max(1),
  evidence: z.string().min(1),
});

export const ResumeRoleSchema = z.object({
  title: z.string().min(1),
  employer: z.string().min(1),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  achievements: z.array(z.string()),
});

export const ResumeProfileSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  totalYearsExperience: z.number().nonnegative().nullable(),
  seniority: z.string().nullable(),
  roles: z.array(ResumeRoleSchema),
  skills: z.array(EvidenceSkillSchema),
  education: z.array(z.string()),
  certifications: z.array(z.string()),
  projects: z.array(z.string()),
});

export const JobSkillSchema = z.object({
  name: z.string().min(1),
  importance: z.enum(["required", "preferred", "mentioned"]),
  confidence: z.number().min(0).max(1),
  evidence: z.string().min(1),
});

export const JobProfileSchema = z.object({
  summary: z.string().min(1),
  seniority: z.string().nullable(),
  minimumYearsExperience: z.number().nonnegative().nullable(),
  skills: z.array(JobSkillSchema),
  responsibilities: z.array(z.string()),
  education: z.array(z.string()),
  workplaceType: z.enum(["remote", "hybrid", "onsite", "unknown"]),
  employmentType: z.enum([
    "full-time",
    "part-time",
    "contract",
    "internship",
    "unknown",
  ]),
});

export const MatchEvidenceSchema = z.object({
  score: z.number().int().min(0).max(100),
  jobTitle: z.string(),
  company: z.string(),
  matchedSkills: z.array(z.string()),
  missingRequiredSkills: z.array(z.string()),
  missingPreferredSkills: z.array(z.string()),
  resumeEvidence: z.array(z.string()),
});

export const MatchExplanationSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string()).max(4),
  gaps: z.array(z.string()).max(4),
  suggestedResumeFocus: z.array(z.string()).max(3),
});

export const OutreachInputSchema = z.object({
  jobId: z.string().min(1).optional(),
  channel: z.enum([
    "email",
    "linkedin_connection",
    "linkedin_message",
  ]),
  recipientName: z.string().max(80).optional(),
  tone: z.enum(["warm", "direct", "curious"]).default("warm"),
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  sourceFacts: z.array(z.string().min(1)).min(1).max(8),
  matchedSkills: z.array(z.string()).max(8),
});

export const OutreachDraftSchema = z.object({
  subject: z.string().max(80).nullable(),
  body: z.string().min(1).max(1500),
  usedFacts: z.array(z.string()),
});

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;
export type JobProfile = z.infer<typeof JobProfileSchema>;
export type MatchEvidence = z.infer<typeof MatchEvidenceSchema>;
export type MatchExplanation = z.infer<typeof MatchExplanationSchema>;
export type OutreachInput = z.infer<typeof OutreachInputSchema>;
export type OutreachDraft = z.infer<typeof OutreachDraftSchema>;

export interface AiRequestContext {
  userId?: string;
  feature: string;
  promptVersion: string;
}
