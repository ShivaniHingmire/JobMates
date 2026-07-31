import type { JobCategory } from "@/lib/job-sources";

export const WORKPLACE_TYPES = ["remote", "hybrid", "onsite", "unknown"] as const;
export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "unknown",
] as const;
export const APPLICATION_STATUSES = [
  "planned",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "archived",
] as const;

export type WorkplaceType = (typeof WORKPLACE_TYPES)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type JobDisposition = "interested" | "rejected" | "saved";

export interface MatchComponents {
  requiredSkills: number;
  preferredSkills: number;
  roleSemantics: number;
  experience: number;
  location: number;
  employmentType: number;
  compensation: number;
}

export interface Job {
  id: string;
  companyId: string;
  category: JobCategory;
  company: string;
  companyInitials: string;
  companyColor: string;
  title: string;
  description: string;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  applyUrl: string;
  postedAt: string;
  isActive: boolean;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  benefits: string[];
}

export interface CandidateJob extends Job {
  score: number;
  components: MatchComponents;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
}

export interface TrackedApplication {
  id: string;
  job: CandidateJob;
  status: ApplicationStatus;
  appliedAt: string | null;
  nextActionAt: string | null;
  notes: string;
}

export interface AnalyticsSnapshot {
  viewed: number;
  interested: number;
  saved: number;
  applied: number;
  interviews: number;
  swipeRate: number;
  weeklyActivity: { label: string; value: number }[];
  statusCounts: { status: ApplicationStatus; count: number }[];
  missingSkills: { skill: string; count: number }[];
  scoreOutcomes: { label: string; value: number }[];
  upcomingFollowups: number;
}

export type ActionCode =
  | "UNAUTHORIZED"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "RETRYABLE"
  | "NOT_FOUND"
  | "CONFLICT";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ActionCode; message: string };
