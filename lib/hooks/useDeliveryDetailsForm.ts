import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useBuyerDetailsStore } from "@/lib/store/useBuyerDetailsStore";
import {
  EMPTY_DELIVERY_DETAILS,
  cleanDeliveryDetails,
  hasDeliveryDetailsErrors,
  validateDeliveryDetails,
  type DeliveryDetails,
  type DeliveryDetailsErrors,
  type DeliveryPin,
} from "@/lib/mock-data/deliveryDetails";

// The state behind the "Delivery details" box, shared by both checkouts
// (marketplace and GrappStore). Pre-filled from what this phone used last
// time once the saved details have loaded — synced during render (once)
// rather than in an effect. A saved location pin is never pre-filled: it'd
// be where they stood last time, not where this order is going.
export function useDeliveryDetailsForm() {
  const phone = useAppStore((s) => s.phone);
  const savedDetails = useBuyerDetailsStore((s) => (phone ? s.detailsByPhone[phone] : undefined));
  const hydrated = useBuyerDetailsStore((s) => s.hasHydrated);
  const saveDetails = useBuyerDetailsStore((s) => s.saveDetails);

  const [details, setDetails] = useState<DeliveryDetails>(EMPTY_DELIVERY_DETAILS);
  const [errors, setErrors] = useState<DeliveryDetailsErrors>({});
  const [prefilled, setPrefilled] = useState(false);
  if (hydrated && !prefilled) {
    setPrefilled(true);
    if (savedDetails) setDetails({ ...savedDetails, pin: undefined });
  }

  const update = (field: "name" | "digitalAddress" | "landmark", value: string) => {
    setDetails((d) => ({ ...d, [field]: value }));
    setErrors({});
  };

  const setPin = (pin: DeliveryPin | undefined) => {
    setDetails((d) => ({ ...d, pin }));
    setErrors({});
  };

  // Validates; on success remembers the typed details for next time (never the
  // one-time pin) and returns the clean details to put on the order. On
  // failure shows the errors and returns null.
  const submit = (): DeliveryDetails | null => {
    const found = validateDeliveryDetails(details);
    if (hasDeliveryDetailsErrors(found)) {
      setErrors(found);
      return null;
    }
    const clean = cleanDeliveryDetails(details);
    if (phone) saveDetails(phone, { ...clean, pin: undefined });
    return clean;
  };

  return { details, errors, update, setPin, submit };
}

export type DeliveryDetailsForm = ReturnType<typeof useDeliveryDetailsForm>;
