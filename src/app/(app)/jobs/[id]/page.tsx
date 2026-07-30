import { BriefcaseBusiness, MapPin, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { MatchScore } from "@/components/match-score";
import { Badge } from "@/components/ui/badge";
import { OutreachGenerator } from "@/features/outreach/outreach-generator";
import { ApplyButton } from "@/features/applications/apply-button";
import { getJobById } from "@/features/jobs/data";
import { formatCurrency } from "@/lib/utils";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const components = [
    ["Required skills", job.components.requiredSkills, 40],
    ["Preferred skills", job.components.preferredSkills, 10],
    ["Role semantics", job.components.roleSemantics, 15],
    ["Experience", job.components.experience, 15],
    ["Location", job.components.location, 10],
    ["Employment type", job.components.employmentType, 5],
    ["Compensation", job.components.compensation, 5],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-[2rem] border border-line bg-surface p-6 sm:p-9">
        <div className="flex flex-col justify-between gap-6 sm:flex-row">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="grid size-12 place-items-center rounded-2xl text-sm font-black text-white"
                style={{ background: job.companyColor }}
              >
                {job.companyInitials}
              </div>
              <p className="font-bold text-brand">{job.company}</p>
            </div>
            <h1 className="font-display mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              {job.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" /> {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5 capitalize">
                <BriefcaseBusiness className="size-4" /> {job.employmentType}
              </span>
              <span>
                {job.salaryMin && job.salaryMax
                  ? `${formatCurrency(job.salaryMin)}–${formatCurrency(job.salaryMax)}`
                  : "Salary not disclosed"}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-8">
            <MatchScore score={job.score} size="lg" />
            <ApplyButton
              jobId={job.id}
              applyUrl={job.applyUrl}
              active={job.isActive}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-[1.75rem] border border-line bg-surface p-6">
            <h2 className="font-display text-2xl font-semibold">About the role</h2>
            <p className="mt-3 leading-7 text-muted">{job.description}</p>
            <h3 className="mt-6 font-bold">What you&apos;ll do</h3>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-muted">
              {job.responsibilities.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <OutreachGenerator job={job} />
        </div>

        <aside className="space-y-5">
          <section className="rounded-[1.75rem] border border-line bg-surface p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-brand" />
              <h2 className="font-bold">Why this fits</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{job.explanation}</p>
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Matching
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {job.matchedSkills.map((skill) => (
                  <Badge key={skill} tone="success">{skill}</Badge>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Missing or unclear
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {job.missingSkills.map((skill) => (
                  <Badge key={skill} tone="warning">{skill}</Badge>
                ))}
              </div>
            </div>
          </section>
          <section className="rounded-[1.75rem] border border-line bg-surface p-6">
            <h2 className="font-bold">Score breakdown</h2>
            <p className="mt-1 text-xs text-muted">hybrid-v1 · rounded once</p>
            <div className="mt-5 space-y-4">
              {components.map(([label, value, weight]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{label}</span>
                    <span className="text-muted">
                      {Math.round(value * weight)}/{weight}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full bg-sage"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
      <p className="mt-5 text-center text-xs leading-5 text-muted">
        Résumé fit supports your judgment. It is not a prediction of hiring success.
      </p>
    </div>
  );
}
