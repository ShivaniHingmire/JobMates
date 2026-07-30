import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  JobProfileSchema,
  MatchExplanationSchema,
  OutreachDraftSchema,
  type AiRequestContext,
  type JobProfile,
  type MatchEvidence,
  type MatchExplanation,
  type OutreachDraft,
  type OutreachInput,
  ResumeProfileSchema,
  type ResumeProfile,
} from "@/lib/ai/contracts";
import type { AiProvider } from "@/lib/ai/provider";
import { createSafetyIdentifier } from "@/lib/ai/safety";
import { env } from "@/lib/env";

function requireParsed<T>(value: T | null, feature: string): T {
  if (!value) throw new Error(`AI_${feature.toUpperCase()}_EMPTY`);
  return value;
}

export class OpenAiProvider implements AiProvider {
  private readonly client: OpenAI;
  private pendingUsage = { inputTokens: 0, outputTokens: 0 };

  constructor() {
    if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      maxRetries: 2,
      timeout: 30_000,
    });
  }

  private captureUsage(inputTokens = 0, outputTokens = 0) {
    this.pendingUsage.inputTokens += inputTokens;
    this.pendingUsage.outputTokens += outputTokens;
  }

  consumeUsage() {
    const usage = this.pendingUsage;
    this.pendingUsage = { inputTokens: 0, outputTokens: 0 };
    return usage.inputTokens || usage.outputTokens ? usage : null;
  }

  async parseResume(
    text: string,
    context: AiRequestContext,
  ): Promise<ResumeProfile> {
    const response = await this.client.responses.parse({
      model: env.AI_TEXT_MODEL,
      store: false,
      safety_identifier: createSafetyIdentifier(context.userId),
      reasoning: { effort: "low" },
      instructions:
        "Extract only facts explicitly supported by this résumé. Never infer credentials, dates, employers, metrics, or experience. Use null for unknown numeric/date fields. Evidence must be a short faithful paraphrase of the source.",
      input: text.slice(0, 80_000),
      text: {
        format: zodTextFormat(ResumeProfileSchema, "resume_profile"),
      },
    });
    this.captureUsage(
      response.usage?.input_tokens,
      response.usage?.output_tokens,
    );
    return requireParsed(response.output_parsed, "resume_parse");
  }

  async parseJob(
    text: string,
    context: AiRequestContext,
  ): Promise<JobProfile> {
    const response = await this.client.responses.parse({
      model: env.AI_TEXT_MODEL,
      store: false,
      safety_identifier: createSafetyIdentifier(context.userId),
      reasoning: { effort: "low" },
      instructions:
        "Extract the job requirements faithfully. Mark a skill required only when the posting clearly requires it; otherwise use preferred or mentioned. Never invent salary, years, or credentials.",
      input: text.slice(0, 80_000),
      text: {
        format: zodTextFormat(JobProfileSchema, "job_profile"),
      },
    });
    this.captureUsage(
      response.usage?.input_tokens,
      response.usage?.output_tokens,
    );
    return requireParsed(response.output_parsed, "job_parse");
  }

  async embed(texts: string[]) {
    if (texts.length === 0) return [];
    const response = await this.client.embeddings.create({
      model: env.AI_EMBEDDING_MODEL,
      input: texts.map((text) => text.slice(0, 30_000)),
      encoding_format: "float",
    });
    this.captureUsage(response.usage.prompt_tokens, 0);
    return response.data.map((item) => item.embedding);
  }

  async explainMatch(
    input: MatchEvidence,
    context: AiRequestContext,
  ): Promise<MatchExplanation> {
    const response = await this.client.responses.parse({
      model: env.AI_TEXT_MODEL,
      store: false,
      safety_identifier: createSafetyIdentifier(context.userId),
      reasoning: { effort: "low" },
      instructions:
        "Explain this deterministic résumé-fit result. Use only the supplied evidence. Do not predict hiring outcomes or claim the candidate has a missing skill.",
      input: JSON.stringify(input),
      text: {
        format: zodTextFormat(MatchExplanationSchema, "match_explanation"),
      },
    });
    this.captureUsage(
      response.usage?.input_tokens,
      response.usage?.output_tokens,
    );
    return requireParsed(response.output_parsed, "match_explanation");
  }

  async generateOutreach(
    input: OutreachInput,
    context: AiRequestContext,
  ): Promise<OutreachDraft> {
    const limits = {
      email: "Use 120–180 words and include an informative subject.",
      linkedin_connection:
        "Use no more than 300 characters and return a null subject.",
      linkedin_message:
        "Use no more than 600 characters and return a null subject.",
    } as const;
    const response = await this.client.responses.parse({
      model: env.AI_TEXT_MODEL,
      store: false,
      safety_identifier: createSafetyIdentifier(context.userId),
      reasoning: { effort: "low" },
      instructions: `Write a ${input.tone} ${input.channel} note. ${limits[input.channel]} Use only sourceFacts for candidate claims. Return every fact used in usedFacts verbatim from sourceFacts. Never imply prior contact.`,
      input: JSON.stringify(input),
      text: {
        format: zodTextFormat(OutreachDraftSchema, "outreach_draft"),
      },
    });
    this.captureUsage(
      response.usage?.input_tokens,
      response.usage?.output_tokens,
    );
    const draft = requireParsed(response.output_parsed, "outreach");
    const unsupported = draft.usedFacts.filter(
      (fact) => !input.sourceFacts.includes(fact),
    );
    if (unsupported.length > 0) throw new Error("AI_UNSUPPORTED_CLAIM");
    return draft;
  }
}
