import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchPublicJobBoard,
  normalizeAshbyJob,
  normalizeLeverJob,
} from "@/lib/job-board/client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("public ATS job normalization", () => {
  it("normalizes Ashby compensation and remote metadata", () => {
    const normalized = normalizeAshbyJob({
      id: "ashby-1",
      title: " Product Engineer ",
      location: "Remote — US",
      isRemote: true,
      workplaceType: "Remote",
      employmentType: "Full-time",
      jobUrl: "https://jobs.ashbyhq.com/acme/ashby-1",
      applyUrl: "https://jobs.ashbyhq.com/acme/ashby-1/application",
      publishedAt: "2026-07-31T00:00:00.000Z",
      descriptionPlain: "Build useful products.",
      compensation: {
        summaryComponents: [
          {
            compensationType: "Salary",
            interval: "1 YEAR",
            currencyCode: "USD",
            minValue: 150000,
            maxValue: 190000,
          },
        ],
      },
    });
    expect(normalized).toMatchObject({
      source: "ashby",
      title: "Product Engineer",
      workplace_type: "remote",
      employment_type: "full-time",
      salary_min: 150000,
      salary_max: 190000,
      salary_currency: "USD",
    });
  });

  it("normalizes Lever descriptions, dates, and employment types", () => {
    const normalized = normalizeLeverJob({
      id: "lever-1",
      text: "Software Engineer",
      hostedUrl: "https://jobs.lever.co/acme/lever-1",
      applyUrl: "https://jobs.lever.co/acme/lever-1/apply",
      description: "<p>Build systems.</p>",
      createdAt: Date.parse("2026-07-31T00:00:00.000Z"),
      categories: {
        location: "New York, NY",
        commitment: "Full-time",
      },
      salaryRange: {
        min: 140000,
        max: 180000,
        currency: "USD",
      },
    });
    expect(normalized).toMatchObject({
      source: "lever",
      description_text: "Build systems.",
      employment_type: "full-time",
      salary_min: 140000,
      posted_at: "2026-07-31T00:00:00.000Z",
    });
  });

  it("dispatches Ashby board keys to the public Ashby feed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jobs: [
            {
              id: "job-1",
              title: "Engineer",
              location: "Remote",
              jobUrl: "https://jobs.ashbyhq.com/acme/job-1",
              applyUrl: "https://jobs.ashbyhq.com/acme/job-1/application",
              descriptionPlain: "Build.",
            },
          ],
        }),
      }),
    );

    const board = await fetchPublicJobBoard("ashby:acme", "Acme");
    expect(board.name).toBe("Acme");
    expect(board.source).toBe("ashby");
    expect(board.jobs).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/job-board/acme?includeCompensation=true"),
      expect.any(Object),
    );
  });
});
