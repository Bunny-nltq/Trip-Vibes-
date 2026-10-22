import React from "react";
import type { Metadata } from "next";
import { NguonAnhScreen } from "@/ui/screens/NguonAnhScreen";

export const metadata: Metadata = {
  title: "Nguồn Ảnh & Bản Quyền - Trip Vibes",
  description: "Chính sách bản quyền hình ảnh, cam kết tuân thủ sở hữu trí tuệ và danh mục ghi công tác giả trên Trip Vibes.",
};

export default function NguonAnhPage() {
  return <NguonAnhScreen />;
}
