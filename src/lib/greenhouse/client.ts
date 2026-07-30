import { createHash } from "node:crypto";
import sanitizeHtml from "sanitize-html";

export interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  content: string;
  location: { name: string };
  metadata?: Array<{ name: string; value: string | string[] | null }>;
}

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
  const response = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`,
    { signal, headers: { accept: "application/json" } },
  );
  if (!response.ok) throw new Error(`GREENHOUSE_${response.status}`);
  const payload = (await response.json()) as GreenhouseBoard;
  if (!payload.name || !Array.isArray(payload.jobs))
    throw new Error("GREENHOUSE_INVALID_PAYLOAD");
  return payload;
}

export function greenhousePlainText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
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
    source: "greenhouse",
    source_job_id: String(job.id),
    title: job.title.trim(),
    description_text: description,
    location_text: job.location?.name?.trim() || null,
    apply_url: job.absolute_url,
    posted_at: job.updated_at,
    raw_payload: job,
    content_hash: contentHash,
    is_active: true,
  };
}
