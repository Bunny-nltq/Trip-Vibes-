import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  kiemTraGioiHanAI,
  taoTrangThaiGioiHanAI,
  type TrangThaiGioiHanAI,
} from "./gioiHanAI";

describe("src/core/gioiHanAI", () => {
  const cauHinh = { moiIpMoiGio: 5, tongMoiNgay: 40 };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("IP A gọi 5 lần trong một giờ -> cho phép; lần thứ 6 -> { choPhep: false, lyDo: 'gioi_han_ip' }", () => {
    const trangThai: TrangThaiGioiHanAI = taoTrangThaiGioiHanAI();
    const t0 = Date.now();

    // 5 lần đầu
    for (let i = 0; i < 5; i++) {
      const kq = kiemTraGioiHanAI(trangThai, "IP_A", t0 + i * 1000, cauHinh);
      expect(kq).toEqual({ choPhep: true });
    }

    // Lần thứ 6 trong vòng 1 giờ
    const kq6 = kiemTraGioiHanAI(trangThai, "IP_A", t0 + 5000, cauHinh);
    expect(kq6).toEqual({ choPhep: false, lyDo: "gioi_han_ip" });
  });

  it("sau 3.600.001 ms kể từ lần đầu của IP A -> cho phép lại", () => {
    const trangThai: TrangThaiGioiHanAI = taoTrangThaiGioiHanAI();
    const t0 = Date.now();

    // 5 lần đầu
    for (let i = 0; i < 5; i++) {
      kiemTraGioiHanAI(trangThai, "IP_A", t0 + i * 1000, cauHinh);
    }

    // Lần thứ 6 bị chặn
    const kq6 = kiemTraGioiHanAI(trangThai, "IP_A", t0 + 5000, cauHinh);
    expect(kq6.choPhep).toBe(false);

    // Sau 3.600.001 ms kể từ t0 (lần đầu của IP A)
    const tSau = t0 + 3_600_001;
    const kqChoPhepLai = kiemTraGioiHanAI(trangThai, "IP_A", tSau, cauHinh);
    expect(kqChoPhepLai).toEqual({ choPhep: true });
  });

  it("IP B độc lập với IP A", () => {
    const trangThai: TrangThaiGioiHanAI = taoTrangThaiGioiHanAI();
    const t0 = Date.now();

    // IP A gọi hết 5 lượt
    for (let i = 0; i < 5; i++) {
      kiemTraGioiHanAI(trangThai, "IP_A", t0 + i * 1000, cauHinh);
    }
    // IP A bị chặn
    expect(kiemTraGioiHanAI(trangThai, "IP_A", t0 + 5000, cauHinh).choPhep).toBe(false);

    // IP B gọi thì vẫn được cho phép bình thường
    const kqB = kiemTraGioiHanAI(trangThai, "IP_B", t0 + 6000, cauHinh);
    expect(kqB).toEqual({ choPhep: true });
  });

  it("tổng 40 lượt trong ngày (nhiều IP) -> lượt 41 { choPhep: false, lyDo: 'gioi_han_ngay' }", () => {
    const trangThai: TrangThaiGioiHanAI = taoTrangThaiGioiHanAI();
    const t0 = Date.now();

    // Dùng 8 IP khác nhau, mỗi IP gọi 5 lượt -> tổng 40 lượt trong ngày
    for (let ipIndex = 1; ipIndex <= 8; ipIndex++) {
      const ip = `IP_${ipIndex}`;
      for (let callIndex = 0; callIndex < 5; callIndex++) {
        const kq = kiemTraGioiHanAI(trangThai, ip, t0 + (ipIndex * 5 + callIndex) * 100, cauHinh);
        expect(kq.choPhep).toBe(true);
      }
    }

    // Lượt thứ 41 (từ một IP mới tinh IP_9)
    const kq41 = kiemTraGioiHanAI(trangThai, "IP_9", t0 + 50_000, cauHinh);
    expect(kq41).toEqual({ choPhep: false, lyDo: "gioi_han_ngay" });
  });
});
