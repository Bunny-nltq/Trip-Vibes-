import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { LiveDataSource } from "@/data/live/LiveDataSource";
import { schemaVersion } from "@/contracts";
import { lapKeHoachTuDong } from "@/core/lapKeHoachTuDong";

describe("POST /api/plan/preview", () => {
  beforeEach(() => {
    process.env.DATA_MODE = "snapshot";
  });

  it("trả về 400 nếu dữ liệu JSON không hợp lệ", async () => {
    const req = new Request("http://localhost:3000/api/plan/preview", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("trả về 400 nếu thiếu thông tin thayDoi", async () => {
    const req = new Request("http://localhost:3000/api/plan/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request: {
          schemaVersion,
          diemDen: "Đà Nẵng",
          soNgay: 3,
          soNguoi: 2,
          ngansachTongVND: 10000000,
        },
        selection: {},
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("tính toán xem trước thành công khi đổi phương tiện đi", async () => {
    const diemDenVN = {
      ten: "Đà Nẵng",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      toaDo: { lat: 16.0544, lng: 108.2022 },
      tienTe: "VND",
      nguon: "danh_sach_co_dinh" as const,
      ngayLay: "2026-10-20",
    };
    const diemDiVN = {
      ten: "TP.HCM",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      toaDo: { lat: 10.7769, lng: 106.7009 },
      tienTe: "VND",
      nguon: "danh_sach_co_dinh" as const,
      ngayLay: "2026-10-20",
    };
    const ds = new LiveDataSource("snapshot", undefined, diemDenVN, diemDiVN);
    const tripRequest = {
      schemaVersion,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNgay: 3,
      soNguoi: 2,
      ngansachTongVND: 15000000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };

    const [transports, hotels, activities, khachSans, quanAns, cafes, hoatDongs] = await Promise.all([
      ds.getTransports(),
      ds.getHotels(),
      ds.getActivities(),
      ds.getKhachSans(),
      ds.getQuanAns(),
      ds.getCafes(),
      ds.getHoatDongs(),
    ]);

    const data = { transports, hotels, activities, khachSans, quanAns, cafes, hoatDongs };
    const tuDong = lapKeHoachTuDong(tripRequest, data);
    expect(tuDong.status).toBe("ok");
    const initialSelection = (tuDong as any).selection;

    const transDi = transports.filter((t) => t.huong === "di");
    expect(transDi.length).toBeGreaterThanOrEqual(2);
    const targetTransport = transDi.find((t) => t.id !== initialSelection.transportDiId) || transDi[1];
    const targetTransportId = targetTransport.id;

    const req = new Request("http://localhost:3000/api/plan/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request: {
          schemaVersion,
          diemDi: "TP.HCM",
          diemDen: "Đà Nẵng",
          soNgay: 3,
          soNguoi: 2,
          ngansachTongVND: 15000000,
          sothich: [],
          tranh: [],
          ghiChu: [],
          thieu: [],
          cauHoiLamRo: [],
          canhBao: [],
        },
        selection: initialSelection,
        thayDoi: {
          loai: "phuong_tien_di",
          idMoi: targetTransportId,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.planSau).toBeDefined();
    expect(json.selection.transportDiId).toBe(targetTransportId);
    expect(json.diff).toBeDefined();
    expect(json.diff.tongVND).toBeDefined();
    expect(json.diff.tongVND.chenh).toBeDefined();
  });
});
