import { createHash } from "node:crypto";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const GreenhouseJobSchema = z
  .object({
    id: z.number().int(),
    title: z.string(),
    absolute_url: z.string().url(),
    updated_at: z.string(),
    content: z.string(),
    location: z.object({ name: z.string().default("") }),
    metadata: z.array(z.unknown()).nullable().optional(),
  })
  .passthrough();

const GreenhouseJobsResponseSchema = z.object({
  jobs: z.array(GreenhouseJobSchema),
});

const GreenhouseBoardResponseSchema = z.object({
  name: z.string().trim().min(1),
});

export type GreenhouseJob = z.infer<typeof GreenhouseJobSchema>;

interface GreenhouseBoard {
  name: string;
  jobs: GreenhouseJob[];
}

const TOKEN_PATTERN = /^[a-z0-9_-]{2,80}$/i;

export function validateBoardToken(token: string) {
  if (!TOKEN_PATTERN.test(token)) throw new Error("INVALID_BOARD_TOKEN");
  return token;
}

export async function fetchGreenhouseBoard(
  token: string,
  signal?: AbortSignal,
): Promise<GreenhouseBoard> {
  validateBoardToken(token);
  const baseUrl = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}`;
  const request = {
    signal: signal ?? AbortSignal.timeout(20_000),
    headers: { accept: "application/json" },
  };
  const [boardResponse, jobsResponse] = await Promise.all([
    fetch(baseUrl, request),
    fetch(`${baseUrl}/jobs?content=true`, request),
  ]);
  if (!boardResponse.ok)
    throw new Error(`GREENHOUSE_BOARD_${boardResponse.status}`);
  if (!jobsResponse.ok)
    throw new Error(`GREENHOUSE_JOBS_${jobsResponse.status}`);

  const board = GreenhouseBoardResponseSchema.safeParse(
    await boardResponse.json(),
  );
  const jobs = GreenhouseJobsResponseSchema.safeParse(await jobsResponse.json());
  if (!board.success || !jobs.success)
    throw new Error("GREENHOUSE_INVALID_PAYLOAD");
  return { name: board.data.name, jobs: jobs.data.jobs };
}

export function greenhousePlainText(html: string) {
  const decodedMarkup = html
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&apos;/gi, "'");
  const withStructure = decodedMarkup
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|section|article)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "\n");
  return sanitizeHtml(withStructure, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/gi, " ")
    .replace(/\r/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeGreenhouseJob(job: GreenhouseJob) {
  const description = greenhousePlainText(job.content);
  const contentHash = createHash("sha256")
    .update(
      JSON.stringify({
        title: job.title,
        description,
        location: job.location?.name ?? "",
        applyUrl: job.absolute_url,
      }),
    )
    .digest("hex");
  return {
    source: "greenhouse" as const,
    source_job_id: String(job.id),
    title: job.title.trim(),
    description_text: description,
    location_text: job.location?.name?.trim() || null,
    apply_url: job.absolute_url,
    posted_at: job.updated_at,
    raw_payload: {
      id: job.id,
      title: job.title,
      absolute_url: job.absolute_url,
      updated_at: job.updated_at,
      location: job.location,
      metadata: job.metadata ?? null,
    },
    content_hash: contentHash,
    is_active: true as const,
  };
}
