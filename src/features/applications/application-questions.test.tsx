import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationQuestionsDialog } from "@/features/applications/application-handoff";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true }),
  }));
  vi.stubGlobal("postMessage", vi.fn());
});

describe("ApplicationQuestionsDialog", () => {
  it("sends protected answers for one application without adding them to the answer bank", async () => {
    render(
      <ApplicationQuestionsDialog
        request={{
          packageId: "2aa88976-d9e8-4f25-b260-470cef608970",
          jobId: "job-1",
          questions: [
            {
              questionKey: "disability-status",
              questionText: "Disability status",
              fieldType: "select",
              options: [
                "Yes, I have a disability",
                "No, I do not have a disability",
                "I do not wish to answer",
              ],
              required: true,
              sensitive: true,
            },
          ],
        }}
        onClose={vi.fn()}
        onSubmitted={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Disability status"), {
      target: { value: "I do not wish to answer" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save answers and continue" }),
    );

    await waitFor(() =>
      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          sensitiveQuestionKeys: ["disability-status"],
        }),
        window.location.origin,
      ),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("persists ordinary answers before continuing", async () => {
    render(
      <ApplicationQuestionsDialog
        request={{
          packageId: "2aa88976-d9e8-4f25-b260-470cef608970",
          jobId: "job-1",
          questions: [
            {
              questionKey: "referral-source",
              questionText: "How did you hear about us?",
              fieldType: "select",
              options: ["Company careers page", "Referral"],
              required: true,
              sensitive: false,
            },
          ],
        }}
        onClose={vi.fn()}
        onSubmitted={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("How did you hear about us?"), {
      target: { value: "Company careers page" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save answers and continue" }),
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(window.postMessage).toHaveBeenCalled();
  });
});
