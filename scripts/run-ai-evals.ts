import "dotenv/config";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  JobProfileSchema,
  ResumeProfileSchema,
  type JobProfile,
  type ResumeProfile,
} from "../src/lib/ai/contracts";
import { MockAiProvider } from "../src/lib/ai/providers/mock";
import { calculateMatchScore, normalizeSkill } from "../src/lib/matching/score";
import { evaluationFixtures } from "../tests/ai-evals/fixtures";

function f1(expected: string[], actual: string[]) {
  const expectedSet = new Set(expected.map(normalizeSkill));
  const actualSet = new Set(actual.map(normalizeSkill));
  const truePositives = [...actualSet].filter((skill) => expectedSet.has(skill)).length;
  const precision = actualSet.size ? truePositives / actualSet.size : 0;
  const recall = expectedSet.size ? truePositives / expectedSet.size : 0;
  return precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
}

async function main() {
  if (evaluationFixtures.length < 30)
    throw new Error("At least 30 evaluation fixtures are required");
  const useReal = process.env.AI_EVAL_REAL === "true";
  const mock = new MockAiProvider();
  const client =
    useReal && process.env.OPENAI_API_KEY
      ? new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          maxRetries: 2,
          timeout: 30_000,
        })
      : null;
  if (useReal && !client) throw new Error("OPENAI_API_KEY is required for real evals");
  const model = process.env.AI_TEXT_MODEL ?? "gpt-5.6-terra";
  const f1Scores: number[] = [];

  for (const fixture of evaluationFixtures) {
    let resume: ResumeProfile;
    let job: JobProfile;
    if (client) {
      const resumeResponse = await client.responses.parse({
        model,
        store: false,
        reasoning: { effort: "low" },
        instructions: "Extract only explicit résumé evidence. Never infer a skill.",
        input: fixture.resumeText,
        text: { format: zodTextFormat(ResumeProfileSchema, "resume_profile") },
      });
      const jobResponse = await client.responses.parse({
        model,
        store: false,
        reasoning: { effort: "low" },
        instructions: "Extract explicitly required job skills without invention.",
        input: fixture.jobText,
        text: { format: zodTextFormat(JobProfileSchema, "job_profile") },
      });
      resume = ResumeProfileSchema.parse(resumeResponse.output_parsed);
      job = JobProfileSchema.parse(jobResponse.output_parsed);
    } else {
      resume = await mock.parseResume(fixture.resumeText);
      job = await mock.parseJob(fixture.jobText);
    }

    const scoreInput = {
      candidateSkills: resume.skills.map((skill) => skill.name),
      requiredSkills: job.skills
        .filter((skill) => skill.importance === "required")
        .map((skill) => skill.name),
      preferredSkills: [],
      candidateYears: null,
      requiredYears: null,
      candidateSeniority: null,
      jobSeniority: null,
      locationFit: 0.5 as const,
      employmentTypeFit: 1 as const,
      compensationFit: 0.5 as const,
    };
    const first = calculateMatchScore(scoreInput);
    const second = calculateMatchScore(scoreInput);
    if (JSON.stringify(first) !== JSON.stringify(second))
      throw new Error(`Non-deterministic score for ${fixture.id}`);
    f1Scores.push(f1(fixture.expectedMissingSkills, first.missingRequiredSkills));
  }

  const averageF1 = f1Scores.reduce((sum, value) => sum + value, 0) / f1Scores.length;
  if (averageF1 < 0.85)
    throw new Error(`Missing required skill F1 ${averageF1.toFixed(3)} is below 0.85`);
  process.stdout.write(
    `${client ? "Real" : "Mock"} AI eval passed: ${evaluationFixtures.length} schema-valid pairs, missing-skill F1 ${averageF1.toFixed(3)}, deterministic scoring.\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Eval failed"}\n`);
  process.exitCode = 1;
});
