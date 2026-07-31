import { describe, expect, it } from "vitest";
import { jobCardExcerpt } from "@/lib/job-card";

describe("jobCardExcerpt", () => {
  it("removes markup artifacts and collapses whitespace", () => {
    expect(
      jobCardExcerpt("&lt;p&gt;Build&nbsp; useful products.&lt;/p&gt;"),
    ).toBe("Build useful products.");
  });

  it("ends a long excerpt on a readable boundary", () => {
    const excerpt = jobCardExcerpt(
      "First useful sentence about the role. Second sentence contains additional information that should not all appear on a swipe card.",
      70,
    );

    expect(excerpt).toBe("First useful sentence about the role.…");
    expect(excerpt.length).toBeLessThanOrEqual(70);
  });

  it("skips long company boilerplate when a role introduction is available", () => {
    const excerpt = jobCardExcerpt(
      "Acme builds software for teams around the world and has a long company introduction that does not explain this job. We're looking for a product designer to lead accessible workflows.",
    );

    expect(excerpt).toBe(
      "We're looking for a product designer to lead accessible workflows.",
    );
  });
});
