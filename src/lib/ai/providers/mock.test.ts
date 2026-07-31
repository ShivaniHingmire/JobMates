import { describe, expect, it } from "vitest";
import { MockAiProvider } from "@/lib/ai/providers/mock";
import type { OutreachInput } from "@/lib/ai/contracts";

const baseInput: Omit<OutreachInput, "channel"> = {
  jobId: "demo-job",
  recipientName: "Jordan",
  tone: "warm",
  jobTitle: "Senior Product Designer",
  company: "Almanac Labs",
  sourceFacts: ["Experience with design systems"],
  matchedSkills: ["Design systems", "User research"],
};

describe("MockAiProvider outreach", () => {
  it("creates distinct LinkedIn connection and follow-up drafts", async () => {
    const provider = new MockAiProvider();
    const connection = await provider.generateOutreach({
      ...baseInput,
      channel: "linkedin_connection",
    });
    const followUp = await provider.generateOutreach({
      ...baseInput,
      channel: "linkedin_message",
    });

    expect(connection.body).toContain("value connecting");
    expect(connection.body.length).toBeLessThanOrEqual(300);
    expect(followUp.body).toContain("follow up");
    expect(followUp.body).toContain("most important outcome");
    expect(followUp.body.length).toBeLessThanOrEqual(600);
    expect(followUp.body).not.toBe(connection.body);
  });
});
