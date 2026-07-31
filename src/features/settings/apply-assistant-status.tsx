"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { useApplyAssistant } from "@/features/applications/apply-assistant";

export function ApplyAssistantStatus() {
  const capabilities = useApplyAssistant();

  if (!capabilities)
    return <p className="mb-5 text-sm text-muted">Checking Apply Assistant…</p>;

  const installed = capabilities.installed;
  return (
    <div
      className={`mb-5 flex gap-3 rounded-2xl border p-4 text-sm ${
        installed
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      {installed ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
      ) : (
        <CircleAlert className="mt-0.5 size-5 shrink-0" />
      )}
      <div>
        <p className="font-bold">
          {installed
            ? capabilities.directApplyEnabled
              ? "Apply Assistant · Direct apply on"
              : "Apply Assistant · Review mode"
            : "Apply Assistant is not detected"}
        </p>
        <p className="mt-1 leading-6 opacity-80">
          {installed
            ? capabilities.directApplyEnabled
              ? "Applications stay hidden while JobMates fills them. New questions return here; login, CAPTCHA, unsupported sensitive data, and legal consent open for you."
              : "Right swipes fill supported employer forms. Enable Direct apply from the extension popup to submit eligible forms in the background."
            : "Load and reload the browser-extension folder as an unpacked Chrome extension before swiping. JobMates will not open a manual employer tab or claim it applied."}
        </p>
      </div>
    </div>
  );
}
