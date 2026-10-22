import type { Metadata, Viewport } from "next";
import tokens from "@/design/tokens.json";

export const viewport: Viewport = {
  themeColor: tokens.colors.primary.main,
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Trip Vibes – AI Agent Lập Kế Hoạch Du Lịch Thông Minh",
    template: "%s | Trip Vibes",
  },
  description:
    "Ứng dụng AI Agent lập kế hoạch du lịch tự động, tối ưu chi phí và bám sát ngân sách thực tế. Tra cứu giá vé, khách sạn, lịch trình chi tiết và quét hóa đơn thông minh.",
  keywords: [
    "du lịch",
    "kế hoạch du lịch",
    "trip planner",
    "AI travel agent",
    "quản lý chi tiêu du lịch",
    "Trip Vibes",
  ],
  authors: [{ name: "Trip Vibes Team" }],
  openGraph: {
    title: "Trip Vibes – AI Agent Lập Kế Hoạch Du Lịch Thông Minh",
    description:
      "Lập kế hoạch du lịch tự động, tối ưu chi phí, bám sát ngân sách và minh bạch nguồn gốc dữ liệu.",
    url: "https://tripvibes.vn",
    siteName: "Trip Vibes",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trip Vibes – AI Agent Lập Kế Hoạch Du Lịch",
    description: "Lập kế hoạch du lịch tự động và tối ưu ngân sách cùng AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};
import { Be_Vietnam_Pro, Dancing_Script } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/ui/components/ThemeProvider";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

const dancingScript = Dancing_Script({
  weight: ["600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-script",
  display: "swap",
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${dancingScript.variable}`}>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Bỏ qua đến nội dung chính
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
