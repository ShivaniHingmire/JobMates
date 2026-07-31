import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncGreenhouseCompany } from "@/lib/greenhouse/sync";
import { ensureCuratedCompanies } from "@/lib/job-sources.server";
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
  const client = admin;
  try {
    await ensureCuratedCompanies(client);
  } catch {
    return new NextResponse(null, { status: 503 });
  }
  const { data: companies, error } = await client
    .from("companies")
    .select("id,name,greenhouse_board_token")
    .eq("enabled", true)
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(20);
  if (error) return new NextResponse(null, { status: 503 });

  const queue = companies ?? [];
  const results: Array<
    | {
        companyId: string;
        ok: true;
        fetched: number;
        created: number;
        updated: number;
        deactivated: number;
      }
    | { companyId: string; ok: false }
  > = [];
  let cursor = 0;
  async function worker() {
    while (cursor < queue.length) {
      const company = queue[cursor++];
      try {
        results.push({
          companyId: company.id,
          ok: true as const,
          ...(await syncGreenhouseCompany(client, company)),
        });
      } catch {
        results.push({ companyId: company.id, ok: false });
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  return NextResponse.json({ ok: true, data: results });
}
