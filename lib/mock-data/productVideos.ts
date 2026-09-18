// YouTube video id (not the full URL — e.g. "M7lc1UVf-VE", not
// "https://youtube.com/watch?v=M7lc1UVf-VE") for products with a Watch &
// Shop / PDP video slide. Optional and additive: a product without an
// entry here just falls back to the static play-button-over-illustration
// look, same as before this existed.
//
// PLACEHOLDER — gs-1 and gs-2 currently point at a generic public YouTube
// sample clip (Google's own API demo video) so the video section has
// something real to tap and actually play while real product footage
// isn't ready yet. Swap these two ids for the real ones the moment they
// exist — that's the only change needed, nothing else in the app touches
// this file.
export const productVideoIdByProductId: Record<string, string> = {
  "gs-1": "M7lc1UVf-VE",
  "gs-2": "M7lc1UVf-VE",
};
