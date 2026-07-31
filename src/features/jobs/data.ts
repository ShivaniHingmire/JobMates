import "server-only";

import { redirect } from "next/navigation";
import { getAiProvider, type JobProfile, type ResumeProfile } from "@/lib/ai";
import { consumeAiUsage } from "@/lib/ai/provider";
import { isAiRateLimited, recordAiRun } from "@/lib/ai/telemetry";
import { getCurrentUser } from "@/lib/auth";
import { demoAnalytics, demoApplications, demoJobs } from "@/lib/demo-data";
import type {
  AnalyticsSnapshot,
  ApplicationStatus,
  CandidateJob,
  EmploymentType,
  TrackedApplication,
  WorkplaceType,
} from "@/lib/domain";
import { calculateMatchScore } from "@/lib/matching/score";
import {
  categoryForCompany,
  CURATED_COMPANIES,
  JOB_CATEGORIES,
} from "@/lib/job-sources";
import { createClient } from "@/lib/supabase/server";

interface CompanyRelation {
  name: string;
  slug: string;
}

interface JobRow {
  id: string;
  company_id: string;
  title: string;
  description_text: string;
  location_text: string | null;
  workplace_type: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  apply_url: string;
  posted_at: string | null;
  is_active: boolean;
  analysis_status: "pending" | "processing" | "ready" | "failed";
  requirements: JobProfile | null;
  embedding: unknown;
  companies: CompanyRelation | CompanyRelation[] | null;
}

interface ResumeRow {
  id: string;
  parsed_profile: ResumeProfile;
  embedding: unknown;
}

interface PreferenceRow {
  target_titles: string[];
  target_skills: string[];
  locations: string[];
  workplace_types: string[];
  employment_types: string[];
  salary_floor: number | null;
  experience_level: string | null;
  excluded_companies: string[];
  excluded_keywords: string[];
}

function vector(value: unknown): number[] | undefined {
  if (Array.isArray(value) && value.every((item) => typeof item === "number"))
    return value as number[];
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === "number")
      )
        return parsed as number[];
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function companyName(row: JobRow) {
  if (Array.isArray(row.companies)) return row.companies[0]?.name ?? "Employer";
  return row.companies?.name ?? "Employer";
}

function companySlug(row: JobRow) {
  if (Array.isArray(row.companies)) return row.companies[0]?.slug ?? "";
  return row.companies?.slug ?? "";
}

function companyColor(id: string) {
  const palette = ["#214f3b", "#405f92", "#d34a31", "#7e4f8a", "#a96d16"];
  const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[sum % palette.length];
}

function asWorkplace(value: string | null): WorkplaceType {
  return ["remote", "hybrid", "onsite"].includes(value ?? "")
    ? (value as WorkplaceType)
    : "unknown";
}

function asEmployment(value: string | null): EmploymentType {
  return ["full-time", "part-time", "contract", "internship"].includes(value ?? "")
    ? (value as EmploymentType)
    : "unknown";
}

function matchFor(
  row: JobRow,
  resume: ResumeRow,
  preferences: PreferenceRow,
) {
  const profile = resume.parsed_profile;
  const job = row.requirements;
  const required =
    job?.skills
      .filter((skill) => skill.importance === "required")
      .map((skill) => skill.name) ?? [];
  const preferred =
    job?.skills
      .filter((skill) => skill.importance === "preferred")
      .map((skill) => skill.name) ?? [];
  const workplace = asWorkplace(row.workplace_type);
  const employment = asEmployment(row.employment_type);
  const salaryFit =
    preferences.salary_floor == null
      ? 0.5
      : row.salary_max == null
        ? 0.5
        : row.salary_max >= preferences.salary_floor
          ? 1
          : 0;
  return calculateMatchScore({
    candidateSkills: [
      ...profile.skills.map((skill) => skill.name),
      ...preferences.target_skills,
    ],
    requiredSkills: required,
    preferredSkills: preferred,
    candidateEmbedding: vector(resume.embedding),
    jobEmbedding: vector(row.embedding),
    candidateYears: profile.totalYearsExperience,
    requiredYears: job?.minimumYearsExperience ?? null,
    candidateSeniority: profile.seniority,
    jobSeniority: job?.seniority ?? null,
    locationFit:
      workplace === "unknown"
        ? 0.5
        : preferences.workplace_types.length === 0 ||
            preferences.workplace_types.includes(workplace)
          ? 1
          : 0,
    employmentTypeFit:
      employment === "unknown"
        ? 0.5
        : preferences.employment_types.length === 0 ||
            preferences.employment_types.includes(employment)
          ? 1
          : 0,
    compensationFit: salaryFit,
  });
}

function toCandidate(
  row: JobRow,
  match: ReturnType<typeof calculateMatchScore>,
): CandidateJob {
  const company = companyName(row);
  const profile = row.requirements;
  return {
    id: row.id,
    companyId: row.company_id,
    category: categoryForCompany(companySlug(row)),
    company,
    companyInitials: company
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase(),
    companyColor: companyColor(row.company_id),
    title: row.title,
    description: row.description_text,
    location: row.location_text ?? "Location not specified",
    workplaceType: asWorkplace(row.workplace_type),
    employmentType: asEmployment(row.employment_type),
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    currency: row.salary_currency ?? "USD",
    applyUrl: row.apply_url,
    postedAt: row.posted_at ?? new Date().toISOString(),
    isActive: row.is_active,
    requiredSkills:
      profile?.skills
        .filter((skill) => skill.importance === "required")
        .map((skill) => skill.name) ?? [],
    preferredSkills:
      profile?.skills
        .filter((skill) => skill.importance === "preferred")
        .map((skill) => skill.name) ?? [],
    responsibilities: profile?.responsibilities ?? [],
    benefits: [],
    score: match.score,
    components: match.components,
    matchedSkills: match.matchedSkills,
    missingSkills: [
      ...match.missingRequiredSkills,
      ...match.missingPreferredSkills,
    ],
    explanation:
      row.analysis_status !== "ready"
        ? "This is a newly synced live posting. Detailed skill analysis is still being prepared."
        : match.missingRequiredSkills.length > 0
        ? `Your strongest overlap is ${match.matchedSkills.slice(0, 3).join(", ") || "the role direction"}. The clearest required gap is ${match.missingRequiredSkills[0]}.`
        : `Your résumé shows evidence for the listed required skills, with especially relevant overlap in ${match.matchedSkills.slice(0, 3).join(", ") || "the role direction"}.`,
  };
}

async function realContext() {
  const user = await getCurrentUser();
  if (!user || user.isDemo) return null;
  const supabase = await createClient();
  const [{ data: resume }, { data: preferences }] = await Promise.all([
    supabase!
      .from("resumes")
      .select("id,parsed_profile,embedding")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .eq("parse_status", "ready")
      .single(),
    supabase!
      .from("job_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single(),
  ]);
  if (!resume || !preferences) redirect("/onboarding");
  return {
    user,
    supabase: supabase!,
    resume: resume as unknown as ResumeRow,
    preferences: preferences as unknown as PreferenceRow,
  };
}

async function rowsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase!
    .from("jobs")
    .select("*,companies(name,slug)")
    .in("id", ids);
  return (data ?? []) as unknown as JobRow[];
}

export async function getCandidateJobs() {
  const context = await realContext();
  if (!context) return demoJobs;
  const { user, supabase, resume, preferences } = context;
  const { data: decided } = await supabase
    .from("user_job_states")
    .select("job_id")
    .eq("user_id", user.id);
  const excludedIds = new Set(decided?.map((state) => state.job_id) ?? []);
  const categoryResults = await Promise.all(
    JOB_CATEGORIES.map((category) =>
      supabase
        .from("jobs")
        .select("*,companies!inner(name,slug)")
        .eq("is_active", true)
        .in("analysis_status", ["ready", "pending", "processing"])
        .in(
          "companies.slug",
          CURATED_COMPANIES.filter(
            (company) => company.category === category,
          ).map((company) => company.slug),
        )
        .order("posted_at", { ascending: false })
        .limit(500),
    ),
  );
  const rows = categoryResults.flatMap(
    ({ data }) => (data ?? []) as unknown as JobRow[],
  );
  const excludedCompanies = preferences.excluded_companies.map((value) =>
    value.toLowerCase(),
  );
  const excludedKeywords = preferences.excluded_keywords.map((value) =>
    value.toLowerCase(),
  );
  const eligible = rows.filter((row) => {
    if (excludedIds.has(row.id)) return false;
    const company = companyName(row).toLowerCase();
    const text = `${row.title} ${row.description_text}`.toLowerCase();
    if (excludedCompanies.some((value) => company.includes(value))) return false;
    if (excludedKeywords.some((value) => text.includes(value))) return false;
    const workplace = asWorkplace(row.workplace_type);
    if (
      workplace !== "unknown" &&
      preferences.workplace_types.length &&
      !preferences.workplace_types.includes(workplace)
    )
      return false;
    const employment = asEmployment(row.employment_type);
    if (
      employment !== "unknown" &&
      preferences.employment_types.length &&
      !preferences.employment_types.includes(employment)
    )
      return false;
    return true;
  });
  const candidates = eligible.map((row) => ({
    row,
    match: matchFor(row, resume, preferences),
  }));
  const ordered = candidates.sort(
    (a, b) =>
      b.match.score - a.match.score ||
      new Date(b.row.posted_at ?? 0).getTime() -
        new Date(a.row.posted_at ?? 0).getTime(),
  );
  const counts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const selected: typeof candidates = [];
  for (const item of ordered) {
    const count = counts.get(item.row.company_id) ?? 0;
    if (count >= 2) continue;
    const category = categoryForCompany(companySlug(item.row));
    const categoryCount = categoryCounts.get(category) ?? 0;
    if (categoryCount >= 20) continue;
    counts.set(item.row.company_id, count + 1);
    categoryCounts.set(category, categoryCount + 1);
    selected.push(item);
    if (selected.length === 60) break;
  }
  await Promise.all(
    selected.map(({ row, match }) =>
      supabase.from("match_analyses").upsert(
        {
          user_id: user.id,
          job_id: row.id,
          resume_id: resume.id,
          score: match.score,
          components: match.components,
          matched_skill_ids: [],
          missing_required_skill_ids: [],
          missing_preferred_skill_ids: [],
          evidence: {
            matchedSkills: match.matchedSkills,
            missingRequiredSkills: match.missingRequiredSkills,
            missingPreferredSkills: match.missingPreferredSkills,
          },
          scoring_version: match.scoringVersion,
        },
        { onConflict: "user_id,job_id,resume_id,scoring_version" },
      ),
    ),
  );
  return selected.map(({ row, match }) => toCandidate(row, match));
}

export async function getJobById(id: string) {
  const demo = demoJobs.find((job) => job.id === id);
  if (demo) return demo;
  const context = await realContext();
  if (!context) return null;
  const { data } = await context.supabase
    .from("jobs")
    .select("*,companies(name,slug)")
    .eq("id", id)
    .single();
  if (!data) return null;
  const row = data as unknown as JobRow;
  const match = matchFor(row, context.resume, context.preferences);
  const candidate = toCandidate(row, match);
  if (row.analysis_status !== "ready") return candidate;
  const { data: stored } = await context.supabase
    .from("match_analyses")
    .select("id,explanation")
    .eq("user_id", context.user.id)
    .eq("job_id", row.id)
    .eq("resume_id", context.resume.id)
    .eq("scoring_version", match.scoringVersion)
    .maybeSingle();
  const storedExplanation =
    stored?.explanation &&
    typeof stored.explanation === "object" &&
    "summary" in stored.explanation
      ? String(stored.explanation.summary)
      : null;
  if (storedExplanation) return { ...candidate, explanation: storedExplanation };

  await context.supabase.from("match_analyses").upsert(
    {
      user_id: context.user.id,
      job_id: row.id,
      resume_id: context.resume.id,
      score: match.score,
      components: match.components,
      matched_skill_ids: [],
      missing_required_skill_ids: [],
      missing_preferred_skill_ids: [],
      evidence: {
        matchedSkills: match.matchedSkills,
        missingRequiredSkills: match.missingRequiredSkills,
        missingPreferredSkills: match.missingPreferredSkills,
      },
      scoring_version: match.scoringVersion,
    },
    { onConflict: "user_id,job_id,resume_id,scoring_version" },
  );

  if (await isAiRateLimited(context.user.id, "match_explanation", 30))
    return candidate;
  const started = Date.now();
  try {
    const ai = getAiProvider();
    const explanation = await ai.explainMatch(
      {
        score: match.score,
        jobTitle: row.title,
        company: companyName(row),
        matchedSkills: match.matchedSkills,
        missingRequiredSkills: match.missingRequiredSkills,
        missingPreferredSkills: match.missingPreferredSkills,
        resumeEvidence: context.resume.parsed_profile.skills
          .filter((skill) => match.matchedSkills.includes(skill.name))
          .map((skill) => skill.evidence)
          .slice(0, 6),
      },
      {
        userId: context.user.id,
        feature: "match_explanation",
        promptVersion: "match-explanation-v1",
      },
    );
    await context.supabase
      .from("match_analyses")
      .update({
        explanation,
        model: process.env.AI_TEXT_MODEL ?? "gpt-5.6-terra",
        prompt_version: "match-explanation-v1",
      })
      .eq("user_id", context.user.id)
      .eq("job_id", row.id)
      .eq("resume_id", context.resume.id)
      .eq("scoring_version", match.scoringVersion);
    const usage = consumeAiUsage(ai);
    await recordAiRun({
      feature: "match_explanation",
      promptVersion: "match-explanation-v1",
      status: "succeeded",
      durationMs: Date.now() - started,
      userId: context.user.id,
      jobId: row.id,
      resumeId: context.resume.id,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    });
    return { ...candidate, explanation: explanation.summary };
  } catch {
    await recordAiRun({
      feature: "match_explanation",
      promptVersion: "match-explanation-v1",
      status: "failed",
      durationMs: Date.now() - started,
      userId: context.user.id,
      jobId: row.id,
      resumeId: context.resume.id,
      safeErrorCode: "MATCH_EXPLANATION_FAILED",
    });
    return candidate;
  }
}

export async function getSavedJobs() {
  const user = await getCurrentUser();
  if (!user || user.isDemo) return demoJobs.slice(0, 4);
  const supabase = await createClient();
  const { data: states } = await supabase!
    .from("user_job_states")
    .select("job_id")
    .eq("user_id", user.id)
    .in("disposition", ["saved", "interested"])
    .order("decided_at", { ascending: false });
  const rows = await rowsByIds(states?.map((state) => state.job_id) ?? []);
  const context = await realContext();
  if (!context) return [];
  return rows.map((row) =>
    toCandidate(row, matchFor(row, context.resume, context.preferences)),
  );
}

export async function getTrackedApplications(): Promise<TrackedApplication[]> {
  const user = await getCurrentUser();
  if (!user || user.isDemo) return demoApplications;
  const supabase = await createClient();
  const { data: applications } = await supabase!
    .from("applications")
    .select("id,job_id,status,applied_at,next_action_at,notes")
    .eq("user_id", user.id)
    .order("last_status_at", { ascending: false });
  const rows = await rowsByIds(applications?.map((item) => item.job_id) ?? []);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const context = await realContext();
  if (!context) return [];
  return (applications ?? []).flatMap((application) => {
    const row = byId.get(application.job_id);
    if (!row) return [];
    return [
      {
        id: application.id,
        job: toCandidate(
          row,
          matchFor(row, context.resume, context.preferences),
        ),
        status: application.status as ApplicationStatus,
        appliedAt: application.applied_at,
        nextActionAt: application.next_action_at,
        notes: application.notes,
      },
    ];
  });
}

export async function getAnalytics(): Promise<AnalyticsSnapshot> {
  const user = await getCurrentUser();
  if (!user || user.isDemo) return demoAnalytics;
  const supabase = await createClient();
  const { data } = await supabase!.rpc("get_user_analytics");
  const aggregate =
    data && typeof data === "object"
      ? (data as {
          viewed?: number;
          interested?: number;
          rejected?: number;
          saved?: number;
          weekly_activity?: { label: string; value: number }[];
          status_counts?: { status: ApplicationStatus; count: number }[];
          missing_skills?: { skill: string; count: number }[];
          score_outcomes?: { label: string; value: number }[];
          upcoming_followups?: number;
        })
      : {};
  const applications = await getTrackedApplications();
  const statuses = [
    "planned",
    "applied",
    "screening",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
    "archived",
  ] as ApplicationStatus[];
  return {
    viewed: aggregate.viewed ?? 0,
    interested: aggregate.interested ?? 0,
    saved: aggregate.saved ?? 0,
    applied: applications.filter((item) => item.status !== "planned").length,
    interviews: applications.filter((item) => item.status === "interview").length,
    swipeRate:
      (aggregate.interested ?? 0) + (aggregate.rejected ?? 0) === 0
        ? 0
        : Math.round(
            ((aggregate.interested ?? 0) /
              ((aggregate.interested ?? 0) + (aggregate.rejected ?? 0))) *
              100,
          ),
    weeklyActivity:
      aggregate.weekly_activity ??
      demoAnalytics.weeklyActivity.map((item) => ({ ...item, value: 0 })),
    statusCounts:
      aggregate.status_counts ??
      statuses.map((status) => ({
        status,
        count: applications.filter((item) => item.status === status).length,
      })),
    missingSkills: aggregate.missing_skills ?? [],
    scoreOutcomes: aggregate.score_outcomes ?? [],
    upcomingFollowups: aggregate.upcoming_followups ?? 0,
  };
}
