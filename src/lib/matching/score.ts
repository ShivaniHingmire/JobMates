import type { MatchComponents } from "@/lib/domain";

export const SCORING_VERSION = "hybrid-v1";

const aliases: Record<string, string> = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  "react.js": "react",
  reactjs: "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  "user experience research": "user research",
  uxr: "user research",
  "design system": "design systems",
  "product analytics": "product analytics",
};

export function normalizeSkill(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .replace(/\s+/g, " ");
  return aliases[normalized] ?? normalized;
}

function coverage(candidate: string[], job: string[]) {
  if (job.length === 0) return 0.5;
  const candidateSet = new Set(candidate.map(normalizeSkill));
  const matched = job.filter((skill) => candidateSet.has(normalizeSkill(skill)));
  return matched.length / job.length;
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length === 0 || a.length !== b.length) return 0.5;
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    magnitudeA += a[index] ** 2;
    magnitudeB += b[index] ** 2;
  }
  if (!magnitudeA || !magnitudeB) return 0.5;
  return Math.max(
    0,
    Math.min(1, dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))),
  );
}

const seniorityOrder = [
  "intern",
  "entry",
  "junior",
  "mid",
  "senior",
  "staff",
  "principal",
  "director",
  "vp",
  "executive",
];

function normalizeSeniority(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  return seniorityOrder.find((level) => lower.includes(level)) ?? null;
}

export function experienceFit(input: {
  candidateYears: number | null;
  requiredYears: number | null;
  candidateSeniority: string | null;
  jobSeniority: string | null;
}) {
  const {
    candidateYears,
    requiredYears,
    candidateSeniority,
    jobSeniority,
  } = input;
  if (
    candidateYears == null &&
    (!candidateSeniority || !normalizeSeniority(candidateSeniority))
  ) {
    return 0.5;
  }

  let yearScore = 1;
  if (requiredYears != null && candidateYears != null) {
    const gap = requiredYears - candidateYears;
    yearScore = gap <= 0 ? 1 : gap <= 1 ? 0.75 : gap <= 3 ? 0.4 : 0;
  } else if (requiredYears != null) {
    yearScore = 0.5;
  }

  const candidateLevel = normalizeSeniority(candidateSeniority);
  const requiredLevel = normalizeSeniority(jobSeniority);
  let seniorityScore = 1;
  if (requiredLevel && candidateLevel) {
    const gap =
      seniorityOrder.indexOf(requiredLevel) -
      seniorityOrder.indexOf(candidateLevel);
    seniorityScore = gap <= 0 ? 1 : gap === 1 ? 0.75 : gap === 2 ? 0.4 : 0;
  } else if (requiredLevel) {
    seniorityScore = 0.5;
  }

  return Math.min(yearScore, seniorityScore);
}

export interface ScoreInput {
  candidateSkills: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  candidateEmbedding?: number[];
  jobEmbedding?: number[];
  candidateYears: number | null;
  requiredYears: number | null;
  candidateSeniority: string | null;
  jobSeniority: string | null;
  locationFit: 0 | 0.5 | 1;
  employmentTypeFit: 0 | 0.5 | 1;
  compensationFit: 0 | 0.5 | 1;
}

export interface ScoreResult {
  score: number;
  components: MatchComponents;
  matchedSkills: string[];
  missingRequiredSkills: string[];
  missingPreferredSkills: string[];
  scoringVersion: typeof SCORING_VERSION;
}

export function calculateMatchScore(input: ScoreInput): ScoreResult {
  const candidateSet = new Set(input.candidateSkills.map(normalizeSkill));
  const matched = (skills: string[]) =>
    skills.filter((skill) => candidateSet.has(normalizeSkill(skill)));
  const missing = (skills: string[]) =>
    skills.filter((skill) => !candidateSet.has(normalizeSkill(skill)));

  const components: MatchComponents = {
    requiredSkills: coverage(input.candidateSkills, input.requiredSkills),
    preferredSkills:
      input.preferredSkills.length === 0
        ? 0
        : coverage(input.candidateSkills, input.preferredSkills),
    roleSemantics:
      input.candidateEmbedding && input.jobEmbedding
        ? cosineSimilarity(input.candidateEmbedding, input.jobEmbedding)
        : 0.5,
    experience: experienceFit({
      candidateYears: input.candidateYears,
      requiredYears: input.requiredYears,
      candidateSeniority: input.candidateSeniority,
      jobSeniority: input.jobSeniority,
    }),
    location: input.locationFit,
    employmentType: input.employmentTypeFit,
    compensation: input.compensationFit,
  };

  const requiredWeight = input.preferredSkills.length === 0 ? 50 : 40;
  const preferredWeight = input.preferredSkills.length === 0 ? 0 : 10;
  const score = Math.round(
    components.requiredSkills * requiredWeight +
      components.preferredSkills * preferredWeight +
      components.roleSemantics * 15 +
      components.experience * 15 +
      components.location * 10 +
      components.employmentType * 5 +
      components.compensation * 5,
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    components,
    matchedSkills: [
      ...matched(input.requiredSkills),
      ...matched(input.preferredSkills),
    ],
    missingRequiredSkills: missing(input.requiredSkills),
    missingPreferredSkills: missing(input.preferredSkills),
    scoringVersion: SCORING_VERSION,
  };
}
