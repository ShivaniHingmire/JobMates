import { describe, expect, it } from "vitest";
import {
  calculateMatchScore,
  cosineSimilarity,
  experienceFit,
  normalizeSkill,
} from "@/lib/matching/score";

describe("hybrid-v1 scoring", () => {
  it("normalizes common aliases", () => {
    expect(normalizeSkill("React.js")).toBe("react");
    expect(normalizeSkill("UXR")).toBe("user research");
    expect(normalizeSkill("TypeScript")).toBe("typescript");
  });

  it("returns a perfect score for a complete fit", () => {
    const result = calculateMatchScore({
      candidateSkills: ["React", "TypeScript", "Figma"],
      requiredSkills: ["React.js", "TS"],
      preferredSkills: ["Figma"],
      candidateEmbedding: [1, 0],
      jobEmbedding: [1, 0],
      candidateYears: 6,
      requiredYears: 5,
      candidateSeniority: "senior",
      jobSeniority: "senior",
      locationFit: 1,
      employmentTypeFit: 1,
      compensationFit: 1,
    });
    expect(result.score).toBe(100);
    expect(result.missingRequiredSkills).toEqual([]);
  });

  it("moves the preferred weight to required skills when absent", () => {
    const result = calculateMatchScore({
      candidateSkills: ["React"],
      requiredSkills: ["React"],
      preferredSkills: [],
      candidateYears: null,
      requiredYears: null,
      candidateSeniority: null,
      jobSeniority: null,
      locationFit: 0.5,
      employmentTypeFit: 0.5,
      compensationFit: 0.5,
    });
    expect(result.components.requiredSkills).toBe(1);
    expect(result.score).toBe(75);
  });

  it("uses neutral values for unknown inputs", () => {
    const result = calculateMatchScore({
      candidateSkills: [],
      requiredSkills: [],
      preferredSkills: [],
      candidateYears: null,
      requiredYears: null,
      candidateSeniority: null,
      jobSeniority: null,
      locationFit: 0.5,
      employmentTypeFit: 0.5,
      compensationFit: 0.5,
    });
    expect(result.score).toBe(50);
  });
});

describe("score helpers", () => {
  it("clamps cosine similarity and handles empty vectors", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([], [])).toBe(0.5);
  });

  it("scores experience gaps by the documented boundaries", () => {
    expect(
      experienceFit({
        candidateYears: 4,
        requiredYears: 5,
        candidateSeniority: "mid",
        jobSeniority: "senior",
      }),
    ).toBe(0.75);
    expect(
      experienceFit({
        candidateYears: 1,
        requiredYears: 5,
        candidateSeniority: "junior",
        jobSeniority: "staff",
      }),
    ).toBe(0);
  });
});
