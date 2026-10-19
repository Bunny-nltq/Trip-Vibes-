import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/ui/components/ThemeProvider";

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
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
