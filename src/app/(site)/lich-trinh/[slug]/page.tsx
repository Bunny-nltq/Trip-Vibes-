import React from "react";
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LichTrinhChiTietScreen } from "@/ui/screens/LichTrinhChiTietScreen";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SLUGS = ["da-nang", "ha-noi", "da-lat", "bangkok", "seoul"];

export async function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), "src", "data", "mau", `${slug}-3ngay.json`);
  if (!fs.existsSync(filePath)) {
    return { title: "Không tìm thấy lịch trình - Trip Vibes" };
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return {
      title: `${data.tieuDe} - Trip Vibes`,
      description: `Lịch trình mẫu 3 ngày 2 đêm tại ${data.tenDiemDen} với tổng chi phí ước tính ${data.tongTienVND.toLocaleString("vi-VN")} đ.`,
    };
  } catch {
    return { title: "Lịch trình mẫu - Trip Vibes" };
  }
}

export default async function LichTrinhChiTietPage({ params }: PageProps) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), "src", "data", "mau", `${slug}-3ngay.json`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  let data: any;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    notFound();
  }

  return <LichTrinhChiTietScreen data={data} />;
}
