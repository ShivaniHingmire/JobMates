import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  if (user.isDemo) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { data: resumes } = await supabase!
    .from("resumes")
    .select("storage_path")
    .eq("user_id", user.id);
  const paths = resumes?.map((resume) => resume.storage_path) ?? [];
  if (paths.length) await supabase!.storage.from("resumes").remove(paths);

  const admin = createAdminClient();
  if (!admin)
    return NextResponse.json({ ok: false, code: "RETRYABLE" }, { status: 503 });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error)
    return NextResponse.json({ ok: false, code: "RETRYABLE" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
