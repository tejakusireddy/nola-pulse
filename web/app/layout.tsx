import type { Metadata } from "next";
import "./globals.css";
import "./workspace.css";
import "./performance.css";

export const metadata: Metadata = {
  title: "NOLA PULSE | Saints + Pelicans Market Intelligence",
  description:
    "Saints and Pelicans attendance performance, historical comparisons, Gulf Coast market context, and campaign planning. Independent portfolio demonstration.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
