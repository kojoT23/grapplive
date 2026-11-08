// In-app notifications: short messages telling a person that something
// happened that concerns them (a rider accepted, cash needs confirming, a
// delivery failed...). SMS / push / WhatsApp come with the backend; this is the
// in-app inbox those would also feed.
//
// Each notification belongs to ONE recipient. A recipient is a string key, so a
// phone with several roles keeps separate inboxes: the same phone as buyer, as
// seller and as rider sees only what's meant for that role.
export type NotificationKind = "order" | "delivery" | "cash" | "account";

export type AppNotification = {
  id: string;
  recipient: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string; // where tapping it goes
  createdAt: number;
  readAt?: number;
};

// GRAPPlive staff share one inbox.
export const STAFF_RECIPIENT = "staff";

export const buyerRecipient = (phone: string) => `buyer:${phone}`;
export const sellerRecipient = (sellerId: string) => `seller:${sellerId}`;
export const riderRecipient = (riderId: string) => `rider:${riderId}`;

// GrappStore has no seller account: its orders and cash go to staff.
export const GRAPPSTORE_SELLER_ID = "grapplive-official";

// Only this many notifications are kept per person (the oldest drop off), so
// the browser's storage can't grow without bound.
export const MAX_PER_RECIPIENT = 100;
