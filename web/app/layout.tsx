import type { Metadata } from "next";
import "./globals.css";
import "./workspace.css";

export const metadata: Metadata = {
  title: "NOLA PULSE | Campaign Decision Intelligence",
  description:
    "Trace the opportunity. Test the economics. Know what changes the decision. Independent Saints and Pelicans market intelligence prototype.",
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
