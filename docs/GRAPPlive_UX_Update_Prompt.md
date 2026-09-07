# GRAPPlive — UX/Visual Polish Handover

Paste this at the start of a new session, alongside `AGENTS.md` and `docs/GRAPPlive_Kickstart_Prompt.md` (both in the repo root/docs). Those two cover the full build history and technical spec — this file is scoped specifically to the open visual/UX thread that prompted this new session.

---

## Where the build stands

Fully built: complete marketplace, complete GrappStore (nav, home, categories, product pages, cart, checkout, fulfillment), seller storefronts, order/product persistence, Step 5 cleanup, API contract draft. See `docs/GRAPPlive_Kickstart_Prompt.md` for the full inventory — don't re-derive it, it's current.

## New since that doc was written — hydration bug fixes (just completed, not yet logged anywhere else)

A real SSR/hydration mismatch was found and fixed across the whole app:

**Root cause:** Zustand stores wrapped in `persist` (`localStorage`-backed) have no data on the server (no `localStorage` there) but do have data on the client once hydrated. Any component that branches its rendered output (className, icon, text) directly on a persisted value — without checking whether hydration has completed — will render one thing on the server and flip to another the instant the client catches up. React flags this as a hydration mismatch; it's not cosmetic, it's a real bug class.

**Fixed this pass**, all following the same pattern already established by `useAppStore`'s `hasHydrated` flag:
- `useWishlistStore` — added `hasHydrated` + `setHasHydrated`, wired via `onRehydrateStorage`
- `useFollowingStore` — same
- `useCartStore` (marketplace) — same
- `useGrappStoreCartStore` — same
- `components/ui/ProductCard.tsx` — wishlist heart now checks `hasHydrated` before trusting `isWishlisted`, defaults to the unwishlisted look until hydration completes
- `app/(buyer)/seller/[id]/SellerFollowButton.tsx` — same pattern for the Follow/Following state

**Confirmed safe, no fix needed:** `components/ui/TabBar.tsx` — only reads `activeHref`, a prop known identically on server and client; never touches a persisted store.

**Verification done:** clean build (38 routes), no visible warnings up to that point. **Not yet fully confirmed:** a hard-refresh browser console check on `/grappstore` and a followed seller's page was requested but the conversation moved to the UX topic before that confirmation came back. If picking this up, worth circling back to confirm the console is actually clean on a hard reload with real persisted wishlist/follow data present.

---

## The open thread this session should focus on: "the app feels not attractive"

The person said the app overall feels unattractive, without specifying which screen or what exactly is wrong. Before making changes, get a screenshot or a specific page named — don't guess and start changing things blind.

**Working diagnosis, offered but not yet confirmed against a real screenshot:**

1. **Most likely dominant cause:** every image in the entire app is still a flat gray `gl-shimmer` placeholder block — products, sellers, banners, avatars, everything except the 6 GrappStore category cards (duotone-treated real photos) and the app icon. A shopping app with zero real product photography will read as a wireframe no matter how good the layout is. This may be the actual root cause of "not attractive," not a fixable design flaw.
2. **Secondary factor:** text sizes are uniformly tiny throughout — 9px/10px/11px is the norm almost everywhere in the codebase. Consistent, but consistently cramped, which can read as cheap rather than clean.

**Do not assume this diagnosis is correct without confirming it against what the person actually shows you.** It could just as easily be color, spacing, information density, a specific broken-looking component, or something else entirely.

## Recommended first steps for the new session

1. Ask for a screenshot of the specific page(s) bothering them, or ask which page feels worst.
2. Diagnose precisely from what's shown — don't apply a shotgun of changes hoping one fixes it.
3. If the placeholder-image diagnosis is confirmed as the real issue, that's a bigger conversation (real product photography, or another round of AI-generated + duotone-treated images like the category cards) — not a quick CSS fix. Scope that properly before starting.
4. If it's something narrower (one bad screen, a spacing issue, a color choice), fix that specifically.

---

## Workflow reminder (still applies, confirmed reliable this session)

**One file at a time.** Send one `cat >` command, require `ls -la <path>` + `cat <path> | head -5` (or similar) confirmation before sending the next file. Heredoc silent-failures happened repeatedly earlier in the broader session; the one-at-a-time discipline has caught every failure since it was adopted — don't revert to batching multiple files per message.

## What NOT to do

Same list as `docs/GRAPPlive_Kickstart_Prompt.md` — no real backend work in chat, no reintroducing GrappStore-as-badge, no mixing the two carts, no batched file writes. Nothing about this UX thread changes any of that.
