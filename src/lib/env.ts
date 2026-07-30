import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.enum(["openai", "mock"]).default("openai"),
  AI_TEXT_MODEL: z.string().default("gpt-5.6-terra"),
  AI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  CRON_SECRET: z.string().min(16).optional(),
  SAFETY_IDENTIFIER_HMAC_SECRET: z.string().min(16).optional(),
});

export const env = serverSchema.parse(process.env);

export function isSupabaseConfigured() {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function isOpenAiConfigured() {
  return Boolean(env.OPENAI_API_KEY);
}
