import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthPromptModal } from "@/components/ui/AuthPromptModal";
import { NotificationWiring } from "@/components/notifications/NotificationWiring";

export const metadata: Metadata = {
  title: "GRAPPlive",
  description: "Buy it. Try it. Zoom it. Live.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#D6127A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans bg-gl-page-bg">
        <div className="max-w-[480px] md:max-w-[720px] mx-auto min-h-dvh bg-white relative">
          {children}
          <AuthPromptModal />
          <NotificationWiring />
        </div>
      </body>
    </html>
  );
}
