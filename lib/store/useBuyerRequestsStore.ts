import { create } from "zustand";

export type BuyerRequestType = "audio" | "video_call";
export type BuyerRequestStatus = "new" | "replied" | "closed";

export type BuyerRequest = {
  id: string;
  productId: string;
  productName: string;
  sellerId: string;
  buyerPhone: string;
  type: BuyerRequestType;
  audioUrl?: string;
  durationSeconds?: number;
  createdAt: number;
  status: BuyerRequestStatus;
  sellerReplyAudioUrl?: string;
};

type NewBuyerRequest = Omit<BuyerRequest, "id" | "createdAt" | "status">;

type BuyerRequestsState = {
  requests: BuyerRequest[];
  addRequest: (input: NewBuyerRequest) => void;
  markReplied: (id: string, sellerReplyAudioUrl?: string) => void;
  markClosed: (id: string) => void;
};

function nextId(existing: BuyerRequest[]): string {
  const maxSuffix = existing.reduce((max, r) => {
    const match = r.id.match(/^req(\d+)$/);
    if (!match) return max;
    return Math.max(max, parseInt(match[1], 10));
  }, 0);
  return `req${maxSuffix + 1}`;
}

// Deliberately NOT persisted. A recorded audio blob is a blob: URL that
// only lives for this browser tab's session — a real MediaRecorder/
// browser constraint, not a design choice. Persisting the request
// metadata while the audio silently stops working on reload would be
// more confusing than an honest in-memory, live-session store.
export const useBuyerRequestsStore = create<BuyerRequestsState>((set, get) => ({
  requests: [],

  addRequest: (input) => {
    const id = nextId(get().requests);
    const newRequest: BuyerRequest = { ...input, id, createdAt: Date.now(), status: "new" };
    set({ requests: [newRequest, ...get().requests] });
  },

  markReplied: (id, sellerReplyAudioUrl) =>
    set({
      requests: get().requests.map((r) =>
        r.id === id
          ? { ...r, status: "replied", sellerReplyAudioUrl: sellerReplyAudioUrl ?? r.sellerReplyAudioUrl }
          : r
      ),
    }),

  markClosed: (id) =>
    set({ requests: get().requests.map((r) => (r.id === id ? { ...r, status: "closed" } : r)) }),
}));
