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

## Switching to PostgreSQL

1. In `prisma/schema.prisma`, change `datasource db { provider = "postgresql" }`.
2. Set `DATABASE_URL` to your Postgres connection string.
3. In `src/lib/db.ts`, swap `@prisma/adapter-better-sqlite3` for `@prisma/adapter-pg`.
4. Run `npm run db:migrate`.

## Testing

- **Unit / component** (Vitest): `npm run test` — covers the URL-clipper parser,
  SSRF/robots guards, validation schemas, and formatting helpers.
- **End-to-end** (Playwright): `npm run test:e2e` — drives the three critical
  flows in a real browser: clip/add an item, build a board via drag-and-drop, and
  follow someone + see their feed. The e2e runner builds the app, spins up its
  own seeded SQLite database (`e2e.db`), and serves it. In CI, run
  `npx playwright install --with-deps chromium` first. If you have a preinstalled
  Chromium, point at it with `PW_CHROMIUM_PATH=/path/to/chrome`.

## Deploying to Vercel

> Not auto-deployed here. Steps:

1. Push the repo to GitHub and import it in Vercel.
2. Provision a Postgres database (Vercel Postgres, Neon, Supabase, …) and follow
   "Switching to PostgreSQL" above.
3. Set environment variables in Vercel: `DATABASE_URL`, `AUTH_SECRET`, and
   optionally `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. Build command `npm run build`, install command `npm install`. Run
   `prisma migrate deploy` as part of the build so the schema is applied.

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
