import { PageHeading } from "@/components/page-heading";
import { SwipeDeck } from "@/features/swipe/swipe-deck";
import { getCandidateJobs } from "@/features/jobs/data";

export const metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const jobs = await getCandidateJobs();
  return (
    <>
      <PageHeading
        eyebrow="Your focused deck"
        title="Discover"
        description="Ranked by résumé fit, preferences, and freshness. Your choices never train a hiring model."
        action={
          <div className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-muted">
            Updated moments ago
          </div>
        }
      />
      <SwipeDeck jobs={jobs} />
    </>
  );
}
