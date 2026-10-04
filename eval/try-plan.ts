import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { parseRequest } from "../src/ai/parseRequest";
import { normalizeRequest, removeVietnameseDiacritics } from "../src/core/normalizeRequest";
import { buildPlan } from "../src/core/buildPlan";
import { runPlanAgent, AGENT_PROMPT_VERSION, type AgentTraceItem } from "../src/ai/planAgent";
import { GeminiProvider } from "../src/ai/provider";
import { JsonDataSource } from "../src/data/JsonDataSource";
import type { Selection } from "../src/contracts";

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
  console.log("       TRIP VIBES – THỬ NGHIỆM LẬP KẾ HOẠCH (BƯỚC 3)");
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
  const dataSource = new JsonDataSource();

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

  // 2. Kiểm tra điều kiện chạy Agent
  const normDiemDen = removeVietnameseDiacritics(request.diemDen);
  const coDuThongTin =
    request.soNguoi !== null &&
    request.soNguoi > 0 &&
    request.soNgay !== null &&
    request.soNgay > 0 &&
    request.ngansachTongVND !== null &&
    request.ngansachTongVND > 0;
  const dungPhamVi = request.soNgay === 3 && normDiemDen === "da nang";

  if (!coDuThongTin || !dungPhamVi) {
    console.log("\n⚠️  Yêu cầu chưa đủ điều kiện chạy Agent hoặc ngoài phạm vi hỗ trợ:");
    if (request.cauHoiLamRo.length > 0) {
      console.log("   Câu hỏi làm rõ:");
      request.cauHoiLamRo.forEach((q) => console.log(`   - ${q}`));
    }
    if (request.canhBao.length > 0) {
      console.log("   Cảnh báo:");
      request.canhBao.forEach((c) => console.log(`   - ${c}`));
    }
    return;
  }

  // 3. Chạy Agent với cache
  console.log("\n2️⃣  Đang chạy AI Agent với công cụ tìm kiếm (runPlanAgent)...");
  const cacheKey = crypto
    .createHash("sha256")
    .update(JSON.stringify(request) + modelName + AGENT_PROMPT_VERSION)
    .digest("hex");
  const cacheFile = path.join(cacheDir, `plan-${cacheKey}.json`);

  let selection: Selection | null = null;
  let trace: AgentTraceItem[] = [];
  let fromCache = false;

  if (!noCache && fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      selection = cached.selection;
      trace = cached.trace ?? [];
      fromCache = true;
      console.log("   ⚡ Tải kết quả Selection từ cache!");
    } catch {
      // cache hỏng thì chạy lại
    }
  }

  if (!selection) {
    const agentRes = await runPlanAgent(request, { provider, dataSource });
    selection = agentRes.selection;
    trace = agentRes.trace;

    fs.writeFileSync(
      cacheFile,
      JSON.stringify({ selection, trace }, null, 2),
      "utf-8"
    );
  }

  // 4. Xây dựng kế hoạch chi tiết từ core
  console.log("\n3️⃣  Đang xây dựng kế hoạch và tính toán số liệu (buildPlan)...");
  const [transports, hotels, activities] = await Promise.all([
    dataSource.getTransports(),
    dataSource.getHotels(),
    dataSource.getActivities(),
  ]);

  const planRes = buildPlan(request, selection, {
    transports,
    hotels,
    activities,
  });

  if (!planRes.ok) {
    console.error("❌ Lỗi khi xây dựng kế hoạch:");
    planRes.loi.forEach((l) => console.error(`   - ${l}`));
    return;
  }

  const plan = planRes.plan;

  // 5. In bảng kế hoạch theo ngày
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

  // 7. Cảnh báo
  if (plan.canhBao.length > 0) {
    console.log("\n⚠️ CẢNH BÁO:");
    plan.canhBao.forEach((c) => console.log(`   - ${c}`));
  }

  // 8. Trace công cụ
  console.log("\n🔍 TRACE GỌI CÔNG CỤ CỦA AGENT:");
  trace.forEach((t, idx) => {
    console.log(`   [${idx + 1}] Công cụ: ${t.tool.padEnd(16, " ")} | Kết quả: ${String(t.soKetQua).padStart(2, " ")} | Thời gian: ${t.ms} ms`);
  });
  console.log();
}

main().catch((err) => {
  console.error("Lỗi chương trình:", err);
  process.exit(1);
});
