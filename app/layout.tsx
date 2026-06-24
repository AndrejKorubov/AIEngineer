import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Batch Creative Studio",
  description: "Turn product photos into styled social creatives, at batch scale.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
