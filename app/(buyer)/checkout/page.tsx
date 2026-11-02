"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconMapPin } from "@tabler/icons-react";
import { useCartStore } from "@/lib/store/useCartStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { useLocationStore } from "@/lib/store/useLocationStore";
import { useBuyerDetailsStore } from "@/lib/store/useBuyerDetailsStore";
import {
  EMPTY_DELIVERY_DETAILS,
  cleanDeliveryDetails,
  hasDeliveryDetailsErrors,
  validateDeliveryDetails,
  type DeliveryDetails,
  type DeliveryDetailsErrors,
} from "@/lib/mock-data/deliveryDetails";
import { getCurrentPin, type PinResult } from "@/lib/utils/getCurrentPin";

const pinErrorMessages: Record<Extract<PinResult, { ok: false }>["reason"], string> = {
  denied: "Location is turned off for this site. Turn it on in your browser settings, or add a landmark instead.",
  unavailable: "Couldn't find your location. Try again outdoors, or add a landmark instead.",
  unsupported: "This browser can't share location. Add a landmark instead.",
  timeout: "That took too long. Try again, or add a landmark instead.",
};
import { useOrdersStore, type NewOrderGroupInput } from "@/lib/store/useOrdersStore";
import { getProductById } from "@/lib/mock-data/catalog";
import type { PaymentMethod } from "@/lib/mock-data/orders";

const INSTANT_CONFIRM_FEE_GHS = 2;

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  const [method, setMethod] = useState<PaymentMethod>("instant_confirm");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Delivery details: pre-filled from what this phone used last time, once
  // the saved details have loaded. Synced during render (once) rather than
  // in an effect, same pattern as the customer notes box.
  const phone = useAppStore((s) => s.phone);
  const areaName = useLocationStore((s) => s.areaName);
  const savedDetails = useBuyerDetailsStore((s) => (phone ? s.detailsByPhone[phone] : undefined));
  const detailsHydrated = useBuyerDetailsStore((s) => s.hasHydrated);
  const saveDetails = useBuyerDetailsStore((s) => s.saveDetails);
  const [details, setDetails] = useState<DeliveryDetails>(EMPTY_DELIVERY_DETAILS);
  const [detailsErrors, setDetailsErrors] = useState<DeliveryDetailsErrors>({});
  const [prefilled, setPrefilled] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [pinError, setPinError] = useState("");
  if (detailsHydrated && !prefilled) {
    setPrefilled(true);
    // A saved location pin is never pre-filled: it'd be where they stood
    // last time, not necessarily where this order is going.
    if (savedDetails) setDetails({ ...savedDetails, pin: undefined });
  }

  const handleSharePin = async () => {
    setIsLocating(true);
    setPinError("");
    const result = await getCurrentPin();
    setIsLocating(false);
    if (result.ok) {
      setDetails((d) => ({ ...d, pin: result.pin }));
      setDetailsErrors({});
    } else {
      setPinError(pinErrorMessages[result.reason]);
    }
  };
  const updateDetail = (field: keyof DeliveryDetails, value: string) => {
    setDetails((d) => ({ ...d, [field]: value }));
    setDetailsErrors({});
  };

  // Resolved once, reused both for the on-screen summary and for building
  // the OrderGroups on submit — one source of truth instead of two
  // separate derivations of the same cart.
  const lineItems = items
    .map((item) => {
      const product = getProductById(item.productId);
      return product ? { item, product } : null;
    })
    .filter((row): row is { item: (typeof items)[number]; product: NonNullable<ReturnType<typeof getProductById>> } =>
      Boolean(row)
    );

  const subtotal = lineItems.reduce((sum, { item, product }) => sum + product.priceGHS * item.quantity, 0);

  if (subtotal === 0) {
    return (
      <div className="px-3 md:px-5 pt-4">
        <div className="text-[12px] text-gl-text-secondary mb-3">
          Your cart is empty — nothing to check out.
        </div>
        <button
          onClick={() => router.push("/home")}
          className="bg-gl-brand text-white text-[11px] font-semibold px-4 py-2 rounded-lg active:opacity-80 transition-opacity"
        >
          Browse products
        </button>
      </div>
    );
  }

  const total = method === "instant_confirm" ? subtotal + INSTANT_CONFIRM_FEE_GHS : subtotal;

  // Grouped by seller purely for the on-screen summary — with a
  // multi-seller cart, buyers should see which items ship from which
  // seller before paying, which also previews the same split the order
  // will actually settle into.
  const groupedForDisplay = lineItems.reduce<
    Record<string, { sellerName: string; rows: { item: (typeof items)[number]; product: NonNullable<ReturnType<typeof getProductById>> }[] }>
  >((acc, row) => {
    const key = row.product.sellerId;
    if (!acc[key]) acc[key] = { sellerName: row.product.sellerName, rows: [] };
    acc[key].rows.push(row);
    return acc;
  }, {});

  const handlePlaceOrder = () => {
    const errors = validateDeliveryDetails(details);
    if (hasDeliveryDetailsErrors(errors)) {
      setDetailsErrors(errors);
      return;
    }
    const cleanDetails = cleanDeliveryDetails(details);
    // The pin is a one-time snapshot, so only the typed details are remembered.
    if (phone) saveDetails(phone, { ...cleanDetails, pin: undefined });

    setIsPlacingOrder(true);
    setTimeout(() => {
      // Group cart items by seller — each seller becomes one OrderGroup
      // within a single buyer-facing Order (unified cart, split settlement).
      const groupsBySeller = new Map<string, NewOrderGroupInput>();

      lineItems.forEach(({ item, product }) => {
        const orderItem = {
          productId: product.id,
          itemName: product.name,
          quantity: item.quantity,
          priceGHS: product.priceGHS,
        };

        const existing = groupsBySeller.get(product.sellerId);
        if (existing) {
          existing.items.push(orderItem);
        } else {
          groupsBySeller.set(product.sellerId, {
            sellerId: product.sellerId,
            sellerName: product.sellerName,
            items: [orderItem],
            paymentMethod: method,
          });
        }
      });

      placeOrder(Array.from(groupsBySeller.values()), cleanDetails);
      clearCart();
      router.push("/checkout/confirmation");
    }, 500);
  };

  return (
    <div className="px-3 md:px-5 pt-3.5 pb-5">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => router.back()} className="active:opacity-60 transition-opacity" aria-label="Back">
          <IconArrowLeft size={16} className="text-gl-text" />
        </button>
        <h1 className="text-[14px] font-semibold text-gl-text">How do you want to pay?</h1>
      </div>

      <div className="border border-gl-border rounded-lg p-3 mb-4">
        <h2 className="text-[11px] font-semibold text-gl-text mb-0.5">Delivery details</h2>
        <p className="text-[9px] text-gl-text-secondary mb-2.5">
          {areaName ? `Delivering in ${areaName}. ` : ""}Your rider sees these only once they accept your order.
        </p>
        <input
          type="text"
          value={details.name}
          onChange={(e) => updateDetail("name", e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          className="w-full border border-gl-border-strong rounded-lg px-3 py-2 text-[12px] text-gl-text outline-none mb-1 transition-colors focus:border-gl-brand"
        />
        {detailsErrors.name && <p className="text-[10px] text-gl-red mb-1">{detailsErrors.name}</p>}
        <input
          type="text"
          value={details.digitalAddress}
          onChange={(e) => updateDetail("digitalAddress", e.target.value)}
          placeholder="Digital address, e.g. GA-123-4567 (optional)"
          autoCapitalize="characters"
          className="w-full border border-gl-border-strong rounded-lg px-3 py-2 text-[12px] text-gl-text outline-none mt-1.5 mb-1 transition-colors focus:border-gl-brand"
        />
        {detailsErrors.digitalAddress && (
          <p className="text-[10px] text-gl-red mb-1">{detailsErrors.digitalAddress}</p>
        )}
        <textarea
          value={details.landmark}
          onChange={(e) => updateDetail("landmark", e.target.value)}
          placeholder="Landmark or directions, e.g. opposite the Shell station, blue gate"
          rows={2}
          className="w-full border border-gl-border-strong rounded-lg px-3 py-2 text-[12px] text-gl-text outline-none mt-1.5 transition-colors focus:border-gl-brand resize-none"
        />

        <div className="mt-2.5">
          {details.pin ? (
            <div className="flex items-center justify-between border border-gl-brand rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gl-brand">
                <IconMapPin size={14} /> Location shared
                <span className="font-normal text-gl-text-secondary">· within {details.pin.accuracyM} m</span>
              </div>
              <button
                onClick={() => setDetails((d) => ({ ...d, pin: undefined }))}
                className="text-[10px] text-gl-text-secondary active:opacity-60"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={handleSharePin}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-1.5 border border-gl-brand text-gl-brand rounded-lg py-2 text-[11px] font-semibold active:bg-gl-brand-soft-bg transition-colors disabled:opacity-60"
            >
              <IconMapPin size={14} /> {isLocating ? "Finding you…" : "Share my current location"}
            </button>
          )}
          <p className="text-[9px] text-gl-text-secondary mt-1">
            Only share this while you&apos;re at the place you want it delivered.
          </p>
          {pinError && <p className="text-[10px] text-gl-red mt-1">{pinError}</p>}
        </div>
        {detailsErrors.form && <p className="text-[10px] text-gl-red mt-1">{detailsErrors.form}</p>}
      </div>

      {/* Real item list before payment, grouped by seller so a multi-seller
          cart is legible — this is the moment someone commits real MoMo
          money, and showing exactly what's being paid for (and to whom)
          matters more here than almost anywhere else in the app. */}
      <div className="border border-gl-border rounded-lg p-3 mb-4">
        <h2 className="text-[11px] font-semibold text-gl-text mb-2">Order summary</h2>
        {Object.entries(groupedForDisplay).map(([sellerId, group], groupIdx) => (
          <div key={sellerId} className={groupIdx > 0 ? "mt-3 pt-3 border-t border-gl-bg-muted" : ""}>
            <div className="text-[9px] font-semibold text-gl-text-secondary uppercase tracking-wide mb-1.5">
              From {group.sellerName}
            </div>
            <div className="divide-y divide-gl-bg-muted">
              {group.rows.map(({ item, product }) => (
                <div key={product.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-md shrink-0 overflow-hidden gl-shimmer" />
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gl-text-secondary truncate">
                      {product.name}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </span>
                    <span className="text-[11px] font-medium text-gl-text shrink-0">
                      {formatGHS(product.priceGHS * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gl-text-secondary mb-4">
        Pick how you&apos;d like to pay
      </p>

      <button
        onClick={() => setMethod("instant_confirm")}
        className={`w-full text-left border rounded-lg p-3 mb-2.5 transition-colors ${
          method === "instant_confirm" ? "border-[1.5px] border-gl-brand" : "border-gl-border-strong"
        }`}
      >
        <div className="flex justify-between items-start mb-1">
          <span className="text-[12px] font-semibold text-gl-text">Instant Confirm</span>
          <span className="bg-gl-brand-soft-bg text-gl-brand-soft-text text-[8px] font-semibold px-1.5 py-0.5 rounded">
            RECOMMENDED
          </span>
        </div>
        <p className="text-[10px] text-gl-text-secondary mb-1.5">
          Approve with your MoMo PIN — order starts right away, no waiting on the seller
        </p>
        <div className="text-[10px] font-semibold text-gl-text">
          +{formatGHS(INSTANT_CONFIRM_FEE_GHS)} fee
        </div>
      </button>

      <button
        onClick={() => setMethod("direct_momo")}
        className={`w-full text-left border rounded-lg p-3 mb-2.5 transition-colors ${
          method === "direct_momo" ? "border-[1.5px] border-gl-brand" : "border-gl-border-strong"
        }`}
      >
        <div className="text-[12px] font-semibold text-gl-text mb-1">Direct MoMo</div>
        <p className="text-[10px] text-gl-text-secondary mb-1.5">
          Send payment yourself, then confirm — seller checks and confirms manually, may take a
          few hours
        </p>
        <div className="text-[10px] font-semibold text-gl-text">No fee</div>
      </button>

      <button
        onClick={() => setMethod("cash_on_delivery")}
        className={`w-full text-left border rounded-lg p-3 mb-4 transition-colors ${
          method === "cash_on_delivery" ? "border-[1.5px] border-gl-brand" : "border-gl-border-strong"
        }`}
      >
        <div className="text-[12px] font-semibold text-gl-text mb-1">Cash on delivery</div>
        <p className="text-[10px] text-gl-text-secondary mb-1.5">
          Pay the rider in cash when your order arrives — have the exact amount ready
        </p>
        <div className="text-[10px] font-semibold text-gl-text">No fee</div>
      </button>

      {/* Subtotal/fee/total breakdown, reactive to the payment method
          chosen above — previously the fee only appeared as a single line
          inside the Instant Confirm card, with no final breakdown showing
          how it rolled into the total before the pay button. */}
      <div className="border border-gl-border rounded-lg p-3 mb-4">
        <div className="flex justify-between text-[11px] text-gl-text-secondary mb-1">
          <span>Subtotal</span>
          <span>{formatGHS(subtotal)}</span>
        </div>
        {method === "instant_confirm" && (
          <div className="flex justify-between text-[11px] text-gl-text-secondary mb-1">
            <span>Instant Confirm fee</span>
            <span>{formatGHS(INSTANT_CONFIRM_FEE_GHS)}</span>
          </div>
        )}
        <div className="flex justify-between text-[12px] font-semibold text-gl-text pt-1.5 border-t border-gl-bg-muted mt-1.5">
          <span>Total</span>
          <span>{formatGHS(total)}</span>
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={isPlacingOrder}
        className="w-full bg-gl-brand disabled:opacity-60 text-white rounded-lg py-2.5 text-[13px] font-semibold active:opacity-80 transition-opacity"
      >
        {isPlacingOrder ? "Placing order…" : `Continue — ${formatGHS(total)}`}
      </button>
    </div>
  );
}
