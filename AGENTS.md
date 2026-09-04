# AGENT.md — Ghana-Native Social Commerce Platform

## 1. Purpose

This repository contains a Ghana-focused social-commerce platform that combines:

- Social product discovery
- Seller storefronts
- WhatsApp-assisted commerce
- Mobile Money payments
- Local delivery/rider operations
- Creator/affiliate selling
- Negotiated offers
- Group buying
- Preorder commerce
- Buyer protection and seller verification

The product is **not a TikTok clone** and should not be designed as a generic ecommerce marketplace.

The central product thesis is:

> **Build the transaction infrastructure that Ghanaian social sellers and buyers are missing.**

The ideal commerce loop is:

`Discover → Watch → Ask/Chat → Compare/Negotiate → Buy → Pay → Dispatch → Track → Receive → Review → Share → Buy Again`

> **File note:** this file lives at the repo root as `AGENTS.md` (plural) so agentic coding tools pick it up automatically each session. For current build status, what's already implemented, and roadmap sequencing, see `docs/GRAPPlive_Kickstart_Prompt.md` — that file changes often; this one shouldn't.

---

# 1A. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS **v4** (`@theme` block in `app/globals.css` — there is no `tailwind.config.ts`) |
| State | Zustand (`persist` middleware for anything that should survive refresh) |
| Icons | `@tabler/icons-react` |
| Target | Mobile-first, ~375px–428px primary, `md:` breakpoint for tablet widening. **No desktop layout, ever** — this is an explicit, repeated decision, not an oversight. |
| Repo | `grapplive` |
| Package manager | npm |

**Brand colors** (`app/globals.css` `@theme` block, exposed as Tailwind classes like `bg-gl-brand`):
Brand/action `#D6127A` · Green (good/complete) `#0B6E4F` · Amber (caution/pending — used deliberately even for "healthy" metrics, since amber means actionable, not finished) `#BA7517` · Red (urgent + Live indicator ONLY) `#C8102E` · Navy (informational label only, never interactive) `#2C2C6E`. No ethnic-specific symbols/patterns/language anywhere — plain warm English, modern/international-first visual language.

---

# 1B. Known Constraints — Read Before Writing Code

These are hard-won lessons from this project's build process. They apply to every session, not just the first one.

1. **Heredoc file-creation commands (`cat > file << 'EOF'`) have silently failed to write files repeatedly** in this project's workflow. Always verify file contents directly (`cat filename` or `grep -c "something-unique" filename`) after any file-creation step — never trust a line count alone, and never assume a described command actually ran.
2. **`npm run build` is the source of truth, not `npm run dev`.** Run it after every meaningful change. A clean build with full `✓ Finished TypeScript in Xs` output is real confirmation; a route listing alone is not sufficient — always get the whole output.
3. **Tailwind v4** — no `tailwind.config.ts`. Colors are Tailwind classes generated from the `@theme { --color-gl-brand: ... }` block in `app/globals.css`.
4. **Next.js 16 App Router dynamic routes** use `params: Promise<{ id: string }>` and require `await params` in Server Components (e.g. `/product/[id]`, `/seller/[id]`, `/category/[slug]`). Client Components (`"use client"`) instead use `useParams<{ id: string }>()` from `next/navigation`. Don't mix the two patterns in the same file.
5. Prefer Next.js `<Link>` over raw `<a>` for external links (WhatsApp/Signal/Telegram deep links included) — a prior tooling pipeline stripped raw `<a href=...>` tags from pasted code. If typing code directly in an editor, plain `<a>` is fine and more semantically correct.
6. **Prefer full-file rewrites over targeted `sed`/`str_replace` edits** when working through a copy-paste terminal workflow — multi-line `sed` edits have repeatedly matched nothing or produced broken output in this project. More text per message, but more reliable.
7. `localStorage.clear()` in browser DevTools is the standard way to reset to a guest/logged-out state for testing — it clears all persisted Zustand stores (session, cart, wishlist, following, etc., each under its own key).
8. **Never expose settlement, commission, or payment-status computation client-side** (see §24, §42.3) — even in prototype/mock form, model these as if a backend will own them, so the eventual real implementation doesn't require re-architecting the client.

---

# 2. Product Vision

Create a mobile-first marketplace that feels natural to Ghanaian consumers and merchants.

The platform should combine the strongest concepts from social commerce platforms with Ghana-specific behavior:

| Social-commerce concept | Ghana-native implementation |
|---|---|
| Short-form product content | Product videos and social discovery |
| LIVE commerce | Seller/creator live selling |
| Creator affiliate sales | Local creators, influencers and sales agents |
| Product tagging | Product cards attached to content |
| Marketplace storefronts | Seller-owned mini stores |
| In-app checkout | MoMo-first checkout |
| Social sharing | WhatsApp/TikTok/Instagram/Facebook sharing |
| Standard logistics | Local rider network |
| Fixed pricing | Optional negotiation / offers |
| Traditional stock | Immediate stock + preorder inventory |
| Reviews | Seller + product + delivery trust signals |
| Generic addresses | Digital address + GPS pin + landmark + phone |

---

# 3. Core Product Principles

## 3.1 Ghana first

Do not assume Western ecommerce behavior.

Design around:

- Mobile-first usage
- Android-first usage
- Mobile Money
- WhatsApp
- Social selling
- Price negotiation
- Small and informal merchants
- Fragmented delivery
- Landmarks and GPS pins
- Phone-based communication
- Cash-on-delivery where appropriate
- Preorders/importation
- Trust concerns
- Variable network quality

## 3.2 Mobile first

The primary experience is mobile.

Prioritize:

- Fast loading
- Low data consumption
- Simple navigation
- Large touch targets
- Clear typography
- Minimal unnecessary animation
- Resilient loading/error states
- Usability on lower-cost Android devices

Desktop should support merchants and administrators, but mobile must remain excellent.

## 3.3 Social commerce, not catalog commerce

The platform should not feel like a static product catalog.

Users should be able to discover products through:

- Videos
- Seller content
- Creator content
- Deals
- Trending products
- Recommendations
- Live selling
- Social sharing

Content should naturally lead to commerce.

## 3.4 Trust is a product feature

Trust must be visible throughout the buying journey.

Use:

- Seller verification
- Seller ratings
- Product reviews
- Successful-order counts
- Delivery reliability
- Product condition
- Warranty information
- Authenticity information where applicable
- Buyer protection
- Clear refund/return states

Do not hide important trust information behind multiple screens.

## 3.5 Every feature needs a business reason

Before implementing a feature, ask:

> Does this make the buyer's transaction easier, safer or more valuable?

or:

> Does this make the seller more profitable, efficient or trustworthy?

If neither is true, question the feature.

---

# 4. Primary User Types

The product must support five major roles.

## 4.1 Buyer

Needs to:

- Discover products
- Search
- Compare
- Ask sellers questions
- Negotiate
- Purchase
- Pay
- Track delivery
- Review products
- Follow sellers
- Save products
- Share products

## 4.2 Seller

Needs to:

- Create a storefront
- Add products
- Manage inventory
- Receive orders
- Communicate with buyers
- Accept/reject offers
- Manage promotions
- Work with riders
- Work with creators/agents
- Track sales and revenue

## 4.3 Creator / Affiliate / Sales Agent

Needs to:

- Discover products to promote
- See commission rates
- Generate/share product links
- Track attributed sales
- View earnings
- Withdraw commissions
- Create promotional content

## 4.4 Rider

Needs to:

- Receive delivery jobs
- Navigate to pickup
- Confirm pickup
- Contact customer
- Navigate to destination
- Handle COD when enabled
- Confirm delivery
- Record proof/OTP
- Track earnings

## 4.5 Admin

Needs to control:

- Users
- Sellers
- Creators
- Riders
- Products
- Orders
- Payments
- Delivery
- Commissions
- Promotions
- Preorders
- Refunds
- Disputes
- Verification
- Fraud/risk
- Analytics

---

# 5. Core Information Architecture

The exact navigation may evolve through UX testing, but the initial architecture should include:

## Buyer

- Home / Discover
- Categories
- Search
- Product
- Store
- Feed / Content
- Cart
- Orders
- Messages
- Wishlist
- Profile

## Seller

- Dashboard
- Products
- Orders
- Inventory
- Customers
- Storefront
- Promotions
- Affiliate
- Delivery
- Payments
- Analytics
- Settings

## Creator

- Discover products
- Affiliate products
- Content
- Sales
- Earnings
- Wallet
- Profile

## Rider

- Jobs
- Active delivery
- History
- Earnings
- Profile

## Admin

- Overview
- Users
- Sellers
- Creators
- Riders
- Products
- Orders
- Payments
- Delivery
- Promotions
- Affiliates
- Preorders
- Disputes
- Reports
- Risk/verification
- Settings

---

# 6. Buyer Experience

## 6.1 Discovery

The homepage should prioritize discovery rather than immediately showing a dense product grid.

Possible sections:

- Recommended
- Trending
- Nearby sellers
- Deals
- New arrivals
- Product videos
- Creator picks
- Preorders
- Group deals

Users should be able to move from content to product with minimal friction.

## 6.2 Product page

Every product page should support:

- Images
- Video
- Price in GH₵
- Variants
- Stock
- Seller
- Seller rating
- Product rating
- Reviews
- Delivery estimate
- Seller location
- Product condition
- Warranty
- Authenticity information
- Return/refund information where applicable

Primary actions:

- Buy Now
- Add to Cart
- Chat / Ask Seller
- Make an Offer
- Share

## 6.3 Negotiation

Products may be configured as:

- Fixed price
- Negotiable
- Negotiable with minimum price

The offer flow should be simple:

`Buyer offer → Seller response → Buyer accepts → Order created → Payment`

Do not allow negotiation to bypass platform transaction records.

---

# 7. WhatsApp Strategy

WhatsApp is part of the ecosystem, not a competitor to eliminate.

Support appropriate flows such as:

- Share product to WhatsApp
- Share storefront
- Share deal
- Share preorder
- Share affiliate product
- Chat seller through WhatsApp
- Send order updates
- Send delivery updates

Where technically possible, distinguish between:

- Platform-originated orders
- WhatsApp-assisted orders
- External/manual orders

Do not claim an order is paid or verified merely because a WhatsApp conversation exists.

---

# 8. Payments

The payment architecture should be Ghana-oriented.

Potential methods:

- MTN MoMo
- Telecel Cash
- AT Money
- Bank transfer
- Cards
- Cash on Delivery where supported

Payment state must be explicit.

Recommended states:

- Unpaid
- Payment initiated
- Payment pending
- Paid
- Payment failed
- Partially paid
- Refunded
- Refund pending
- COD
- Settlement pending
- Settled

Never mark an order as paid based only on a user-provided screenshot.

Payment verification must come from the payment integration/backend.

---

# 9. Order Lifecycle

Use a clear state machine.

Suggested order states:

`DRAFT`
→ `PENDING_PAYMENT`
→ `PAID`
→ `SELLER_ACCEPTED`
→ `PROCESSING`
→ `READY_FOR_PICKUP`
→ `RIDER_ASSIGNED`
→ `PICKED_UP`
→ `OUT_FOR_DELIVERY`
→ `DELIVERED`

Alternative terminal states:

- CANCELLED
- PAYMENT_FAILED
- REFUND_REQUESTED
- REFUNDED
- RETURN_REQUESTED
- RETURNED
- DISPUTED

Do not allow arbitrary status changes from the client.

All important state transitions should be validated server-side and logged.

---

# 10. Delivery

Delivery is a core product subsystem.

A delivery record should support:

- Order ID
- Seller pickup location
- Customer delivery location
- GPS coordinates where available
- Digital address
- Landmark
- Customer phone
- Rider
- Delivery fee
- COD amount
- Pickup time
- Delivery time
- Delivery status
- OTP/proof of delivery where applicable

Lifecycle:

`READY_FOR_PICKUP`
→ `RIDER_ASSIGNED`
→ `PICKED_UP`
→ `OUT_FOR_DELIVERY`
→ `DELIVERED`

Failure states should include:

- Customer unavailable
- Wrong address
- Seller unavailable
- Rider cancelled
- Delivery failed
- Customer refused

---

# 11. Seller Storefront

> **Note:** The seller profile described in this section *is* the seller's storefront — there is no separate storefront object. This is distinct from **GrappStore**, GRAPPlive's own official company-owned store (see §40) — sellers never list products in GrappStore, and GrappStore is not a badge or ranking layer on top of seller storefronts. See §40–42 for the full resolution, including the renamed seller trust badge (§41, "GRAPP Verified") and the order/data-model implications (§42).

Every seller should have a mini-store.

Include:

- Logo/profile
- Banner
- Store description
- Product catalog
- Categories
- Deals
- Reviews
- Rating
- Followers
- Verification badge
- Delivery areas
- Contact/chat
- Seller content

A seller should be able to build a brand, not merely list products.

---

# 12. Seller Dashboard

The seller dashboard should immediately answer:

- How much did I sell today?
- How many orders are pending?
- Which payments are pending?
- Which products are low stock?
- Which orders need delivery?
- Which products are performing best?
- How much have affiliates sold?
- How much revenue/profit has been generated?

Core modules:

- Overview
- Products
- Inventory
- Orders
- Customers
- Storefront
- Promotions
- Affiliates
- Delivery
- Payments
- Analytics
- Settings

---

# 13. Creator / Affiliate System

The affiliate model is a major growth mechanism.

Seller creates:

`Product → Commission rate → Affiliate availability`

Creator sees:

`Product → Price → Commission → Promote`

Customer buys.

System records:

`Customer → Order → Affiliate attribution → Commission`

Commission should not become payable until the relevant order reaches the platform's defined eligible state, normally after delivery/return conditions.

Creator dashboard should show:

- Clicks
- Orders
- Conversion rate
- Sales
- Pending commission
- Available commission
- Withdrawn commission

---

# 14. Group Buying

Explore a social group-buying model.

Example:

- 1 unit: GH₵220
- 5 buyers: GH₵200
- 20 buyers: GH₵175

Show:

- Current participants
- Target participants
- Price tier
- Countdown/deadline
- Terms
- Delivery conditions
- Refund rules if target is not reached

Sharing to WhatsApp should be prominent.

---

# 15. Preorder Commerce

Preorders are important for imported products.

A preorder product must clearly communicate that it is not immediately available.

Display:

- Expected price
- Current orders
- Target quantity
- Preorder deadline
- Expected arrival
- Seller/importer
- Deposit/full-payment requirement
- Cancellation rules
- Refund rules
- Status

Example state:

`OPEN → TARGET_REACHED → SOURCING → IN_TRANSIT → ARRIVED → FULFILLING → COMPLETED`

Never show an uncertain arrival date as a guaranteed delivery date.

---

# 16. Trust and Verification

Seller verification should support appropriate levels.

Example:

### Unverified
Basic account.

### Phone verified
Phone number confirmed.

### Identity/business verified
Additional verification completed.

### Trusted seller
Based on platform-defined performance criteria.

Avoid implying government or legal certification unless the platform actually verifies it.

Product condition should be explicit:

- New
- Used
- Refurbished
- Open box

Warranty should be explicit:

- No warranty
- Seller warranty
- Manufacturer warranty
- Platform warranty/protection where applicable

---

# 17. Cash on Delivery

COD must be treated as a controlled workflow.

Possible controls:

- Customer order confirmation
- OTP
- COD amount displayed clearly
- Rider cash collection
- Delivery confirmation
- Digital receipt
- Rider settlement
- Customer reliability history

Do not design COD as an informal "pay the rider" shortcut.

---

# 18. Social Features

Users should be able to:

- Follow sellers
- Follow creators
- Like content
- Comment
- Share
- Save
- Review
- Follow deals
- Share storefronts
- Share products
- Share preorders

Avoid building social features merely for vanity metrics. Every social feature should contribute to discovery, trust, retention or commerce.

---

# 19. Product Sharing

Product sharing should support:

- WhatsApp
- TikTok
- Instagram
- Facebook
- Copy link
- Internal platform sharing

Shared content should preserve important information:

- Product
- Price
- Seller
- Trust signals
- Purchase destination

---

# 20. UX States

Every important screen must include:

- Loading
- Empty
- Error
- Offline/poor network where relevant
- Success
- Permission denied
- Unauthorized
- Out of stock
- Payment pending
- Payment failed
- Order cancelled
- Delivery failed

Do not design only the happy path.

---

# 21. Design System

Create a reusable design system before scaling screens.

Define:

- Typography
- Spacing
- Grid
- Buttons
- Inputs
- Cards
- Product cards
- Seller cards
- Badges
- Status chips
- Modals
- Bottom sheets
- Navigation
- Tabs
- Toasts
- Alerts
- Skeleton loaders
- Empty states
- Error states

Components should be reusable and accessible.

Do not create one-off UI patterns unnecessarily.

---

# 22. Accessibility

Follow practical accessibility principles:

- Adequate color contrast
- Clear focus states
- Large enough touch targets
- Semantic labels
- Keyboard accessibility on web
- Screen-reader-friendly controls
- Do not rely on color alone for status
- Clear error messages
- Simple language

---

# 23. Performance

Performance is a product requirement.

Prioritize:

- Image optimization
- Lazy loading
- Pagination/infinite loading
- Caching
- Optimistic UI only where safe
- Minimal JavaScript where possible
- Efficient API calls
- Compressed media
- Graceful poor-network behavior

Do not autoplay heavy video everywhere.

Social content should be optimized for mobile data usage.

---

# 24. Security Rules

Never trust client-side values for:

- Price
- Commission
- Payment status
- Order ownership
- Seller ownership
- Inventory
- Delivery completion
- Refund amount
- User role

Validate sensitive operations server-side.

Use role-based access control.

Users must only access resources they are authorized to access.

Never expose:

- Payment secrets
- API keys
- Private credentials
- Internal risk information
- Sensitive customer information

in client-side code.

---

# 25. Fraud / Abuse Considerations

Design for:

- Fake sellers
- Fake products
- Fake reviews
- Payment screenshots
- COD abuse
- Fake delivery confirmation
- Multiple accounts
- Affiliate self-referrals
- Commission fraud
- Refund abuse
- Order manipulation

Risk controls should be introduced progressively rather than making the MVP unnecessarily complex.

---

# 26. Analytics

Track meaningful events.

Buyer events:

- Product viewed
- Video viewed
- Product shared
- Seller followed
- Add to cart
- Offer created
- Offer accepted
- Checkout started
- Payment initiated
- Payment completed
- Order delivered
- Review submitted

Seller events:

- Product created
- Product edited
- Order accepted
- Offer accepted
- Promotion created
- Affiliate enabled

Creator events:

- Product promoted
- Link clicked
- Conversion
- Commission earned

Do not collect unnecessary personal data.

---

# 27. MVP PRIORITY

Do not build everything at once.

## Phase 1 — Commerce foundation

Prioritize:

1. User accounts
2. Seller accounts
3. Seller storefronts
4. Product catalog
5. Search/categories
6. Cart
7. Checkout
8. MoMo/payment integration
9. Order management
10. Basic delivery management
11. WhatsApp sharing
12. Seller dashboard
13. Admin dashboard
14. Reviews/ratings
15. Basic seller verification

## Phase 2 — Social commerce

Add:

- Product videos
- Social feed
- Following
- Likes
- Comments
- Product tagging
- Creator profiles
- Product sharing
- Recommendations

## Phase 3 — Growth mechanisms

Add:

- Affiliate marketplace
- Creator commissions
- Group buying
- Offers/negotiation
- Promotions
- Flash sales
- Advanced analytics

## Phase 4 — Advanced commerce

Add:

- Preorders
- Advanced logistics
- Buyer protection
- COD controls
- Automated seller settlement
- Risk/fraud engine
- Advanced personalization

Do not allow Phase 3/4 complexity to destabilize the core transaction system.

---

# 28. UX Research Requirements

Before finalizing major flows, validate assumptions with Ghanaian users.

Research:

### Buyers
- How they currently discover products
- How they pay
- Why they trust/reject sellers
- How they use WhatsApp
- How they negotiate
- COD preferences
- Delivery expectations

### Sellers
- Current selling channels
- WhatsApp workflow
- MoMo workflow
- Inventory management
- Rider relationships
- Customer management
- Affiliate willingness
- Preorder behavior

### Creators
- Current monetization
- Affiliate expectations
- WhatsApp/TikTok usage
- Commission expectations

### Riders
- Pickup process
- Navigation
- Cash handling
- Delivery confirmation
- Earnings expectations

Never assume a feature is culturally appropriate merely because it exists on another platform.

---

# 29. Competitive Inspiration

Use other platforms as references, not templates.

Study:

- TikTok Shop — social/content commerce
- TikTok — discovery and engagement
- Alibaba — seller storefronts and marketplace depth
- Temu — promotions and product discovery
- WhatsApp — communication and sharing
- Local Ghanaian social sellers — real-world transaction behavior

The product should take useful patterns and adapt them to Ghana.

Avoid copying branding, layouts, proprietary assets or distinctive interface details.

---

# 30. UX Decision Framework

For every major design decision, evaluate:

1. User value
2. Seller value
3. Trust impact
4. Revenue impact
5. Operational complexity
6. Technical complexity
7. Ghanaian relevance
8. Mobile performance
9. Scalability
10. MVP priority

Prefer the simplest solution that produces meaningful value.

---

# 31. Engineering Guidance

When implementing UI:

- Reuse components
- Keep business logic out of presentation components where practical
- Use typed data models
- Validate API responses
- Handle loading/error states
- Keep role permissions explicit
- Do not duplicate business rules in multiple places
- Keep payment/order state transitions backend-controlled
- Write maintainable code over clever code
- Avoid unnecessary dependencies
- Document non-obvious decisions

If the repository already has an established architecture, preserve it unless there is a strong technical reason to change it.

---

# 32. Product Data Model — Conceptual

Core entities should conceptually include:

- User
- Seller
- Store
- Product
- ProductVariant
- Inventory
- Category
- Cart
- Order
- OrderItem
- Payment
- Delivery
- Rider
- Customer
- Review
- Message
- Offer
- Promotion
- Affiliate
- Commission
- Preorder
- GroupBuy
- Notification
- Dispute
- Verification

The exact database schema may differ, but ownership and state transitions must remain clear.

---

# 33. Admin and Operational Visibility

The admin system should provide a transaction timeline.

For an order, administrators should be able to understand:

`Order created → Payment → Seller accepted → Rider assigned → Pickup → Delivery → Settlement`

Every important financial or operational event should have:

- Timestamp
- Actor
- Event
- Previous state
- New state
- Relevant reference

This is essential for disputes and support.

---

# 34. Notifications

Notifications should be useful, not noisy.

Important channels may include:

- In-app
- Push
- WhatsApp where supported
- SMS where necessary
- Email where useful

Important events:

- Order confirmation
- Payment confirmation
- Seller acceptance
- Rider assignment
- Pickup
- Out for delivery
- Delivery
- Refund
- Offer received
- Offer accepted
- Affiliate commission
- Preorder status

---

# 35. What NOT to Build

Do not introduce features merely because large platforms have them.

Avoid:

- Unnecessary social gamification
- Complex wallet features before payment infrastructure is reliable
- Excessive animations
- Heavy video backgrounds
- Overcomplicated seller onboarding
- Too many categories
- Fake scarcity
- Dark-pattern checkout
- Hidden fees
- Hidden delivery charges
- Unclear preorder terms
- Unverified trust badges
- Client-side payment verification
- Arbitrary order status manipulation

---

# 36. Definition of a Good Experience

A successful buyer should be able to:

> Discover a product in seconds, understand whether the seller is trustworthy, ask a question or negotiate if needed, pay using a familiar Ghanaian method, receive reliable delivery information, and know exactly what is happening to the order.

A successful seller should be able to:

> Create a storefront, upload products, receive payment-confirmed orders, arrange delivery, work with creators, and understand sales without relying on spreadsheets and multiple WhatsApp conversations.

A successful creator should be able to:

> Find products, promote them easily, see exactly which sales came from them, and receive commissions transparently.

A successful rider should be able to:

> Accept a job, find the pickup and customer, confirm each step, handle COD safely, and know what they earned.

---

# 37. Final Product Principle

The platform should not try to win by being "another marketplace."

It should win by connecting fragmented Ghanaian commerce:

`SOCIAL DISCOVERY`
+
`WHATSAPP`
+
`MOBILE MONEY`
+
`STOREFRONTS`
+
`CREATORS`
+
`RIDERS`
+
`TRUST`
+
`PREORDERS`

into one coherent commerce system.

The central question for every product decision is:

> **Would this make a Ghanaian buyer or seller's transaction easier, safer, faster, or more profitable?**

If not, reconsider it.

---

# 38. Agent Operating Instructions

When acting as an AI coding/product agent in this repository:

1. Read this file before making substantial product or UX changes.
2. Inspect the existing codebase before creating new architecture.
3. Preserve working functionality.
4. Prefer incremental changes over unnecessary rewrites.
5. Do not invent backend capabilities that do not exist.
6. Clearly distinguish mocked functionality from production functionality.
7. Do not claim payment, delivery, notification or verification integrations are live unless they are actually connected and tested.
8. Test important user flows after changes.
9. Consider mobile responsiveness for every UI change.
10. Keep Ghana-specific requirements in mind.
11. Avoid unnecessary dependencies.
12. Protect user and payment data.
13. Do not expose secrets in source code.
14. Keep order/payment state transitions authoritative on the server.
15. When requirements are ambiguous, choose the option that best supports the product principles in this document and document the assumption.
16. For major architectural changes, explain the trade-off before implementing them.
17. Prioritize the MVP roadmap unless explicitly instructed otherwise.
18. Do not add TikTok-like features simply because they look impressive; prioritize measurable commerce value.
19. Keep the UI visually premium but operationally simple.
20. Build reusable components and patterns rather than isolated screens.

---

# 39. Success Metric

The ultimate product metric is not:

- Number of screens
- Number of features
- Number of animations
- Number of social interactions

The product succeeds when it reliably converts:

`DISCOVERY → TRUST → TRANSACTION → DELIVERY → REPEAT PURCHASE`

while making the process easier for Ghanaian buyers, sellers, creators and riders.

---

# 40. GrappStore — Official Company Storefront

## 40.1 What GrappStore is

**GrappStore is GRAPPlive's own first-party e-commerce arm.** GRAPPlive is the merchant of record: it sources, holds, and sells genuine products directly to buyers, the same way Amazon sells Amazon-owned stock, or the way CenterPoint/Alibaba run owned-inventory retail alongside a third-party marketplace.

**GrappStore is not a marketplace, a badge, or a discovery layer for other sellers.** Third-party sellers never list products in GrappStore. There is no ambiguity here: if GRAPPlive did not source and does not own the inventory, it does not belong in GrappStore.

## 40.2 Why GrappStore exists (product thesis)

GRAPPlive's core value proposition to third-party sellers is **not** competing with where they already sell (TikTok, Instagram, WhatsApp Status). Most GRAPPlive sellers are already making sales through those channels. What they lack is:

- A CRM/order-management layer that TikTok Shop-style tools don't offer in Ghana
- Mobile Money integration, which TikTok's commerce tools don't support locally
- A trustworthy checkout/delivery/payment-confirmation pipeline

GRAPPlive gives sellers that missing infrastructure. GrappStore is a **separate, second business line** — GRAPPlive acting as its own retailer — layered on top of the same buyer app, not a competitive wedge against the sellers using the platform.

## 40.3 Relationship to the seller storefront (§11)

Per §11, **the seller profile (`/seller/[id]`) is the seller's real storefront** — not a separate "GrappStore-branded" concept. GrappStore is entirely distinct from every seller storefront: it is GRAPPlive's own storefront, standing alongside seller storefronts, not layered on top of them or ranking them.

## 40.4 Experience shape

- **Standalone section**, reached via its own nav entry point — not a banner buried inside the buyer Home feed.
- Reuses existing shared components and patterns (product card, category grid, search, product page shape) pointed at a GrappStore-only product source, rather than being built from scratch.
- Should feel like a complete, dedicated shopping app in its own right (reference points: Alibaba, Shopee, CenterPoint) — full home, categories, search, and its own product catalog — even though it's reached from within GRAPPlive rather than as a separate app.

## 40.5 Checkout: unified cart, split settlement

**The buyer never sees a distinction between GrappStore and third-party seller items.** One cart, one checkout, one payment action, regardless of how many merchants are represented in the basket.

Behind that single buyer-facing transaction, the order **splits into sub-orders by merchant** at the moment of purchase:

- One sub-order per third-party seller involved (existing pipeline: MoMo confirmation → prepare → dispatch, seller sees only their own sub-order on their dashboard, no visibility into the GrappStore portion)
- One sub-order for GrappStore, with GRAPPlive as merchant of record — fulfilled directly by GRAPPlive, no seller-confirmation step needed since GRAPPlive already holds the payment
- Each sub-order carries its own delivery/tracking timeline — a buyer with a mixed-merchant order sees multiple tracking threads under one order, since GrappStore ships from GRAPPlive's own fulfillment and sellers ship independently
- The single MoMo payment is collected once by the platform, then allocated internally: sellers receive their normal commission-adjusted payout, GrappStore's portion is recognized directly as company revenue with no seller-payout logic involved

See §42 for the corresponding data-model change.

---

# 41. Seller Trust Badge — "GRAPP Verified"

The seller-facing trust/quality badge system (previously informally called "GrappStore," before that name was reassigned to the official company store per §40) is renamed:

**GRAPP Verified** — the umbrella badge shown on third-party sellers' products, with existing sub-tiers retained as qualifiers:

- `verified_producer` → **GRAPP Verified · Producer**
- `trusted_import` → **GRAPP Verified · Import**
- `top_seller` → **GRAPP Verified · Top Seller**

GRAPP Verified is a **quality/trust signal on a seller's own product**, entirely separate from GrappStore (§40). A product can be GRAPP Verified and still be sold by an independent third-party seller through their own storefront — GRAPP Verified never implies the product is sold *by* GRAPPlive, and GrappStore products never need this badge since GRAPPlive-sourced inventory is understood to be genuine by definition.

Any existing UI copy, component names, or data fields referencing "GrappStore" in the badge-tier sense (e.g. a `premiumBadge` field, a `/grappstore` route used for badge display) must be audited and renamed to avoid collision with the new official-store meaning of "GrappStore."

---

# 42. Data Model Addendum — GrappStore & Split Settlement

Extends §32 (Product Data Model — Conceptual).

## 42.1 New/clarified entities

- **`Store`** — now explicitly two kinds:
  - A **seller-owned `Store`**, one per `Seller`, representing their storefront (§11): banner, about, catalog, followers, delivery areas.
  - **GrappStore**, a single, singular `Store` record owned by GRAPPlive itself, functioning as merchant of record for its own catalog.
- **`Product.sourceType`** — `"marketplace" | "grapplive"` (or equivalent), distinguishing GrappStore-owned inventory from seller-listed inventory. Products never carry both.

## 42.2 Order splitting

- **`Order`** — the single buyer-facing transaction, created at checkout, spans one payment event.
- **`OrderGroup`** — one per merchant represented in the `Order` (one per third-party `Seller`, plus one for GrappStore if present). Each `OrderGroup` owns:
  - Its own `OrderItem`s
  - Its own fulfillment/delivery status and timeline
  - Its own settlement record (seller payout vs. direct GRAPPlive revenue recognition)
- Sellers' dashboards query `OrderGroup`s scoped to their own `Seller` id only — they have no access to GrappStore's `OrderGroup`s or to other sellers' `OrderGroup`s within the same `Order`.
- Buyer-facing order tracking (`/account/orders/[id]`) displays one `Order` with multiple tracking threads, one per `OrderGroup`, when the order is mixed-merchant.

## 42.3 Payment allocation

A single MoMo payment funds the whole `Order`. Allocation across `OrderGroup`s (seller payout minus commission vs. GrappStore revenue) is a backend/settlement concern only — it must never be exposed as a client-side computation, per §24 (never trust client-side values for payment status, commission, or settlement).
