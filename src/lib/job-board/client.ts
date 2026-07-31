import { createHash } from "node:crypto";
import { z } from "zod";
import {
  fetchGreenhouseBoard,
  greenhousePlainText,
  normalizeGreenhouseJob,
} from "@/lib/greenhouse/client";
import { parseBoardKey, type AtsProvider } from "@/lib/job-sources";

const AshbyJobSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    location: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    team: z.string().nullable().optional(),
    isRemote: z.boolean().nullable().optional(),
    workplaceType: z.string().nullable().optional(),
    employmentType: z.string().nullable().optional(),
    jobUrl: z.string().url().nullable().optional(),
    applyUrl: z.string().url().nullable().optional(),
    publishedAt: z.string().nullable().optional(),
    descriptionHtml: z.string().nullable().optional(),
    descriptionPlain: z.string().nullable().optional(),
    compensation: z
      .object({
        summaryComponents: z
          .array(
            z
              .object({
                compensationType: z.string(),
                interval: z.string().nullable().optional(),
                currencyCode: z.string().nullable().optional(),
                minValue: z.number().nullable().optional(),
                maxValue: z.number().nullable().optional(),
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const AshbyResponseSchema = z.object({
  jobs: z.array(AshbyJobSchema),
});

const LeverJobSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    hostedUrl: z.string().url(),
    applyUrl: z.string().url(),
    descriptionPlain: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    createdAt: z.number().nullable().optional(),
    categories: z
      .object({
        location: z.string().nullable().optional(),
        commitment: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
    salaryRange: z
      .object({
        min: z.number().nullable().optional(),
        max: z.number().nullable().optional(),
        currency: z.string().nullable().optional(),
        interval: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const LeverResponseSchema = z.array(LeverJobSchema);
type AshbyJob = z.infer<typeof AshbyJobSchema>;
type LeverJob = z.infer<typeof LeverJobSchema>;

export interface NormalizedPublicJob {
  source: AtsProvider;
  source_job_id: string;
  title: string;
  description_text: string;
  location_text: string | null;
  workplace_type?: string | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  apply_url: string;
  posted_at: string | null;
  raw_payload: Record<string, unknown>;
  content_hash: string;
  is_active: true;
}

export interface PublicJobBoard {
  name: string;
  source: AtsProvider;
  jobs: NormalizedPublicJob[];
}

function hashJob(job: {
  title: string;
  description: string;
  location: string;
  applyUrl: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
}) {
  return createHash("sha256").update(JSON.stringify(job)).digest("hex");
}

function normalizedEmploymentType(value: string | null | undefined) {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("full")) return "full-time";
  if (normalized.includes("part")) return "part-time";
  if (normalized.includes("contract") || normalized.includes("temporary"))
    return "contract";
  if (normalized.includes("intern")) return "internship";
  return null;
}

function normalizedWorkplaceType(
  location: string,
  value?: string | null,
  isRemote?: boolean | null,
) {
  const normalized = `${value ?? ""} ${location}`.toLowerCase();
  if (isRemote || normalized.includes("remote")) return "remote";
  if (normalized.includes("hybrid")) return "hybrid";
  if (value || location) return "onsite";
  return null;
}

function ashbySalary(job: AshbyJob) {
  const salary = job.compensation?.summaryComponents?.find(
    (component) =>
      component.compensationType.toLowerCase() === "salary" &&
      (!component.interval ||
        /year|annual/i.test(component.interval)),
  );
  return {
    salaryMin: salary?.minValue ?? null,
    salaryMax: salary?.maxValue ?? null,
    currency: salary?.currencyCode ?? null,
  };
}

export function normalizeAshbyJob(job: AshbyJob): NormalizedPublicJob {
  const description =
    job.descriptionPlain?.trim() ||
    greenhousePlainText(job.descriptionHtml ?? "");
  const location = job.location?.trim() ?? "";
  const salary = ashbySalary(job);
  const applyUrl = job.applyUrl ?? job.jobUrl ?? "";
  return {
    source: "ashby",
    source_job_id: job.id,
    title: job.title.trim(),
    description_text: description,
    location_text: location || null,
    workplace_type: normalizedWorkplaceType(
      location,
      job.workplaceType,
      job.isRemote,
    ),
    employment_type: normalizedEmploymentType(job.employmentType),
    salary_min: salary.salaryMin,
    salary_max: salary.salaryMax,
    salary_currency: salary.currency,
    apply_url: applyUrl,
    posted_at: job.publishedAt ?? null,
    raw_payload: {
      id: job.id,
      title: job.title,
      department: job.department ?? null,
      team: job.team ?? null,
      location: job.location ?? null,
      jobUrl: job.jobUrl ?? null,
      applyUrl: job.applyUrl ?? null,
      publishedAt: job.publishedAt ?? null,
      compensation: job.compensation ?? null,
    },
    content_hash: hashJob({
      title: job.title,
      description,
      location,
      applyUrl,
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
    }),
    is_active: true,
  };
}

export function normalizeLeverJob(job: LeverJob): NormalizedPublicJob {
  const description =
    job.descriptionPlain?.trim() ||
    greenhousePlainText(job.description ?? "");
  const location = job.categories?.location?.trim() ?? "";
  const salaryMin = job.salaryRange?.min ?? null;
  const salaryMax = job.salaryRange?.max ?? null;
  return {
    source: "lever",
    source_job_id: job.id,
    title: job.text.trim(),
    description_text: description,
    location_text: location || null,
    workplace_type: normalizedWorkplaceType(location),
    employment_type: normalizedEmploymentType(job.categories?.commitment),
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: job.salaryRange?.currency ?? null,
    apply_url: job.applyUrl || job.hostedUrl,
    posted_at: job.createdAt
      ? new Date(job.createdAt).toISOString()
      : null,
    raw_payload: {
      id: job.id,
      title: job.text,
      hostedUrl: job.hostedUrl,
      applyUrl: job.applyUrl,
      createdAt: job.createdAt ?? null,
      categories: job.categories ?? null,
      salaryRange: job.salaryRange ?? null,
    },
    content_hash: hashJob({
      title: job.text,
      description,
      location,
      applyUrl: job.applyUrl || job.hostedUrl,
      salaryMin,
      salaryMax,
    }),
    is_active: true,
  };
}

async function fetchAshbyBoard(
  token: string,
  companyName: string,
  signal?: AbortSignal,
): Promise<PublicJobBoard> {
  const requestSignal = signal ?? AbortSignal.timeout(20_000);
  const response = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}?includeCompensation=true`,
    { signal: requestSignal, headers: { accept: "application/json" } },
  );
  if (!response.ok) throw new Error(`ASHBY_BOARD_${response.status}`);
  const parsed = AshbyResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("ASHBY_INVALID_PAYLOAD");
  return {
    name: companyName,
    source: "ashby",
    jobs: parsed.data.jobs.map(normalizeAshbyJob),
  };
}

async function fetchLeverBoard(
  token: string,
  companyName: string,
  signal?: AbortSignal,
): Promise<PublicJobBoard> {
  const requestSignal = signal ?? AbortSignal.timeout(20_000);
  const response = await fetch(
    `https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json`,
    { signal: requestSignal, headers: { accept: "application/json" } },
  );
  if (!response.ok) throw new Error(`LEVER_BOARD_${response.status}`);
  const parsed = LeverResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("LEVER_INVALID_PAYLOAD");
  return {
    name: companyName,
    source: "lever",
    jobs: parsed.data.map(normalizeLeverJob),
  };
}

export async function fetchPublicJobBoard(
  value: string,
  companyName: string,
  signal?: AbortSignal,
): Promise<PublicJobBoard> {
  const { provider, token } = parseBoardKey(value);
  if (provider === "ashby")
    return fetchAshbyBoard(token, companyName, signal);
  if (provider === "lever")
    return fetchLeverBoard(token, companyName, signal);

  const board = await fetchGreenhouseBoard(token, signal);
  return {
    name: board.name,
    source: "greenhouse",
    jobs: board.jobs.map(normalizeGreenhouseJob),
  };
}
