// What a rider needs to find a customer: who they are, plus at least one of
// a shared location pin, a GhanaPost GPS digital address, or a landmark /
// directions (street addressing in Ghana is unreliable, so these do the real
// work).
// A shared location pin, like sending "my current location" on WhatsApp: a
// snapshot of where the buyer was standing when they tapped the button.
export type DeliveryPin = {
  lat: number;
  lng: number;
  accuracyM: number; // how close the phone says the fix is, in metres
};

export type DeliveryDetails = {
  name: string;
  digitalAddress: string; // "" when not given
  landmark: string; // "" when not given
  pin?: DeliveryPin; // only when the buyer shared their location
};

export function isValidPin(pin: DeliveryPin | undefined): pin is DeliveryPin {
  return (
    pin !== undefined &&
    Number.isFinite(pin.lat) &&
    Number.isFinite(pin.lng) &&
    Math.abs(pin.lat) <= 90 &&
    Math.abs(pin.lng) <= 180
  );
}

// Opens turn-by-turn directions to the pin in Google Maps (works in the
// browser and in the Maps app). This is what a rider taps to navigate.
export function mapsDirectionsLink(pin: DeliveryPin): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;
}

export const EMPTY_DELIVERY_DETAILS: DeliveryDetails = {
  name: "",
  digitalAddress: "",
  landmark: "",
};

// GhanaPostGPS format: two letters, then a 3–5 digit area code, then four
// digits — e.g. GA-123-4567 (sources differ slightly on the middle part, so
// this accepts 3 to 5 digits).
const DIGITAL_ADDRESS_LOOSE = /^([A-Za-z]{2})-?(\d{3,5})-?(\d{4})$/;

// Tidies what someone typed into the canonical form: "ga 1234567" or
// "ga-123-4567" -> "GA-123-4567". Leaves anything that doesn't look like a
// digital address uppercased and trimmed so validation can reject it.
export function normalizeDigitalAddress(raw: string): string {
  const compact = raw.trim().replace(/\s+/g, "");
  const match = compact.match(DIGITAL_ADDRESS_LOOSE);
  return match ? `${match[1].toUpperCase()}-${match[2]}-${match[3]}` : compact.toUpperCase();
}

export type DeliveryDetailsErrors = {
  name?: string;
  digitalAddress?: string;
  landmark?: string;
  // Shown when neither a digital address nor a landmark was given.
  form?: string;
};

export function validateDeliveryDetails(details: DeliveryDetails): DeliveryDetailsErrors {
  const errors: DeliveryDetailsErrors = {};
  if (details.name.trim().length < 2) errors.name = "Enter your name";

  const address = normalizeDigitalAddress(details.digitalAddress);
  const landmark = details.landmark.trim();

  if (address && !/^[A-Z]{2}-\d{3,5}-\d{4}$/.test(address)) {
    errors.digitalAddress = "That doesn't look like a digital address (e.g. GA-123-4567)";
  }
  if (!isValidPin(details.pin) && !address && landmark.length < 5) {
    errors.form = "Share your location, or add your digital address or a landmark, so your rider can find you";
  }
  return errors;
}

export function hasDeliveryDetailsErrors(errors: DeliveryDetailsErrors): boolean {
  return Object.keys(errors).length > 0;
}

// Trimmed, canonical copy to store on the order.
export function cleanDeliveryDetails(details: DeliveryDetails): DeliveryDetails {
  return {
    name: details.name.trim(),
    digitalAddress: normalizeDigitalAddress(details.digitalAddress),
    landmark: details.landmark.trim(),
    ...(isValidPin(details.pin) ? { pin: details.pin } : {}),
  };
}
