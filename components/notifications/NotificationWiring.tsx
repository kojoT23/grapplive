"use client";

import { useEffect } from "react";
import { startNotificationWiring } from "@/lib/notifications/wire";

// Starts the watcher that turns changes in orders, deliveries, cash and riders
// into notifications for the people they concern. Rendered once, in the root
// layout, so it runs on every screen.
export function NotificationWiring() {
  useEffect(() => startNotificationWiring(), []);
  return null;
}
