import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Command } from "commander";
import { createClient } from "@supabase/supabase-js";
import {
  fetchGreenhouseBoard,
  validateBoardToken,
} from "../src/lib/greenhouse/client";
import { fetchPublicJobBoard } from "../src/lib/job-board/client";
import { syncGreenhouseCompany } from "../src/lib/greenhouse/sync";
import {
  boardKey,
  CURATED_COMPANIES,
} from "../src/lib/job-sources";

function admin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase admin environment is required.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function confirm(question: string) {
  if (process.env.CI === "true") return false;
  const reader = createInterface({ input, output });
  const answer = await reader.question(`${question} [y/N] `);
  reader.close();
  return answer.trim().toLowerCase() === "y";
}

const program = new Command()
  .name("pnpm jobs")
  .description("Audit and maintain the curated Greenhouse employer allowlist.");

program
  .command("add")
  .requiredOption("--token <token>")
  .option("--yes", "skip interactive confirmation")
  .action(async ({ token, yes }) => {
    validateBoardToken(token);
    const board = await fetchGreenhouseBoard(token);
    output.write(`Validated ${board.name}: ${board.jobs.length} public jobs.\n`);
    if (!yes && !(await confirm(`Add ${board.name} (${token})?`))) {
      output.write("No changes made.\n");
      return;
    }
    const client = admin();
    const slug = board.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const { error } = await client.from("companies").upsert(
      {
        slug,
        name: board.name,
        greenhouse_board_token: token,
        enabled: true,
      },
      { onConflict: "greenhouse_board_token" },
    );
    if (error) throw error;
    output.write(`Added ${board.name}.\n`);
  });

program.command("list").action(async () => {
  const { data, error } = await admin()
    .from("companies")
    .select("name,greenhouse_board_token,enabled,last_synced_at")
    .order("name");
  if (error) throw error;
  console.table(data);
});

program
  .command("bootstrap")
  .description("Validate and register the curated 100-company job feed.")
  .option("--sync", "immediately import every live posting")
  .option("--remaining", "with --sync, import only never-synced employers")
  .option("--concurrency <count>", "parallel feed requests", "5")
  .action(async ({ sync, remaining, concurrency }) => {
    const workerCount = Math.max(1, Math.min(10, Number(concurrency) || 5));
    const failures: string[] = [];
    let cursor = 0;
    let jobCount = 0;
    async function validateWorker() {
      while (cursor < CURATED_COMPANIES.length) {
        const company = CURATED_COMPANIES[cursor++];
        try {
          const board = await fetchPublicJobBoard(
            boardKey(company.provider, company.token),
            company.name,
          );
          if (!board.jobs.length) {
            failures.push(`${company.name}: no current public jobs`);
            continue;
          }
          jobCount += board.jobs.length;
        } catch {
          failures.push(`${company.name}: public feed unavailable`);
        }
      }
    }
    await Promise.all(Array.from({ length: workerCount }, validateWorker));
    if (failures.length) {
      throw new Error(
        `REGISTRY_VALIDATION_FAILED (${failures.slice(0, 8).join("; ")})`,
      );
    }

    const client = admin();
    const { error } = await client.from("companies").upsert(
      CURATED_COMPANIES.map((company) => ({
        slug: company.slug,
        name: company.name,
        website_url: company.websiteUrl,
        greenhouse_board_token: boardKey(company.provider, company.token),
        enabled: true,
      })),
      { onConflict: "slug" },
    );
    if (error) throw error;
    output.write(
      `Registered ${CURATED_COMPANIES.length} verified employers with ${jobCount} current public jobs.\n`,
    );
    if (!sync) return;

    let companyQuery = client
      .from("companies")
      .select("id,name,slug,greenhouse_board_token")
      .in(
        "slug",
        CURATED_COMPANIES.map((company) => company.slug),
      );
    if (remaining) companyQuery = companyQuery.is("last_synced_at", null);
    const { data: companies, error: companyError } = await companyQuery;
    if (companyError) throw companyError;
    let syncCursor = 0;
    let syncedJobs = 0;
    let failedSyncs = 0;
    async function syncWorker() {
      while (syncCursor < (companies?.length ?? 0)) {
        const company = companies![syncCursor++];
        try {
          const result = await syncGreenhouseCompany(client, company);
          syncedJobs += result.fetched;
        } catch {
          failedSyncs += 1;
        }
      }
    }
    await Promise.all(Array.from({ length: workerCount }, syncWorker));
    output.write(
      `Synced ${syncedJobs} live postings; ${failedSyncs} employer feeds failed during import.\n`,
    );
    if (failedSyncs) process.exitCode = 1;
  });

for (const action of ["enable", "disable"] as const) {
  program
    .command(action)
    .requiredOption("--token <token>")
    .action(async ({ token }) => {
      validateBoardToken(token);
      const { error } = await admin()
        .from("companies")
        .update({ enabled: action === "enable" })
        .eq("greenhouse_board_token", token);
      if (error) throw error;
      output.write(`${action === "enable" ? "Enabled" : "Disabled"} ${token}.\n`);
    });
}

program
  .command("sync")
  .requiredOption("--token <token>")
  .action(async ({ token }) => {
    validateBoardToken(token);
    const client = admin();
    const { data: company, error } = await client
      .from("companies")
      .select("id,name,greenhouse_board_token")
      .eq("greenhouse_board_token", token)
      .single();
    if (error) throw error;
    const result = await syncGreenhouseCompany(client, company);
    output.write(
      `Synced ${result.fetched} jobs for ${company.name}; ${result.created} new, ${result.updated} changed, ${result.deactivated} closed.\n`,
    );
  });

program.parseAsync().catch((error) => {
  output.write(`Job board command failed: ${error.message}\n`);
  process.exitCode = 1;
});
