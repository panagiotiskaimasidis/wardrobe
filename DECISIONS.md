# Architecture & library decisions

A running log of meaningful decisions and their one-line rationale. Newest first
within each phase.

## Phase 0 — Scaffold

- **Next.js 16 + App Router + Turbopack** — latest stable; came from `create-next-app`. Turbopack is the default builder in 16.
- **React 19.2** — bundled with Next 16.
- **Tailwind CSS v4 (CSS-first config)** — no `tailwind.config.js`; theme tokens live in `globals.css` via `@theme inline`.
- **Hand-authored shadcn/ui-style components instead of the shadcn CLI** — the CLI's interactive init is awkward in an autonomous, non-interactive build and its Tailwind-v4 + Next-16 detection is still settling. The components in `src/components/ui` follow shadcn conventions (Radix primitives + `cva` + `cn`) so the CLI can still be adopted later. Only the Radix packages actually used are installed, keeping deps lean.
- **Prisma 7 with the new `prisma-client` generator + driver adapters** — Prisma 7 ships the query compiler and requires a driver adapter. Using `@prisma/adapter-better-sqlite3` for zero-setup local dev. Generated client lives in `src/generated/prisma` (git-ignored). Postgres swap documented in README.
- **SQLite for dev** — zero external setup so `npm install && npm run dev` just works. SQLite lacks native enums and arrays, so enum-like fields are validated strings (`src/lib/constants.ts`) and `colorTags` is a JSON-encoded string array (`src/lib/products.ts`).
- **Custom signed-cookie sessions (JWT via `jose`) instead of Auth.js/NextAuth** — _deviation from the brief, logged here as required._ Auth.js v5 (beta) is not yet validated against Next 16 + React 19 and its middleware-based patterns conflict with Next 16's `middleware`→`proxy` rename. A small, fully-controlled session layer (`src/lib/auth/session.ts`) guarantees the app builds and runs with zero external setup, satisfies the "dev login without OAuth" requirement, and keeps a clean seam: swapping in Auth.js later only touches the `lib/auth` module. Google OAuth remains stubbed behind env vars.
- **TanStack Query for client data, server actions for mutations** — RSC for reads where natural; server actions (Zod-validated) for writes.
- **Vitest + Testing Library for unit/component, Playwright for e2e** — per the brief.
- **`next/font` Geist** — default from the scaffold; fetched at build time.
