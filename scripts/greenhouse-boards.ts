import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Command } from "commander";
import { createClient } from "@supabase/supabase-js";
import {
  fetchGreenhouseBoard,
  validateBoardToken,
} from "../src/lib/greenhouse/client";
import { syncGreenhouseCompany } from "../src/lib/greenhouse/sync";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
