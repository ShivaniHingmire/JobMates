import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { consumeAiUsage } from "@/lib/ai/provider";
import { recordAiRun } from "@/lib/ai/telemetry";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSkill } from "@/lib/matching/score";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET)
    return new NextResponse(null, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return new NextResponse(null, { status: 503 });
  const { data: jobs, error } = await admin.rpc("claim_jobs_for_analysis", {
    batch_size: 5,
  });
  if (error) return new NextResponse(null, { status: 503 });

  const ai = getAiProvider();
  const parsed = [];
  for (const job of jobs ?? []) {
    const started = Date.now();
    try {
      const profile = await ai.parseJob(
        `${job.title}\n${job.location_text ?? ""}\n${job.description_text}`,
        {
          feature: "job_parse",
          promptVersion: "job-extract-v1",
        },
      );
      parsed.push({ job, profile });
      const usage = consumeAiUsage(ai);
      await recordAiRun({
        feature: "job_parse",
        promptVersion: "job-extract-v1",
        status: "succeeded",
        durationMs: Date.now() - started,
        jobId: job.id,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      });
    } catch {
      const attempts = Number(job.analysis_attempts ?? 1);
      const permanent = attempts >= 4;
      await admin
        .from("jobs")
        .update({
          analysis_status: permanent ? "failed" : "pending",
          safe_error_code: "AI_JOB_PARSE_FAILED",
          next_retry_at: permanent
            ? null
            : new Date(Date.now() + Math.min(60, 2 ** attempts) * 60_000).toISOString(),
        })
        .eq("id", job.id);
      await recordAiRun({
        feature: "job_parse",
        promptVersion: "job-extract-v1",
        status: "failed",
        durationMs: Date.now() - started,
        jobId: job.id,
        safeErrorCode: "AI_JOB_PARSE_FAILED",
      });
    }
  }

  let embeddings: number[][];
  const embeddingStarted = Date.now();
  try {
    embeddings = await ai.embed(
      parsed.map(
        ({ job, profile }) =>
          `${job.title}\n${profile.summary}\n${profile.skills
            .map((skill) => `${skill.importance}:${skill.name}`)
            .join(",")}`,
      ),
    );
    const usage = consumeAiUsage(ai);
    await recordAiRun({
      feature: "job_embedding",
      promptVersion: "job-embedding-v1",
      status: "succeeded",
      durationMs: Date.now() - embeddingStarted,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    });
  } catch {
    await recordAiRun({
      feature: "job_embedding",
      promptVersion: "job-embedding-v1",
      status: "failed",
      durationMs: Date.now() - embeddingStarted,
      safeErrorCode: "AI_EMBEDDING_FAILED",
    });
    await Promise.all(
      parsed.map(({ job }) =>
        admin
          .from("jobs")
          .update({
            analysis_status: "pending",
            safe_error_code: "AI_EMBEDDING_FAILED",
            next_retry_at: new Date(Date.now() + 10 * 60_000).toISOString(),
          })
          .eq("id", job.id),
      ),
    );
    return NextResponse.json(
      { ok: false, code: "RETRYABLE", analyzed: 0 },
      { status: 503 },
    );
  }
  for (let index = 0; index < parsed.length; index += 1) {
    const { job, profile } = parsed[index];
    const { error: updateError } = await admin
      .from("jobs")
      .update({
        requirements: profile,
        workplace_type: profile.workplaceType,
        employment_type: profile.employmentType,
        embedding: embeddings[index],
        analysis_status: "ready",
        model: env.AI_TEXT_MODEL,
        prompt_version: "job-extract-v1",
        safe_error_code: null,
      })
      .eq("id", job.id);
    if (updateError) {
      await admin
        .from("jobs")
        .update({
          analysis_status: "pending",
          safe_error_code: "JOB_ANALYSIS_WRITE_FAILED",
          next_retry_at: new Date(Date.now() + 10 * 60_000).toISOString(),
        })
        .eq("id", job.id);
      continue;
    }

    await admin.from("job_skills").delete().eq("job_id", job.id);
    for (const skill of profile.skills) {
      const canonical = normalizeSkill(skill.name);
      const slug = slugify(canonical);
      const { data: storedSkill } = await admin
        .from("skills")
        .upsert({ slug, label: canonical }, { onConflict: "slug" })
        .select("id")
        .single();
      if (storedSkill)
        await admin.from("job_skills").upsert({
          job_id: job.id,
          skill_id: storedSkill.id,
          importance: skill.importance,
          confidence: skill.confidence,
          evidence: skill.evidence,
        });
    }
  }
  return NextResponse.json({ ok: true, analyzed: parsed.length });
}
