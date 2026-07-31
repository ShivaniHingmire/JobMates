import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchGreenhouseBoard,
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Greenhouse normalization", () => {
  it("removes markup and normalizes whitespace", () => {
    expect(greenhousePlainText("<p>Hello&nbsp; <b>world</b></p>")).toBe(
      "Hello world",
    );
    expect(
      greenhousePlainText("&lt;p&gt;Hello &lt;b&gt;world&lt;/b&gt;&lt;/p&gt;"),
    ).toBe("Hello world");
  });

  it("hashes only relevant normalized content", () => {
    const a = normalizeGreenhouseJob(fixture);
    const b = normalizeGreenhouseJob({ ...fixture, metadata: null });
    expect(a.content_hash).toBe(b.content_hash);
    expect(a.title).toBe("Product Designer");
  });

  it("rejects unsafe tokens", () => {
    expect(() => validateBoardToken("../secret")).toThrow("INVALID_BOARD_TOKEN");
  });

  it("combines the current board and jobs API responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ name: "Acme" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobs: [fixture] }),
        }),
    );

    await expect(fetchGreenhouseBoard("acme")).resolves.toEqual({
      name: "Acme",
      jobs: [fixture],
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed public API payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ name: "" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobs: [] }),
        }),
    );

    await expect(fetchGreenhouseBoard("acme")).rejects.toThrow(
      "GREENHOUSE_INVALID_PAYLOAD",
    );
  });
});
