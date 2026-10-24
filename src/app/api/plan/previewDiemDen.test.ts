/**
 * Hồi quy: xem trước thay đổi (preview) và /api/options phải dùng đúng dữ liệu của điểm đến trong kế hoạch.
 * Trước đây preview tạo nguồn dữ liệu không có điểm đến nên mọi ID "không tồn tại"
 * và /api/options trả danh sách rỗng khi thiếu tham số. Không gọi Gemini, không gọi mạng.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as plan } from "./route";
import { POST as preview } from "./preview/route";
import { GET as options } from "../options/route";
import { extractSelectionFromPlan } from "@/ui/context/AppContext";

const DEN = { ten: "Hà Nội", quocGia: "Việt Nam", maQuocGia: "VN", toaDo: { lat: 21.0285, lng: 105.8542 }, tienTe: "VND", nguon: "nominatim", ngayLay: "2026-10-20" };
const DI = { ten: "TP.HCM", quocGia: "Việt Nam", maQuocGia: "VN", toaDo: { lat: 10.7769, lng: 106.7009 }, tienTe: "VND", nguon: "nominatim", ngayLay: "2026-10-20" };
const REQ = {
  schemaVersion: 12, diemDi: DI, diemDen: DEN, soNgay: 3, soNguoi: 2, ngansachTongVND: 20_000_000,
  sothich: [], tranh: [], ghiChu: [], thieu: [], cauHoiLamRo: [], canhBao: [],
};

const json = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const cu = { ...process.env };
beforeAll(() => {
  process.env.DATA_MODE = "snapshot";
  process.env.LIVE_DATA_ENABLED = "false";
  process.env.LIVE_AI_ENABLED = "false";
});
afterAll(() => {
  process.env = { ...cu };
});

describe("preview và options dùng đúng điểm đến", () => {
  it("options trả phương tiện, khách sạn, hoạt động khi có điểm đến", async () => {
    const q = `soNguoi=2&soNgay=3&diemDen=${encodeURIComponent(JSON.stringify(DEN))}&diemDi=${encodeURIComponent(JSON.stringify(DI))}`;
    for (const [loai, extra] of [["phuong_tien", "&huong=di"], ["phuong_tien", "&huong=ve"], ["khach_san", ""], ["hoat_dong", ""]] as const) {
      const res = await options(new Request(`http://localhost/api/options?loai=${loai}${extra}&${q}`));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.items.length, `${loai}${extra}`).toBeGreaterThan(0);
    }
  });

  it("preview đổi phương tiện chiều đi thành công và có diff", async () => {
    const res = await plan(json("/api/plan", { request: REQ }) as never);
    const p = await res.json();
    expect(p.status).toBe("ok");
    const selection = extractSelectionFromPlan(p.plan);

    const q = `loai=phuong_tien&huong=di&soNguoi=2&soNgay=3&diemDen=${encodeURIComponent(JSON.stringify(DEN))}&diemDi=${encodeURIComponent(JSON.stringify(DI))}`;
    const ds = (await (await options(new Request(`http://localhost/api/options?${q}`))).json()).items as Array<{ id: string }>;
    const khac = ds.find((t) => t.id !== selection.transportDiId);
    expect(khac).toBeDefined();

    const pv = await preview(json("/api/plan/preview", { request: p.request ?? REQ, selection, thayDoi: { loai: "phuong_tien_di", idMoi: khac!.id } }) as never);
    const body = await pv.json();
    expect(pv.status, JSON.stringify(body).slice(0, 200)).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.selection.transportDiId).toBe(khac!.id);
    expect(body.diff).toBeDefined();
  });

  it("preview thiếu thông tin điểm đến thì báo lỗi, không tự bịa Đà Nẵng 10 triệu", async () => {
    const pv = await preview(json("/api/plan/preview", { request: {}, selection: { transportDiId: "a", transportVeId: "b", hotelId: "c", hoatDongTheoNgay: [[], [], []] }, thayDoi: { loai: "khach_san", idMoi: "x" } }) as never);
    const body = await pv.json();
    expect(pv.status).toBe(400);
    expect(JSON.stringify(body)).not.toMatch(/Đà Nẵng/);
  });
});
