import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { boardKey, CURATED_COMPANIES } from "@/lib/job-sources";

export async function ensureCuratedCompanies(admin: SupabaseClient) {
  const rows = CURATED_COMPANIES.map((company) => ({
    slug: company.slug,
    name: company.name,
    website_url: company.websiteUrl,
    greenhouse_board_token: boardKey(company.provider, company.token),
  }));
  const { error } = await admin
    .from("companies")
    .upsert(rows, { onConflict: "slug" });
  if (error)
    throw new Error(`COMPANY_REGISTRY_UPSERT_${error.code ?? "UNKNOWN"}`);
}
