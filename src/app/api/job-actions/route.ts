import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const ActionSchema = z.object({
  jobId: z.string().min(1),
  action: z.enum(["interested", "rejected", "saved"]),
  idempotencyKey: z.string().min(8),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });

  const parsed = ActionSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ ok: false, code: "VALIDATION" }, { status: 400 });

  if (user.isDemo) return NextResponse.json({ ok: true, data: parsed.data });

  const supabase = await createClient();
  const { error } = await supabase!.rpc("record_job_action", {
    target_job_id: parsed.data.jobId,
    target_action: parsed.data.action,
    action_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error)
    return NextResponse.json({ ok: false, code: "RETRYABLE" }, { status: 503 });
  return NextResponse.json({ ok: true, data: parsed.data });
}
