import type { Metadata } from "next";
import { AutoHideNavbar } from "@/components/nav/auto-hide-navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Infrared",
  description: "Infrared migrated to Next.js + TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AutoHideNavbar />
        {children}
      </body>
    </html>
  );
}
