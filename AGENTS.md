<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# JobMates conventions

- Use `pnpm` for dependency and script commands.
- Keep TypeScript strict and validate network, form, and model data with Zod.
- Prefer Server Components. Add `"use client"` only at interactive boundaries.
- Create Supabase clients inside the request that uses them. Never expose the secret key to client code.
- Treat résumé text and AI prompts as sensitive. Never write them to logs or analytics.
- Keep scoring deterministic, versioned, and covered by table-driven tests.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before handoff.
