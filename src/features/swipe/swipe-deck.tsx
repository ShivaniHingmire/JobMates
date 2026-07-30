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
import { useCallback, useEffect, useState } from "react";
import { MatchScore } from "@/components/match-score";
import { Button } from "@/components/ui/button";
import type { CandidateJob, JobDisposition } from "@/lib/domain";
import { formatCurrency } from "@/lib/utils";

const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 500;

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
  const [notice, setNotice] = useState("");
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const reduceMotion = useReducedMotion();
  const current = deck[0];

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
    async (action: JobDisposition) => {
      if (!current) return;
      const snapshot = deck;
      setDeck((items) => items.slice(1));
      setHistory((items) => [current, ...items].slice(0, 5));
      setNotice(
        action === "interested"
          ? `Interested in ${current.title}`
          : action === "saved"
            ? `Saved ${current.title}`
            : `Passed on ${current.title}`,
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft") void act("rejected");
      if (event.key === "ArrowRight") void act("interested");
      if (event.key.toLowerCase() === "s") void act("saved");
      if (event.key === "Enter" && current)
        window.location.href = `/jobs/${current.id}`;
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [act, current]);

  const undo = () => {
    const previous = history[0];
    if (!previous) return;
    setDeck((items) => [previous, ...items]);
    setHistory((items) => items.slice(1));
    setNotice(`Restored ${previous.title}`);
  };

  if (!current) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-10 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-sage">
          <Sparkles className="size-7" />
        </div>
        <h2 className="font-display mt-5 text-3xl font-semibold">
          You&apos;re all caught up
        </h2>
        <p className="mt-3 leading-7 text-muted">
          New roles are synced throughout the day. Broaden your preferences or
          come back after the next feed refresh.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={undo} disabled={!history.length}>
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
    );
  }

  const salary =
    current.salaryMin && current.salaryMax
      ? `${formatCurrency(current.salaryMin)}–${formatCurrency(current.salaryMax)}`
      : "Compensation not disclosed";

  return (
    <div className="mx-auto max-w-[1120px]">
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>
      <div className="grid items-center gap-7 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[610px]">
          {deck.slice(1, 3).map((job, index) => (
            <div
              key={job.id}
              aria-hidden="true"
              className="absolute inset-x-4 top-0 h-[585px] rounded-[2.3rem] border border-line bg-surface"
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
                  void act("interested");
                else if (
                  info.offset.x < -SWIPE_DISTANCE ||
                  info.velocity.x < -SWIPE_VELOCITY
                )
                  void act("rejected");
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { x: direction >= 0 ? 600 : -600, rotate: direction * 10 }
              }
              className="card-shadow absolute inset-x-0 top-0 cursor-grab overflow-hidden rounded-[2.3rem] border border-line bg-surface active:cursor-grabbing"
            >
              <div className="h-2 bg-brand" />
              <div className="p-6 sm:p-9">
                <div className="flex items-start justify-between gap-5">
                  <div
                    className="grid size-14 place-items-center rounded-2xl text-lg font-black text-white sm:size-16"
                    style={{ background: current.companyColor }}
                  >
                    {current.companyInitials}
                  </div>
                  <MatchScore score={current.score} />
                </div>
                <p className="mt-10 text-sm font-bold text-brand">
                  {current.company}
                </p>
                <h2 className="font-display mt-2 text-4xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-5xl">
                  {current.title}
                </h2>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" /> {current.location}
                  </span>
                  <span className="capitalize">{current.workplaceType}</span>
                  <span>{salary}</span>
                </div>
                <p className="mt-6 max-w-2xl text-[15px] leading-7 text-muted">
                  {current.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {current.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-sage"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-7 grid gap-3 rounded-2xl border border-line bg-paper/65 p-4 sm:grid-cols-[auto_1fr]">
                  <Sparkles className="mt-0.5 size-5 text-brand" />
                  <div>
                    <p className="text-sm font-bold">Why it fits</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {current.explanation}
                    </p>
                  </div>
                </div>
                <div className="mt-7 flex items-center justify-center gap-3 sm:gap-5">
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
                    aria-label="Interested"
                    onClick={() => void act("interested")}
                    className="size-17"
                  >
                    <Heart className="size-7" />
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
                  {direction > 0 ? "Interested" : "Pass"}
                </div>
              )}
            </motion.article>
          </AnimatePresence>
        </div>

        <aside className="hidden lg:block">
          <div className="rounded-[1.75rem] border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Up next</p>
              <span className="text-xs text-muted">{deck.length} roles</span>
            </div>
            <div className="mt-4 space-y-3">
              {deck.slice(1, 4).map((job) => (
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
                Interested
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
    </div>
  );
}
