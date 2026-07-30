# Delivery and deployment

## Branching

`main` is protected and always releasable. Work uses short-lived
`feat/<issue>-<name>`, `fix/<issue>-<name>`, `chore/<issue>-<name>`, or
`spike/<issue>-<name>` branches. Use Conventional Commits, open draft pull
requests early, keep one feature or migration concern per PR, and squash merge
after required checks pass. Beta tags follow `v0.x.y`.

## Required checks

Lint, TypeScript, Vitest, fresh-database migrations and pgTAP, production build,
desktop/mobile Playwright, and a high-severity production dependency audit must
pass. Migrations are immutable after merge and use expand/contract changes.

## Release flow

1. A pull request gets an isolated Vercel preview; cron is disabled.
2. Merge applies migrations to staging and deploys a preview build.
3. Production is a manually dispatched, GitHub-environment-approved workflow.
4. The workflow applies additive migrations before the compatible Vercel build.
5. Smoke tests run before enabling or changing cron schedules.

Required GitHub environments are `staging` and `production`. Store
`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`,
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as environment secrets.
