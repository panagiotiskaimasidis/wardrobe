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

## Phase 2 — Catalog + Add by URL

- **URL-state-driven catalog** — filters/search/sort/page live in the query
  string, so the catalog is server-rendered, shareable, and back-button-friendly. The client toolbar only mutates the URL.
- **`node-html-parser` for metadata extraction** — tiny, fast, dependency-light HTML parser; we only read `<meta>`/`<script type=ld+json>`/`<title>`, so a full DOM (cheerio/jsdom) is overkill.
- **Clipper reads public metadata only** — JSON-LD `Product`, Open Graph, Twitter Card, and HTML fallbacks. No scraping of body content or paywalled data; the source is always referenced by link. robots.txt is honoured (fail-open, since it's advisory and often absent), a descriptive User-Agent is sent, responses are size-capped (2 MB) and cached (10 min) to avoid hammering sites. SSRF is mitigated by blocking loopback/private/link-local hosts.
- **Pure logic split from I/O** — parser and guards (`parse.ts`, `guards.ts`) are side-effect-free and unit-tested; only `fetch.ts` does network + `server-only`. Keeps the testable surface large and the untestable surface tiny.
- **Clip failures degrade to manual entry** — `/api/clip` returns `ok:false` (HTTP 200) with a reason rather than erroring, and the dialog reveals an editable manual form. "Add by URL" is never a dead end.
- **`CatalogSource` adapter seam (design only)** — the clipper is effectively the first source; affiliate/brand-feed adapters (Rakuten/Awin/Skimlinks) can implement a `search()/getProduct()/normalize()` interface later and feed the same `addClippedProduct` persistence path. Not implemented in the MVP.
- **colorTags filtering via substring match** — stored as a JSON string; a `contains '"navy"'` LIKE is sufficient and portable for SQLite without a join table. Revisit with a real tag table if tag analytics are needed.

## Phase 3 — Collections + Drag & Drop

- **dnd-kit with three sensors** — `PointerSensor` (8px activation so clicks/taps on card buttons don't start drags), `TouchSensor` (200ms press-delay for a usable mobile path), and `KeyboardSensor` (`sortableKeyboardCoordinates`) for accessible reordering.
- **Catalog → board is a `useDraggable` source + `useDroppable` board, board items are `useSortable`** — catalog tiles aren't part of the sortable set; dropping one anywhere on the board calls `addItemToCollection`. Reordering uses `arrayMove` + persisted `position`.
- **Move vs copy across closets via a modifier key** — board items can be dropped onto sibling-closet droppable chips; default is **move**, holding **Alt** switches to **copy** (tracked with a window keydown ref read at drop time). Chosen over a right-click menu so the gesture stays in the drag flow as the brief specifies.
- **Optimistic DnD with server reconciliation** — add/reorder/move update local state immediately; failures toast + `router.refresh()`. The editor is remounted via a `key` derived from the server item ids so a refresh resets local state to canonical truth (avoids a props→state sync effect the lint rules flag).
- **Dev login pulled forward into Phase 3** — collections need an owner, so a minimal one-click demo login + bcrypt credentials login was built early. The full Auth.js-style surface (signup, handle picking, profiles, OAuth stub) stays in Phase 4. Documented to keep the phase demoable without skipping ahead.
- **Activity events written on action** (not derived) — `created_collection` / `added_item` rows are written inside the mutating actions so the Phase 5 feed is a cheap chronological read. Denormalized labels live in the event `metadata` JSON.

## Phase 4 — Auth + profiles

- **Handle is the public identity** — unique, lowercased `[a-z0-9_]{3,20}`, validated by a shared Zod schema reused by signup and profile edit; URLs are `/u/[handle]`.
- **Visibility enforced at the query layer** — `canViewCollection` + `getUserCollections(ownerId, viewerId)` filter to public / friends (mutual-or-either follow) / private, so profile and collection reads never leak hidden closets regardless of the calling page.
- **Follow/unfollow front-loaded with profiles** — the follow button lives on the profile, so its action shipped here; the rest of the social graph (feed, reactions, lists) stays in Phase 5. Optimistic toggle with rollback on error.
- **Google OAuth is a documented seam, not a dead button** — the "Continue with Google" button renders only when `GOOGLE_CLIENT_ID` is configured and points at `/api/oauth/google`, which returns a 501 explaining how to finish the flow. Keeps the dev experience clean (credentials/dev login) while leaving an obvious place to add real OAuth.

## Phase 5 — Social layer

- **Feed reads pre-written ActivityEvents** — `getFeed` filters events by followed actors and renders text from the denormalized `metadata`, with a single batched `collection.findMany` for links/thumbnails (no per-event queries). Cheap, chronological, resilient to deleted objects.
- **Likes/comments are polymorphic** (`targetType` + `targetId`) so they cover both collections and items with one table each; the unique `(userId, targetType, targetId)` index makes a like an idempotent toggle.
- **Re-save = add-to-closet from anywhere** — one `SaveToClosetButton` (catalog grid + others' collection items) reuses `addItemToCollection`, so "steal a friend's item" and "save from catalog" are the same well-tested path. The picker lazy-loads the viewer's closets via `/api/my/collections`.
- **Optimistic social interactions** — likes and comments update locally first and reconcile/rollback on the server result, matching the snappy feel of the DnD board.

## Phase 7 — Hardening + ship-ready

- **e2e runs against a built app with its own seeded DB** — Playwright's `webServer` does `db:push && db:seed && build && start` with `DATABASE_URL=file:./e2e.db`, isolating tests from the dev database and exercising the real production build. `dotenv` doesn't override the injected env var, so the e2e DB target is honoured.
- **Browser path is environment-overridable** — `PW_CHROMIUM_PATH` lets sandboxes point at a preinstalled Chromium; normal CI uses `playwright install`. Keeps the config portable.
- **Flow 1 e2e uses the manual-entry path** — clipping a live external URL is non-deterministic (network, robots, rate limits), so the e2e drives the clip dialog's manual fallback to assert the persistence path deterministically; the parser itself is covered by unit tests.
- **Known sandbox note** — `next/image` optimization of remote demo images (picsum/dicebear) requires outbound network; in restricted sandboxes those fetches 403 but never affect functionality or tests.
