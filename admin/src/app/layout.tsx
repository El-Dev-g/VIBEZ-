import type { Metadata } from "next";
import "./globals.css";
import DashboardShell from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "VIBEZ Admin Portal",
  description: "Administrative dashboard for the VIBEZ communication platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full bg-gray-50">
        <DashboardShell>
          {children}
        </DashboardShell>
      </body>
    </html>
  );
}
