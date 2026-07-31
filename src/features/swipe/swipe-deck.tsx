"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MatchScore } from "@/components/match-score";
import { Button } from "@/components/ui/button";
import {
  ApplicationQuestionsDialog,
  type ApplicationQuestionRequest,
  recordApplicationAction,
  startApplicationHandoff,
} from "@/features/applications/application-handoff";
import { useApplyAssistant } from "@/features/applications/apply-assistant";
import { ApplicationQuestionSchema } from "@/lib/application-profile";
import type { CandidateJob, JobDisposition } from "@/lib/domain";
import { jobCardExcerpt } from "@/lib/job-card";
import type { JobCategory } from "@/lib/job-sources";
import { formatCurrency } from "@/lib/utils";

const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 500;
type DeckCategory = "all" | JobCategory;
const CATEGORY_TABS: Array<{ value: DeckCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "ai", label: "AI" },
  { value: "tech", label: "Tech" },
  { value: "software", label: "Software" },
];

async function persistAction(jobId: string, action: JobDisposition) {
  const response = await fetch("/api/job-actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jobId,
      action,
      idempotencyKey: crypto.randomUUID(),
    }),
  });
  if (!response.ok) throw new Error("Could not save that choice");
}

export function SwipeDeck({ jobs }: { jobs: CandidateJob[] }) {
  const [deck, setDeck] = useState(jobs);
  const [history, setHistory] = useState<CandidateJob[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<DeckCategory>("all");
  const [notice, setNotice] = useState("");
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const [questionRequest, setQuestionRequest] =
    useState<ApplicationQuestionRequest | null>(null);
  const [applying, setApplying] = useState(false);
  const assistant = useApplyAssistant();
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const dragged = useRef(false);
  const visibleDeck = useMemo(
    () =>
      activeCategory === "all"
        ? deck
        : deck.filter((job) => job.category === activeCategory),
    [activeCategory, deck],
  );
  const current = visibleDeck[0];

  useEffect(() => {
    if (!current) return;
    const sessionKey = "jobmates-deck-session";
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(sessionKey, sessionId);
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: current.id,
        eventType: "viewed",
        idempotencyKey: `view:${sessionId}:${current.id}`,
      }),
    });
  }, [current]);

  const act = useCallback(
    async (action: JobDisposition, successNotice?: string) => {
      if (!current) return;
      const snapshot = deck;
      setDeck((items) => items.filter((job) => job.id !== current.id));
      setHistory((items) => [current, ...items].slice(0, 5));
      setNotice(
        successNotice ??
          (action === "interested"
            ? `Interested in ${current.title}`
            : action === "saved"
              ? `Saved ${current.title}`
              : `Passed on ${current.title}`),
      );
      try {
        await persistAction(current.id, action);
      } catch {
        setDeck(snapshot);
        setHistory((items) => items.filter((job) => job.id !== current.id));
        setNotice("That choice was not saved. The card has been restored.");
      }
    },
    [current, deck],
  );

  const startApplication = useCallback(async () => {
    if (!current || applying) return;
    const job = current;
    setApplying(true);
    try {
      const result = await startApplicationHandoff(
        job.id,
        job.applyUrl,
        assistant?.installed === true,
      );
      if (result.mode === "profile_required") {
        setNotice(
          `Complete Settings → Application questionnaire first: ${result.missingFields.join(", ")}.`,
        );
        return;
      }
      if (result.mode === "extension_required") {
        setNotice(
          "Reload the JobMates Apply Assistant extension, then refresh this page. No employer tab was opened.",
        );
        return;
      }
      setNotice(
        result.mode === "direct"
          ? `Applying to ${job.title} in the background.`
          : `Apply Assistant opened ${job.title} because Direct apply is turned off.`,
      );
      await act(
        "interested",
        `Applying to ${job.title} in the background.`,
      );
    } catch {
      setNotice(
        "JobMates could not prepare this application. The card is still here and no employer tab was opened.",
      );
    } finally {
      setApplying(false);
    }
  }, [act, applying, assistant, current]);

  useEffect(() => {
    const onResult = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        event.data?.type !== "JOBMATES_APPLICATION_RESULT"
      )
        return;
      const result = event.data.result;
      if (!result?.jobId) return;
      if (result.status === "applied") {
        void recordApplicationAction(
          result.jobId,
          result.applyUrl,
          "applied",
        );
        sessionStorage.removeItem(`apply-started:${result.jobId}`);
        setNotice("Application submitted successfully in the background.");
        setQuestionRequest(null);
      }
      if (result.status === "questions_required") {
        const parsed = ApplicationQuestionSchema.array().safeParse(
          result.questions,
        );
        if (parsed.success && parsed.data.length) {
          setQuestionRequest({
            packageId: result.packageId,
            jobId: result.jobId,
            questions: parsed.data,
          });
          setNotice(
            "The employer has a question JobMates has not seen before. Answer it here to continue the hidden application.",
          );
        }
      }
      if (result.status === "review_required") {
        setQuestionRequest(null);
        setNotice(
          "The employer requires login, CAPTCHA, an unsupported sensitive answer, or a legal attestation. Only that exception was opened for you.",
        );
      }
    };
    window.addEventListener("message", onResult);
    return () => window.removeEventListener("message", onResult);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft") void act("rejected");
      if (event.key === "ArrowRight") void startApplication();
      if (event.key.toLowerCase() === "s") void act("saved");
      if (event.key === "Enter" && current)
        window.location.href = `/jobs/${current.id}`;
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [act, current, startApplication]);

  const undo = () => {
    const previous = history[0];
    if (!previous) return;
    setDeck((items) => [previous, ...items]);
    setHistory((items) => items.slice(1));
    if (activeCategory !== "all") setActiveCategory(previous.category);
    setNotice(`Restored ${previous.title}`);
  };

  const categoryTabs = (
    <div
      className="scrollbar-none -mx-4 mb-4 flex flex-nowrap gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mb-5 sm:px-0"
      role="tablist"
      aria-label="Job categories"
    >
      {CATEGORY_TABS.map((tab) => {
        const count =
          tab.value === "all"
            ? deck.length
            : deck.filter((job) => job.category === tab.value).length;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeCategory === tab.value}
            onClick={() => setActiveCategory(tab.value)}
            className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
              activeCategory === tab.value
                ? "border-ink bg-ink text-white"
                : "border-line bg-surface text-muted hover:border-ink/30 hover:text-ink"
            }`}
          >
            {tab.label}
            <span className="ml-2 opacity-65">{count}</span>
          </button>
        );
      })}
    </div>
  );

  const applicationDialog = (
    <ApplicationQuestionsDialog
      request={questionRequest}
      onClose={() => setQuestionRequest(null)}
      onSubmitted={() => {
        setQuestionRequest(null);
        setNotice(
          "Answer saved. JobMates is continuing the application in the background.",
        );
      }}
    />
  );

  if (!current) {
    return (
      <>
        <div className="mx-auto max-w-[1120px]">{categoryTabs}</div>
        <div className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-10 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-sage">
            <Sparkles className="size-7" />
          </div>
          <h2 className="font-display mt-5 text-3xl font-semibold">
            {deck.length ? `No more ${activeCategory.toUpperCase()} roles` : "You’re all caught up"}
          </h2>
          <p className="mt-3 leading-7 text-muted">
            {deck.length
              ? "Choose another company category to keep swiping."
              : "New roles are synced throughout the day. Broaden your preferences or come back after the next feed refresh."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="secondary"
              onClick={undo}
              disabled={!history.length}
            >
              <RotateCcw className="size-4" /> Undo
            </Button>
            <Link
              href="/settings"
              className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white"
            >
              Edit preferences
            </Link>
          </div>
        </div>
        {applicationDialog}
      </>
    );
  }

  const salary =
    current.salaryMin && current.salaryMax
      ? `${formatCurrency(current.salaryMin)}–${formatCurrency(current.salaryMax)}`
      : "Compensation not disclosed";

  return (
    <div className="mx-auto max-w-[1120px]">
      {categoryTabs}
      {notice && (
        <p
          role="status"
          className="mb-4 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-muted"
        >
          {notice}
        </p>
      )}
      <div className="grid items-center gap-7 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[660px] sm:min-h-[610px]">
          {visibleDeck.slice(1, 3).map((job, index) => (
            <div
              key={job.id}
              aria-hidden="true"
              className="absolute inset-x-3 top-0 h-[630px] rounded-[2rem] border border-line bg-surface sm:inset-x-4 sm:h-[585px] sm:rounded-[2.3rem]"
              style={{
                transform: `translateY(${(index + 1) * 12}px) scale(${1 - (index + 1) * 0.025})`,
                opacity: 1 - (index + 1) * 0.2,
              }}
            />
          ))}
          <AnimatePresence mode="popLayout">
            <motion.article
              key={current.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              onPointerDown={() => {
                dragged.current = false;
              }}
              onDragStart={() => {
                dragged.current = true;
              }}
              onDrag={(_, info) =>
                setDirection(
                  info.offset.x > 45 ? 1 : info.offset.x < -45 ? -1 : 0,
                )
              }
              onDragEnd={(_, info) => {
                setDirection(0);
                if (
                  info.offset.x > SWIPE_DISTANCE ||
                  info.velocity.x > SWIPE_VELOCITY
                )
                  void startApplication();
                else if (
                  info.offset.x < -SWIPE_DISTANCE ||
                  info.velocity.x < -SWIPE_VELOCITY
                )
                  void act("rejected");
                window.setTimeout(() => {
                  dragged.current = false;
                }, 0);
              }}
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (
                  dragged.current ||
                  target.closest("button, a, input, select, textarea")
                )
                  return;
                router.push(`/jobs/${current.id}`);
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { x: direction >= 0 ? 600 : -600, rotate: direction * 10 }
              }
              className="card-shadow absolute inset-x-0 top-0 cursor-grab touch-pan-y overflow-hidden rounded-[2rem] border border-line bg-surface active:cursor-grabbing sm:rounded-[2.3rem]"
              aria-label={`View details for ${current.title} at ${current.company}`}
            >
              <div className="h-2 bg-brand" />
              <div className="p-5 sm:p-9">
                <div className="flex items-start justify-between gap-5">
                  <div
                    className="grid size-14 place-items-center rounded-2xl text-lg font-black text-white sm:size-16"
                    style={{ background: current.companyColor }}
                  >
                    {current.companyInitials}
                  </div>
                  <MatchScore score={current.score} />
                </div>
                <p className="mt-6 text-sm font-bold text-brand sm:mt-10">
                  {current.company}
                  <span className="ml-2 rounded-full bg-mint px-2.5 py-1 text-[10px] uppercase tracking-wider text-sage">
                    {current.category}
                  </span>
                </p>
                <h2 className="font-display mt-2 text-3xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-5xl">
                  {current.title}
                </h2>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" /> {current.location}
                  </span>
                  <span className="capitalize">{current.workplaceType}</span>
                  <span>{salary}</span>
                </div>
                <p className="mt-5 line-clamp-2 max-w-2xl text-sm leading-6 text-muted sm:mt-6 sm:line-clamp-3 sm:text-[15px] sm:leading-7">
                  {jobCardExcerpt(current.description)}
                </p>
                <p className="mt-2 text-xs font-semibold text-muted">
                  Click the card for the complete job posting
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {current.matchedSkills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-sage"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 rounded-2xl border border-line bg-paper/65 p-4 sm:mt-7 sm:grid-cols-[auto_1fr]">
                  <Sparkles className="mt-0.5 size-5 text-brand" />
                  <div>
                    <p className="text-sm font-bold">Why it fits</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted sm:line-clamp-3">
                      {current.explanation}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-center gap-3 sm:mt-7 sm:gap-5">
                  <Button
                    size="icon"
                    variant="secondary"
                    aria-label="Not interested"
                    onClick={() => void act("rejected")}
                    className="size-14 text-muted"
                  >
                    <X className="size-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="primary"
                    aria-label="Apply to job"
                    onClick={() => void startApplication()}
                    disabled={applying}
                    className="size-17"
                  >
                    <Heart className="size-7 fill-current" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    aria-label="Save for later"
                    onClick={() => void act("saved")}
                    className="size-14 text-sage"
                  >
                    <Bookmark className="size-5" />
                  </Button>
                </div>
              </div>
              {direction !== 0 && (
                <div
                  className={`pointer-events-none absolute top-24 rounded-xl border-4 px-4 py-2 text-2xl font-black uppercase ${
                    direction > 0
                      ? "right-8 rotate-6 border-sage text-sage"
                      : "left-8 -rotate-6 border-brand text-brand"
                  }`}
                >
                  {direction > 0 ? "Apply" : "Pass"}
                </div>
              )}
            </motion.article>
          </AnimatePresence>
        </div>

        <aside className="hidden lg:block">
          <div className="rounded-[1.75rem] border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Up next</p>
              <span className="text-xs text-muted">
                {visibleDeck.length} roles
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {visibleDeck.slice(1, 4).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 rounded-2xl bg-paper p-3"
                >
                  <div
                    className="grid size-10 place-items-center rounded-xl text-xs font-black text-white"
                    style={{ background: job.companyColor }}
                  >
                    {job.companyInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{job.title}</p>
                    <p className="truncate text-xs text-muted">{job.company}</p>
                  </div>
                  <span className="text-sm font-black text-sage">
                    {job.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-[1.75rem] bg-ink p-5 text-white">
            <p className="text-sm font-bold">Keyboard shortcuts</p>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <p className="flex items-center gap-3">
                <kbd className="rounded bg-white/10 px-2 py-1">
                  <ChevronLeft className="size-4" />
                </kbd>
                Not interested
              </p>
              <p className="flex items-center gap-3">
                <kbd className="rounded bg-white/10 px-2 py-1">
                  <ChevronRight className="size-4" />
                </kbd>
                Apply in background
              </p>
              <p>
                <kbd className="mr-3 rounded bg-white/10 px-2 py-1">S</kbd>
                Save for later
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-3 w-full"
            onClick={undo}
            disabled={!history.length}
          >
            <RotateCcw className="size-4" /> Undo last card
          </Button>
        </aside>
      </div>
      {applicationDialog}
    </div>
  );
}
