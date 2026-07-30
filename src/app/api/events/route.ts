import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  jobId: z.string().min(1),
  eventType: z.literal("viewed"),
  idempotencyKey: z.string().min(12).max(200),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const parsed = Schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ ok: false, code: "VALIDATION" }, { status: 400 });
  if (user.isDemo) return NextResponse.json({ ok: true });
  const supabase = await createClient();
  const { error } = await supabase!.from("interaction_events").upsert(
    {
      user_id: user.id,
      job_id: parsed.data.jobId,
      event_type: parsed.data.eventType,
      idempotency_key: parsed.data.idempotencyKey,
      metadata: {},
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true },
  );
  if (error)
    return NextResponse.json({ ok: false, code: "RETRYABLE" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
