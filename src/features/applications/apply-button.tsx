"use client";

import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ApplyButton({
  jobId,
  applyUrl,
  active,
}: {
  jobId: string;
  applyUrl: string;
  active: boolean;
}) {
  const [prompting, setPrompting] = useState(false);

  useEffect(() => {
    const onFocus = () => {
      if (sessionStorage.getItem(`apply-started:${jobId}`)) setPrompting(true);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [jobId]);

  async function start() {
    await fetch("/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, action: "apply_started", sourceUrl: applyUrl }),
    });
    sessionStorage.setItem(`apply-started:${jobId}`, "1");
    window.open(applyUrl, "_blank", "noopener,noreferrer");
  }

  async function confirm(status: "applied" | "planned" | "none") {
    await fetch("/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, action: status, sourceUrl: applyUrl }),
    });
    sessionStorage.removeItem(`apply-started:${jobId}`);
    setPrompting(false);
  }

  return (
    <>
      <Button size="lg" onClick={start} disabled={!active}>
        {active ? "Apply on employer site" : "Job is no longer active"}
        {active && <ArrowUpRight className="size-4" />}
      </Button>
      {prompting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-confirm-title"
          className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-[2rem] bg-surface p-7 shadow-2xl">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setPrompting(false)}
              className="absolute right-5 top-5 grid size-9 place-items-center rounded-full hover:bg-paper"
            >
              <X className="size-4" />
            </button>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              Welcome back
            </p>
            <h2 id="apply-confirm-title" className="font-display mt-2 text-3xl font-semibold">
              Did you apply?
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              JobMates cannot see the employer form, so you stay in control of the
              application record.
            </p>
            <div className="mt-6 grid gap-2">
              <Button onClick={() => void confirm("applied")}>Yes, I applied</Button>
              <Button variant="secondary" onClick={() => void confirm("planned")}>
                Planning to apply
              </Button>
              <Button variant="ghost" onClick={() => void confirm("none")}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
