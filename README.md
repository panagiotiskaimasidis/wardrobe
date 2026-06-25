# Wardrobe

> A social fashion collection app — Pinterest × wishlist × wardrobe planner, focused entirely on fashion.

Clip clothing items from **any brand** on the web, drag and drop them onto visual
closets, follow friends, and react to each other's collections.

## The core loop

1. **Find** clothing items from any brand (browse the catalog or paste a product URL).
2. **Curate** them by dragging items onto visual boards ("closets" / collections).
3. **Follow** friends and browse each other's collections in a social feed.
4. **React** — like, comment, and re-save items into your own boards.

## Tech stack

| Concern        | Choice                                                      |
| -------------- | ----------------------------------------------------------- |
| Framework      | Next.js 16 (App Router) + React 19 + TypeScript             |
| Styling        | Tailwind CSS v4 + hand-authored shadcn/ui-style components  |
| Drag & drop    | `@dnd-kit/core` + `@dnd-kit/sortable`                       |
| Database / ORM | Prisma 7 + SQLite (dev) — swappable to PostgreSQL           |
| Auth           | Lightweight signed-cookie sessions (JWT via `jose`)         |
| Client data    | TanStack Query + React Server Components / server actions   |
| Validation     | Zod on every API boundary and form                          |
| Testing        | Vitest + Testing Library (unit/component), Playwright (e2e) |
| Tooling        | ESLint + Prettier                                           |
| Deploy target  | Vercel                                                      |

See [`DECISIONS.md`](./DECISIONS.md) for the rationale behind each choice.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment (defaults work out of the box)
cp .env.example .env

# 3. Create the SQLite database, generate the Prisma client, and seed sample data
npm run db:push
npm run db:seed

# 4. Run the dev server
npm run dev
```

Open http://localhost:3000. **No external setup is required** — the app boots with
a seeded catalog, demo users, and sample collections.

### Dev login

There is no real OAuth in dev. Use the **dev login** on `/login`: pick any seeded
demo user (one click) or sign in with a demo email + password. Seeded demo
accounts and their passwords are printed by `npm run db:seed`.

## Scripts

| Script               | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Start the dev server                             |
| `npm run build`      | Production build                                 |
| `npm run start`      | Start the production server                      |
| `npm run lint`       | ESLint                                           |
| `npm run typecheck`  | TypeScript type checking (`tsc --noEmit`)        |
| `npm run test`       | Unit/component tests (Vitest, single run)        |
| `npm run test:watch` | Vitest in watch mode                             |
| `npm run test:e2e`   | Playwright end-to-end tests                      |
| `npm run format`     | Prettier write                                   |
| `npm run db:push`    | Push the Prisma schema to the database           |
| `npm run db:seed`    | Seed sample brands, products, users, collections |
| `npm run db:reset`   | Reset and re-migrate the database                |
| `npm run db:studio`  | Open Prisma Studio                               |

## Environment variables

See [`.env.example`](./.env.example). The only one you may want to set for real is
`AUTH_SECRET` (used to sign session cookies). Everything else has dev defaults.

## SQLite (dev) vs PostgreSQL (production)

The app supports both with **no code changes** — `src/lib/db.ts` picks the Prisma
driver adapter from the `DATABASE_URL` scheme (`file:` → SQLite, `postgres://` →
Postgres). There are two schema files with identical models (only the datasource
provider differs):

- `prisma/schema.prisma` — SQLite, used for local dev (`npm run db:push`).
- `prisma/schema.postgres.prisma` — PostgreSQL, used in production
  (`npm run db:push:pg`, and the `vercel-build` script).

To run locally against Postgres instead of SQLite: set `DATABASE_URL` to your
connection string and run `npm run db:push:pg && npm run db:seed:pg`.

## Testing

- **Unit / component** (Vitest): `npm run test` — covers the URL-clipper parser,
  SSRF/robots guards, validation schemas, and formatting helpers.
- **End-to-end** (Playwright): `npm run test:e2e` — drives the three critical
  flows in a real browser: clip/add an item, build a board via drag-and-drop, and
  follow someone + see their feed. The e2e runner builds the app, spins up its
  own seeded SQLite database (`e2e.db`), and serves it. In CI, run
  `npx playwright install --with-deps chromium` first. If you have a preinstalled
  Chromium, point at it with `PW_CHROMIUM_PATH=/path/to/chrome`.

## Deploying to Vercel (get a public link)

The repo is prepped for a near one-click deploy. You provide a Vercel account and
a hosted Postgres; everything else is wired.

1. **Push to GitHub** (this branch already is) and **Import the repo** at
   [vercel.com/new](https://vercel.com/new).
2. **Add a Postgres database**: in the Vercel project → _Storage_ → create a
   Postgres database (Vercel Postgres / Neon), or use any provider (Supabase,
   Neon, …). Vercel auto-injects `DATABASE_URL` when you use its Storage tab; for
   an external DB, add `DATABASE_URL` yourself.
3. **Set environment variables** (Project → Settings → Environment Variables):
   - `DATABASE_URL` — your Postgres connection string (if not auto-added).
   - `AUTH_SECRET` — run `openssl rand -base64 32` and paste the result.
   - `NEXT_PUBLIC_SITE_URL` — your Vercel URL (e.g. `https://wardrobe-xxx.vercel.app`).
   - _(optional)_ `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. **Set the Build Command** to `npm run vercel-build` (Project → Settings →
   Build & Development). This runs `prisma generate` + `prisma db push` against
   the Postgres schema, then `next build`. Install command stays `npm install`.
5. **Deploy.** Open the resulting `https://…vercel.app` URL on your phone.
6. _(optional, recommended)_ **Load demo data once** so the app isn't empty —
   from your machine, pointing at the same DB:
   ```bash
   DATABASE_URL="<your-postgres-url>" npm run db:seed:pg
   ```
   Demo logins are then available (password `password123`), or just sign up.

> Notes: `vercel-build` uses `prisma db push` (great for a prototype). For a
> long-lived production app, switch to migrations (`prisma migrate deploy`).
> Don't run the seed on every deploy — it resets data (it's idempotent/wipes).

## Project structure

```
prisma/                 Prisma schema + seed script
src/
  app/                  App Router routes (pages, API routes, server actions)
  components/           UI primitives (components/ui) and feature components
  lib/                  Domain logic: db client, auth/session, validation, helpers
  generated/prisma/     Generated Prisma client (git-ignored)
e2e/                    Playwright end-to-end tests
```

## Progress & decisions

- [`PROGRESS.md`](./PROGRESS.md) — dated log of what's been built.
- [`DECISIONS.md`](./DECISIONS.md) — architecture/library decisions and rationale.
