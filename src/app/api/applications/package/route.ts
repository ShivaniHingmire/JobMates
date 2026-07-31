import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getJobById } from "@/features/jobs/data";
import { ApplicationPackageSchema } from "@/lib/application-package";
import { getApplicationProfile } from "@/lib/application-profile.server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const RequestSchema = z.object({
  jobId: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });

  const parsed = RequestSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ ok: false, code: "VALIDATION" }, { status: 400 });

  const job = await getJobById(parsed.data.jobId);
  if (!job)
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  const applicant = await getApplicationProfile(user);
  let answerBank: Array<{
    questionKey: string;
    questionText: string;
    answer: string;
  }> = [];
  let resume: {
    downloadUrl: string;
    filename: string;
    mimeType:
      | "application/pdf"
      | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } | null = null;

  if (!user.isDemo) {
    const supabase = await createClient();
    const { data: storedAnswers } = await supabase!
      .from("application_question_answers")
      .select("question_key,question_text,answer")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(500);
    answerBank = (storedAnswers ?? []).map((answer) => ({
      questionKey: answer.question_key,
      questionText: answer.question_text,
      answer: answer.answer,
    }));

    const { data: storedResume } = await supabase!
      .from("resumes")
      .select("storage_path,original_filename,mime_type")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .single();
    if (storedResume) {
      const { data: signed } = await supabase!.storage
        .from("resumes")
        .createSignedUrl(storedResume.storage_path, 1800);
      if (signed)
        resume = {
          downloadUrl: signed.signedUrl,
          filename: storedResume.original_filename,
          mimeType: storedResume.mime_type,
        };
    }
  }

  const missingFields = [
    !applicant.phone && "phone",
    !applicant.addressLine1 && "address",
    !applicant.city && "city",
    !applicant.region && "state or region",
    !applicant.postalCode && "postal code",
    !applicant.currentTitle && "current or most recent job title",
    !applicant.yearsExperience && "years of experience",
    applicant.workAuthorized === null && "work authorization",
    applicant.requiresSponsorship === null && "sponsorship answer",
    applicant.over18 === null && "age eligibility",
    !applicant.directApplyConsent && "direct apply consent",
    !resume && "résumé file",
  ].filter((field): field is string => Boolean(field));

  const applicationPackage = ApplicationPackageSchema.parse({
    version: 1,
    packageId: randomUUID(),
    expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      applyUrl: job.applyUrl,
    },
    applicant,
    answerBank,
    resume,
    missingFields,
  });

  return NextResponse.json({ ok: true, data: applicationPackage });
}
