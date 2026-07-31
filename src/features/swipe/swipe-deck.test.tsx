import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startApplicationHandoff } from "@/features/applications/application-handoff";
import { SwipeDeck } from "@/features/swipe/swipe-deck";
import { demoJobs } from "@/lib/demo-data";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("@/features/applications/apply-assistant", () => ({
  useApplyAssistant: () => ({
    installed: true,
    directApplyEnabled: true,
  }),
}));

vi.mock("@/features/applications/application-handoff", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/features/applications/application-handoff")
    >();
  return {
    ...original,
    startApplicationHandoff: vi.fn(),
  };
});

beforeEach(() => {
  navigation.push.mockReset();
  vi.mocked(startApplicationHandoff).mockResolvedValue({
    extensionDetected: true,
    mode: "direct",
    trackingStarted: true,
    missingFields: [],
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  vi.stubGlobal("open", vi.fn());
  sessionStorage.clear();
});

describe("SwipeDeck", () => {
  it("filters the deck by company category", () => {
    render(<SwipeDeck jobs={demoJobs.slice(0, 3)} />);
    fireEvent.click(screen.getByRole("tab", { name: /software/i }));
    expect(
      screen.getByRole("heading", { name: "Frontend Engineer, Growth" }),
    ).toBeInTheDocument();
  });

  it("opens the full in-app posting when the card is clicked", () => {
    render(<SwipeDeck jobs={demoJobs.slice(0, 2)} />);
    fireEvent.click(
      screen.getByLabelText(
        "View details for Senior Product Designer at Almanac Labs",
      ),
    );
    expect(navigation.push).toHaveBeenCalledWith(
      "/jobs/demo-product-designer",
    );
  });

  it("starts a hidden application and advances the deck on a right action", async () => {
    render(<SwipeDeck jobs={demoJobs.slice(0, 2)} />);
    fireEvent.click(screen.getByRole("button", { name: "Apply to job" }));

    expect(
      await screen.findByRole("heading", {
        name: "Product Manager, Member Experience",
      }),
    ).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
    expect(startApplicationHandoff).toHaveBeenCalledWith(
      demoJobs[0].id,
      demoJobs[0].applyUrl,
      true,
    );
    expect(screen.getByText(/applying to senior product designer/i)).toBeInTheDocument();
  });

  it("supports keyboard rejection and restores a failed optimistic action", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<SwipeDeck jobs={demoJobs.slice(0, 2)} />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Senior Product Designer" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/card has been restored/i)).toBeInTheDocument();
  });
});
