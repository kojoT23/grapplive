export type ChannelVideoCategory = "ad" | "news" | "instructional";

export type ChannelVideo = {
  id: string;
  title: string;
  videoId: string;
  category: ChannelVideoCategory;
};

// PLACEHOLDER — all three currently point at the same public YouTube demo
// clip used for the per-product videos (see productVideos.ts), so this
// section has real, playable content to show while GrappStore's actual
// official channel doesn't exist yet. Once it does: swap each videoId for
// the real upload, and add/remove/reorder entries freely — nothing else
// in the app needs to change to support more videos or new categories.
export const grappStoreChannelVideos: ChannelVideo[] = [
  { id: "cv-1", title: "Flash Deals — shop this week's picks", videoId: "M7lc1UVf-VE", category: "ad" },
  { id: "cv-2", title: "New arrivals: what's just landed", videoId: "M7lc1UVf-VE", category: "news" },
  { id: "cv-3", title: "How to track your GrappStore order", videoId: "M7lc1UVf-VE", category: "instructional" },
];
