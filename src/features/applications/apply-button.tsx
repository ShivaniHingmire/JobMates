"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ApplicationQuestionsDialog,
  type ApplicationQuestionRequest,
  recordApplicationAction,
  startApplicationHandoff,
} from "@/features/applications/application-handoff";
import { useApplyAssistant } from "@/features/applications/apply-assistant";
import { ApplicationQuestionSchema } from "@/lib/application-profile";

export function ApplyButton({
  jobId,
  applyUrl,
  active,
}: {
  jobId: string;
  applyUrl: string;
  active: boolean;
}) {
  const [error, setError] = useState("");
  const [questionRequest, setQuestionRequest] =
    useState<ApplicationQuestionRequest | null>(null);
  const assistant = useApplyAssistant();

  useEffect(() => {
    const onResult = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        event.data?.type !== "JOBMATES_APPLICATION_RESULT" ||
        event.data.result?.jobId !== jobId
      )
        return;
      const result = event.data.result;
      if (result.status === "applied") {
        void recordApplicationAction(jobId, result.applyUrl, "applied");
        sessionStorage.removeItem(`apply-started:${jobId}`);
        setError("Application submitted successfully in the background.");
        setQuestionRequest(null);
      }
      if (result.status === "questions_required") {
        const parsed = ApplicationQuestionSchema.array().safeParse(
          result.questions,
        );
        if (parsed.success && parsed.data.length)
          setQuestionRequest({
            packageId: result.packageId,
            jobId,
            questions: parsed.data,
          });
      }
      if (result.status === "review_required")
        setError(
          "This employer requires login, verification, legal consent, or an unsupported sensitive answer, so the exception opened for your review.",
        );
    };
    window.addEventListener("message", onResult);
    return () => window.removeEventListener("message", onResult);
  }, [jobId]);

  function start() {
    setError("");
    void startApplicationHandoff(
      jobId,
      applyUrl,
      assistant?.installed === true,
    )
      .then((result) => {
        if (result.mode === "direct")
          setError("Direct apply started in the background.");
        if (result.mode === "extension_required")
          setError(
            "Reload the Apply Assistant extension and refresh JobMates. No employer tab was opened.",
          );
        if (result.mode === "profile_required")
          setError(
            `Complete your application questionnaire first: ${result.missingFields.join(", ")}.`,
          );
      })
      .catch(() =>
        setError(
          "JobMates could not prepare the application. No employer tab was opened.",
        ),
      );
  }

  return (
    <>
      <Button size="lg" onClick={start} disabled={!active}>
        {active ? "Start application" : "Job is no longer active"}
        {active && <ArrowUpRight className="size-4" />}
      </Button>
      {error && (
        <div className="max-w-sm text-center text-xs text-brand">
          <p role="alert">{error}</p>
          {error.startsWith("Complete your application questionnaire") && (
            <Link href="/settings" className="mt-1 inline-block font-bold underline">
              Open questionnaire
            </Link>
          )}
        </div>
      )}
      <ApplicationQuestionsDialog
        request={questionRequest}
        onClose={() => setQuestionRequest(null)}
        onSubmitted={() => {
          setQuestionRequest(null);
          setError(
            "Answer saved. JobMates is continuing in the background.",
          );
        }}
      />
    </>
  );
}
