import React from "react";
import type { Metadata } from "next";
import { GioiHanScreen } from "@/ui/screens/GioiHanScreen";

export const metadata: Metadata = {
  title: "Giới Hạn & Tuyên Bố Minh Bạch - Trip Vibes",
  description: "Thông tin minh bạch về phạm vi hỗ trợ 2-5 ngày, 5 điểm đến snapshot, nguồn dữ liệu OSM và tính bảo mật của Trip Vibes.",
};

export default function GioiHanPage() {
  return <GioiHanScreen />;
}
