import type { MetadataRoute } from "next";
import tokens from "@/design/tokens.json";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trip Vibes - Lập Kế Hoạch Du Lịch",
    short_name: "Trip Vibes",
    description: "Lập kế hoạch du lịch theo ngân sách của bạn",
    start_url: "/",
    display: "standalone",
    background_color: tokens.colors.background,
    theme_color: tokens.colors.primary.main,
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
