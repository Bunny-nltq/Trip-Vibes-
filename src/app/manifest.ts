import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trip Vibes - AI Agent Lập Kế Hoạch Du Lịch",
    short_name: "Trip Vibes",
    description: "Lập kế hoạch du lịch thông minh, tối ưu ngân sách cùng AI Agent",
    start_url: "/",
    display: "standalone",
    background_color: "#EEF4FB",
    theme_color: "#2B55D6",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
