import type { Metadata, Viewport } from "next";
import tokens from "@/design/tokens.json";
import "./globals.css";
import { ThemeProvider } from "@/ui/components/ThemeProvider";

export const viewport: Viewport = {
  themeColor: tokens.colors.primary.main,
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Trip Vibes – Lập Kế Hoạch Du Lịch Theo Ngân Sách",
    template: "%s | Trip Vibes",
  },
  description:
    "Ứng dụng lập kế hoạch du lịch tự động, tối ưu chi phí và bám sát ngân sách thực tế. Tra cứu giá vé, khách sạn, lịch trình chi tiết và theo dõi chi tiêu.",
  keywords: [
    "du lịch",
    "kế hoạch du lịch",
    "trip planner",
    "lập kế hoạch du lịch",
    "quản lý chi tiêu du lịch",
    "Trip Vibes",
  ],
  authors: [{ name: "Trip Vibes Team" }],
  openGraph: {
    title: "Trip Vibes – Lập Kế Hoạch Du Lịch Theo Ngân Sách",
    description:
      "Lập kế hoạch du lịch tự động, tối ưu chi phí, bám sát ngân sách và minh bạch nguồn gốc dữ liệu.",
    url: "https://tripvibes.vn",
    siteName: "Trip Vibes",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trip Vibes – Lập Kế Hoạch Du Lịch",
    description: "Lập kế hoạch du lịch tự động và tối ưu ngân sách.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Bỏ qua đến nội dung chính
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
