# GRAPPlive — Pre-Backend Roadmap

Companion to `AGENTS.md` (product/UX spec). This document is an engineering
audit of the current frontend-only prototype (Next.js + Zustand +
localStorage, no backend, no database, no real auth) — written to catch
data-model mistakes while they're still just TypeScript types, before a
real schema exists and every fix becomes a migration.

Each item is marked:
- 🔴 **Fix before backend** — cheap now, expensive (schema migration /
  data-loss risk) if left until after tables exist.
- 🟡 **Live bug** — broken today, independent of backend timing.
- 🟢 **Deliberately deferred** — correctly unstarted per AGENTS.md's own
  phase sequencing, listed here so it's a documented decision, not a gap
  discovered by surprise later.
- ⚪ **Cosmetic** — zero functional impact, cheap whenever convenient.
- ✅ **Resolved** — fixed, with the commit that fixed it.

---

## 1. Identity & scoping — the critical section

Everything in this section stems from one root cause: **the app had a real
session layer (`useAppStore`: phone, OTP verification, `shop`/`sell`/
`grapplive_staff` roles) that was completely disconnected from the
Seller/Store/Product/Customer data layer.** Picking "Sell" at
`/auth/role-selector` used to only set `activeRole = "sell"` on the
session — it never created a `Seller` record, and never linked the
verified phone number to a seller id. Every seller-facing page
(`/products`, `/storefront`, `/storefront/go-live`, `/dashboard`) hardcoded
`const CURRENT_SELLER_ID = "s1"`, independent of who was actually signed
in.

**Status: 1.1, 1.4, and 1.5 (type half) are resolved.** A real, isolated
seller identity gets created the moment a new phone picks "Sell,"
Customer records are properly per-seller, and seller contact info is one
consistent shape, and the storefront profile (about/socials/logo/banner)
is per-seller too. What's still open is narrower and backend-blocked:
1.2 (`Seller` as its own backend-ready record) and 1.3 (`Order` buyer
identity — itself needed before 1.4's `orderHistory` can become real).

### 1.1 ✅ Resolved — no Seller record was created on signup
`/auth/role-selector` → `addRole("sell")` used to never create a seller
identity at all. Fixed: new `lib/store/useSellerIdentityStore.ts`, a
persisted phone → seller id mapping, created the moment a phone picks
"Sell" for the first time. The first phone to do so in a browser inherits
the demo seller ("s1") and its fixture data, so nothing broke for
existing sessions; any different phone after that gets a genuinely new,
empty identity instead of silently sharing s1's data. Signup also gained
the one field it was missing to make this real — a shop name, prompted
for only when creating a new (non-demo) identity. Every hardcoded
`CURRENT_SELLER_ID = "s1"` across the seller-facing pages now resolves
dynamically via `useCurrentSellerId()` / `getCurrentSellerIdSync()`.
*Commit: "Create a real seller identity on signup (ROADMAP.md §1.1)."*

**Follow-up, now also resolved:** `useStoreProfileStore` (about/socials/
logo/banner) still only represented one seller after the pass above — a
second seller on the same device would have seen and overwritten the
first one's storefront profile. It was left open deliberately, and was
then wrongly described as needing a backend; it doesn't, it's client-side
keying exactly like `useSellerIdentityStore`. Fixed: state is now
`profiles: Record<sellerId, ...>`, components read it through
`useCurrentStoreProfile()`, and persisted data migrated (version 1) so
anyone with the old flat shape keeps their edits under the demo seller.
8 tests cover seeding, per-seller isolation and the migration. *Commit:
"Make the storefront profile store per-seller (ROADMAP.md §1.1
follow-up)."*

**Also closed, same area:** `/live/[id]` used to resolve a session's
pinned product from the static fixture list, so a product created after
the app shipped got no working "View product" link on the buyer's side.
It now resolves against the reactive catalog store. *Commit: "/live/[id]
resolves its pinned product from the reactive catalog store."*

### 1.2 🔴 Seller identity is reconstructed from `Product[0]`, not its own record
`sellers.ts`'s `getSellerById` filters `catalogProducts` by `sellerId` and
reads `sellerName`/`sellerOrdersCompleted`/`sellerReplyTime` off whichever
product happens to be first in that filtered list. There is no `Seller`
table — a seller's identity is denormalized *onto every product row*
instead of the other way around. A seller with zero products (a normal
state: brand new signup, or they delete everything) currently resolves to
`undefined` — they stop existing. Needs: `Seller` as its own record;
products reference it by id, never the reverse.

**Partially addressed by 1.1, not fully:** a new seller's own
`name`/`ordersCompleted`/`replyTime` now come from the real identity
record (`useSellerIdentityStore`), not `Product[0]` — so a brand-new
seller adding their first product correctly stamps their own name onto
it, not "undefined" or s1's. `getSellerById` itself is unchanged, though,
and still can't resolve a seller who exists only in
`useSellerIdentityStore` with zero products yet. The seller-owned pages
(their own `/storefront`, `/products`) already degrade gracefully via
existing `seller?.` fallbacks. Their buyer-facing public profile
(`/seller/[newId]`) will correctly 404 for now, and that specific part
isn't a frontend bug to fix — a seller who only exists in their own
browser's localStorage genuinely can't be visible to a buyer on a
different device without a backend. That's the real remaining shape of
this item: `getSellerById` reading from a real `Seller` table instead of
`catalogProducts`, which only makes sense once that table exists
server-side.

### 1.3 🔴 `Order` has no buyer identity field at all
`Order`/`OrderGroup` (in `lib/mock-data/orders.ts`) have no `buyerId` or
`buyerPhone` anywhere. Orders aren't scoped to anyone. Same root issue as
1.1, mirrored on the buyer side.

### 1.4 ✅ Design decision made and applied — `Customer` scoping
**Decision:** per-seller, not global. Matches industry precedent exactly —
Shopify, Etsy, and standard B2B CRM tools (Salesforce, HubSpot) all scope
customer/contact data to one seller's relationship with a buyer, never
shared across sellers on the same platform, even though the underlying
buyer identity is shared. The reasoning carries over directly: privacy (a
buyer's relationship with one business isn't every business's to see) and
competitive separation (GRAPPlive sellers are often direct competitors —
letting one see another's tags/notes on a shared buyer would hand over
competitive intelligence). The buyer *identity* stays global — see 1.3 —
it's the relationship data (tags, notes, this-seller's-view-of-their-order-
history) that's per-seller.

**Applied:** `Customer` gained `sellerId`; `/customers` and
`/customers/[id]` now scope and ownership-check against
`useCurrentSellerId()`, same pattern as products. *Commit: "Scope Customer
records to a seller (ROADMAP.md §1.4 decision applied)."*

**Still open, and this is the real remaining shape of 1.2/1.4 together:**
`useCustomersStore`'s `orderHistory` is still hand-typed fixture data, not
derived from real `Order` rows — because per 1.3, `Order` has no buyer id
to join against yet. A real `Customer` becomes a `(sellerId, buyerId)`
pair with a *computed* view over that seller's real orders with that real
buyer — not a stored `orderHistory` field at all. That depends on 1.3
landing first, which depends on a backend existing.

### 1.5 ✅ Resolved (type), still open (data) — seller contact info existed in two different shapes
`SellerSocials` (whatsapp/signal/telegram/tiktok/instagram) was
denormalized onto every `CatalogProduct`. `StoreSocials` (whatsapp/
instagram/tiktok/facebook — a *different* field list) lived separately on
`Store`. Fixed the type half: `StoreSocials` is now a type alias for
`SellerSocials` (which gained `facebookHandle`), so there's one shape
instead of two mismatched ones — the one existing import site
(`useStoreProfileStore.ts`) didn't even need to change. *Commit: "Merge
SellerSocials and StoreSocials into one type (ROADMAP.md §1.5)."*

**Still open, same root cause as 1.2:** the *data* is still denormalized
onto both `Product` and `Store` separately — if a seller updates their
WhatsApp number today, neither copy is authoritative, just consistently
shaped now. Properly fixing that means `Store`/`Seller` becoming the one
source of truth other things reference, which depends on 1.2 (`Seller` as
its own record) landing first.

---

## 2. Live bugs (independent of backend timing)

### 2.1 ✅ Resolved — `useCustomersStore` isn't persisted
No `persist` middleware, no `hasHydrated` — unlike every other store in
this codebase. Every tag added, every note typed into a customer's profile
in the CRM UI was lost on page reload. Fixed: wrapped in `persist()` +
`safeJSONStorage`, matching every other store; `selectedIds`/
`isSelectMode` deliberately excluded from persistence via `partialize`
(bulk-select UI state, not data worth surviving a reload — and `Set`
doesn't serialize to JSON cleanly anyway). Also fixed a related latent
bug found while wiring this up: `/customers/[id]`'s `notesDraft` field
would have locked onto the pre-hydration (empty) notes value and never
resynced. *Commit: "Persist useCustomersStore — CRM tags/notes no longer
lost on reload."*

### 2.2 ✅ Resolved — `status` and `stockCount` could silently disagree
`CatalogProduct.status` was a field the seller manually picked;
`stockCount` a separate number nothing kept in sync — a product could sit
at `stockCount: 0` while still marked `status: "live"`. Resolved the
underlying question (manual vs. derived) in favor of derived:
`useCatalogStore`'s `normalizeStatus` now enforces it on every write — a
live product that hits zero stock auto-flips to `out_of_stock`,
restocking auto-flips it back to `live`. `draft`/`paused` stay fully
seller-controlled regardless of stock level. This also explains, rather
than needing to fix, the other half of the original finding: the two
forms' manually-selectable status options not matching is fine now that
`out_of_stock` is never meant to be a manual choice on either one.
*Commit: "status and stockCount can no longer silently disagree
(ROADMAP.md §2.2)."*

---

## 3. AGENTS.md §32 entities with no implementation yet

Confirmed via full-repo search — genuinely zero code, not just hard to
find. Most of these are correctly sequenced for later per AGENTS.md's own
phase list (§29-ish "Phase 1 — Commerce foundation"), so this section is
**not a bug list** — it's a documented confirmation of what's deliberately
not started, so nothing here is discovered as a surprise gap later.

- 🟢 **Notification** — no store, no UI, despite AGENTS.md §34 already
  speccing notification behavior in the abstract.
- 🟢 **Dispute** — no implementation.
- 🟢 **Verification (as a flow)** — `VerifiedTier` exists as a display
  badge (`verified_producer` / `trusted_import` / `top_seller`), but
  there's no seller-facing "apply for verification" / document-submission
  flow behind it yet.
- 🟢 **Promotion, Preorder, GroupBuy, Affiliate, Commission** — zero
  implementation. All later-phase per your own document.
- 🟡/🟢 **Rider** — `OrderGroup.riderName` is a bare string, not a real
  Rider account/entity. Fine for now (delivery is listed as "Coming soon"
  in the role selector itself), flagged so a real `Rider` table isn't
  designed as an afterthought when delivery work actually starts.

---

## 4. Data integrity / linkage gaps in what does exist

### 4.1 🟡/🟢 Reviews aren't linked to real orders or accounts
`Review.authorName` is a plain string; `verifiedPurchase` is a static
boolean, not derived from an actual matching `Order`. Lower priority than
section 1 — there's no review-*submission* flow yet (confirmed: no
"write a review" UI anywhere), so this is currently pure read-only fixture
display. Worth fixing at the same time a submission flow gets built, not
before.

### 4.2 ⚪→🔴 (later) All record ids are client-generated, sequential, per-store
`p1`/`p2`... (products), `o1`/`o2`... (orders), `req1`/`req2`... (buyer
requests), `po-req-<timestamp>-N` (payouts) — each store keeps its own
"highest existing suffix + 1" counter. Fine for a single device today;
will collide the moment two people create records concurrently against a
shared backend. Not urgent to change now (nothing to change it *to* yet),
but the ID scheme should become backend-issued (UUID/ULID) as part of the
backend migration, not ported as-is.

### 4.3 🟢 `unitsSold` is a static fixture number, not a computed aggregate
Added during the catalog unification, explicitly commented as a
placeholder for "Best Selling" sorting. In a real system this must be
computed from real `OrderItem` rows, never stored/incremented as a column
sellers or buyers could influence directly.

### 4.4 🟢 Per-variant stock isn't modeled
`ProductColorVariant` is just `{ label, hex }` — one shared `stockCount`
covers the whole product, so "12 in Kente-print, 0 in plain black" isn't
representable. May genuinely not matter for MVP depending on how your
sellers actually manage stock — flagged as a decision, not a defect.

---

## 5. Cosmetic

### 5.1 ⚪ Inconsistent localStorage key naming
Roughly half the persisted stores use `"grapplive-*"`, the other half
`"grapplelive-*"` (extra "le") as their storage key prefix — a leftover
from an earlier project name, evidently not fully migrated:

| `grapplive-*` (short) | `grapplelive-*` (long) |
|---|---|
| useCatalogStore, useLiveSessionStore, usePayoutsStore, useStoreProfileStore | useAppStore, useOrdersStore, useFollowingStore, useGrappStoreCartStore, useWishlistStore, useCartStore |

Zero functional impact (each key is internally consistent, no collisions)
— purely worth a cleanup pass whenever convenient, ideally before real
users' localStorage has either spelling baked into it.

---

## 6. What's already right — don't second-guess these in a redesign

- **`Order` → `OrderGroup` → `OrderItem`** correctly *snapshots*
  `itemName`/`priceGHS`/`sellerName` at the moment of purchase rather than
  re-deriving them live from the current product/seller record. This is
  the right call — an order should always show what was actually paid,
  even after a price changes or a seller renames their store. Don't
  "normalize this away" by mistake later; it's intentional denormalization
  for historical accuracy, a different (correct) use of the pattern that
  section 1 flags as wrong elsewhere.
- **`Product.sourceType`** (`"marketplace" | "grapplive"`) cleanly
  separates GrappStore-owned inventory from seller-listed inventory,
  matching AGENTS.md §40 exactly.
- **The `hasHydrated` pattern** is applied consistently across every
  persisted store (except 2.1, which should simply adopt it) — a real,
  deliberate guard against server/client render mismatches, not
  boilerplate to trim.
- **`usePayoutsStore`** is honestly modeled as a mock — comments say
  outright "does not move real money," and it zeroes the visible balance
  on request rather than computing anything that could be mistaken for
  real settlement logic. Matches AGENTS.md §8's instruction to model
  payment/settlement as backend-owned even in prototype form.

---

## 7. Suggested sequencing

1. **2.1 is done** — was the live bug, fixed first, ahead of everything
   else in this document.
2. **1.1 is done** — real seller identity on signup, every seller page
   scoped dynamically instead of hardcoded.
3. **Resolve the rest of section 1 before writing any backend schema** —
   specifically 1.2 (`Seller` as its own record), the backend-dependent
   half of 1.4 (real `(sellerId, buyerId)`-derived order history, which
   needs 1.3 first). The `useStoreProfileStore` follow-up is done.
4. **Section 4 items ride along with the backend migration itself** — not
   separate work, just don't port the client-generated-id scheme (4.2) or
   the fixture-number aggregates (4.3) as-is.
5. **Section 3 stays deferred** exactly as your own phase list already
   sequences it — this document doesn't argue for reordering that.
6. **Section 5 (cosmetic)** — whenever convenient, no urgency.
7. **Section 8 items are already done** — listed for the record, not as
   remaining work.
8. **Section 9 needs your input, not more auditing** — each item there is
   a product decision (build it, or delete the dead UI), not something to
   guess at.

---

## 8. Performance & reliability — resolved this pass

Found and fixed together, since #1 was a risk introduced by the product-
photo feature itself and the other three are what stops that class of
failure from ever reaching the user again.

### 8.1 ✅ Resolved — uploaded photos were stored uncompressed
Product photos and storefront logo/banner were stored as raw base64 —
routinely 3-8MB per phone photo, up to 4 photos per product. localStorage
caps out around 5-10MB **per origin, total**, shared across every
persisted store (cart, wishlist, orders, the whole catalog) — a single
product with max-size photos could have exceeded the entire quota and
broken every other store sharing it, not just uploads. Fixed by resizing
to 900px on the long edge and re-encoding as JPEG before anything gets
stored (`lib/utils/image-upload.ts`'s `compressImageFile`) — roughly a
10x reduction on a typical phone photo. *Commit: "Compress uploaded
photos before storing them."*

### 8.2 ✅ Resolved — a full localStorage quota would have crashed the app
Zustand's default storage adapter throws on quota-exceeded or a blocked
store (private browsing). Uncaught, mid-render, with zero error
boundaries anywhere (see 8.3) — that's a real path to a white screen over
something as small as one too many photos. Fixed with
`lib/utils/safe-storage.ts`, a wrapper that catches read/write failures
so a failed persist just doesn't survive a reload, rather than crashing
the page. Applied to all 10 persisted stores. *Commit: "Make every
persisted store survive a localStorage quota/corruption error."* Prototype-
phase safety net only — see 4.2/section 1 for the real fix (this data
shouldn't be in localStorage at all once a backend exists).

### 8.3 ✅ Resolved — zero error boundaries anywhere in the app
Confirmed via full search: no `error.tsx`, `global-error.tsx`, or
`loading.tsx` in `app/`. Any unhandled render error had nowhere to land —
likely a blank white screen, worst possible failure mode for a commerce
app mid-checkout or mid-payout. Fixed: `app/error.tsx` (route-level,
styled to match the existing `not-found.tsx`) and `app/global-error.tsx`
(root-layout-level fallback). *Commit: "Add app-wide error boundaries
(none existed before)."*

### 8.4 ✅ Resolved — hardcoded hex duplicating an existing design token
Five files hardcoded `bg-[#0B0B0B]` instead of the already-defined
`--color-gl-text` token (same value). Zero visual change, just means a
future palette tweak happens in one place instead of drifting across
five. *Commit: "Use the existing gl-text token instead of hardcoding its
hex value."* Not re-audited beyond this one duplicate — a full pass for
other hardcoded values wasn't done.

### 8.5 ✅ Resolved — an entire orphaned component
`app/(buyer)/product/[id]/ProductActions.tsx` (Add to cart / Checkout /
Request video call / WhatsApp-TikTok-Instagram buttons) was never
imported or rendered anywhere — `page.tsx` already fully reimplements the
same functionality inline, correctly. Deleted the dead file rather than
"fixing" buttons in code nothing runs. *Commit: "Remove orphaned
ProductActions.tsx and an unused variable."*

### 8.6 🟢 Not yet done — real image storage
8.1's fix reduces the risk, doesn't remove it. A determined seller
uploading many products with max-size photos could still eventually
approach the quota. Real fix stays what section 1/4.2 already say: images
belong in real object storage (S3-compatible / Cloudinary) with a CDN,
not localStorage, once a backend exists.

### 8.7 ✅ Resolved — five lists rendered unbounded
Found in the frontend-vs-market-players audit: the home page's full
catalog grid, search results, category pages, the seller's CRM customer
list, and the seller's own product list all rendered their entire array
at once. Harmless at ~13 fixture products; a real problem at the catalog
size this product is meant to reach. Fixed with `usePagedList` (20 per
page, "Load more") — shared hook, shared `LoadMoreButton`, and a shared
`PagedProductGrid` for the three buyer-facing pages. Deliberately simple
client-side slicing, not virtualization — real virtualization or
server-side paging only makes sense once a backend serves genuinely paged
data. *Commit: "Paginate every unbounded list render (20 per page, Load
more)."* Not covered by an automated test (hook testing needs
`@testing-library/react`, same gap as §10.1).

### 8.8 🟢 Not fixable yet — placeholder product photos
Outside photos a seller has uploaded since the photo feature shipped,
every product renders the woven-texture placeholder. Against Jumia /
TikTok Shop / Instagram Shopping — fundamentally visual-first — this is
the single biggest appearance gap. It's a content problem, not a code
one: the upload capability exists (see 8.1). It needs real seller
photos. Deliberately not "fixed" with stock imagery: that would
misrepresent what's actually being sold, and raises its own sourcing
problems.

### 8.9 🟢 Not fixable yet — `next/image` runs `unoptimized`
Most `<Image>` usages pass `unoptimized`, bypassing Next's resizing and
format conversion. Unavoidable while photos are base64 data URLs in
`localStorage` — nothing exists to optimize *to*. Resolves with 8.6 once
real image hosting exists, at which point the flag should come off.

### 8.10 ⚪ Checked, no action needed — typography
Audited because tallying font sizes showed ~600 usages at 9-12px. Checked
the surface that matters: `ProductCard`'s price renders at 15px bold and
the product name at 11.5px (two-line clamped), in line with compact
grid-card conventions on comparable apps. The very small text is mostly
seller-dashboard labels/metadata, where it's less of a problem. No
change made — "fixing" it without an identified problem risked a visual
regression for no gain. Worth a lighter design pass eventually; not a
defect.

---

## 9. UI completeness — buttons with no handler

Full-app sweep for `<button>` elements with no `onClick`. Five buttons
found (ProductActions.tsx's three are covered in 8.5, resolved by
deletion, not listed again here). All three remaining items below are
now resolved — two by explicit decision, one by a direction given.

### 9.1 ✅ Resolved — `/discover`'s fake engagement numbers
The "1.2k" likes / "86" comments next to Heart/Comment were hardcoded,
fabricated numbers — exactly the "unnecessary social gamification"
AGENTS.md §35 warns against. Removed them. Heart is now a genuinely
honest per-viewer toggle (makes no claim about anyone else's behavior);
Share reuses the real native-share pattern already built for the
storefront; Comment has no `onClick` — there's no comment system to
honestly back it, so it stays a plain icon rather than a dead button
pretending otherwise. *Commit: "Resolve all three ROADMAP.md §9 items —
real GPS location, two honest fixes."*

**Still open, deliberately not decided here:** whether `/discover`
becomes a real short-video feed or gets retired — that's a bigger product
call than the fake-numbers fix, and wasn't part of what was settled.

### 9.2 ✅ Resolved — home page's "Accra" button is now real GPS-based location
**Direction given:** automatic detection via GPS, reflecting that
delivery can't cover everywhere at once. Built exactly that:
`lib/mock-data/serviceAreas.ts` holds the real, grounded set of areas
(Accra, Tema, Kumasi, Tamale — the exact union already present across
every seller's `Store.deliveryAreas`, not an invented list), matched via
haversine distance with an 80km coverage radius. Outside that radius is
honestly shown as out-of-coverage, not silently snapped to the nearest
city anyway. `useLocationStore.ts` persists the result; denied/
unsupported/out-of-coverage GPS all fall back to a manual picker of the 4
known areas.

### 9.3 ✅ Resolved — analytics date-range dropdown
Converted to a plain label. Wiring up a real dropdown would have shown
the same numbers regardless of what's picked — `revenueGHS7Day` and
friends are static fixtures with no per-period data yet — so a label is
the honest version of what's actually there. Real period-switching can
come back once there's real timestamped order data to compute different
ranges from.

---

## 10. Test coverage

### 10.1 ✅ Resolved — zero automated tests existed until this pass
Every fix logged as ✅ in this document up to this point was verified by
reading the code and running a manual `next build` — real verification,
but it only holds up for one continuous session by one careful reviewer.
It doesn't survive a team, a gap of months, or someone who didn't read
the reasoning in this document touching the code later. Good
documentation of *why* a decision was made (this file) isn't the same as
*enforcement* that it stays true.

Added Vitest + 37 tests (45 now), scoped deliberately to pure business-logic in
the stores this session actually built or changed — not component/UI
tests, which need heavier setup (testing-library, DOM rendering) for
lower return at this stage:
- `lib/utils/safe-storage.test.ts` — the §8.2 guarantee (a storage
  failure degrades, never throws).
- `lib/store/useCatalogStore.test.ts` — the §2.2 status/stockCount
  normalization rule, in both directions.
- `lib/store/useSellerIdentityStore.test.ts` — the §1.1
  demo-seller-inheritance rule, specifically the actual bug it fixes (a
  second phone must not inherit the first seller's identity).
- `lib/store/useCustomersStore.test.ts` — tag/notes correctness, and that
  `partialize` is actually excluding selection UI state from what's
  written to storage, not just configured to look like it does.
- `lib/store/useStoreProfileStore.test.ts` (added later, 8 tests) — the
  per-seller storefront profile: seeding, isolation between sellers, and
  the migration from the old single-seller shape.

`npm test` runs the suite once (CI-style); `npm run test:watch` for active
development. *Commit: "Add a test suite — Vitest, 37 tests across the
logic built this session."*

**Not yet covered, real gaps:** component/UI tests (nothing rendering an
actual page or form yet — a regression in, say, the product image
uploader's slot logic wouldn't be caught by anything here), the
seller-ownership checks added across `/products/[id]` and
`/customers/[id]` (that a mismatched sellerId correctly returns "not
found"), and no CI wiring yet — these tests only run when someone
remembers to run `npm test` locally, which is the same "depends on a
careful human" problem this section exists to start moving away from.
