import { ArrowUpRight, CalendarClock, Target } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { getAnalytics } from "@/features/jobs/data";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();
  const summary = [
    { label: "Cards viewed", value: analytics.viewed, note: "This search" },
    {
      label: "Right-swipe rate",
      value: `${analytics.swipeRate}%`,
      note: "Focused shortlist",
    },
    {
      label: "Applications",
      value: analytics.applied,
      note: "Current pipeline",
    },
    {
      label: "Interviews",
      value: analytics.interviews,
      note: "User reported",
    },
  ];
  const maxActivity = Math.max(
    1,
    ...analytics.weeklyActivity.map((item) => item.value),
  );
  const maxMissing = Math.max(
    1,
    ...analytics.missingSkills.map((item) => item.count),
  );

  return (
    <>
      <PageHeading
        eyebrow="Your search, in context"
        title="Analytics"
        description="Use patterns to adjust your strategy—not to judge your worth."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-sm font-semibold text-muted">{item.label}</p>
            <p className="font-display mt-2 text-4xl font-semibold">{item.value}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sage">
              <ArrowUpRight className="size-3.5" /> {item.note}
            </p>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <CalendarClock className="size-5 text-brand" />
            <h2 className="font-display text-2xl font-semibold">Weekly activity</h2>
          </div>
          <div className="mt-7 flex h-56 items-end gap-3">
            {analytics.weeklyActivity.map((item) => (
              <div
                key={item.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-bold">{item.value}</span>
                <div
                  className="w-full max-w-12 rounded-t-xl bg-sage transition-[height]"
                  style={{ height: `${(item.value / maxActivity) * 80}%` }}
                />
                <span className="text-xs text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Target className="size-5 text-brand" />
            <h2 className="font-display text-2xl font-semibold">
              Frequent skill gaps
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            Missing required skills across roles you viewed.
          </p>
          <div className="mt-6 space-y-5">
            {analytics.missingSkills.map((item) => (
              <div key={item.skill}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{item.skill}</span>
                  <span className="text-muted">{item.count} roles</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-paper">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(item.count / maxMissing) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {analytics.missingSkills.length === 0 && (
              <p className="rounded-2xl bg-paper p-4 text-sm leading-6 text-muted">
                Skill-gap trends appear after you view enough analyzed roles.
              </p>
            )}
          </div>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-2xl font-semibold">Pipeline by status</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {analytics.statusCounts
              .filter((item) => item.count > 0)
              .map((item) => (
                <div key={item.status} className="rounded-2xl bg-paper p-4">
                  <p className="font-display text-3xl font-semibold">{item.count}</p>
                  <p className="mt-1 text-xs font-bold capitalize text-muted">
                    {item.status}
                  </p>
                </div>
              ))}
          </div>
          <p className="mt-5 text-sm text-muted">
            {analytics.upcomingFollowups} follow-up
            {analytics.upcomingFollowups === 1 ? "" : "s"} due in the next seven days.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-2xl font-semibold">Average fit by outcome</h2>
          <p className="mt-2 text-sm text-muted">
            A pattern finder—not a hiring forecast.
          </p>
          <div className="mt-6 space-y-4">
            {analytics.scoreOutcomes.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-22 text-sm font-semibold">{item.label}</span>
                <div className="h-2 flex-1 rounded-full bg-paper">
                  <div
                    className="h-full rounded-full bg-sage"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-black">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
