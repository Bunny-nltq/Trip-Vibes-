import React from "react";
import type { Metadata } from "next";
import { TroGiupScreen } from "@/ui/screens/TroGiupScreen";

export const metadata: Metadata = {
  title: "Trung Tâm Trợ Giúp & Hướng Dẫn - Trip Vibes",
  description: "Hướng dẫn sử dụng các tính năng lập kế hoạch du lịch, quét hóa đơn chi tiêu và giải thích các cờ cảnh báo trên Trip Vibes.",
};

export default function TroGiupPage() {
  return <TroGiupScreen />;
}
