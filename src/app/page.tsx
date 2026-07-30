import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Heart,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/logo";

const features = [
  {
    icon: Sparkles,
    title: "Know why it fits",
    body: "See a transparent résumé-fit score, matched strengths, and the gaps worth addressing.",
  },
  {
    icon: MessageSquareText,
    title: "Reach out thoughtfully",
    body: "Generate grounded recruiter emails and LinkedIn notes from evidence already in your résumé.",
  },
  {
    icon: BarChart3,
    title: "Run a calmer search",
    body: "Keep applications, follow-ups, outcomes, and skill trends in one place.",
  },
];

export default function Home() {
  return (
    <div className="noise min-h-screen overflow-hidden bg-paper">
      <header className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-muted hover:text-ink sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/discover"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            Try the demo <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-10 sm:px-8 md:grid-cols-[1.02fr_0.98fr] md:pb-28 md:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              <span className="size-2 rounded-full bg-brand" />
              A more human job search
            </div>
            <h1 className="font-display max-w-3xl text-[clamp(3.4rem,8vw,6.9rem)] leading-[0.88] font-semibold tracking-[-0.065em] text-ink">
              Find work that{" "}
              <span className="relative text-brand after:absolute after:-bottom-1 after:left-0 after:-z-10 after:h-3 after:w-full after:rounded-full after:bg-sun">
                fits.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted sm:text-xl">
              JobMates turns your résumé and preferences into a focused swipe
              deck—then helps you understand the fit, make contact, and keep
              momentum.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand px-7 text-base font-bold text-white shadow-[0_14px_30px_rgba(236,91,63,0.24)] transition hover:-translate-y-0.5 hover:bg-brand-dark"
              >
                Start your search <ArrowRight className="size-5" />
              </Link>
              <Link
                href="/discover"
                className="inline-flex h-13 items-center justify-center rounded-full border border-line bg-white/70 px-7 text-base font-bold text-ink transition hover:bg-white"
              >
                Explore the product
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["Transparent scoring", "Private résumé", "No auto-apply"].map(
                (label) => (
                  <span key={label} className="inline-flex items-center gap-2">
                    <Check className="size-4 text-sage" /> {label}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="relative mx-auto min-h-[560px] w-full max-w-[530px]">
            <div className="absolute left-2 top-20 h-[440px] w-[86%] rotate-[-8deg] rounded-[2.2rem] border border-line bg-mint/80" />
            <div className="absolute right-0 top-12 h-[455px] w-[88%] rotate-[7deg] rounded-[2.2rem] border border-line bg-sun/45" />
            <div className="card-shadow absolute left-1/2 top-0 w-[92%] -translate-x-1/2 overflow-hidden rounded-[2.3rem] border border-line bg-surface">
              <div className="h-2 bg-brand" />
              <div className="p-7 sm:p-9">
                <div className="flex items-start justify-between">
                  <div className="grid size-14 place-items-center rounded-2xl bg-sage text-lg font-black text-white">
                    AL
                  </div>
                  <div className="relative grid size-20 place-items-center rounded-full bg-mint text-sage">
                    <span className="text-xl font-black">92</span>
                    <span className="absolute -bottom-5 text-[10px] font-bold uppercase tracking-wider text-muted">
                      Résumé fit
                    </span>
                  </div>
                </div>
                <p className="mt-10 text-sm font-bold text-brand">
                  Almanac Labs
                </p>
                <h2 className="font-display mt-2 text-4xl leading-tight font-semibold tracking-[-0.04em]">
                  Senior Product Designer
                </h2>
                <p className="mt-3 text-sm text-muted">
                  New York, NY · Hybrid · $165K–$205K
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {["Figma", "User research", "Design systems"].map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-sage"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-8 rounded-2xl border border-line bg-paper/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Sparkles className="size-4 text-brand" />
                    Why it fits
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Your end-to-end product work and design-systems experience
                    line up closely.
                  </p>
                </div>
                <div className="mt-7 flex items-center justify-center gap-4">
                  <div className="grid size-14 place-items-center rounded-full border border-line bg-white text-muted shadow-sm">
                    ×
                  </div>
                  <div className="grid size-17 place-items-center rounded-full bg-brand text-white shadow-[0_12px_24px_rgba(236,91,63,0.24)]">
                    <Heart className="size-7 fill-current" />
                  </div>
                  <div className="grid size-14 place-items-center rounded-full border border-line bg-white text-sage shadow-sm">
                    <span className="text-xl">⌑</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-3 left-0 rounded-2xl border border-line bg-white px-4 py-3 shadow-xl">
              <p className="text-xs font-bold text-muted">This week</p>
              <p className="mt-1 text-2xl font-black">6 applications</p>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-surface/75">
          <div className="mx-auto grid max-w-[1240px] gap-6 px-5 py-16 sm:px-8 md:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-3xl p-5">
                <div className="grid size-11 place-items-center rounded-2xl bg-mint text-sage">
                  <Icon className="size-5" />
                </div>
                <h2 className="font-display mt-5 text-2xl font-semibold">
                  {title}
                </h2>
                <p className="mt-3 leading-7 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo />
        <p>Fit estimates support judgment—they do not predict hiring outcomes.</p>
      </footer>
    </div>
  );
}
