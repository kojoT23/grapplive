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

Everything in this section stems from one root cause: **the app has a real
session layer (`useAppStore`: phone, OTP verification, `shop`/`sell`/
`grapplive_staff` roles) that is completely disconnected from the
Seller/Store/Product/Customer data layer.** Picking "Sell" at
`/auth/role-selector` only sets `activeRole = "sell"` on the session — it
never creates a `Seller` or `Store` record, and never links the verified
phone number to a seller id. Meanwhile every seller-facing page
(`/products`, `/storefront`, `/storefront/go-live`, `/dashboard`) hardcodes
`const CURRENT_SELLER_ID = "s1"`, independent of who's actually signed in.

**Practical consequence today:** any phone number that verifies and picks
"Sell" lands inside the *same* seller's real dashboard and can edit/delete
`s1`'s actual inventory. There is currently no per-seller data isolation
in the frontend's own logic — this is not just "no backend yet," the
client-side data flow itself doesn't distinguish sellers.

### 1.1 🔴 No Seller/Store record is created on signup
`/auth/role-selector` → `addRole("sell")` never creates a `Seller` or
`Store`. Needs: on first "Sell" selection, generate a real seller id tied
to `useAppStore.phone`, create a `Store` record (via `useStoreProfileStore`
or equivalent), and replace every hardcoded `CURRENT_SELLER_ID` with a
derived "current authenticated seller" value. This is the fix that makes
"add another seller" actually mean something in the frontend, ahead of any
backend work.

### 1.2 🔴 Seller identity is reconstructed from `Product[0]`, not its own record
`sellers.ts`'s `getSellerById` filters `catalogProducts` by `sellerId` and
reads `sellerName`/`sellerOrdersCompleted`/`sellerReplyTime` off whichever
product happens to be first in that filtered list. There is no `Seller`
table — a seller's identity is denormalized *onto every product row*
instead of the other way around. A seller with zero products (a normal
state: brand new signup, or they delete everything) currently resolves to
`undefined` — they stop existing. Needs: `Seller` as its own record;
products reference it by id, never the reverse.

### 1.3 🔴 `Order` has no buyer identity field at all
`Order`/`OrderGroup` (in `lib/mock-data/orders.ts`) have no `buyerId` or
`buyerPhone` anywhere. Orders aren't scoped to anyone. Same root issue as
1.1, mirrored on the buyer side.

### 1.4 🔴 `Customer` (CRM) is disconnected from `Order` and unscoped to any seller
`useCustomersStore`'s `Customer` type has its own hand-typed
`orderHistory: CustomerOrder[]` field that duplicates order-shaped data
instead of being *derived from* real `Order` rows — and per 1.3, there's
currently no buyer id on `Order` to join against even if it tried. It's
also not scoped to a seller at all (not even a hardcoded constant, unlike
the other seller-facing stores) — there's no drawn boundary for "this
seller's customers" vs. "that seller's customers."

**Open design decision, not yet made either way:** is a `Customer` record
global (one buyer, referenced by every seller who's sold to them) or
per-seller (each seller's own private tags/notes about a buyer, layered on
a shared underlying buyer identity)? Real CRM tools do the latter — your
notes about a buyer are private to your relationship with them. Worth
deciding deliberately before a `customers` table gets designed around the
wrong assumption.

### 1.5 🔴 Seller contact info exists in two different shapes
`SellerSocials` (whatsapp/signal/telegram/tiktok/instagram) is denormalized
onto every `CatalogProduct`. `StoreSocials` (whatsapp/instagram/tiktok/
facebook — a *different* field list) lives separately on `Store`. Two
types, two sources of truth, for what's conceptually one seller's contact
info. If a seller updates their WhatsApp number, neither is authoritative
today. Needs: one `SellerContact`/`StoreSocials` shape, owned by `Store`
(per 1.2, `Store`/`Seller` should be the source of truth other things
reference, not the reverse), matching sub-fields.

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

### 2.2 🟡 `status` and `stockCount` can silently disagree
`CatalogProduct.status` (`live`/`draft`/`out_of_stock`/`paused`) is a field
the seller manually picks; `stockCount` is a separate number nothing keeps
in sync. A product can sit at `stockCount: 0` while still marked `status:
"live"`. Also inconsistently exposed: the "add product" form doesn't offer
`out_of_stock` as a choice, the "edit product" form does — a symptom of
the underlying rule (manual vs. derived) not being decided yet.

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
2. **Resolve section 1 before writing any backend schema** — specifically
   1.1 (seller creation on signup) and 1.4's open design question
   (global vs. per-seller `Customer`), since those are the two decisions
   most likely to force a table redesign if made implicitly instead of
   deliberately.
3. **Section 4 items ride along with the backend migration itself** — not
   separate work, just don't port the client-generated-id scheme (4.2) or
   the fixture-number aggregates (4.3) as-is.
4. **Section 3 stays deferred** exactly as your own phase list already
   sequences it — this document doesn't argue for reordering that.
5. **Section 5 (cosmetic)** — whenever convenient, no urgency.
6. **Section 8 items are already done** — listed for the record, not as
   remaining work.
7. **Section 9 needs your input, not more auditing** — each item there is
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

---

## 9. UI completeness — buttons with no handler

Full-app sweep for `<button>` elements with no `onClick`. Five buttons
found (ProductActions.tsx's three are covered in 8.5, resolved by
deletion, not listed again here). Each of the following needs a product
decision, not a default guess — none were touched.

### 9.1 🟢 `/discover` — Heart/Comment/Share are dead on a single-story mockup
The whole page is one hardcoded "Adjoa Beauty" story with no real feed
behind it — not just these three buttons. Wiring up a fake like counter
wasn't done on purpose: a fabricated "1.2k likes" is exactly the
"unnecessary social gamification" AGENTS.md §35 already warns against.
**Needs a decision:** is `/discover` becoming a real short-video feed, or
was it a design exploration not actually on the roadmap? That decides
build-it vs. delete-it.

### 9.2 🟢 Home page's "Accra" button — dead location selector
No delivery-location switching exists behind it. Likely a real feature
for a Ghana-wide marketplace, but building it means deciding which
cities/areas are supported and what it actually affects (search results?
delivery cost? nothing yet?) — a product-scope question, not a wiring fix.

### 9.3 🟢 Analytics "Last 7 days" dropdown — dead, and would show the same numbers if wired up
`revenueGHS7Day` and friends are static fixture numbers with no variation
by time range yet — wiring the dropdown to switch ranges wouldn't
actually show different data today. Lower priority until there's real
data behind it.
