import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  jobId: z.string().min(1),
  action: z.enum(["apply_started", "applied", "planned", "none"]),
  sourceUrl: z.string().url(),
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

  if (parsed.data.action === "apply_started") {
    await supabase!.from("interaction_events").insert({
      user_id: user.id,
      job_id: parsed.data.jobId,
      event_type: "apply_started",
      idempotency_key: crypto.randomUUID(),
      metadata: {},
    });
    return NextResponse.json({ ok: true });
  }
  if (parsed.data.action === "none") return NextResponse.json({ ok: true });

  const status = parsed.data.action;
  const { data: previous } = await supabase!
    .from("applications")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("job_id", parsed.data.jobId)
    .maybeSingle();
  const now = new Date().toISOString();
  const { data: application, error } = await supabase!
    .from("applications")
    .upsert(
      {
        user_id: user.id,
        job_id: parsed.data.jobId,
        status,
        applied_at: status === "applied" ? now : null,
        source_url: parsed.data.sourceUrl,
        last_status_at: now,
      },
      { onConflict: "user_id,job_id" },
    )
    .select("id")
    .single();
  if (error)
    return NextResponse.json({ ok: false, code: "RETRYABLE" }, { status: 503 });
  await supabase!.from("application_status_events").insert({
    application_id: application.id,
    user_id: user.id,
    from_status: previous?.status ?? null,
    to_status: status,
  });
  return NextResponse.json({ ok: true });
}

const UpdateSchema = z.object({
  applicationId: z.string().min(1),
  status: z
    .enum([
      "planned",
      "applied",
      "screening",
      "interview",
      "offer",
      "rejected",
      "withdrawn",
      "archived",
    ])
    .optional(),
  notes: z.string().max(4000).optional(),
  nextActionAt: z.string().datetime().nullable().optional(),
}).refine(
  (value) =>
    value.status !== undefined ||
    value.notes !== undefined ||
    value.nextActionAt !== undefined,
  "At least one update is required.",
);

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const parsed = UpdateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ ok: false, code: "VALIDATION" }, { status: 400 });
  if (user.isDemo) return NextResponse.json({ ok: true });
  const supabase = await createClient();
  const { data: previous } = await supabase!
    .from("applications")
    .select("status")
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id)
    .single();
  if (!previous)
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  const now = new Date().toISOString();
  const updates = {
    ...(parsed.data.status
      ? {
          status: parsed.data.status,
          last_status_at: now,
          applied_at: parsed.data.status === "applied" ? now : undefined,
        }
      : {}),
    ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    ...(parsed.data.nextActionAt !== undefined
      ? { next_action_at: parsed.data.nextActionAt }
      : {}),
  };
  const { error } = await supabase!
    .from("applications")
    .update(updates)
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id);
  if (error)
    return NextResponse.json({ ok: false, code: "RETRYABLE" }, { status: 503 });
  if (parsed.data.status && parsed.data.status !== previous.status)
    await supabase!.from("application_status_events").insert({
      application_id: parsed.data.applicationId,
      user_id: user.id,
      from_status: previous.status,
      to_status: parsed.data.status,
    });
  return NextResponse.json({ ok: true });
}
