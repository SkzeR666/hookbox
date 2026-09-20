import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const title = "Hookbox — Webhook Inspector, Request Bin & HTTP Replay Tool";
const description =
  "Open-source webhook debugging workspace. Catch any webhook in real time, inspect headers, JSON body and raw request, then replay it — self-hosted, no signup. AGPL-3.0.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "webhook inspector",
    "webhook debugger",
    "request bin",
    "request inspector",
    "http replay",
    "webhook testing tool",
    "webhook.site alternative",
    "self-hosted requestbin",
    "stripe webhook debugging",
    "open source webhook tool",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Hookbox",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  applicationName: "Hookbox",
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
