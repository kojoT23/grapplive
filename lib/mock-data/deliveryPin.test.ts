import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  cleanDeliveryDetails,
  isValidPin,
  mapsDirectionsLink,
  validateDeliveryDetails,
  hasDeliveryDetailsErrors,
} from "./deliveryDetails";
import { getCurrentPin } from "@/lib/utils/getCurrentPin";
import { useOrdersStore } from "@/lib/store/useOrdersStore";
import { useDeliveryStore } from "@/lib/store/useDeliveryStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { useLocationStore } from "@/lib/store/useLocationStore";
import { requestDeliveryForGroup } from "@/lib/delivery/dispatch";

const pin = { lat: 5.6037, lng: -0.187, accuracyM: 12 };

describe("location pin", () => {
  it("is valid only with real coordinates", () => {
    expect(isValidPin(pin)).toBe(true);
    expect(isValidPin(undefined)).toBe(false);
    expect(isValidPin({ ...pin, lat: 95 })).toBe(false);
    expect(isValidPin({ ...pin, lng: NaN })).toBe(false);
  });

  it("is enough on its own to say where to deliver", () => {
    const withPin = validateDeliveryDetails({ name: "Ama", digitalAddress: "", landmark: "", pin });
    expect(hasDeliveryDetailsErrors(withPin)).toBe(false);
    const without = validateDeliveryDetails({ name: "Ama", digitalAddress: "", landmark: "" });
    expect(without.form).toBeTruthy();
  });

  it("is kept when details are cleaned, and dropped if it's garbage", () => {
    expect(cleanDeliveryDetails({ name: "Ama", digitalAddress: "", landmark: "", pin }).pin).toEqual(pin);
    expect(
      cleanDeliveryDetails({ name: "Ama", digitalAddress: "", landmark: "", pin: { ...pin, lat: 999 } }).pin
    ).toBeUndefined();
  });

  it("turns into a directions link for the rider", () => {
    expect(mapsDirectionsLink(pin)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=5.6037,-0.187"
    );
  });
});

describe("getCurrentPin", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis.navigator, "geolocation");

  function mockGeolocation(impl: unknown) {
    Object.defineProperty(globalThis.navigator, "geolocation", { value: impl, configurable: true });
  }

  afterEach(() => {
    if (original) Object.defineProperty(globalThis.navigator, "geolocation", original);
    else delete (globalThis.navigator as unknown as Record<string, unknown>).geolocation;
  });

  it("returns the position with a rounded accuracy", async () => {
    mockGeolocation({
      getCurrentPosition: (ok: (p: unknown) => void) =>
        ok({ coords: { latitude: 5.6, longitude: -0.19, accuracy: 11.6 } }),
    });
    expect(await getCurrentPin()).toEqual({ ok: true, pin: { lat: 5.6, lng: -0.19, accuracyM: 12 } });
  });

  it("asks for a fresh, high-accuracy fix, never a cached one", async () => {
    const spy = vi.fn((ok: (p: unknown) => void) =>
      ok({ coords: { latitude: 1, longitude: 1, accuracy: 5 } })
    );
    mockGeolocation({ getCurrentPosition: spy });
    await getCurrentPin();
    const options = (spy.mock.calls[0] as unknown[])[2] as PositionOptions;
    expect(options.enableHighAccuracy).toBe(true);
    expect(options.maximumAge).toBe(0);
  });

  it("explains why it failed", async () => {
    const failWith = (code: number) =>
      mockGeolocation({
        getCurrentPosition: (_ok: unknown, err: (e: { code: number }) => void) => err({ code }),
      });
    failWith(1);
    expect(await getCurrentPin()).toEqual({ ok: false, reason: "denied" });
    failWith(3);
    expect(await getCurrentPin()).toEqual({ ok: false, reason: "timeout" });
    failWith(2);
    expect(await getCurrentPin()).toEqual({ ok: false, reason: "unavailable" });
  });

  it("reports browsers with no location support", async () => {
    mockGeolocation(undefined);
    expect(await getCurrentPin()).toEqual({ ok: false, reason: "unsupported" });
  });
});

describe("pin through the order and delivery", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [], hasHydrated: true });
    useDeliveryStore.setState({ deliveries: [], hasHydrated: true });
    useAppStore.setState({ phone: "+233501234567", isVerified: true, roles: [], activeRole: null });
    useLocationStore.setState({ areaName: "Accra" });
  });

  it("reaches the rider's delivery record", () => {
    useOrdersStore.getState().placeOrder(
      [
        {
          sellerId: "s1",
          sellerName: "Ama's Fashion House",
          items: [{ productId: "p1", itemName: "Dress", priceGHS: 100, quantity: 1 }],
          paymentMethod: "instant_confirm",
        },
      ],
      { name: "Ama", digitalAddress: "", landmark: "", pin }
    );
    requestDeliveryForGroup(useOrdersStore.getState().orders[0].groups[0].id);
    expect(useDeliveryStore.getState().deliveries[0].pin).toEqual(pin);
  });
});
