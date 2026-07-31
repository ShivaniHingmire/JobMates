import { NextResponse } from "next/server";
import { OutreachInputSchema } from "@/lib/ai/contracts";
import { getAiProvider } from "@/lib/ai";
import { consumeAiUsage } from "@/lib/ai/provider";
import { isAiRateLimited, recordAiRun } from "@/lib/ai/telemetry";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });

  const parsed = OutreachInputSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ ok: false, code: "VALIDATION" }, { status: 400 });

  if (!user.isDemo && (await isAiRateLimited(user.id, "outreach", 20)))
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", message: "Hourly draft limit reached." },
      { status: 429 },
    );

  const started = Date.now();
  try {
    const ai = getAiProvider();
    const draft = await ai.generateOutreach(parsed.data, {
      userId: user.id,
      feature: "outreach",
      promptVersion: "outreach-v2",
    });
    const words = draft.body.trim().split(/\s+/).length;
    if (
      (parsed.data.channel === "email" && (words < 120 || words > 180)) ||
      (parsed.data.channel === "linkedin_connection" && draft.body.length > 300) ||
      (parsed.data.channel === "linkedin_message" && draft.body.length > 600)
    )
      throw new Error("AI_CHANNEL_LIMIT");
    const usage = consumeAiUsage(ai);
    await recordAiRun({
      feature: "outreach",
      promptVersion: "outreach-v2",
      status: "succeeded",
      durationMs: Date.now() - started,
      userId: user.id,
      jobId: parsed.data.jobId,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    });
    if (!user.isDemo && parsed.data.jobId) {
      const supabase = await createClient();
      const { data: resume } = await supabase!
        .from("resumes")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .single();
      if (resume)
        await supabase!.from("message_drafts").insert({
          user_id: user.id,
          job_id: parsed.data.jobId,
          resume_id: resume.id,
          channel: parsed.data.channel,
          recipient: parsed.data.recipientName ?? null,
          tone: parsed.data.tone,
          subject: draft.subject,
          body: draft.body,
          source_facts: parsed.data.sourceFacts,
          model: process.env.AI_TEXT_MODEL ?? "gpt-5.6-terra",
          prompt_version: "outreach-v2",
        });
    }
    return NextResponse.json({ ok: true, data: draft });
  } catch {
    await recordAiRun({
      feature: "outreach",
      promptVersion: "outreach-v2",
      status: "failed",
      durationMs: Date.now() - started,
      userId: user.id,
      jobId: parsed.data.jobId,
      safeErrorCode: "OUTREACH_FAILED",
    });
    return NextResponse.json(
      { ok: false, code: "RETRYABLE", message: "Drafting is temporarily unavailable." },
      { status: 503 },
    );
  }
}
