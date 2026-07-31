import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
      <Logo />
      <h1 className="font-display mt-14 text-5xl font-semibold tracking-[-0.04em]">
        Privacy, in plain language
      </h1>
      <div className="mt-8 space-y-6 leading-7 text-muted">
        <p>
          Your résumé is private. It is stored in an access-controlled bucket and
          used to extract evidence, create fit analyses, draft messages you
          request, and prepare application details when you explicitly choose to
          apply.
        </p>
        <p>
          We do not sell résumé data, search for recruiter identities, or send
          outreach messages on your behalf. Fit scores compare supplied evidence
          with a job post; they do not predict whether you will be hired.
        </p>
        <p>
          If you install the optional Apply Assistant, a right swipe or Apply
          action creates a 30-minute application package. The assistant can fill
          the employer form, attach your résumé, and submit a complete application
          in a hidden tab. Unknown ordinary questions return to JobMates and are
          saved to your answer bank. Voluntary self-identification answers are
          filled only when you explicitly provide and enable them; they are never
          inferred or used for ranking. Login, CAPTCHA, unsupported sensitive
          questions, legal consent, and unresolved portal validation open for
          your review. JobMates does not reuse, create, or store employer-portal
          passwords.
        </p>
        <p>
          AI requests use schema-constrained outputs and disable provider storage
          where supported. Default provider abuse-monitoring retention may still
          apply. Deleting a résumé removes derived matches and drafts; deleting the
          account removes all owned data.
        </p>
      </div>
      <Link
        href="/"
        className="mt-9 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white"
      >
        Back to JobMates
      </Link>
    </main>
  );
}
