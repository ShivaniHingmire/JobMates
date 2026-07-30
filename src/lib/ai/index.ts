import "server-only";

import type { AiProvider } from "@/lib/ai/provider";
import { MockAiProvider } from "@/lib/ai/providers/mock";
import { OpenAiProvider } from "@/lib/ai/providers/openai";
import { env, isOpenAiConfigured } from "@/lib/env";

export function getAiProvider(): AiProvider {
  if (env.AI_PROVIDER === "openai" && isOpenAiConfigured()) {
    return new OpenAiProvider();
  }
  return new MockAiProvider();
}

export * from "@/lib/ai/contracts";
export type { AiProvider } from "@/lib/ai/provider";
