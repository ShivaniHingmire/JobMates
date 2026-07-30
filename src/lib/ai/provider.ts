import type {
  AiRequestContext,
  JobProfile,
  MatchEvidence,
  MatchExplanation,
  OutreachDraft,
  OutreachInput,
  ResumeProfile,
} from "@/lib/ai/contracts";

export interface AiProvider {
  parseResume(
    text: string,
    context: AiRequestContext,
  ): Promise<ResumeProfile>;
  parseJob(text: string, context: AiRequestContext): Promise<JobProfile>;
  embed(texts: string[]): Promise<number[][]>;
  explainMatch(
    input: MatchEvidence,
    context: AiRequestContext,
  ): Promise<MatchExplanation>;
  generateOutreach(
    input: OutreachInput,
    context: AiRequestContext,
  ): Promise<OutreachDraft>;
  consumeUsage?(): { inputTokens: number; outputTokens: number } | null;
}

export function consumeAiUsage(provider: AiProvider) {
  return provider.consumeUsage?.() ?? null;
}
