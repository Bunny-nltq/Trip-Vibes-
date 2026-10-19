import { NextResponse } from "next/server";
import { LiveDataSource } from "@/data/live/LiveDataSource";
import { buildPlan } from "@/core/buildPlan";
import { validatePlan } from "@/core/validatePlan";
import { diffPlan } from "@/core/diffPlan";
import {
  TripRequestSchema,
  SelectionSchema,
  type TripRequest,
  type Selection,
} from "@/contracts";

/**
 * POST /api/plan/preview
 *
 * Body: { request, selection, thayDoi: { loai, viTri?, idMoi } }
 *
 * Tạo plan mới từ selection đã sửa, chạy buildPlan + validatePlan + diffPlan.
 * KHÔNG gọi Gemini.
 *
 * Trả: { planSau, diff, hard, soft }
 */
export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu JSON không hợp lệ." },
        { status: 400 }
      );
    }

    const payload = body as {
      request?: unknown;
      selection?: unknown;
      planTruoc?: unknown;
      thayDoi?: {
        loai: string;
        viTri?: number;
        idMoi: string;
      };
    };

    // Normalize and validate request
    const rawReq = (payload.request && typeof payload.request === "object") ? { ...(payload.request as object) } : {};
    const filledReq = {
      schemaVersion: 1,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNgay: 3,
      soNguoi: 2,
      ngansachTongVND: 10_000_000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
      ...rawReq,
    };

    const reqParsed = TripRequestSchema.safeParse(filledReq);
    if (!reqParsed.success) {
      return NextResponse.json(
        { ok: false, error: "request không hợp lệ: " + reqParsed.error.message },
        { status: 400 }
      );
    }
    const tripRequest: TripRequest = reqParsed.data;

    // Validate selection
    const selParsed = SelectionSchema.safeParse(payload.selection);
    if (!selParsed.success) {
      return NextResponse.json(
        { ok: false, error: "selection không hợp lệ: " + selParsed.error.message },
        { status: 400 }
      );
    }
    const currentSelection: Selection = selParsed.data;

    const thayDoi = payload.thayDoi;
    if (!thayDoi || !thayDoi.loai || !thayDoi.idMoi) {
      return NextResponse.json(
        { ok: false, error: "Cần trường thayDoi với loai và idMoi." },
        { status: 400 }
      );
    }

    // Load data
    const ds = new LiveDataSource();
    const [transports, hotels, activities, khachSans, quanAns, cafes, hoatDongs] =
      await Promise.all([
        ds.getTransports(),
        ds.getHotels(),
        ds.getActivities(),
        ds.getKhachSans(),
        ds.getQuanAns(),
        ds.getCafes(),
        ds.getHoatDongs(),
      ]);

    const data = { transports, hotels, activities, khachSans, quanAns, cafes, hoatDongs };

    // Build plan TRƯỚC
    const buildTruoc = buildPlan(tripRequest, currentSelection, data, ds.getMode());
    if (!buildTruoc.ok) {
      return NextResponse.json(
        { ok: false, error: "Không thể build kế hoạch hiện tại: " + buildTruoc.loi.join("; ") },
        { status: 400 }
      );
    }
    const planTruoc = buildTruoc.plan;

    // Tạo selection mới
    const newSelection = { ...currentSelection };
    let durationVePhut: number | undefined;

    switch (thayDoi.loai) {
      case "phuong_tien_di": {
        const t = transports.find((x) => x.id === thayDoi.idMoi);
        if (!t) return NextResponse.json({ ok: false, error: `ID phương tiện '${thayDoi.idMoi}' không tồn tại.` }, { status: 400 });
        if (t.huong !== "di") return NextResponse.json({ ok: false, error: `Phương tiện '${thayDoi.idMoi}' không phải chiều đi.` }, { status: 400 });
        newSelection.transportDiId = thayDoi.idMoi;
        break;
      }
      case "phuong_tien_ve": {
        const t = transports.find((x) => x.id === thayDoi.idMoi);
        if (!t) return NextResponse.json({ ok: false, error: `ID phương tiện '${thayDoi.idMoi}' không tồn tại.` }, { status: 400 });
        if (t.huong !== "ve") return NextResponse.json({ ok: false, error: `Phương tiện '${thayDoi.idMoi}' không phải chiều về.` }, { status: 400 });
        newSelection.transportVeId = thayDoi.idMoi;
        durationVePhut = t.durationMinutes;
        break;
      }
      case "khach_san": {
        const kLive = khachSans.find((x) => x.id === thayDoi.idMoi);
        const kMock = hotels.find((x) => x.id === thayDoi.idMoi);
        if (!kLive && !kMock) return NextResponse.json({ ok: false, error: `ID khách sạn '${thayDoi.idMoi}' không tồn tại.` }, { status: 400 });
        newSelection.hotelId = thayDoi.idMoi;
        break;
      }
      case "hoat_dong": {
        const viTri = thayDoi.viTri;
        if (viTri === undefined || viTri === null) {
          return NextResponse.json({ ok: false, error: "Cần viTri (index ngày) khi đổi hoạt động." }, { status: 400 });
        }
        // viTri format: ngayIndex * 10 + actIndex (VD: 0=ngày1-act0, 10=ngày2-act0, 11=ngày2-act1)
        const dayIdx = Math.floor(viTri / 10);
        const actIdx = viTri % 10;
        if (dayIdx < 0 || dayIdx >= newSelection.hoatDongTheoNgay.length) {
          return NextResponse.json({ ok: false, error: `viTri ngày ${dayIdx} ngoài phạm vi.` }, { status: 400 });
        }
        const dayActs = [...newSelection.hoatDongTheoNgay[dayIdx]];
        if (actIdx < 0 || actIdx >= dayActs.length) {
          return NextResponse.json({ ok: false, error: `viTri hoạt động ${actIdx} ngoài phạm vi.` }, { status: 400 });
        }
        dayActs[actIdx] = thayDoi.idMoi;
        newSelection.hoatDongTheoNgay = [...newSelection.hoatDongTheoNgay];
        newSelection.hoatDongTheoNgay[dayIdx] = dayActs;
        break;
      }
      default:
        return NextResponse.json({ ok: false, error: `Loại thay đổi '${thayDoi.loai}' không được hỗ trợ.` }, { status: 400 });
    }

    // Build plan SAU
    const buildSau = buildPlan(tripRequest, newSelection, data, ds.getMode());
    if (!buildSau.ok) {
      return NextResponse.json(
        { ok: false, error: "Kế hoạch mới không hợp lệ: " + buildSau.loi.join("; ") },
        { status: 400 }
      );
    }
    const planSau = buildSau.plan;

    // Validate
    const { hard, soft } = validatePlan(tripRequest, planSau, data);

    // Diff
    const diff = diffPlan(planTruoc, planSau, data, durationVePhut);

    return NextResponse.json({
      ok: true,
      planSau,
      selection: newSelection,
      diff,
      hard,
      soft,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
