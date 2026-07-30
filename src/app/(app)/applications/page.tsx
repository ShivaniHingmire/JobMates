import { PageHeading } from "@/components/page-heading";
import { ApplicationBoard } from "@/features/applications/application-board";
import { getTrackedApplications } from "@/features/jobs/data";

export const metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const applications = await getTrackedApplications();
  return (
    <>
      <PageHeading
        eyebrow="Your pipeline"
        title="Applications"
        description="Track the human part of the process—from an application you started to the next conversation."
      />
      <ApplicationBoard initialApplications={applications} />
    </>
  );
}
