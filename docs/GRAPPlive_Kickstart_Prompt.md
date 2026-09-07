# GRAPPlive — Kickstart Prompt (Post-AGENT.md Update)

Paste this at the start of a new session (chat or Claude Code) to bring Claude up to speed and begin execution.

---

## What this project is

**GRAPPlive** is a Ghana-first live-commerce marketplace: AliExpress-style browsing, Shopee/TikTok Shop-style live and 1:1 video selling, MoMo-first payments, a seller CRM/dashboard, and — as of this update — **GrappStore**, GRAPPlive's own first-party official retail arm.

**GRAPPlive's core thesis**: most sellers already sell through TikTok, Instagram, and WhatsApp Status. GRAPPlive isn't trying to replace those channels — it gives sellers what they're missing: a real CRM, Mobile Money integration, and a trustworthy checkout/delivery/payment-confirmation pipeline, none of which TikTok's commerce tools offer in Ghana.

This is currently a **Phase 0 frontend-only prototype** — no real backend, database, payments, auth, or video calling. Every screen uses realistic mock/fixture data and real client-side state (Zustand), built to production-code quality but backed by fixtures instead of a server.

## Reference documents (attached / referenced this session)

1. **`AGENT.md`** (updated this session) — the durable product constitution: principles, five user types, information architecture, data model, order/payment/delivery state machines, MVP phasing, and now §40–42 covering GrappStore, the renamed seller badge system, and the split-settlement order model. **Read this in full before making product or architecture decisions.**
2. **Ghana Social Commerce UX Master Prompt** — the fuller narrative UX/product-strategy brief AGENT.md was distilled from. Useful for buyer/seller/creator/rider/admin journey detail not fully repeated in AGENT.md.
3. **`GRAPPlive_Handoff_Prompt.md`** (prior session) — describes what's actually built so far: routes, screens, shared stores, known constraints. Still accurate for what exists in code today, except where this document below explicitly supersedes it (GrappStore naming/scope, order data model).
4. **Concept & Go-To-Market Plan**, **Tech Stack & Roadmap**, **Master Brief**, **GRAPPLIVE_Frontend_Build_Prompt.md** — original planning docs referenced in the prior handoff; consult if anything below is ambiguous. Note: these originally used the name "BITZ LIVE" — treat every mention as GRAPPlive.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS **v4** (`@theme` block in `app/globals.css`, no `tailwind.config.ts`) |
| State | Zustand (`persist` middleware for anything that should survive refresh) |
| Icons | `@tabler/icons-react` |
| Target | Mobile-first, ~375px–428px primary, `md:` breakpoint for tablet widening; **no desktop layout, ever** |
| Repo name | `grapplive` |
| Package manager | npm |

**Brand colors** (`app/globals.css` `@theme`, exposed as `bg-gl-brand` etc.):
Brand/action `#D6127A` · Green (good/complete) `#0B6E4F` · Amber (caution/pending) `#BA7517` · Red (urgent + Live indicator only) `#C8102E` · Navy (informational label only) `#2C2C6E`. No ethnic-specific symbols/patterns — plain warm English, modern/international-first visual language.

---

## What's already built (per prior handoff — verify against current repo state)

- Auth flow (signup → OTP → role selector), dual-role model (`shop`/`sell`), guest browsing with `useAuthGate()`
- Buyer: Home, Product page, Discover, Live broadcast, Cart, Checkout, Categories/Category filter, Search, Seller profile, Account (orders, wishlist, following — rewards not yet built)
- Seller: Dashboard, Orders, Products (list only — add/edit not built), Customers, Payouts, Analytics
- Shared: `useOrdersStore` (currently flat, one order → one seller), `useCartStore`, `useWishlistStore`, `useFollowingStore`, `useAppStore`, `catalog.ts`, `sellers.ts` (derived, not persisted), `ProductCard`, `TabBar`

---

## Decisions locked this session (supersedes anything conflicting in prior docs)

1. **GrappStore = GRAPPlive's own official store.** First-party inventory, GRAPPlive as merchant of record. No third-party sellers list there. Not a badge system, not a discovery/ranking layer.
2. **The seller profile (`/seller/[id]`) IS the seller's storefront** — no separate storefront object. It needs to grow from "derived from product listings" into a real persisted `Store` entity (banner, about, delivery areas, follower count as stored state).
3. **The old seller badge system is renamed "GRAPP Verified"** (sub-tiers unchanged: Producer / Import / Top Seller), fully decoupled from the GrappStore name to avoid collision.
4. **GrappStore is a standalone section** (own home/categories/search/entry point) but reuses existing shared components (`ProductCard`, `TabBar`, category/search patterns) rather than being built from scratch.
5. **Unified cart, split settlement.** One cart, one checkout, one MoMo payment — regardless of how many merchants (GrappStore + any number of sellers) are represented. Behind the scenes, the order splits into per-merchant `OrderGroup`s at purchase time, each with its own fulfillment/delivery timeline and settlement record. Sellers only ever see their own `OrderGroup`s. See AGENT.md §40–42 for full detail.

---

## Known constraints / hard-won lessons (carried forward — still apply)

1. Heredoc file-creation commands have silently failed repeatedly. **Always verify file contents** (`cat`/`grep`) after any file-creation step — never trust a described command ran.
2. `npm run build` is the source of truth, not `npm run dev`. Confirm the full compile output, not just a route listing.
3. Tailwind v4 — no config file, colors come from the `@theme` block.
4. Next.js 16 dynamic routes: Server Components use `await params` (typed as a `Promise`); Client Components use `useParams()`. Don't mix patterns in one file.
5. Prefer Next.js `<Link>` over raw `<a>` for this workflow (a prior pipeline issue stripped `<a>` tags from pasted code).
6. Prefer full-file rewrites over `sed`/targeted edits — `sed` multi-line edits have been unreliable here.
7. The user runs all commands on their own MacBook (`~/grapplive`) in a separate terminal. Claude's own sandboxed tool use cannot see or touch that machine — all file creation happens via commands the user runs and reports back on.
8. `localStorage.clear()` resets to guest state for testing.

---

## Roadmap from here, in execution order

### Step 1 — Rename audit (do first, small but blocking)
- Rename `premiumBadge` field in `catalog.ts` → e.g. `verifiedTier`, values unchanged (`verified_producer`/`trusted_import`/`top_seller`), UI label becomes "GRAPP Verified"
- Rename/repurpose the existing `/grappstore` route (currently the badge-tier page) so the path is free for the real GrappStore
- Grep the whole repo for "GrappStore" / "grappstore" references and confirm each one is updated to the correct meaning

### Step 2 — Data model changes (before more UI is built on the old shape)
- `useOrdersStore`: move from flat "one order → one seller" to "one order → one or more `OrderGroup`s," each with its own items, fulfillment status, and settlement record
- `catalog.ts`: add `sourceType: "marketplace" | "grapplive"` to distinguish GrappStore-owned products from seller-listed ones
- Introduce a real `Store` entity for seller storefronts (banner, about, delivery areas, follower count as persisted fixture state, not derived) — needed for both seller storefronts (§11) and GrappStore's own `Store` record (§40)

### Step 3 — Build GrappStore
- New route group with its own home/categories/search, reusing shared components
- New `officialCatalog.ts` fixture data (GrappStore-owned products only)
- New cart/checkout flow feeding into the unified `Order`/`OrderGroup` model from Step 2 — no seller-confirmation step, GRAPPlive fulfills directly

### Step 4 — Enrich the seller storefront
- Now that `/seller/[id]` has a real `Store` entity behind it, build out banner, about, delivery areas, follower count, and other §11 fields properly

### Step 5 — Resume the previously deferred cleanup
- `/account/rewards` (decision still open: simple points display vs. real redemption flow)
- `/products/new`, `/products/[id]` (seller add/edit — currently dead links)
- Terms of Service / Privacy Policy pages
- Custom 404/error pages
- PWA manifest + icons

---

## Explicitly deferred / out of scope (do not build without discussing first)

Per AGENT.md's own phasing (§27) and the prior handoff: Rider app, Admin platform, Creator/Affiliate system, Group buying, full Negotiation/"Make an Offer" flow, Preorder marketplace, real video calling (Agora — WhatsApp/Signal/Telegram/TikTok/Instagram deep links remain the approach), real payment PIN security beyond the existing UX mockup (`usePinStore`, `PinPad`), Dispute resolution UI, Reseller/pool browsing, Receipt/packing-slip generation.

## What NOT to do

- Do not launch publicly or connect real payments/user data — Phase 0 prototype only, no backend/auth/payment integration, no compliance review done.
- Do not build backend/database/payment-gateway work in a plain chat-based session — that's Claude Code territory, and needs a proper API-contract handoff doc (based on the Zustand store shapes, now including `OrderGroup`) written first.
- Do not reintroduce "GrappStore" as a badge/ranking concept anywhere in new code — that meaning is retired per §41.

---

## Suggested first message to send after pasting this

"Let's start with Step 1 — walk me through the rename audit, show me exactly what needs to change in `catalog.ts` and the `/grappstore` route, and give me the commands to find every other reference in the repo."
