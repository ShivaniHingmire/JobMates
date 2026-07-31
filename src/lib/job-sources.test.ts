import { describe, expect, it } from "vitest";
import {
  boardKey,
  CURATED_COMPANIES,
  parseBoardKey,
} from "@/lib/job-sources";

describe("curated company sources", () => {
  it("contains exactly 100 unique employers across the requested tabs", () => {
    expect(CURATED_COMPANIES).toHaveLength(100);
    expect(new Set(CURATED_COMPANIES.map((company) => company.slug)).size).toBe(
      100,
    );
    expect(
      CURATED_COMPANIES.filter((company) => company.category === "ai"),
    ).toHaveLength(34);
    expect(
      CURATED_COMPANIES.filter((company) => company.category === "tech"),
    ).toHaveLength(33);
    expect(
      CURATED_COMPANIES.filter((company) => company.category === "software"),
    ).toHaveLength(33);
  });

  it("supports legacy Greenhouse tokens and explicit ATS keys", () => {
    expect(parseBoardKey("gusto")).toEqual({
      provider: "greenhouse",
      token: "gusto",
    });
    expect(parseBoardKey(boardKey("ashby", "openai"))).toEqual({
      provider: "ashby",
      token: "openai",
    });
    expect(() => parseBoardKey("lever:../private")).toThrow(
      "INVALID_BOARD_TOKEN",
    );
  });
});
