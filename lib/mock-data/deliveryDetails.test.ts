import { describe, it, expect, beforeEach } from "vitest";
import {
  cleanDeliveryDetails,
  hasDeliveryDetailsErrors,
  normalizeDigitalAddress,
  validateDeliveryDetails,
} from "./deliveryDetails";
import { useBuyerDetailsStore } from "@/lib/store/useBuyerDetailsStore";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { useLocationStore } from "@/lib/store/useLocationStore";
import { requestDeliveryForGroup } from "@/lib/delivery/dispatch";

describe("normalizeDigitalAddress", () => {
  it("accepts the common ways people type a GhanaPost GPS code", () => {
    expect(normalizeDigitalAddress("ga-123-4567")).toBe("GA-123-4567");
    expect(normalizeDigitalAddress("GA 123 4567")).toBe("GA-123-4567");
    expect(normalizeDigitalAddress("ga1234567")).toBe("GA-123-4567");
    expect(normalizeDigitalAddress("  AK-0391-5028 ")).toBe("AK-0391-5028");
  });

  it("leaves things that aren't addresses uppercased, for validation to reject", () => {
    expect(normalizeDigitalAddress("near the market")).toBe("NEARTHEMARKET");
  });
});

describe("validateDeliveryDetails", () => {
  const ok = { name: "Ama Mensah", digitalAddress: "GA-123-4567", landmark: "" };

  it("accepts a name with a digital address", () => {
    expect(hasDeliveryDetailsErrors(validateDeliveryDetails(ok))).toBe(false);
  });

  it("accepts a name with just a landmark", () => {
    const errors = validateDeliveryDetails({ name: "Ama", digitalAddress: "", landmark: "Opposite the Shell station" });
    expect(hasDeliveryDetailsErrors(errors)).toBe(false);
  });

  it("needs a name", () => {
    expect(validateDeliveryDetails({ ...ok, name: " " }).name).toBeTruthy();
  });

  it("needs a digital address or a real landmark, so a rider can find the customer", () => {
    expect(validateDeliveryDetails({ name: "Ama", digitalAddress: "", landmark: "" }).form).toBeTruthy();
    expect(validateDeliveryDetails({ name: "Ama", digitalAddress: "", landmark: "near" }).form).toBeTruthy();
  });

  it("rejects a malformed digital address", () => {
    expect(validateDeliveryDetails({ ...ok, digitalAddress: "12-34" }).digitalAddress).toBeTruthy();
    expect(validateDeliveryDetails({ ...ok, digitalAddress: "GA-12-4567" }).digitalAddress).toBeTruthy();
  });
});

describe("cleanDeliveryDetails", () => {
  it("trims and canonicalises before the details are stored", () => {
    expect(
      cleanDeliveryDetails({ name: "  Ama ", digitalAddress: "ga 123 4567", landmark: " blue gate " })
    ).toEqual({ name: "Ama", digitalAddress: "GA-123-4567", landmark: "blue gate" });
  });
});

describe("delivery details through checkout and dispatch", () => {
  beforeEach(() => {
    useBuyerDetailsStore.setState({ detailsByPhone: {}, hasHydrated: true });
    useOrdersStore.setState({ orders: [], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useAppStore.setState({ phone: "+233501234567", isVerified: true, roles: [], activeRole: null });
    useLocationStore.setState({ areaName: "Accra" });
  });

  const details = { name: "Ama", digitalAddress: "GA-123-4567", landmark: "Blue gate" };
  const input = {
    sellerId: "s1",
    sellerName: "Ama's Fashion House",
    items: [{ productId: "p1", itemName: "Dress", priceGHS: 100, quantity: 1 }],
    paymentMethod: "instant_confirm" as const,
  };

  it("are saved on the order", () => {
    useOrdersStore.getState().placeOrder([input], details);
    expect(useOrdersStore.getState().orders[0].deliveryDetails).toEqual(details);
  });

  it("are copied onto the delivery when a rider is requested", () => {
    useOrdersStore.getState().placeOrder([input], details);
    const groupId = useOrdersStore.getState().orders[0].groups[0].id;
    requestDeliveryForGroup(groupId);

    const d = useDeliveryStore.getState().deliveries[0];
    expect(d.customerName).toBe("Ama");
    expect(d.digitalAddress).toBe("GA-123-4567");
    expect(d.landmark).toBe("Blue gate");
  });

  it("orders placed without details still work (the rider is told to call)", () => {
    useOrdersStore.getState().placeOrder([input]);
    const groupId = useOrdersStore.getState().orders[0].groups[0].id;
    requestDeliveryForGroup(groupId);
    expect(useDeliveryStore.getState().deliveries[0].digitalAddress).toBeUndefined();
  });

  it("are remembered per phone, never shared between phones", () => {
    useBuyerDetailsStore.getState().saveDetails("+233501111111", details);
    useBuyerDetailsStore.getState().saveDetails("+233502222222", { ...details, name: "Kofi" });

    const saved = useBuyerDetailsStore.getState().detailsByPhone;
    expect(saved["+233501111111"].name).toBe("Ama");
    expect(saved["+233502222222"].name).toBe("Kofi");
    expect(saved["+233503333333"]).toBeUndefined();
  });
});
