"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-[2rem] border border-line bg-surface p-8 text-center">
      <h1 className="font-display text-3xl font-semibold">That page hit a snag</h1>
      <p className="mt-3 leading-7 text-muted">
        Your information is safe. Try the request again; if it persists, return
        to Discover.
      </p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
