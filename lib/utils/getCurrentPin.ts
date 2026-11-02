import type { DeliveryPin } from "@/lib/mock-data/deliveryDetails";

export type PinResult =
  | { ok: true; pin: DeliveryPin }
  | { ok: false; reason: "denied" | "unavailable" | "unsupported" | "timeout" };

// Asks the phone for a precise fix right now (high accuracy, never a cached
// position) — the "send my current location" moment. Browsers only allow
// this on secure (https) pages and after the person says yes.
export function getCurrentPin(): Promise<PinResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ ok: false, reason: "unsupported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          ok: true,
          pin: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyM: Math.round(position.coords.accuracy),
          },
        }),
      (error) =>
        resolve({
          ok: false,
          reason: error.code === 1 ? "denied" : error.code === 3 ? "timeout" : "unavailable",
        }),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  });
}
