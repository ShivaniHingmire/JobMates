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
src/lib/greenhouse/      public feed normalization and safe sync
src/lib/matching/        deterministic hybrid-v1 scorer
src/lib/supabase/        request-scoped browser/server/admin clients
supabase/migrations/     immutable schema, RLS, indexes, RPCs, Storage policies
supabase/tests/          pgTAP authorization and database behavior tests
tests/e2e/               mobile and desktop product smoke tests
scripts/                 audited employer CLI and AI evaluation runner
docs/                    architecture, deployment, retention, and eval policy
```

## Product boundaries

- “Résumé fit” is a transparent comparison, never a chance of being hired.
- JobMates does not auto-apply or claim an employer received an application.
- Outreach is generated as an editable draft and is never sent automatically.
- Recruiter discovery, OCR, direct ATS submissions, and local-model support are
  intentionally post-MVP.

See [architecture](docs/architecture.md), [deployment](docs/deployment.md),
[data retention](docs/data-retention.md), and
[AI evaluations](docs/ai-evaluations.md).
