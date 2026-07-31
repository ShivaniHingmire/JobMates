import { ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";
import { MatchScore } from "@/components/match-score";
import type { CandidateJob } from "@/lib/domain";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";

export function JobListCard({
  job,
  label,
}: {
  job: CandidateJob;
  label?: string;
}) {
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <article className="group flex flex-col gap-5 rounded-[1.75rem] border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center">
        <div
          className="grid size-13 shrink-0 place-items-center rounded-2xl text-sm font-black text-white"
          style={{ background: job.companyColor }}
        >
          {job.companyInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-brand">{job.company}</p>
            <span className="rounded-full bg-mint px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-sage">
              {label ?? job.category}
            </span>
            {!job.isActive && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-700">
                No longer active
              </span>
            )}
          </div>
          <h2 className="mt-1 truncate text-xl font-bold">{job.title}</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {job.location}
            </span>
            <span className="capitalize">{job.workplaceType}</span>
            <span>
              {job.salaryMin && job.salaryMax
                ? `${formatCurrency(job.salaryMin)}–${formatCurrency(job.salaryMax)}`
                : "Salary undisclosed"}
            </span>
            <span>{formatRelativeDate(job.postedAt)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-5 sm:justify-end">
          <MatchScore score={job.score} size="sm" />
          <span
          aria-label={`View ${job.title}`}
            className="grid size-11 place-items-center rounded-full border border-line text-muted transition group-hover:border-ink/30 group-hover:text-ink"
          >
            <ArrowUpRight className="size-5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
