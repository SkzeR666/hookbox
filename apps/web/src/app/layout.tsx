import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hookbox — inspect, replay, fix",
  description:
    "Catch any webhook. See exactly what happened. Replay it when you're ready.",
};

export const viewport: Viewport = {
  themeColor: "#070907",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}