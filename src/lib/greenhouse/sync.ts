import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchGreenhouseBoard,
  normalizeGreenhouseJob,
} from "@/lib/greenhouse/client";

interface Company {
  id: string;
  greenhouse_board_token: string;
}

export async function syncGreenhouseCompany(
  admin: SupabaseClient,
  company: Company,
) {
  const startedAt = new Date().toISOString();
  const { data: run } = await admin
    .from("job_sync_runs")
    .insert({ company_id: company.id, status: "running", started_at: startedAt })
    .select("id")
    .single();

  try {
    const board = await fetchGreenhouseBoard(company.greenhouse_board_token);
    const normalized = board.jobs.map(normalizeGreenhouseJob);
    const sourceIds = normalized.map((job) => job.source_job_id);
    const { data: existingJobs } = await admin
      .from("jobs")
      .select(
        "id,source_job_id,content_hash,is_active,analysis_status,analysis_attempts,next_retry_at",
      )
      .eq("company_id", company.id)
      .eq("source", "greenhouse");
    const existingBySource = new Map(
      (existingJobs ?? []).map((job) => [job.source_job_id, job]),
    );
    const created = normalized.filter(
      (job) => !existingBySource.has(job.source_job_id),
    ).length;
    const updated = normalized.filter((job) => {
      const existing = existingBySource.get(job.source_job_id);
      return existing && existing.content_hash !== job.content_hash;
    }).length;
    const rows = normalized.map((job) => {
      const existing = existingBySource.get(job.source_job_id);
      const changed = !existing || existing.content_hash !== job.content_hash;
      return {
        ...job,
        company_id: company.id,
        analysis_status: changed ? "pending" : existing.analysis_status,
        analysis_attempts: changed ? 0 : existing.analysis_attempts,
        next_retry_at: changed ? null : existing.next_retry_at,
      };
    });
    if (rows.length) {
      const { error } = await admin
        .from("jobs")
        .upsert(rows, { onConflict: "source,source_job_id" });
      if (error) throw new Error("JOB_UPSERT_FAILED");
    }

    const stale =
      existingJobs?.filter(
        (job) => job.is_active && !sourceIds.includes(job.source_job_id),
      ) ?? [];
    if (stale.length) {
      await admin
        .from("jobs")
        .update({ is_active: false })
        .in(
          "id",
          stale.map((job) => job.id),
        );
    }
    await admin
      .from("companies")
      .update({ name: board.name, last_synced_at: new Date().toISOString() })
      .eq("id", company.id);
    if (run)
      await admin
        .from("job_sync_runs")
        .update({
          status: "succeeded",
          fetched_count: normalized.length,
          created_count: created,
          updated_count: updated,
          deactivated_count: stale.length,
          finished_at: new Date().toISOString(),
        })
        .eq("id", run.id);
    return { fetched: normalized.length, created, updated, deactivated: stale.length };
  } catch (error) {
    if (run)
      await admin
        .from("job_sync_runs")
        .update({
          status: "failed",
          safe_error_code:
            error instanceof Error ? error.message.slice(0, 80) : "SYNC_FAILED",
          finished_at: new Date().toISOString(),
        })
        .eq("id", run.id);
    throw error;
  }
}
