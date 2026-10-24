/**
 * src/data/prepareDestination.test.ts
 *
 * Test bộ chuẩn bị dữ liệu điểm đến độc lập và giải quyết timeout 60s.
 * Đáp án do người dùng yêu cầu:
 * (a) hai lần gọi prepare liên tiếp cùng điểm đến chỉ tạo 1 công việc;
 * (b) cache đã đủ thì trả "san_sang" ngay và không gọi mạng;
 * (c) status phản ánh hạng mục nào xong hoặc thiếu;
 * (d) /api/plan khi dữ liệu chưa sẵn sàng trả 409;
 * (e) môi trường production không có snapshot thì trả khong_co_du_lieu_luu_san và không gọi Overpass.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { DiemDen } from "@/contracts";
import { prepareDestinationJob, getDestinationJobStatus, clearJobsForTest } from "./prepareDestination";
import { POST as planRouteHandler } from "@/app/api/plan/route";

const DA_NANG: DiemDen = {
  ten: "Đà Nẵng",
  quocGia: "Việt Nam",
  maQuocGia: "VN",
  toaDo: { lat: 16.0544, lng: 108.2022 },
  tienTe: "VND",
  nguon: "nominatim",
  ngayLay: "2026-10-20",
};

const DIEM_DEN_MOI: DiemDen = {
  ten: "Thành phố Mới 123",
  quocGia: "Việt Nam",
  maQuocGia: "VN",
  toaDo: { lat: 10.1234, lng: 105.5678 },
  tienTe: "VND",
  nguon: "nominatim",
  ngayLay: "2026-10-20",
};

describe("Chuẩn bị dữ liệu điểm đến (Prepare Destination)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearJobsForTest();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // (a) hai lần gọi prepare liên tiếp cùng điểm đến chỉ tạo 1 công việc
  it("(a) hai lần gọi prepare liên tiếp cùng điểm đến chỉ tạo 1 công việc", () => {
    (process.env as any).NODE_ENV = "development";

    const res1 = prepareDestinationJob({ diemDen: DIEM_DEN_MOI });
    const res2 = prepareDestinationJob({ diemDen: DIEM_DEN_MOI });

    expect(res1.trangThai).toBe("dang_chay");
    expect(res2.trangThai).toBe("dang_chay");
    expect(res1.jobId).toBeDefined();
    expect(res2.jobId).toBeDefined();
    // Cùng chung jobId, không tạo thêm công việc thứ hai
    expect(res1.jobId).toBe(res2.jobId);
  });

  // (b) cache đã đủ thì trả "san_sang" ngay và không gọi mạng
  it("(b) cache đã đủ thì trả \"san_sang\" ngay và không gọi mạng", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // Đà Nẵng đã có snapshot trong src/data/snapshots/snapshot_da_nang_2026-10-20.json
    const res = prepareDestinationJob({ diemDen: DA_NANG });

    expect(res.trangThai).toBe("san_sang");
    expect(res.jobId).toBeUndefined();
    // Không thực hiện bất kỳ gọi mạng nào
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // (c) status phản ánh hạng mục nào xong hoặc thiếu
  it("(c) status phản ánh hạng mục nào xong hoặc thiếu", () => {
    (process.env as any).NODE_ENV = "development";

    const res = prepareDestinationJob({ diemDen: DIEM_DEN_MOI });
    expect(res.jobId).toBeDefined();

    const job = getDestinationJobStatus(res.jobId!);
    expect(job).toBeDefined();
    const validJob = job!;

    const keys = Object.keys(validJob.tienTrinh) as (keyof typeof validJob.tienTrinh)[];
    expect(keys).toContain("khach_san");
    expect(keys).toContain("quan_an");
    expect(keys).toContain("cafe");
    expect(keys).toContain("hoat_dong");
    expect(keys).toContain("phuong_tien");
    expect(keys).toContain("gia_diem_den");

    // Mỗi hạng mục có trạng thái rõ ràng
    for (const k of keys) {
      const item = validJob.tienTrinh[k];
      expect(["cho", "dang_chay", "xong", "thieu", "loi"]).toContain(item.trangThai);
    }
  });

  // (d) /api/plan khi dữ liệu chưa sẵn sàng trả 409
  it("(d) /api/plan khi dữ liệu chưa sẵn sàng trả 409", async () => {
    (process.env as any).NODE_ENV = "development";

    // DIEM_DEN_MOI chưa có snapshot và chưa chạy prepare
    const req = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request: {
          schemaVersion: 7,
          diemDi: "TP.HCM",
          diemDen: DIEM_DEN_MOI,
          soNguoi: 2,
          soNgay: 3,
          ngansachTongVND: 10000000,
          sothich: [],
          tranh: [],
          ghiChu: [],
          thieu: [],
          cauHoiLamRo: [],
          canhBao: [],
        },
      }),
    });

    const res = await planRouteHandler(req);
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.status).toBe("du_lieu_chua_san_sang");
    expect(body.maLoi).toBe("du_lieu_chua_san_sang");
  });

  // (e) môi trường production không có snapshot thì trả khong_co_du_lieu_luu_san và không gọi Overpass
  it("(e) môi trường production không có snapshot thì trả khong_co_du_lieu_luu_san và không gọi Overpass", () => {
    (process.env as any).NODE_ENV = "production";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const res = prepareDestinationJob({ diemDen: DIEM_DEN_MOI });

    expect(res.trangThai).toBe("loi");
    expect(res.maLoi).toBe("khong_co_du_lieu_luu_san");
    expect(res.thongBao).toBe(
      "Điểm đến này chưa có dữ liệu đã lưu. Hãy chạy chương trình trên máy để chuẩn bị dữ liệu."
    );
    // Không gọi Overpass
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
