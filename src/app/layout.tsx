import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trip Vibes",
  description: "AI Agent lập kế hoạch du lịch",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
