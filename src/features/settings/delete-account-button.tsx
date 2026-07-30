"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeleteAccountButton({ demo }: { demo: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const response = await fetch("/api/account", { method: "DELETE" });
    if (response.ok) window.location.href = "/";
    else setBusy(false);
  }

  if (demo)
    return (
      <p className="text-sm text-muted">
        Account deletion is disabled in demo mode because no personal data is stored.
      </p>
    );

  if (!confirming)
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Delete account
      </Button>
    );

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-bold text-red-900">This cannot be undone.</p>
      <p className="mt-1 text-sm text-red-700">
        Your profile, résumé files, preferences, drafts, and activity will be removed.
      </p>
      <div className="mt-4 flex gap-2">
        <Button variant="danger" onClick={remove} disabled={busy}>
          {busy ? "Deleting…" : "Delete everything"}
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
