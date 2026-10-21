#!/usr/bin/env tsx
/**
 * eval/run-data.ts
 * npm run eval:data
 *
 * Báo cáo chất lượng dữ liệu live:
 * - Tỷ lệ mục có nguồn
 * - Tỷ lệ giá ước tính
 * - Số mục thiếu trường
 * - Số lượt Tavily và Gemini đã dùng
 * - Thời gian
 * Tạo eval/results/kiem-tra-thu-cong.csv với 10 mục ngẫu nhiên.
 */

import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { LiveDataSource } from "../src/data/live/LiveDataSource";
import { getTavilyUsageToday } from "../src/data/live/searchClient";
import { getGeminiCallCount } from "../src/data/live/researchTransport";
import { getGeminiHotelCallCount } from "../src/data/live/researchHotelPrice";
import { taoMetaEval } from "./lib/meta";
import { QUY_TAC_VERSION } from "../src/core/assumptions";
import { AGENT_PROMPT_VERSION } from "../src/ai/planAgent";

loadEnvConfig(process.cwd());

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function main() {
  console.log("\n=========================================");
  console.log("     TRIP VIBES – EVAL DỮ LIỆU LIVE");
  console.log("=========================================\n");

  const t0 = Date.now();
  const ds = new LiveDataSource("live");

  console.log("📡 Đang tải dữ liệu...");
  const [khachSans, quanAns, cafes, hoatDongs, transports] = await Promise.all([
    ds.getKhachSans(),
    ds.getQuanAns(),
    ds.getCafes(),
    ds.getHoatDongs(),
    ds.getTransports(),
  ]);

  const elapsed = Date.now() - t0;

  const allPlaces = [
    ...khachSans.map((x) => ({ ...x, loai_eval: "khach_san" })),
    ...quanAns.map((x) => ({ ...x, loai_eval: "quan_an" })),
    ...cafes.map((x) => ({ ...x, loai_eval: "cafe" })),
    ...hoatDongs.map((x) => ({ ...x, loai_eval: "hoat_dong" })),
  ];

  // Thống kê
  const total = allPlaces.length;
  const coNguon = allPlaces.filter((i) => i.nguon).length;
  const giaUocTinh = allPlaces.filter((i) => i.giaLaUocTinh).length;

  const theuTen = allPlaces.filter((i) => !i.ten || i.ten.trim() === "").length;
  const thieuToaDo = allPlaces.filter(
    (i) => !i.toaDo || (i.toaDo.lat === 0 && i.toaDo.lng === 0)
  ).length;
  const thieuGia = allPlaces.filter(
    (i) => i.giaUocTinhNguoi === null || i.giaUocTinhNguoi === undefined
  ).length;

  const soTavilyHom = getTavilyUsageToday();
  const soGeminiTransport = getGeminiCallCount();
  const soGeminiHotel = getGeminiHotelCallCount();

  console.log(`\n📊 KẾT QUẢ DỮ LIỆU:`);
  console.log(`   Tổng địa điểm:          ${total}`);
  console.log(`   - Khách sạn:            ${khachSans.length}`);
  console.log(`   - Quán ăn:              ${quanAns.length}`);
  console.log(`   - Cafe:                 ${cafes.length}`);
  console.log(`   - Hoạt động:            ${hoatDongs.length}`);
  console.log(`   - Phương tiện:          ${transports.length}`);
  console.log();
  console.log(`📋 CHẤT LƯỢNG:`);
  console.log(
    `   Tỷ lệ có nguồn:          ${total > 0 ? ((coNguon / total) * 100).toFixed(1) : 0}% (${coNguon}/${total})`
  );
  console.log(
    `   Tỷ lệ giá ước tính:      ${total > 0 ? ((giaUocTinh / total) * 100).toFixed(1) : 0}% (${giaUocTinh}/${total})`
  );
  console.log(`   Thiếu tên:              ${theuTen}`);
  console.log(`   Thiếu toạ độ:           ${thieuToaDo}`);
  console.log(`   Thiếu giá:              ${thieuGia}`);
  console.log();
  console.log(`🔢 API USAGE:`);
  console.log(`   Lượt Tavily hôm nay:    ${soTavilyHom}`);
  console.log(`   Lượt Gemini (transport):${soGeminiTransport}`);
  console.log(`   Lượt Gemini (hotel):    ${soGeminiHotel}`);
  console.log(`   Thời gian tải dữ liệu:  ${elapsed} ms`);

  // Tạo CSV kiểm tra thủ công
  const sample = pickRandom(allPlaces, Math.min(10, total));
  const csvDir = path.join(process.cwd(), "eval", "results");
  fs.mkdirSync(csvDir, { recursive: true });
  const csvPath = path.join(csvDir, "kiem-tra-thu-cong.csv");

  const csvHeader = "id,ten,loai,nguon,gia_uoc_tinh,gia_toi_tu_kiem,sao_google_toi_xem,dung_hay_sai\n";
  const csvRows = sample
    .map((item) => {
      const gia = (item as any).giaUocTinhNguoi ?? "";
      const nguon = (item as any).nguon ?? "";
      return [
        item.id,
        `"${(item.ten ?? "").replace(/"/g, '""')}"`,
        (item as any).loai_eval,
        `"${nguon.replace(/"/g, '""')}"`,
        gia,
        "",  // gia_toi_tu_kiem - để trống cho người dùng điền
        "",  // sao_google_toi_xem - để trống
        "",  // dung_hay_sai - để trống
      ].join(",");
    })
    .join("\n");

  fs.writeFileSync(csvPath, csvHeader + csvRows, "utf-8");
  console.log(`\n📄 CSV kiểm tra thủ công: ${csvPath}`);
  console.log(`   (Điền cột gia_toi_tu_kiem, sao_google_toi_xem, dung_hay_sai)`);

  const dateStr = new Date().toISOString().slice(0, 10);
  const meta = taoMetaEval({
    quyTacVersion: QUY_TAC_VERSION,
    agentPromptVersion: AGENT_PROMPT_VERSION,
    model: "khong_dung_ai",
    ngayChayISO: new Date().toISOString(),
    tenBo: "data",
  });
  const dataResult = {
    meta,
    date: dateStr,
    total,
    coNguon,
    giaUocTinh,
    theuTen,
    thieuToaDo,
    thieuGia,
    soTavilyHom,
    soGeminiTransport,
    soGeminiHotel,
    elapsed,
  };
  const jsonPath = path.join(csvDir, `data-${dateStr}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(dataResult, null, 2), "utf-8");
  console.log(`💾 Kết quả JSON đã lưu: ${jsonPath}`);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err instanceof Error ? err.message : err);
  process.exit(1);
});
