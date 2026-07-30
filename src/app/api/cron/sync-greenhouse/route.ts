import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncGreenhouseCompany } from "@/lib/greenhouse/sync";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = request.headers.get("authorization")?.replace(/^Bearer /, "");
  return Boolean(env.CRON_SECRET && secret === env.CRON_SECRET);
}

export async function GET(request: Request) {
  if (!authorized(request)) return new NextResponse(null, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return new NextResponse(null, { status: 503 });
  const { data: companies, error } = await admin
    .from("companies")
    .select("id,greenhouse_board_token")
    .eq("enabled", true)
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(20);
  if (error) return new NextResponse(null, { status: 503 });

  const results = await Promise.all(
    (companies ?? []).map(async (company) => {
      try {
        return {
          companyId: company.id,
          ok: true,
          ...(await syncGreenhouseCompany(admin, company)),
        };
      } catch {
        return { companyId: company.id, ok: false };
      }
    }),
  );
  return NextResponse.json({ ok: true, data: results });
}
