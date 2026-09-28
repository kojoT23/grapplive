import { createJSONStorage } from "zustand/middleware";

// Every persisted store in this app (cart, wishlist, catalog, orders...)
// writes to the SAME origin-wide localStorage quota (~5-10MB total,
// browser-dependent). Without this wrapper, a write that pushes past that
// quota throws inside zustand's persist middleware — during a React state
// update, with no error boundary anywhere in the app (see ROADMAP.md) —
// which can white-screen the whole page over something as small as one
// seller uploading one too many product photos.
//
// This wrapper catches that instead: the in-memory state update still
// succeeds (the person's edit isn't lost mid-session), only the write-to-
// disk step silently fails, so a quota problem degrades to "this won't
// survive a reload" rather than "the app just crashed." Same treatment on
// read, in case a previous corrupted/partial write left invalid JSON
// behind — falls back to a clean slate instead of failing to boot the
// store (and therefore the page) at all.
//
// Real fix, once there's a backend: this data shouldn't be living in
// localStorage in the first place (see ROADMAP.md §4.2, §1). This is a
// client-only safety net for the prototype phase, not a substitute for
// that.
export const safeJSONStorage = createJSONStorage(() => ({
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Quota exceeded, or storage blocked (private browsing, etc).
      // Nothing more useful to do client-side — see comment above.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Same as above.
    }
  },
}));
