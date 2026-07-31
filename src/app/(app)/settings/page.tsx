import { FileText, LockKeyhole, ShieldCheck, WandSparkles } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { ApplyAssistantStatus } from "@/features/settings/apply-assistant-status";
import { ApplicationProfileForm } from "@/features/settings/application-profile-form";
import { DeleteAccountButton } from "@/features/settings/delete-account-button";
import { getApplicationProfile } from "@/lib/application-profile.server";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const applicationProfile = await getApplicationProfile(user);
  return (
    <>
      <PageHeading
        eyebrow="Your account"
        title="Settings"
        description="Control your search preferences, résumé, privacy, and account."
      />
      <div className="mx-auto grid max-w-4xl gap-5">
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mint text-sage">
              <WandSparkles className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-semibold">
                Application questionnaire
              </h2>
              <p className="mt-2 mb-5 text-sm leading-6 text-muted">
                Complete this once before right-swiping. JobMates reuses the
                answers across employer portals, asks you about new required
                questions inside JobMates, and keeps the employer tab hidden
                unless login, CAPTCHA, unsupported sensitive data, or legal
                consent needs you.
              </p>
              <ApplyAssistantStatus />
              <ApplicationProfileForm profile={applicationProfile} />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mint text-sage">
              <FileText className="size-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-semibold">Résumé</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Upload a replacement through onboarding. Replacing or deleting
                removes extracted text, matches, and drafts derived from the old file.
                Application history remains.
              </p>
              <a
                href="/onboarding"
                className="mt-4 inline-flex h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-bold"
              >
                Replace résumé
              </a>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mint text-sage">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">AI & privacy</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                JobMates sends only the text needed for the feature to the configured
                AI provider, uses <code>store: false</code>, and never uses a fit score
                as a hiring prediction. OpenAI may retain abuse-monitoring logs for up
                to 30 days under its default API data controls.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-paper text-muted">
              <LockKeyhole className="size-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-semibold">Session</h2>
              <p className="mt-2 text-sm text-muted">{user.email}</p>
              <form action="/api/auth/signout" method="post" className="mt-4">
                <button className="h-10 rounded-full border border-line bg-white px-4 text-sm font-bold">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </Card>
        <Card className="border-red-200 p-6">
          <h2 className="font-display text-2xl font-semibold">Delete account</h2>
          <p className="mt-2 mb-4 text-sm leading-6 text-muted">
            Permanently delete your private data and revoke access.
          </p>
          <DeleteAccountButton demo={user.isDemo} />
        </Card>
      </div>
    </>
  );
}
