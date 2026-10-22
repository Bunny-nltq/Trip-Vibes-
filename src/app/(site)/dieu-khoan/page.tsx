import React from "react";
import type { Metadata } from "next";
import { PhapLyScreen } from "@/ui/screens/PhapLyScreen";

export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng - Trip Vibes",
  description: "Điều khoản sử dụng và quy định dịch vụ của nền tảng Trip Vibes dành cho đồ án học tập và nghiên cứu công nghệ.",
};

export default function DieuKhoanPage() {
  return <PhapLyScreen loai="dieu-khoan" />;
}
