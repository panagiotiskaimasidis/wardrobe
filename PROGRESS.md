# Progress log

Dated entries appended after every phase.

## 2026-06-25 — Phase 0: Scaffold ✅

**Done**

- Scaffolded Next.js 16 (App Router, TS, Tailwind v4) via `create-next-app`.
- Installed and wired the full stack: Prisma 7 (+ better-sqlite3 adapter), dnd-kit,
  TanStack Query, Zod, jose, Radix primitives, lucide-react, sonner, date-fns.
- Authored shadcn/ui-style base components: button, card, input, textarea, label,
  badge, avatar, dialog, dropdown-menu, tabs, select, skeleton, separator.
- Theme tokens (light/dark) in `globals.css` (Tailwind v4 `@theme inline`).
- Tooling: ESLint (flat config, ignores generated), Prettier (+ tailwind plugin),
  Vitest (+ jsdom setup), Playwright config. Scripts for lint/typecheck/test/e2e,
  dev/build/start, and db:generate/push/seed/migrate/reset/studio.
- Prisma schema for the full data model (User, Brand, Product, Collection,
  CollectionItem, Follow, Like, Comment, ActivityEvent). DB pushed; client generated.
- Core lib: Prisma singleton (`lib/db.ts`), session layer (`lib/auth/session.ts`),
  enum-like constants, color-tag/category helpers, `cn`/`formatPrice`/`initials`.
- App shell: root layout with metadata + providers (Query + Toaster), sticky
  `SiteHeader` nav with user menu, and a landing page.
- Repo docs: README, DECISIONS, this file, `.env.example`.

**Verification**: `lint`, `typecheck`, and `build` all pass.

**Next**: Phase 1 — seed script (~10 brands, ~60–100 products, demo users, sample
collections) so the app boots with real, demoable data.
