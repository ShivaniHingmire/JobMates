"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

export function MagicLinkForm({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!configured) return;
    setStatus("sending");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/confirm`,
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch {
      setStatus("error");
      setMessage("We could not send that link. Check the address and try again.");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        className="rounded-3xl border border-sage/15 bg-mint p-6 text-center"
      >
        <CheckCircle2 className="mx-auto size-9 text-sage" />
        <h2 className="font-display mt-4 text-2xl font-semibold">
          Check your inbox
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          We sent a secure sign-in link to <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink">
          Email address
        </span>
        <span className="relative block">
          <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-13 w-full rounded-2xl border border-line bg-white pl-12 pr-4 text-base transition focus:border-brand"
          />
        </span>
      </label>
      {message && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {message}
        </p>
      )}
      {configured ? (
        <Button
          type="submit"
          size="lg"
          disabled={status === "sending"}
          className="w-full"
        >
          {status === "sending" ? "Sending…" : "Email me a sign-in link"}
          <ArrowRight className="size-4" />
        </Button>
      ) : (
        <Link
          href="/discover"
          className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand px-7 font-bold text-white shadow-[0_8px_24px_rgba(236,91,63,0.25)]"
        >
          Continue in demo mode <ArrowRight className="size-4" />
        </Link>
      )}
      <p className="text-center text-xs leading-5 text-muted">
        No password to remember. By continuing, you agree to the privacy and
        acceptable-use terms.
      </p>
    </form>
  );
}
