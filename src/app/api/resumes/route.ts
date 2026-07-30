import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { consumeAiUsage } from "@/lib/ai/provider";
import { isAiRateLimited, recordAiRun } from "@/lib/ai/telemetry";
import { getCurrentUser } from "@/lib/auth";
import {
  extractResumeText,
  ResumeFileError,
  validateResumeBytes,
} from "@/lib/documents/resume";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSkill } from "@/lib/matching/score";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("resume");
  if (!(file instanceof File))
    return NextResponse.json(
      { ok: false, code: "VALIDATION", message: "Choose a PDF or DOCX résumé." },
      { status: 400 },
    );

  let aiStarted: number | null = null;
  try {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const expectedExtension = file.type === "application/pdf" ? "pdf" : "docx";
    if (extension !== expectedExtension)
      throw new ResumeFileError(
        "UNSUPPORTED_TYPE",
        "The filename extension and declared file type must both be PDF or DOCX.",
      );
    if (!user.isDemo && (await isAiRateLimited(user.id, "resume_parse", 6)))
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED", message: "Hourly résumé limit reached." },
        { status: 429 },
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    validateResumeBytes(bytes, file.type);
    const text = await extractResumeText(bytes, file.type);
    const ai = getAiProvider();
    const context = {
      userId: user.id,
      feature: "resume_parse",
      promptVersion: "resume-extract-v1",
    };
    aiStarted = Date.now();
    const profile = await ai.parseResume(text, context);
    const [embedding] = await ai.embed([
      `${profile.headline}\n${profile.summary}\n${profile.skills
        .map((skill) => skill.name)
        .join(", ")}`,
    ]);

    if (!user.isDemo) {
      const resumeId = randomUUID();
      const extension = expectedExtension;
      const path = `${user.id}/${resumeId}/original.${extension}`;
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const supabase = await createClient();

      const { data: priorResumes } = await supabase!
        .from("resumes")
        .select("id,storage_path")
        .eq("user_id", user.id)
        .eq("is_primary", true);
      await supabase!
        .from("resumes")
        .update({ is_primary: false })
        .eq("user_id", user.id)
        .eq("is_primary", true);

      const { error: uploadError } = await supabase!.storage
        .from("resumes")
        .upload(path, bytes, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error("STORAGE_UPLOAD_FAILED");

      const { error: rowError } = await supabase!.from("resumes").insert({
        id: resumeId,
        user_id: user.id,
        storage_path: path,
        original_filename: file.name.slice(0, 255),
        mime_type: file.type,
        byte_size: bytes.byteLength,
        sha256,
        parse_status: "ready",
        extracted_text: text,
        parsed_profile: profile,
        embedding,
        model: process.env.AI_TEXT_MODEL ?? "gpt-5.6-terra",
        prompt_version: "resume-extract-v1",
        is_primary: true,
      });
      if (rowError) {
        await supabase!.storage.from("resumes").remove([path]);
        if (priorResumes?.[0])
          await supabase!
            .from("resumes")
            .update({ is_primary: true })
            .eq("id", priorResumes[0].id);
        throw new Error("RESUME_ROW_FAILED");
      }
      const admin = createAdminClient();
      if (admin) {
        for (const skill of profile.skills) {
          const canonical = normalizeSkill(skill.name);
          const { data: storedSkill } = await admin
            .from("skills")
            .upsert(
              { slug: slugify(canonical), label: canonical },
              { onConflict: "slug" },
            )
            .select("id")
            .single();
          if (storedSkill)
            await admin.from("resume_skills").upsert({
              resume_id: resumeId,
              skill_id: storedSkill.id,
              years: skill.years,
              confidence: skill.confidence,
              evidence: skill.evidence,
            });
        }
      }
      if (priorResumes?.length) {
        await supabase!.storage
          .from("resumes")
          .remove(priorResumes.map((resume) => resume.storage_path));
        await supabase!
          .from("resumes")
          .delete()
          .in(
            "id",
            priorResumes.map((resume) => resume.id),
          );
      }
    }

    const usage = consumeAiUsage(ai);
    await recordAiRun({
      feature: "resume_parse",
      promptVersion: "resume-extract-v1",
      status: "succeeded",
      durationMs: Date.now() - aiStarted,
      userId: user.id,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    });
    return NextResponse.json({
      ok: true,
      data: { skillCount: profile.skills.length, headline: profile.headline },
    });
  } catch (error) {
    if (aiStarted !== null)
      await recordAiRun({
        feature: "resume_parse",
        promptVersion: "resume-extract-v1",
        status: "failed",
        durationMs: Date.now() - aiStarted,
        userId: user.id,
        safeErrorCode:
          error instanceof ResumeFileError ? error.code : "RESUME_PARSE_FAILED",
      });
    const message =
      error instanceof ResumeFileError
        ? error.message
        : "Résumé processing is temporarily unavailable. Please try again.";
    return NextResponse.json(
      { ok: false, code: "RETRYABLE", message },
      { status: error instanceof ResumeFileError ? 400 : 503 },
    );
  }
}
