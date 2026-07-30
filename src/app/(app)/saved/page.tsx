import { Bookmark, Heart } from "lucide-react";
import { JobListCard } from "@/components/job-list-card";
import { PageHeading } from "@/components/page-heading";
import { getSavedJobs } from "@/features/jobs/data";

export const metadata = { title: "Saved jobs" };

export default async function SavedPage() {
  const jobs = await getSavedJobs();
  return (
    <>
      <PageHeading
        eyebrow="Your shortlist"
        title="Saved & interested"
        description="Return to promising roles, compare fit, and take the next step when you are ready."
      />
      <div className="mb-6 flex gap-2">
        <button className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
          <Bookmark className="size-4" /> Saved <span>3</span>
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-muted">
          <Heart className="size-4" /> Interested <span>5</span>
        </button>
      </div>
      <div className="grid gap-3">
        {jobs.map((job, index) => (
          <JobListCard
            key={job.id}
            job={job}
            label={index < 2 ? "Saved" : "Interested"}
          />
        ))}
      </div>
    </>
  );
}
