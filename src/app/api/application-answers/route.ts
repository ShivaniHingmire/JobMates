import { NextResponse } from "next/server";
import { z } from "zod";
import { SavedApplicationAnswerSchema } from "@/lib/application-profile";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const RequestSchema = z.object({
  packageId: z.string().uuid(),
  answers: z.array(SavedApplicationAnswerSchema).min(1).max(30),
});

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });

  const parsed = RequestSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION",
        message: parsed.error.issues[0]?.message ?? "Check your answers.",
      },
      { status: 400 },
    );
  if (user.isDemo) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { error } = await supabase!.from("application_question_answers").upsert(
    parsed.data.answers.map((answer) => ({
      user_id: user.id,
      question_key: answer.questionKey,
      question_text: answer.questionText,
      answer: answer.answer,
    })),
    { onConflict: "user_id,question_key" },
  );
  if (error)
    return NextResponse.json(
      {
        ok: false,
        code: "RETRYABLE",
        message:
          "Could not save the answer bank. Apply the latest Supabase migration and try again.",
      },
      { status: 503 },
    );

  return NextResponse.json({ ok: true });
}
