"use client";

import { CalendarClock, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus, TrackedApplication } from "@/lib/domain";
import { APPLICATION_STATUSES } from "@/lib/domain";
import { formatDate } from "@/lib/utils";

const labels: Record<ApplicationStatus, string> = {
  planned: "Planning",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

export function ApplicationBoard({
  initialApplications,
}: {
  initialApplications: TrackedApplication[];
}) {
  const [applications, setApplications] = useState(initialApplications);

  async function updateStatus(id: string, status: ApplicationStatus) {
    const snapshot = applications;
    setApplications((items) =>
      items.map((application) =>
        application.id === id
          ? {
              ...application,
              status,
              appliedAt:
                status === "applied" && !application.appliedAt
                  ? new Date().toISOString()
                  : application.appliedAt,
            }
          : application,
      ),
    );
    const response = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId: id, status }),
    });
    if (!response.ok) setApplications(snapshot);
  }

  function updateLocal(
    id: string,
    fields: Partial<Pick<TrackedApplication, "notes" | "nextActionAt">>,
  ) {
    setApplications((items) =>
      items.map((application) =>
        application.id === id ? { ...application, ...fields } : application,
      ),
    );
  }

  async function persistFields(
    id: string,
    fields: { notes?: string; nextActionAt?: string | null },
  ) {
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId: id, ...fields }),
    });
  }

  return (
    <div className="grid gap-4">
      {applications.map((application) => (
        <article
          key={application.id}
          className="rounded-[1.75rem] border border-line bg-surface p-5 sm:p-6"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="grid size-13 shrink-0 place-items-center rounded-2xl text-sm font-black text-white"
              style={{ background: application.job.companyColor }}
            >
              {application.job.companyInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-brand">
                  {application.job.company}
                </p>
                <Badge tone="success">{application.job.score} fit</Badge>
              </div>
              <h2 className="mt-1 text-xl font-bold">{application.job.title}</h2>
            </div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Status
              <select
                className="mt-2 block h-11 min-w-40 rounded-xl border border-line bg-white px-3 text-sm font-semibold normal-case tracking-normal text-ink"
                value={application.status}
                onChange={(event) =>
                  void updateStatus(
                    application.id,
                    event.target.value as ApplicationStatus,
                  )
                }
              >
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {labels[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_190px]">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Notes
              <textarea
                className="mt-2 min-h-20 w-full resize-y rounded-xl border border-line bg-paper/50 p-3 text-sm font-normal normal-case tracking-normal text-ink"
                value={application.notes}
                onChange={(event) =>
                  updateLocal(application.id, { notes: event.target.value })
                }
                onBlur={(event) =>
                  void persistFields(application.id, { notes: event.target.value })
                }
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Next action
              <input
                type="date"
                className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 text-sm font-normal normal-case tracking-normal text-ink"
                value={application.nextActionAt?.slice(0, 10) ?? ""}
                onChange={(event) => {
                  const value = event.target.value
                    ? new Date(`${event.target.value}T12:00:00`).toISOString()
                    : null;
                  updateLocal(application.id, { nextActionAt: value });
                  void persistFields(application.id, { nextActionAt: value });
                }}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
            <span>
              {application.appliedAt
                ? `Applied ${formatDate(application.appliedAt)}`
                : "Application not submitted"}
            </span>
            {application.nextActionAt && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                <CalendarClock className="size-4 text-brand" />
                Follow up {formatDate(application.nextActionAt)}
              </span>
            )}
            <a
              href={application.job.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 font-bold text-sage"
            >
              Employer page <ExternalLink className="size-3.5" />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
