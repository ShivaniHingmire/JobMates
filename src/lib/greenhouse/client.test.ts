import { describe, expect, it } from "vitest";
import {
  greenhousePlainText,
  normalizeGreenhouseJob,
  validateBoardToken,
} from "@/lib/greenhouse/client";

const fixture = {
  id: 42,
  title: " Product Designer ",
  absolute_url: "https://boards.greenhouse.io/example/jobs/42",
  updated_at: "2026-07-30T00:00:00Z",
  content: "<p>Build <strong>accessible</strong> products.</p>",
  location: { name: "Remote — US" },
};

describe("Greenhouse normalization", () => {
  it("removes markup and normalizes whitespace", () => {
    expect(greenhousePlainText("<p>Hello&nbsp; <b>world</b></p>")).toBe(
      "Hello world",
    );
  });

  it("hashes only relevant normalized content", () => {
    const a = normalizeGreenhouseJob(fixture);
    const b = normalizeGreenhouseJob({ ...fixture, metadata: [{ name: "x", value: "y" }] });
    expect(a.content_hash).toBe(b.content_hash);
    expect(a.title).toBe("Product Designer");
  });

  it("rejects unsafe tokens", () => {
    expect(() => validateBoardToken("../secret")).toThrow("INVALID_BOARD_TOKEN");
  });
});
