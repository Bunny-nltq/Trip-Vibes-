import React from "react";
import type { Metadata } from "next";
import { PhapLyScreen } from "@/ui/screens/PhapLyScreen";

export const metadata: Metadata = {
  title: "Chính Sách Quyền Riêng Tư - Trip Vibes",
  description: "Chính sách bảo mật quyền riêng tư của Trip Vibes: cách ứng dụng lưu thông tin tài khoản, hành trình và chi tiêu.",
};

export default function QuyenRiengTuPage() {
  return <PhapLyScreen loai="quyen-rieng-tu" />;
}
