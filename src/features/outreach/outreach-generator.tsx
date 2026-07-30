"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CandidateJob } from "@/lib/domain";

type Channel = "email" | "linkedin_connection" | "linkedin_message";

export function OutreachGenerator({ job }: { job: CandidateJob }) {
  const [channel, setChannel] = useState<Channel>("email");
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setBusy(true);
    const response = await fetch("/api/outreach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        channel,
        recipientName: recipient || undefined,
        tone: "warm",
        jobTitle: job.title,
        company: job.company,
        sourceFacts: [
          `Experience with ${job.matchedSkills[0] ?? "cross-functional work"}`,
          `Experience with ${job.matchedSkills[1] ?? "customer-focused products"}`,
        ],
        matchedSkills: job.matchedSkills,
      }),
    });
    const result = await response.json();
    if (result.ok) {
      setSubject(result.data.subject ?? "");
      setBody(result.data.body);
    }
    setBusy(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(
      `${subject ? `${subject}\n\n` : ""}${body}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const limit =
    channel === "linkedin_connection"
      ? 300
      : channel === "linkedin_message"
        ? 600
        : 1500;

  return (
    <section className="rounded-[1.75rem] border border-line bg-surface p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-mint text-sage">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold">Start a conversation</h2>
          <p className="text-sm text-muted">Grounded in evidence from your résumé.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold">
          Format
          <select
            className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 font-normal"
            value={channel}
            onChange={(event) => setChannel(event.target.value as Channel)}
          >
            <option value="email">Recruiter email</option>
            <option value="linkedin_connection">LinkedIn connection note</option>
            <option value="linkedin_message">LinkedIn follow-up</option>
          </select>
        </label>
        <label className="text-sm font-bold">
          Recipient name (optional)
          <input
            className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 font-normal"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="Jordan"
          />
        </label>
      </div>
      <Button className="mt-4" onClick={generate} disabled={busy}>
        <Sparkles className="size-4" /> {busy ? "Drafting…" : "Generate draft"}
      </Button>
      {body && (
        <div className="mt-5 space-y-3">
          {subject && (
            <input
              aria-label="Email subject"
              className="h-11 w-full rounded-xl border border-line bg-paper/50 px-3 font-semibold"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          )}
          <textarea
            aria-label="Outreach draft"
            className="min-h-48 w-full resize-y rounded-2xl border border-line bg-paper/50 p-4 leading-7"
            maxLength={limit}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              {body.length}/{limit} characters
            </span>
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
