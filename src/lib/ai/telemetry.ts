import "server-only";

import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

interface AiRunInput {
  feature: string;
  promptVersion: string;
  status: "succeeded" | "failed" | "refused";
  durationMs: number;
  userId?: string;
  jobId?: string;
  resumeId?: string;
  inputTokens?: number;
  outputTokens?: number;
  safeErrorCode?: string;
}

export async function recordAiRun(input: AiRunInput) {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("ai_runs").insert({
    feature: input.feature,
    provider: env.AI_PROVIDER,
    model: env.AI_TEXT_MODEL,
    prompt_version: input.promptVersion,
    status: input.status,
    duration_ms: input.durationMs,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    safe_error_code: input.safeErrorCode ?? null,
    user_id: input.userId ?? null,
    job_id: input.jobId ?? null,
    resume_id: input.resumeId ?? null,
  });
}

export async function isAiRateLimited(
  userId: string,
  feature: string,
  maximum: number,
) {
  const admin = createAdminClient();
  if (!admin) return false;
  const since = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count } = await admin
    .from("ai_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", since);
  return (count ?? 0) >= maximum;
}
