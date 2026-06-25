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

## 2026-06-25 — Phase 1: Data + seed ✅

**Done**

- Idempotent seed script (`prisma/seed.ts`): 10 brands, 80 products across all 6
  fashion categories (deterministic placeholder images via picsum, dicebear
  avatars), 3 demo users (password `password123`), 7 collections with ordered
  items, 5 follows, 5 likes, 3 comments, and 40 derived activity events so the
  feed is populated from day one.
- Client-safe view types (`lib/types.ts`) and a product query/mapper layer
  (`lib/queries/products.ts`: `toProductView`, `getRecentProducts`,
  `getCatalogStats`) so Prisma types never leak into the client.
- Reusable presentational `ProductCard`.
- Landing page now boots with **real seeded data** — live catalog counts and a
  "Fresh in the catalog" grid (verified at runtime).
- Unit tests for color-tag/category/format/`cn` helpers (14 tests).

**Verification**: `lint`, `typecheck`, `test`, and a runtime dev-server smoke
test (home page renders seeded products + stats) all pass.

**Next**: Phase 2 — catalog browse/search/filter pages and the "Add by URL"
metadata clipper.

## 2026-06-25 — Phase 2: Catalog + Add by URL ✅

**Done**

- **Catalog** at `/catalog`: server-rendered, URL-driven search + filters
  (text, category, brand, color, sort) with pagination. Client `CatalogToolbar`
  (debounced search, Radix selects) syncs filters to the query string;
  `CatalogGrid` (with empty state) + `CatalogPagination`.
- Catalog query layer: `getCatalogProducts` (filtered/paginated),
  `getBrandsWithCounts`. SQLite-safe LIKE search; colorTags substring match.
- **Add by URL clipper** — the "from any company" engine:
  - Pure, tested metadata parser (`lib/clipper/parse.ts`): JSON-LD `Product`
    → Open Graph → Twitter Card → HTML fallbacks; derives brand, price,
    category guess, and color tags; resolves relative image URLs.
  - Pure, tested guards (`lib/clipper/guards.ts`): SSRF host blocking,
    URL validation, robots.txt `Disallow` parsing.
  - Server fetcher (`lib/clipper/fetch.ts`): robots.txt respect (fail-open),
    custom User-Agent, timeout, 2 MB cap, 10-min in-memory cache.
  - `POST /api/clip` (auth-guarded, Zod-validated) returns a draft; on failure
    returns `ok:false` so the UI shows the manual-entry fallback.
  - `addClippedProduct` server action (Zod + find-or-create brand).
  - `AddByUrlButton` dialog: paste → fetch → editable preview (image, title,
    brand, price, currency, category, color chips, notes) → save; graceful
    manual fallback. Wired into the header.
- Fixed two seed bugs found via runtime testing: category assignment only hit
  3 of 6 categories; color stepping missed half the palette. Now all 6
  categories and all 15 filter colors have items.
- Tests: parser (6) + guards (8) added → **28 unit tests** total.

**Verification**: `lint`, `typecheck`, `test`, `build`, and runtime smoke
tests (every filter returns correct results; clip API auth guard returns 401)
all pass.

**Next**: Phase 3 — collection CRUD and the drag-and-drop centerpiece.

## 2026-06-25 — Phase 3: Collections + Drag & Drop ✅

**Done**

- **Collection CRUD**: `/collections` (owner's closets, create dialog, empty
  state) and `/collections/[id]` (board detail). Server actions
  (`lib/actions/collections.ts`): create / update / delete / addItem /
  removeItem / reorder / move-or-copy — all ownership-checked and Zod-validated,
  writing `created_collection` / `added_item` activity events.
- **Drag & drop centerpiece** (`@dnd-kit`):
  - Drag products from a live **catalog panel** (TanStack Query → `/api/catalog`)
    onto the board to add them (optimistic, with dup guard).
  - Reorder items within the board (SortableContext, persisted via `position`).
  - Drag a board item onto another closet to **move** it; hold **Alt** to **copy**.
  - DragOverlay preview, drop-zone highlighting, empty-board prompt.
  - Touch sensor (press-delay) for mobile + KeyboardSensor for accessible
    reordering.
- Queries (`lib/queries/collections.ts`): list, detail (ordered items),
  options, plus `canViewCollection` visibility logic (public/friends/private).
- **Minimal dev login** pulled forward to make the phase demoable: `/login`
  with one-click demo accounts + email/password (bcrypt). Full auth/profiles
  land in Phase 4.
- Collection cards, edit/delete header actions with confirm dialog.

**Verification**: `lint`, `typecheck`, `test` (28), `build` pass. Runtime smoke:
unauth `/collections` → redirect to login; authed board renders editor + catalog
panel; `/api/catalog` returns JSON. **Real-browser Playwright check confirmed
drag-to-add adds an item to the board.**

**Next**: Phase 4 — full auth (signup, handle selection, profile pages + edit),
and visibility enforcement on profiles.

## 2026-06-25 — Phase 4: Auth + profiles ✅

**Done**

- **Signup** (`/signup`): name + unique handle (validated 3–20 `[a-z0-9_]`) +
  email + password (bcrypt), auto-signs-in. Handle/email uniqueness enforced.
- **Login** now links to signup; **Google OAuth** button appears only when
  `GOOGLE_CLIENT_ID` is set, wired to a documented `/api/oauth/google` **stub**
  (501 with guidance) — app stays fully usable via dev login without OAuth.
- **Profile pages** (`/u/[handle]`): avatar, name, handle, bio, and live counts
  (items / closets / followers / following); shows only collections the viewer
  is allowed to see (visibility enforced).
- **Edit profile** dialog (name, handle, bio, avatar) with handle-uniqueness
  check; redirects when the handle changes.
- **Follow/unfollow** pulled in alongside profiles (`lib/actions/social.ts` +
  optimistic `FollowButton`), writing `followed` activity events. The rest of
  the social layer (feed, likes, comments, re-save, follower lists) is Phase 5.
- Verified visibility enforcement: a private closet is hidden from other viewers
  on the owner's public profile.

**Verification**: `lint`, `typecheck`, `test` (28), `build` pass; runtime smoke
of profile (self vs viewer), signup, follow button, OAuth stub, and private-
collection hiding all pass.

**Next**: Phase 5 — activity feed, likes, comments, re-save, follower/following
lists.

## 2026-06-25 — Phase 5: Social layer ✅

**Done**

- **Activity feed** (`/feed`): chronological activity from people you follow,
  with actor avatars, human-readable text per verb (created closet / added item
  / followed / liked / commented), relative timestamps, thumbnails, and deep
  links. Batched collection lookup avoids N+1. Friendly empty state.
- **Likes & comments** on collections (`CollectionSocial`): optimistic like
  toggle with live count, comment list with relative times, add-comment form,
  delete-own-comment. Backed by `toggleLike` / `addComment` / `deleteComment`
  actions that also write `liked` / `commented` activity events.
- **Re-save**: `SaveToClosetButton` (dropdown of your closets + "new closet")
  added to non-owned collection items **and** the catalog grid, so you can pull
  anyone's item into your own board. Reuses `addItemToCollection`.
- **Follower / following lists** (`/u/[handle]/followers`, `/following`) with
  follow buttons; profile counts now link to them.
- `/api/my/collections` powers the save-to picker.

**Verification**: `lint`, `typecheck`, `test` (28), `build` pass; runtime smoke
of feed, follower/following lists, and the my-collections API; **real-browser
check confirmed like-toggle and comment posting work**.

**Next**: Phase 6 — responsive/mobile polish, empty/loading/error states,
accessibility, 404/500, SEO.
