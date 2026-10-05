import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { parseRequest } from "../src/ai/parseRequest";
import { normalizeRequest } from "../src/core/normalizeRequest";
import { planWithRepair, type PlanRepairResult } from "../src/ai/planWithRepair";
import { AGENT_PROMPT_VERSION } from "../src/ai/planAgent";
import { GeminiProvider } from "../src/ai/provider";

loadEnvConfig(process.cwd());

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

async function main() {
  const args = process.argv.slice(2);
  const noCache = args.includes("--no-cache");
  const filteredArgs = args.filter((a) => a !== "--no-cache");

  const defaultText =
    "Đi Đà Nẵng 3 ngày 2 đêm với vợ, ngân sách 10 triệu, thích biển và hải sản, không muốn dậy sớm.";
  const userText = filteredArgs[0] || defaultText;

  const cacheDir = path.resolve(process.cwd(), "eval/.cache");
  fs.mkdirSync(cacheDir, { recursive: true });

  console.log("\n========================================================");
  console.log("       TRIP VIBES – THỬ NGHIỆM LẬP KẾ HOẠCH (BƯỚC 4)");
  console.log("========================================================");
  console.log(`Câu yêu cầu: "${userText}"`);
  console.log(`Dùng cache:  ${noCache ? "KHÔNG (--no-cache)" : "CÓ"}\n`);

  let provider: GeminiProvider;
  try {
    provider = new GeminiProvider();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Không thể khởi tạo GeminiProvider: " + msg);
    process.exit(1);
  }

  const modelName = provider.modelName;

  // 1. Trích xuất yêu cầu
  console.log("1️⃣  Đang trích xuất yêu cầu du lịch (parseRequest)...");
  const startParse = Date.now();
  const raw = await parseRequest(userText, { provider });
  const request = normalizeRequest(raw);
  console.log(`   ✅ Hoàn thành (${Date.now() - startParse} ms)`);
  console.log(`   - Điểm đến:      ${request.diemDen}`);
  console.log(`   - Số ngày:       ${request.soNgay} ngày`);
  console.log(`   - Số người:      ${request.soNguoi} người`);
  console.log(
    `   - Ngân sách:     ${
      request.ngansachTongVND ? formatVND(request.ngansachTongVND) : "Chưa có"
    }`
  );
  console.log(
    `   - Sở thích:      ${request.sothich.join(", ") || "(không)"}`
  );
  console.log(
    `   - Cần tránh:     ${request.tranh.join(", ") || "(không)"}`
  );

  // 2. Chạy planWithRepair với cache
  console.log("\n2️⃣  Đang chạy AI Agent với tự sửa lỗi (planWithRepair)...");
  const cacheKey = crypto
    .createHash("sha256")
    .update(JSON.stringify(request) + modelName + AGENT_PROMPT_VERSION + "-repair")
    .digest("hex");
  const cacheFile = path.join(cacheDir, `plan-${cacheKey}.json`);

  let result: PlanRepairResult | null = null;
  let fromCache = false;

  if (!noCache && fs.existsSync(cacheFile)) {
    try {
      result = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      fromCache = true;
      console.log("   ⚡ Tải kết quả từ cache!");
    } catch {
      // cache hỏng thì chạy lại
    }
  }

  if (!result) {
    result = await planWithRepair(request, { provider });
    fs.writeFileSync(
      cacheFile,
      JSON.stringify(result, null, 2),
      "utf-8"
    );
  }

  // 3. Kết quả
  console.log(`\n=> Trạng thái cuối: ${result.status}`);
  console.log(`=> Thời gian: ${result.ms} ms`);
  console.log(`=> Số vòng sửa thực tế: ${result.soVongSua}`);
  console.log(`=> Số lần gọi AI: ${result.soLanGoiAI}`);
  if (result.toiThieuVND) {
    console.log(`=> Ngân sách tối thiểu yêu cầu: ${formatVND(result.toiThieuVND)}`);
  }

  if (result.lichSu.length > 0) {
    console.log("\n📖 LỊCH SỬ SỬA LỖI:");
    result.lichSu.forEach(ls => {
      console.log(`   - Vòng ${ls.vong}: ${ls.soHard} vi phạm cứng [${ls.codes.join(", ")}], tổng VND: ${formatVND(ls.tongVND)}`);
    });
  }

  if (result.hard.length > 0) {
    console.log("\n❌ VI PHẠM CỨNG CÒN LẠI:");
    result.hard.forEach(h => console.log(`   - [${h.code}] ${h.chiTiet}`));
  }

  if (result.soft.length > 0) {
    console.log("\n⚠️ CẢNH BÁO MỀM:");
    result.soft.forEach(s => console.log(`   - [${s.code}] ${s.chiTiet}`));
  }

  if (result.plan) {
    const plan = result.plan;
    console.log("\n========================================================");
    console.log("                 BẢNG KẾ HOẠCH THEO NGÀY");
    console.log("========================================================");
    console.log(
      "| Ngày | Giờ   | Hạng mục   | Nội dung                                 | SL | Đơn giá     | Thành tiền   |"
    );
    console.log(
      "|------|-------|------------|------------------------------------------|----|-------------|--------------|"
    );
  
    plan.items.forEach((item) => {
      const ngayStr = `Ngày ${item.ngay}`.padEnd(5, " ");
      const gioStr = (item.gio || "--:--").padEnd(5, " ");
      const hangMucStr = item.hangMuc.padEnd(10, " ");
      const noiDungStr =
        item.noiDung.length > 40
          ? item.noiDung.slice(0, 37) + "..."
          : item.noiDung.padEnd(40, " ");
      const slStr = String(item.soLuong).padStart(2, " ");
      const donGiaStr = formatVND(item.donGia).padStart(11, " ");
      const thanhTienStr = formatVND(item.thanhTien).padStart(12, " ");
  
      console.log(
        `| ${ngayStr} | ${gioStr} | ${hangMucStr} | ${noiDungStr} | ${slStr} | ${donGiaStr} | ${thanhTienStr} |`
      );
    });
  
    // 6. In tổng kết
    console.log("\n========================================================");
    console.log("                     TỔNG KẾT CHI PHÍ");
    console.log("========================================================");
    console.log(`- Di chuyển:                    ${formatVND(plan.tongKet.theoHangMuc["Di chuyển"] ?? 0)}`);
    console.log(`- Chỗ ở:                        ${formatVND(plan.tongKet.theoHangMuc["Chỗ ở"] ?? 0)}`);
    console.log(`- Ăn uống:                      ${formatVND(plan.tongKet.theoHangMuc["Ăn uống"] ?? 0)}`);
    console.log(`- Vui chơi:                     ${formatVND(plan.tongKet.theoHangMuc["Vui chơi"] ?? 0)}`);
    console.log("--------------------------------------------------------");
    console.log(`👉 TỔNG CHI PHÍ:                ${formatVND(plan.tongKet.tongVND)}`);
    console.log(`- Ngân sách ban đầu:            ${formatVND(request.ngansachTongVND ?? 0)}`);
    console.log(`- Còn lại:                      ${formatVND(plan.tongKet.conLaiVND)}`);
    console.log(`- Đã sử dụng:                   ${plan.tongKet.phanTramDaDung} %`);
    console.log(`- Trạng thái ngân sách:         ${plan.tongKet.trangThaiNganSach === "trong" ? "✅ Trong ngân sách" : "⚠️ Vượt ngân sách"}`);
    console.log(`- Tổng thời gian di chuyển:     ${plan.tongKet.tongThoiGianDiChuyenPhut} phút (${(plan.tongKet.tongThoiGianDiChuyenPhut / 60).toFixed(1)} giờ)`);
  }
}

main().catch((err) => {
  console.error("Lỗi chương trình:", err);
  process.exit(1);
});
