export type PayoutStatus = "paid_out" | "pending_release";

export type PayoutRecord = {
  id: string;
  amountGHS: number;
  detail: string; // e.g. "2 orders · 19 Aug" or "Direct MoMo · settled directly"
  status: PayoutStatus | "direct_momo_untracked";
};

export type MomoDetails = {
  numberMasked: string; // e.g. "024 XXX 4567"
  isVerified: boolean;
  pendingChange: {
    hoursRemaining: number;
    minutesRemaining: number;
  } | null;
};

export const availableBalanceGHS = 341;

export const momoDetails: MomoDetails = {
  numberMasked: "024 XXX 4567",
  isVerified: true,
  pendingChange: {
    hoursRemaining: 18,
    minutesRemaining: 32,
  },
};

export const payoutHistory: PayoutRecord[] = [
  { id: "po1", amountGHS: 145, detail: "2 orders · 19 Aug", status: "paid_out" },
  { id: "po2", amountGHS: 89, detail: "1 order · 21 Aug", status: "pending_release" },
  { id: "po3", amountGHS: 65, detail: "Direct MoMo · settled directly", status: "direct_momo_untracked" },
];
