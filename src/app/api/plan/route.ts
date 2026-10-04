import { NextResponse } from "next/server";
import { parseRequest } from "@/ai/parseRequest";
import { runPlanAgent } from "@/ai/planAgent";
import { normalizeRequest, removeVietnameseDiacritics } from "@/core/normalizeRequest";
import { buildPlan } from "@/core/buildPlan";
import { JsonDataSource } from "@/data/JsonDataSource";
import { TripRequestSchema, type TripRequest } from "@/contracts";

/**
 * POST /api/plan
 * Nhận { text } hoặc { request }.
 * - Có text thì chạy parse-request trước.
 * - Điều kiện chạy agent: soNguoi, soNgay, ngansachTongVND đều có; soNgay = 3; diemDen là Đà Nẵng.
 * - Không đủ điều kiện: trả { ok: true, status: "can_lam_ro", request, cauHoiLamRo, canhBao } và KHÔNG gọi agent.
 * - Đủ điều kiện: gọi runPlanAgent -> buildPlan, trả { ok: true, status: "ok", request, plan, trace, ms }.
 * - Không log nội dung text, không in key.
 */
export async function POST(req: Request) {
  const start = Date.now();

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu JSON gửi lên không hợp lệ." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu yêu cầu không hợp lệ." },
        { status: 400 }
      );
    }

    const payload = body as { text?: unknown; request?: unknown };
    let tripRequest: TripRequest;

    if (typeof payload.text === "string" && payload.text.trim().length > 0) {
      if (payload.text.length > 500) {
        return NextResponse.json(
          { ok: false, error: "Nội dung yêu cầu quá dài (tối đa 500 ký tự)." },
          { status: 400 }
        );
      }
      const raw = await parseRequest(payload.text);
      tripRequest = normalizeRequest(raw);
    } else if (payload.request && typeof payload.request === "object") {
      const parsed = TripRequestSchema.safeParse(payload.request);
      if (!parsed.success) {
        return NextResponse.json(
          {
            ok: false,
            error: "Dữ liệu request không đúng định dạng schema: " + parsed.error.message,
          },
          { status: 400 }
        );
      }
      tripRequest = parsed.data;
    } else {
      return NextResponse.json(
        { ok: false, error: "Cần cung cấp trường 'text' hoặc 'request'." },
        { status: 400 }
      );
    }

    // Kiểm tra điều kiện chạy AI Agent
    const normDiemDen = removeVietnameseDiacritics(tripRequest.diemDen);
    const coDuThongTin =
      tripRequest.soNguoi !== null &&
      tripRequest.soNguoi > 0 &&
      tripRequest.soNgay !== null &&
      tripRequest.soNgay > 0 &&
      tripRequest.ngansachTongVND !== null &&
      tripRequest.ngansachTongVND > 0;

    const dungPhamVi = tripRequest.soNgay === 3 && normDiemDen === "da nang";

    if (!coDuThongTin || !dungPhamVi) {
      const ms = Date.now() - start;
      return NextResponse.json({
        ok: true,
        status: "can_lam_ro",
        request: tripRequest,
        cauHoiLamRo: tripRequest.cauHoiLamRo,
        canhBao: tripRequest.canhBao,
        ms,
      });
    }

    // Đủ điều kiện: chạy AI agent để chọn mã ID
    const { selection, trace } = await runPlanAgent(tripRequest);

    // Dùng code core đọc dữ liệu và xây dựng kế hoạch, tính toán chi phí
    const dataSource = new JsonDataSource();
    const [transports, hotels, activities] = await Promise.all([
      dataSource.getTransports(),
      dataSource.getHotels(),
      dataSource.getActivities(),
    ]);

    const planRes = buildPlan(tripRequest, selection, {
      transports,
      hotels,
      activities,
    });

    const ms = Date.now() - start;

    if (!planRes.ok) {
      return NextResponse.json(
        { ok: false, error: planRes.loi.join("; "), ms },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "ok",
      request: tripRequest,
      plan: planRes.plan,
      trace,
      ms,
    });
  } catch (err: unknown) {
    const ms = Date.now() - start;
    const raw = err instanceof Error ? err.message : String(err);

    let error = "Lỗi khi lập kế hoạch du lịch.";
    if (raw.includes("GEMINI_API_KEY")) {
      error = "Chưa cấu hình GEMINI_API_KEY trong .env.local.";
    } else if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
      error = "Đã vượt hạn mức gọi Gemini API (429). Vui lòng thử lại sau.";
    } else if (raw.includes("agent_dung_id_la")) {
      error = "AI Agent sử dụng ID không tồn tại trong dữ liệu hệ thống.";
    } else if (raw.length < 300) {
      error = raw;
    }

    return NextResponse.json({ ok: false, error, ms }, { status: 500 });
  }
}
