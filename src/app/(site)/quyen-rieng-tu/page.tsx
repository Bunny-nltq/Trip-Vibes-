import React from "react";
import type { Metadata } from "next";
import { PhapLyScreen } from "@/ui/screens/PhapLyScreen";

export const metadata: Metadata = {
  title: "Chính Sách Quyền Riêng Tư - Trip Vibes",
  description: "Chính sách bảo mật quyền riêng tư của Trip Vibes: không thu thập thông tin định danh, xử lý ảnh bill trong RAM và lưu trữ cục bộ.",
};

export default function QuyenRiengTuPage() {
  return <PhapLyScreen loai="quyen-rieng-tu" />;
}
