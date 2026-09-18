// Native, self-hosted-style video clips for the Watch & Shop card — NOT
// YouTube. This is what a real backend "product video" field should look
// like: a direct video file URL the product record owns (S3, Cloudinary,
// wherever the eventual backend hosts media), not tied to a third-party
// platform's embed player.
//
// PLACEHOLDER — both currently point at a well-known, Creative Commons
// licensed public test clip ("Big Buck Bunny," Google's own hosted copy,
// widely used for testing <video> tags) so the card has something real to
// loop while actual product footage isn't ready. Swap the URL per product
// once real clips exist — aim for 30-45s, muted-safe (autoplay requires
// no sound anyway), and looping cleanly.
export const productVideoClipByProductId: Record<string, string> = {
  "gs-1": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "gs-2": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
};
