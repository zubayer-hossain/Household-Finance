# Household Finance (MVP web)

Household‑first budgeting app (Next.js 15 + Supabase). Auth, households, and membership are implemented; budgeting modules ship in a later phase.

## Prerequisites

- **Node.js** 20+ recommended (aligned with `@types/node` in this repo)
- **npm** (bundled with Node)
- A **Supabase** project with migrations from `supabase/migrations/` applied

## Developer setup

```bash
cp .env.example .env.local
# Fill NEXT_PUBLIC_* and SERVER keys (see comments in .env.example)
npm install
npm run dev
```

Open `http://localhost:3000`.

## NPM scripts


| Script                        | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `npm run dev`                 | Next.js dev server                                        |
| `npm run build` / `npm start` | Production build & serve                                  |
| `npm run lint`                | ESLint (Next core-web-vitals + feature import boundaries) |
| `npm run test`                | Vitest unit tests (`src/**/*.test.ts`)                    |


## Environment variables

Defined in `.env.example` with inline documentation. `**SUPABASE_SERVICE_ROLE_KEY` is privileged** — use only on the server (`app/api`), never expose to the client.

## Repo layout


| Path                      | Role                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `src/app/`                | App Router routes, layouts, providers                              |
| `src/features/auth/`      | Sign-in/session/profile (must not import `features/household`)     |
| `src/features/household/` | Households + members UI/services (must not import `features/auth`) |
| `src/components/`         | Shared UI primitives (`components/ui`) and shell chrome            |
| `src/lib/`                | Shared utilities (React‑agnostic helpers, formatters, query keys)  |


Cross‑feature coupling goes through `**src/lib/`**, `**src/components/**`, or route/API layers — ESLint blocks direct `features/auth` ↔ `features/household` imports.

## Database

SQL migrations live in `supabase/migrations/`. Apply them with Supabase CLI or your usual deployment pipeline (`supabase db push`, CI, etc.).

## Conventions before new modules

- Follow `.cursor/rules/ui-ux.mdc` for UI tokens and primitives.
- Add unit tests beside logic in `*.test.ts` and run `npm run test`.

## License

Private project — see repository settings.