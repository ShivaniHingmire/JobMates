import Link from "next/link";
import { Logo } from "@/components/logo";
import { MagicLinkForm } from "@/features/auth/magic-link-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="noise grid min-h-screen bg-paper lg:grid-cols-2">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
            Welcome
          </p>
          <h1 className="font-display mt-3 text-5xl font-semibold tracking-[-0.05em]">
            Your next move starts here.
          </h1>
          <p className="mt-4 leading-7 text-muted">
            Sign in with a private magic link. We will never sell your résumé
            data or apply to a job without you.
          </p>
          <div className="mt-8">
            <MagicLinkForm configured={isSupabaseConfigured()} />
          </div>
          <Link
            href="/"
            className="mt-8 text-center text-sm font-semibold text-muted hover:text-ink"
          >
            ← Back to JobMates
          </Link>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-sage p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-20 -top-20 size-[430px] rounded-full border-[70px] border-white/5" />
        <div className="absolute left-12 top-24 rotate-[-8deg] rounded-[2rem] bg-surface p-7 text-ink shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">
            Résumé fit
          </p>
          <p className="font-display mt-2 text-7xl font-semibold">92</p>
          <p className="mt-2 text-sm text-muted">Strong alignment</p>
        </div>
        <blockquote className="relative max-w-xl">
          <p className="font-display text-4xl leading-tight font-medium">
            “A job search should feel like a series of informed choices—not a
            second full-time job.”
          </p>
          <footer className="mt-6 text-sm text-white/65">
            The idea behind JobMates
          </footer>
        </blockquote>
      </section>
    </div>
  );
}
