import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (user.isDemo)
    return NextResponse.json(
      { ok: false, message: "Demo files are not persisted." },
      { status: 404 },
    );

  const { id } = await params;
  const supabase = await createClient();
  const { data: resume } = await supabase!
    .from("resumes")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!resume) return new NextResponse(null, { status: 404 });
  const { data, error } = await supabase!.storage
    .from("resumes")
    .createSignedUrl(resume.storage_path, 60);
  if (error) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (user.isDemo) return NextResponse.json({ ok: true });

  const { id } = await params;
  const supabase = await createClient();
  const { data: resume } = await supabase!
    .from("resumes")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!resume) return new NextResponse(null, { status: 404 });

  const { error: storageError } = await supabase!.storage
    .from("resumes")
    .remove([resume.storage_path]);
  if (storageError)
    return NextResponse.json({ ok: false, code: "RETRYABLE" }, { status: 503 });
  const { error } = await supabase!
    .from("resumes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error)
    return NextResponse.json({ ok: false, code: "RETRYABLE" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
