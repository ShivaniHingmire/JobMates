"use client";

import { HelpCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ApplicationPackageSchema,
  type ApplicationPackage,
} from "@/lib/application-package";
import type {
  ApplicationQuestion,
  SavedApplicationAnswer,
} from "@/lib/application-profile";

export type ApplicationAction =
  | "apply_started"
  | "applied"
  | "planned"
  | "none";

export async function recordApplicationAction(
  jobId: string,
  applyUrl: string,
  action: ApplicationAction,
) {
  const response = await fetch("/api/applications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId, action, sourceUrl: applyUrl }),
  });
  if (!response.ok) throw new Error("Could not update the application");
}

async function createApplicationPackage(jobId: string) {
  const response = await fetch("/api/applications/package", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId }),
  });
  if (!response.ok) throw new Error("Could not prepare the application package");
  const result = await response.json();
  return ApplicationPackageSchema.parse(result.data);
}

function offerPackageToExtension(
  applicationPackage: ApplicationPackage,
  openPortal: boolean,
) {
  return new Promise<{
    detected: boolean;
    directApplyEnabled: boolean;
  }>((resolve) => {
    let settled = false;
    const finish = (detected: boolean, directApplyEnabled = false) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timeout);
      resolve({ detected, directApplyEnabled });
    };
    const onMessage = (event: MessageEvent) => {
      if (
        event.source === window &&
        event.origin === window.location.origin &&
        event.data?.type === "JOBMATES_EXTENSION_ACK" &&
        event.data?.packageId === applicationPackage.packageId
      )
        finish(true, event.data.directApplyEnabled === true);
    };
    const timeout = window.setTimeout(() => finish(false), 3_000);
    window.addEventListener("message", onMessage);
    window.postMessage(
      {
        type: "JOBMATES_APPLICATION_PACKAGE",
        package: applicationPackage,
        openPortal,
      },
      window.location.origin,
    );
  });
}

export async function startApplicationHandoff(
  jobId: string,
  applyUrl: string,
  assistantInstalled = false,
) {
  const applicationPackage = await createApplicationPackage(jobId);
  if (applicationPackage.missingFields.length)
    return {
      extensionDetected: assistantInstalled,
      mode: "profile_required" as const,
      trackingStarted: false,
      missingFields: applicationPackage.missingFields,
    };
  if (!assistantInstalled)
    return {
      extensionDetected: false,
      mode: "extension_required" as const,
      trackingStarted: false,
      missingFields: [],
    };

  const extension = await offerPackageToExtension(applicationPackage, true);
  if (!extension.detected)
    return {
      extensionDetected: false,
      mode: "extension_required" as const,
      trackingStarted: false,
      missingFields: [],
    };
  sessionStorage.setItem(`apply-started:${jobId}`, "1");
  const trackingStarted = await recordApplicationAction(
    jobId,
    applyUrl,
    "apply_started",
  )
    .then(() => true)
    .catch(() => false);
  return {
    extensionDetected: extension.detected,
    mode: extension.directApplyEnabled
      ? ("direct" as const)
      : ("review" as const),
    trackingStarted,
    missingFields: [],
  };
}

export interface ApplicationQuestionRequest {
  packageId: string;
  jobId: string;
  questions: ApplicationQuestion[];
}

async function saveAndSendApplicationAnswers(
  request: ApplicationQuestionRequest,
  answers: SavedApplicationAnswer[],
) {
  const sensitiveKeys = new Set(
    request.questions
      .filter((question) => question.sensitive)
      .map((question) => question.questionKey),
  );
  const reusableAnswers = answers.filter(
    (answer) => !sensitiveKeys.has(answer.questionKey),
  );
  if (reusableAnswers.length) {
    const response = await fetch("/api/application-answers", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        packageId: request.packageId,
        answers: reusableAnswers,
      }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message ?? "Could not save your answers.");
  }
  window.postMessage(
    {
      type: "JOBMATES_APPLICATION_ANSWERS",
      packageId: request.packageId,
      answers,
      sensitiveQuestionKeys: Array.from(sensitiveKeys),
    },
    window.location.origin,
  );
}

export function ApplicationQuestionsDialog({
  request,
  onClose,
  onSubmitted,
}: {
  request: ApplicationQuestionRequest | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!request) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const answers = request.questions.map((question) => ({
      questionKey: question.questionKey,
      questionText: question.questionText,
      answer:
        question.fieldType === "multiselect"
          ? form
              .getAll(question.questionKey)
              .map((value) => String(value).trim())
              .filter(Boolean)
              .join(" || ")
          : String(form.get(question.questionKey) ?? "").trim(),
    }));
    if (answers.some((answer) => !answer.answer)) {
      setError("Answer every required question so JobMates can continue.");
      setBusy(false);
      return;
    }
    try {
      await saveAndSendApplicationAnswers(request, answers);
      onSubmitted();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not send your answers.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="application-questions-title"
      className="safe-modal fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-ink/40 px-4 backdrop-blur-sm"
    >
      <form
        onSubmit={submit}
        className="relative my-4 w-full max-w-xl rounded-[1.5rem] bg-surface p-5 shadow-2xl sm:my-8 sm:rounded-[2rem] sm:p-7"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full hover:bg-paper"
        >
          <X className="size-4" />
        </button>
        <div className="grid size-11 place-items-center rounded-2xl bg-mint text-sage">
          <HelpCircle className="size-5" />
        </div>
        <h2
          id="application-questions-title"
          className="mt-4 pr-8 font-display text-2xl font-semibold sm:text-3xl"
        >
          The employer needs {request.questions.length} answer
          {request.questions.length === 1 ? "" : "s"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          The application remains hidden. Answer once and JobMates will save
          ordinary responses, finish the form, and submit it in the background.
        </p>
        {request.questions.some((question) => question.sensitive) && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            This employer requires a voluntary self-identification selection.
            JobMates will use your answer for this application only and will not
            infer it or add it to the reusable employer-question bank.
          </p>
        )}
        <div className="mt-6 space-y-5">
          {request.questions.map((question) => (
            <label
              key={question.questionKey}
              className="block text-sm font-bold"
            >
              {question.questionText}
              {question.fieldType === "multiselect" &&
              question.options.length ? (
                <select
                  name={question.questionKey}
                  required
                  multiple
                  size={Math.min(question.options.length, 8)}
                  className="mt-2 min-h-32 w-full rounded-xl border border-line bg-white p-3 font-normal"
                >
                  {question.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : question.options.length ? (
                <select
                  name={question.questionKey}
                  required
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 font-normal"
                  defaultValue=""
                >
                  <option value="">Choose</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <textarea
                  name={question.questionKey}
                  required
                  className="mt-2 min-h-24 w-full rounded-xl border border-line bg-white p-3 font-normal"
                />
              )}
            </label>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-5 text-sm font-semibold text-brand">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy ? "Saving and continuing…" : "Save answers and continue"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Not now
          </Button>
        </div>
      </form>
    </div>
  );
}
