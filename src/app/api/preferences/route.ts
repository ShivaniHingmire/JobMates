import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  targetTitles: z.string().min(1),
  targetSkills: z.string().default(""),
  locations: z.string().default(""),
  salaryFloor: z.coerce.number().int().nonnegative().optional(),
  workplaceType: z.enum(["remote", "hybrid", "onsite"]),
  experienceLevel: z.string().min(1),
  excluded: z.string().default(""),
});

const split = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const parsed = Schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ ok: false, code: "VALIDATION" }, { status: 400 });
  if (user.isDemo) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const values = parsed.data;
  const { error } = await supabase!.from("job_preferences").upsert({
    user_id: user.id,
    target_titles: split(values.targetTitles),
    target_skills: split(values.targetSkills),
    locations: split(values.locations),
    workplace_types: [values.workplaceType],
    employment_types: ["full-time"],
    salary_floor: values.salaryFloor ?? null,
    experience_level: values.experienceLevel,
    excluded_companies: [],
    excluded_keywords: split(values.excluded),
  });
  if (error)
    return NextResponse.json({ ok: false, code: "RETRYABLE" }, { status: 503 });

  await supabase!
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  return NextResponse.json({ ok: true });
}
