import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SwipeDeck } from "@/features/swipe/swipe-deck";
import { demoJobs } from "@/lib/demo-data";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

describe("SwipeDeck", () => {
  it("uses the same transition for the Interested button", async () => {
    render(<SwipeDeck jobs={demoJobs.slice(0, 2)} />);
    fireEvent.click(screen.getByRole("button", { name: "Interested" }));
    expect(
      await screen.findByRole("heading", {
        name: "Product Manager, Member Experience",
      }),
    ).toBeInTheDocument();
  });

  it("supports keyboard rejection and restores a failed optimistic action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false }),
    );
    render(<SwipeDeck jobs={demoJobs.slice(0, 2)} />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Senior Product Designer" }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/card has been restored/i),
    ).toBeInTheDocument();
  });
});
