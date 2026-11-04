import { getStoreBySellerId } from "@/lib/mock-data/stores";
import { ACTIVE_DELIVERY_STATUSES, canRequestAgain } from "@/lib/mock-data/deliveries";
import { groupPayable } from "@/lib/mock-data/orders";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { latestDeliveryForGroup, useDeliveryStore } from "@/lib/store/useDeliveryStore";

// The seller pressing "Request delivery": moves the order to
// ready_for_pickup AND creates the delivery offer riders will see. Lives
// here (not in either store) because it needs both, and the delivery store
// already depends on the orders store.
//
// Pickup area: the seller's first delivery area; sellers created at runtime
// have no Store record yet, so they fall back to "Accra" until sellers get
// real addresses (ROADMAP.md §1.2). Drop-off area is the buyer's area as
// captured at checkout.
export function requestDeliveryForGroup(groupId: string): void {
  const orders = useOrdersStore.getState();
  const order = orders.orders.find((o) => o.groups.some((g) => g.id === groupId));
  const group = order?.groups.find((g) => g.id === groupId);
  if (!order || !group) return;

  // Never create a second offer while one is open or being delivered.
  const latest = latestDeliveryForGroup(useDeliveryStore.getState().deliveries, groupId);
  if (latest && (latest.status === "offered" || ACTIVE_DELIVERY_STATUSES.includes(latest.status))) {
    return;
  }
  // A returned parcel has to be confirmed back with the seller first.
  if (!canRequestAgain(latest)) return;

  const pickupArea = getStoreBySellerId(group.sellerId)?.deliveryAreas[0] ?? "Accra";
  orders.requestDelivery(groupId);
  useDeliveryStore.getState().createDelivery({
    orderGroupId: groupId,
    sellerId: group.sellerId,
    sellerName: group.sellerName,
    pickupArea,
    dropoffArea: order.deliveryArea ?? pickupArea,
    customerPhone: order.buyerPhone ?? "",
    customerName: order.deliveryDetails?.name,
    digitalAddress: order.deliveryDetails?.digitalAddress,
    landmark: order.deliveryDetails?.landmark,
    pin: order.deliveryDetails?.pin,
    // The delivery fee is the rider's pay; fixture orders without one fall
    // back to the mock trip estimate.
    feeGHS: group.deliveryFeeGHS,
    // Cash on delivery: the rider collects everything the buyer owes (items
    // plus any delivery fee they're charged). The items part is tracked in the
    // cash ledger until it reaches the seller; the rider keeps the delivery
    // fee from it. Every other payment method is already paid.
    codAmountGHS: group.paymentMethod === "cash_on_delivery" ? groupPayable(group) : 0,
    feePaidInCash:
      group.paymentMethod === "cash_on_delivery" && (group.deliveryFeeChargedGHS ?? 0) > 0,
  });
}
