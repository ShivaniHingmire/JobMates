"use client";

import { Check, FileText, LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-muted/60";

export function OnboardingForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "ready" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload() {
    if (!file) return;
    setStatus("uploading");
    const body = new FormData();
    body.append("resume", file);
    const response = await fetch("/api/resumes", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(result.message ?? "Could not process this résumé.");
      return;
    }
    setStatus("ready");
    setMessage(
      `${result.data.skillCount} skills found. You can review them later in settings.`,
    );
  }

  async function savePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/preferences", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    if (response.ok) window.location.href = "/discover";
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 grid grid-cols-2 gap-3">
        {([
          [1, "Résumé"],
          [2, "Preferences"],
        ] as const).map(([number, label]) => (
          <div key={label} className="flex items-center gap-3">
            <span
              className={`grid size-9 place-items-center rounded-full text-sm font-black ${
                step >= number ? "bg-sage text-white" : "bg-white text-muted"
              }`}
            >
              {step > number ? <Check className="size-4" /> : number}
            </span>
            <span className="text-sm font-bold">{label}</span>
          </div>
        ))}
      </div>

      {step === 1 ? (
        <section className="rounded-[2rem] border border-line bg-surface p-6 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Step 1 of 2
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Add your résumé
          </h1>
          <p className="mt-3 max-w-xl leading-7 text-muted">
            We use the text to explain fit and ground drafts. Your original file
            stays private and is never shared with employers.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-7 flex min-h-56 w-full flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-line bg-paper/50 p-6 text-center transition hover:border-sage"
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-mint text-sage">
              {file ? <FileText className="size-6" /> : <Upload className="size-6" />}
            </span>
            <span className="mt-4 font-bold">
              {file ? file.name : "Choose a PDF or DOCX"}
            </span>
            <span className="mt-1 text-sm text-muted">Text-based files up to 5 MB</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setStatus("idle");
            }}
          />
          {message && (
            <p
              className={`mt-4 text-sm ${status === "error" ? "text-red-700" : "text-sage"}`}
              role="status"
            >
              {message}
            </p>
          )}
          <div className="mt-7 flex justify-end">
            {status === "ready" ? (
              <Button size="lg" onClick={() => setStep(2)}>
                Continue to preferences
              </Button>
            ) : (
              <Button size="lg" onClick={upload} disabled={!file || status === "uploading"}>
                {status === "uploading" && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}
                {status === "uploading" ? "Reading résumé…" : "Upload and analyze"}
              </Button>
            )}
          </div>
        </section>
      ) : (
        <form
          onSubmit={savePreferences}
          className="rounded-[2rem] border border-line bg-surface p-6 sm:p-9"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Step 2 of 2
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Focus your search
          </h1>
          <p className="mt-3 leading-7 text-muted">
            Comma-separated values are fine. You can change everything later.
          </p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-bold sm:col-span-2">
              Target titles
              <input
                name="targetTitles"
                required
                className={inputClass}
                defaultValue="Senior Product Designer, Product Designer"
              />
            </label>
            <label className="text-sm font-bold sm:col-span-2">
              Target skills
              <input
                name="targetSkills"
                className={inputClass}
                defaultValue="Figma, user research, design systems, AI products"
              />
            </label>
            <label className="text-sm font-bold">
              Locations
              <input name="locations" className={inputClass} defaultValue="New York, Remote US" />
            </label>
            <label className="text-sm font-bold">
              Salary floor
              <input
                name="salaryFloor"
                type="number"
                min="0"
                className={inputClass}
                defaultValue="140000"
              />
            </label>
            <label className="text-sm font-bold">
              Workplace
              <select name="workplaceType" className={inputClass} defaultValue="hybrid">
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </label>
            <label className="text-sm font-bold">
              Experience level
              <select name="experienceLevel" className={inputClass} defaultValue="senior">
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="manager">Manager</option>
              </select>
            </label>
            <label className="text-sm font-bold sm:col-span-2">
              Excluded companies or keywords
              <input name="excluded" className={inputClass} placeholder="Agency, gambling, crypto" />
            </label>
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" size="lg">
              Build my deck
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
