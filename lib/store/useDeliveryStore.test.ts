import { describe, it, expect, beforeEach } from "vitest";
import {
  useDeliveryStore,
  latestDeliveryForGroup,
  activeDeliveryFor,
  openOffersFor,
  historyFor,
} from "./useDeliveryStore";
import { useOrdersStore } from "./useOrdersStore";
import { useRiderStore } from "./useRiderStore";
import { useRiderIdentityStore } from "./useRiderIdentityStore";
import { useAppStore } from "./useAppStore";
import { useLocationStore } from "./useLocationStore";
import { requestDeliveryForGroup } from "@/lib/delivery/dispatch";
import { OTP_MAX_ATTEMPTS, estimateTrip, failureReasonsFor } from "@/lib/mock-data/deliveries";
import type { Order } from "@/lib/mock-data/orders";

const GROUP = "o99-g1";

function freshOrder(): Order {
  return {
    id: "o99",
    buyerPhone: "+233501234567",
    deliveryArea: "Accra",
    groups: [
      {
        id: GROUP,
        sellerId: "s1",
        sellerName: "Ama's Fashion House",
        items: [{ productId: "p1", itemName: "Dress", priceGHS: 100, quantity: 1 }],
        paymentMethod: "instant_confirm",
        status: "ready_to_pack",
        history: [],
      },
    ],
  };
}

const orderStatus = () => useOrdersStore.getState().orders[0].groups[0].status;
const group = () => useOrdersStore.getState().orders[0].groups[0];
const store = () => useDeliveryStore.getState();

function makeRider(phone: string, name: string, online = true) {
  const id = useRiderIdentityStore
    .getState()
    .getOrCreateRiderId(phone, { name, vehicle: "motorbike", area: "Accra" });
  useRiderStore.getState().setOnline(id, online);
  return id;
}

describe("delivery dispatch", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [freshOrder()], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useRiderStore.setState({ onlineByRider: {}, hasHydrated: true });
    useRiderIdentityStore.setState({ identitiesByPhone: {}, hasHydrated: true });
    useAppStore.setState({ phone: "", isVerified: false, roles: [], activeRole: null });
    useLocationStore.setState({ areaName: null });
  });

  describe("requesting a delivery", () => {
    it("moves the order to ready_for_pickup and creates one open offer", () => {
      requestDeliveryForGroup(GROUP);

      expect(orderStatus()).toBe("ready_for_pickup");
      const d = latestDeliveryForGroup(store().deliveries, GROUP)!;
      expect(d.status).toBe("offered");
      expect(d.pickupArea).toBe("Accra");
      expect(d.dropoffArea).toBe("Accra");
      expect(d.customerPhone).toBe("+233501234567");
      expect(d.otp).toMatch(/^\d{4}$/);
      expect(d.codAmountGHS).toBe(0);
    });

    it("does not create a second offer while one is already open", () => {
      requestDeliveryForGroup(GROUP);
      requestDeliveryForGroup(GROUP);
      expect(store().deliveries).toHaveLength(1);
    });
  });

  describe("offers", () => {
    it("are shown only to riders in the pickup area, and not once declined", () => {
      requestDeliveryForGroup(GROUP);
      const rider = makeRider("+233501111111", "Kwesi");

      expect(openOffersFor(store().deliveries, rider, "Accra")).toHaveLength(1);
      expect(openOffersFor(store().deliveries, rider, "Kumasi")).toHaveLength(0);

      const offer = store().deliveries[0];
      store().declineOffer(offer.id, rider);
      expect(openOffersFor(store().deliveries, rider, "Accra")).toHaveLength(0);
      // ...but another rider still sees it.
      const other = makeRider("+233502222222", "Yaw");
      expect(openOffersFor(store().deliveries, other, "Accra")).toHaveLength(1);
    });

    it("remember when a rider first saw them (so a reload doesn't restart the timer)", () => {
      requestDeliveryForGroup(GROUP);
      const rider = makeRider("+233501111111", "Kwesi");
      const id = store().deliveries[0].id;

      store().markOfferSeen(id, rider, 1000);
      store().markOfferSeen(id, rider, 9999);
      expect(store().deliveries[0].offerSeenAt[rider]).toBe(1000);
    });
  });

  describe("acceptOffer", () => {
    it("assigns the rider and tells the order", () => {
      requestDeliveryForGroup(GROUP);
      const rider = makeRider("+233501111111", "Kwesi");

      expect(store().acceptOffer(store().deliveries[0].id, rider)).toBe("ok");
      expect(store().deliveries[0].status).toBe("heading_to_pickup");
      expect(store().deliveries[0].riderId).toBe(rider);
      expect(orderStatus()).toBe("rider_assigned");
      expect(group().riderName).toBe("Kwesi");
      expect(group().etaMinutes).toBe(store().deliveries[0].etaMinutes);
    });

    it("only one rider can win an offer", () => {
      requestDeliveryForGroup(GROUP);
      const a = makeRider("+233501111111", "Kwesi");
      const b = makeRider("+233502222222", "Yaw");
      const id = store().deliveries[0].id;

      expect(store().acceptOffer(id, a)).toBe("ok");
      expect(store().acceptOffer(id, b)).toBe("gone");
      expect(store().deliveries[0].riderId).toBe(a);
    });

    it("refuses offline riders, riders mid-delivery and unknown riders", () => {
      requestDeliveryForGroup(GROUP);
      const id = store().deliveries[0].id;

      const offline = makeRider("+233501111111", "Kwesi", false);
      expect(store().acceptOffer(id, offline)).toBe("offline");
      expect(store().acceptOffer(id, "nobody")).toBe("unknown_rider");

      const busy = makeRider("+233502222222", "Yaw");
      expect(store().acceptOffer(id, busy)).toBe("ok");
      // a second, separate offer while busy
      useOrdersStore.setState({
        orders: [freshOrder(), { ...freshOrder(), id: "o100", groups: [{ ...freshOrder().groups[0], id: "o100-g1" }] }],
      });
      store().createDelivery({
        orderGroupId: "o100-g1", sellerId: "s1", sellerName: "x",
        pickupArea: "Accra", dropoffArea: "Accra", customerPhone: "", codAmountGHS: 0,
      });
      const second = store().deliveries.find((d) => d.orderGroupId === "o100-g1")!;
      expect(store().acceptOffer(second.id, busy)).toBe("busy");
    });

    it("refuses a rider who already declined that offer", () => {
      requestDeliveryForGroup(GROUP);
      const rider = makeRider("+233501111111", "Kwesi");
      const id = store().deliveries[0].id;
      store().declineOffer(id, rider);
      expect(store().acceptOffer(id, rider)).toBe("gone");
    });
  });

  describe("the trip flow", () => {
    function accepted() {
      requestDeliveryForGroup(GROUP);
      const rider = makeRider("+233501111111", "Kwesi");
      const id = store().deliveries[0].id;
      store().acceptOffer(id, rider);
      return { id, rider };
    }

    it("only moves forward one checked step at a time, and only for the assigned rider", () => {
      const { id, rider } = accepted();
      const stranger = makeRider("+233502222222", "Yaw");

      expect(store().advance(id, stranger)).toBe("invalid");
      expect(store().advance(id, rider)).toBe("ok");
      expect(store().deliveries[0].status).toBe("at_pickup");
      expect(orderStatus()).toBe("rider_assigned"); // nothing new for the buyer yet

      expect(store().advance(id, rider)).toBe("ok");
      expect(store().deliveries[0].status).toBe("out_for_delivery");
      expect(orderStatus()).toBe("out_for_delivery");

      expect(store().advance(id, rider)).toBe("ok");
      expect(store().deliveries[0].status).toBe("at_dropoff");
      // there is no button-step into "delivered": only the OTP does that
      expect(store().advance(id, rider)).toBe("invalid");
    });

    it("cannot be completed before the rider has arrived", () => {
      const { id, rider } = accepted();
      const otp = store().deliveries[0].otp;
      expect(store().completeDelivery(id, rider, otp)).toBe("invalid");
    });

    it("completes only with the right OTP, then updates order, status and trip count", () => {
      const { id, rider } = accepted();
      store().advance(id, rider);
      store().advance(id, rider);
      store().advance(id, rider);
      const otp = store().deliveries[0].otp;
      const wrong = otp === "0000" ? "1111" : "0000";

      expect(store().completeDelivery(id, rider, wrong)).toBe("wrong_otp");
      expect(store().deliveries[0].status).toBe("at_dropoff");

      expect(store().completeDelivery(id, rider, ` ${otp} `)).toBe("ok");
      expect(store().deliveries[0].status).toBe("delivered");
      expect(orderStatus()).toBe("delivered");
      expect(Object.values(useRiderIdentityStore.getState().identitiesByPhone)[0].tripsCompleted).toBe(1);
      expect(activeDeliveryFor(store().deliveries, rider)).toBeUndefined();
      expect(historyFor(store().deliveries, rider)).toHaveLength(1);
    });

    it("locks the code after too many wrong tries, even for the right code", () => {
      const { id, rider } = accepted();
      store().advance(id, rider);
      store().advance(id, rider);
      store().advance(id, rider);
      const otp = store().deliveries[0].otp;
      const wrong = otp === "0000" ? "1111" : "0000";

      for (let i = 0; i < OTP_MAX_ATTEMPTS - 1; i++) {
        expect(store().completeDelivery(id, rider, wrong)).toBe("wrong_otp");
      }
      expect(store().completeDelivery(id, rider, wrong)).toBe("locked");
      expect(store().completeDelivery(id, rider, otp)).toBe("locked");
      expect(store().deliveries[0].status).toBe("at_dropoff");
    });
  });

  describe("failed deliveries", () => {
    function atDropoff() {
      requestDeliveryForGroup(GROUP);
      const rider = makeRider("+233501111111", "Kwesi");
      const id = store().deliveries[0].id;
      store().acceptOffer(id, rider);
      store().advance(id, rider);
      store().advance(id, rider);
      store().advance(id, rider);
      return { id, rider };
    }

    it("only allows reasons that fit the step (seller problems at pickup, customer problems after)", () => {
      expect(failureReasonsFor("heading_to_pickup")).toEqual([]);
      expect(failureReasonsFor("at_pickup")).toEqual(["seller_unavailable"]);
      expect(failureReasonsFor("at_dropoff")).toContain("wrong_address");
      expect(failureReasonsFor("at_dropoff")).not.toContain("seller_unavailable");
    });

    it("ends the attempt, sends the order back to waiting, and frees the rider", () => {
      const { id, rider } = atDropoff();

      expect(store().reportFailure(id, rider, "seller_unavailable")).toBe("invalid");
      expect(store().reportFailure(id, rider, "customer_unavailable")).toBe("ok");

      expect(store().deliveries[0].status).toBe("failed");
      expect(store().deliveries[0].failureReason).toBe("customer_unavailable");
      expect(orderStatus()).toBe("ready_for_pickup");
      expect(group().riderName).toBeUndefined();
      expect(activeDeliveryFor(store().deliveries, rider)).toBeUndefined();
    });

    it("lets the seller request again, creating a fresh offer and keeping the failed one as history", () => {
      const { id, rider } = atDropoff();
      store().reportFailure(id, rider, "wrong_address");

      requestDeliveryForGroup(GROUP);
      expect(store().deliveries).toHaveLength(2);
      expect(latestDeliveryForGroup(store().deliveries, GROUP)!.status).toBe("offered");
      expect(store().deliveries.find((d) => d.id === id)!.status).toBe("failed");
    });
  });

  describe("estimateTrip (mock)", () => {
    it("is deterministic and within sensible bounds", () => {
      const a = estimateTrip("o1-g1");
      expect(estimateTrip("o1-g1")).toEqual(a);
      expect(a.pickupKm).toBeGreaterThanOrEqual(0.5);
      expect(a.dropoffKm).toBeGreaterThanOrEqual(1.5);
      expect(a.feeGHS).toBeGreaterThan(8);
    });
  });

  describe("placeOrder captures how to reach the buyer", () => {
    it("stores the buyer's phone and delivery area on the order", () => {
      useAppStore.setState({ phone: "+233509999999" });
      useLocationStore.setState({ areaName: "Tema" });
      useOrdersStore.getState().placeOrder([
        {
          sellerId: "s1",
          sellerName: "Ama's",
          items: [{ productId: "p1", itemName: "Dress", priceGHS: 100, quantity: 1 }],
          paymentMethod: "instant_confirm",
        },
      ]);
      const placed = useOrdersStore.getState().orders[0];
      expect(placed.buyerPhone).toBe("+233509999999");
      expect(placed.deliveryArea).toBe("Tema");
    });
  });
});
