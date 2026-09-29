"use client";

import { useEffect } from "react";

// error.tsx only catches errors below the root layout — if the root
// layout itself throws, Next.js falls back to this instead, which is why
// it needs its own <html>/<body> (it fully replaces the page, styles and
// all, since even globals.css may not have loaded). Very unlikely to
// trigger in practice, but without it a root-layout failure is a true
// blank screen with nothing to recover from at all.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100dvh",
            padding: "24px",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <h1 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "24px", maxWidth: 240 }}>
            That&apos;s on us, not you. Try again — if it keeps happening, restarting the app
            usually helps.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#D6127A",
              color: "white",
              fontSize: "12px",
              fontWeight: 600,
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
