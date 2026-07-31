# JobMates

JobMates is a mobile-first, AI-assisted job-search workspace. It turns a private
résumé and explicit preferences into a ranked swipe deck, explains the evidence
behind each fit score, drafts fact-grounded outreach, and tracks applications and
personal search analytics.

The repository runs in deterministic demo mode when Supabase and OpenAI
credentials are absent. Demo mode is intentionally non-persistent.

## Stack

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4
- Supabase Auth, Postgres, Row Level Security, private Storage, Cron, and pgvector
- OpenAI Responses API with Structured Outputs and `text-embedding-3-small`
- Vitest, React Testing Library, pgTAP, and Playwright
- GitHub Actions and Vercel

## Local development

Demo requirements: Node 22+ and pnpm 10+. A full local backend also needs
Docker and the Supabase CLI.

```bash
cp .env.example .env.local
pnpm install
supabase start
supabase db reset
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Without credentials, choose
“Continue in demo mode” or “Try the demo.”

For iPhone testing, run `pnpm dev --hostname 0.0.0.0`, keep the phone on the
same Wi-Fi network, and open `http://<your-mac-lan-ip>:3000`. Add
`http://<your-mac-lan-ip>:3000/api/auth/confirm` to the Supabase Auth redirect
allowlist before requesting a magic link from the phone.

For application autofill, load `browser-extension/` as an unpacked Chrome
extension, complete **Settings → Application questionnaire**, and swipe right
on a job. Direct apply keeps the application hidden, returns unknown required
questions to JobMates, and submits only after the form is complete. Without the
extension, a swipe does not open an employer tab or claim that it applied.

To use a local Supabase project, copy its URL, publishable key, and secret key
from `supabase status` into `.env.local`. Never expose the secret key with a
`NEXT_PUBLIC_` prefix.

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm ai:evals
pnpm jobs add --token <greenhouse-board-token>
pnpm jobs list
pnpm jobs sync --token <greenhouse-board-token>
pnpm jobs bootstrap --sync
```

## Environments

Local, staging, and production use separate Supabase projects, private résumé
buckets, OpenAI projects, secrets, and retention controls. Vercel preview points
at staging; production deployment requires GitHub environment approval and runs
additive database migrations before the compatible application build.

Cron routes require `Authorization: Bearer $CRON_SECRET`. Put the same random
secret in Vercel and Supabase Vault; never put it in a migration.

## Repository map

```text
src/app/                 routes, layouts, and protected handlers
src/components/          shared UI and responsive shell
src/features/            product workflows and client interactions
src/lib/ai/              provider interface, contracts, OpenAI/mock adapters
src/lib/documents/       validated PDF/DOCX text extraction
src/lib/job-board/       Greenhouse, Ashby, and Lever feed normalization
src/lib/greenhouse/      shared public-feed text cleanup and safe sync
src/lib/matching/        deterministic hybrid-v1 scorer
src/lib/supabase/        request-scoped browser/server/admin clients
browser-extension/       optional portal autofill and résumé upload assistant
supabase/migrations/     immutable schema, RLS, indexes, RPCs, Storage policies
supabase/tests/          pgTAP authorization and database behavior tests
tests/e2e/               mobile and desktop product smoke tests
scripts/                 audited employer CLI and AI evaluation runner
docs/                    architecture, deployment, retention, and eval policy
```

## Product boundaries

- “Résumé fit” is a transparent comparison, never a chance of being hired.
- The optional Direct apply mode can submit a supported form only when every
  required field is complete. Unknown ordinary questions return to JobMates;
  explicitly supplied voluntary self-identification answers can be filled;
  CAPTCHA, portal login, unsupported sensitive fields, and legal attestations
  open for the user.
- Portal passwords stay with the browser or the user’s password manager and are
  never copied into JobMates.
- The Discover feed is refreshed from 100 explicitly curated company career
  boards. Each refresh validates public Greenhouse, Ashby, or Lever data and
  keeps up to 50 recent active roles per employer; no synthetic jobs are shown.
- Outreach is generated as an editable draft and is never sent automatically.
- Recruiter discovery, OCR, and local-model support are intentionally post-MVP.

See [architecture](docs/architecture.md), [ATS portal matrix](docs/ats-portal-matrix.md),
[deployment](docs/deployment.md), [data retention](docs/data-retention.md), and
[AI evaluations](docs/ai-evaluations.md).
