import { describe, it, expect } from "vitest";
import { coTuyenTau, chuanHoaTen } from "./tuyenTau";

describe("tuyenTau – coTuyenTau (đáp án người dùng B3b)", () => {
  it("coTuyenTau('TP.HCM', 'Hà Nội') -> true", () => {
    expect(coTuyenTau("TP.HCM", "Hà Nội")).toBe(true);
  });

  it("coTuyenTau('Thành phố Hồ Chí Minh', 'Thành phố Đà Nẵng') -> true", () => {
    expect(coTuyenTau("Thành phố Hồ Chí Minh", "Thành phố Đà Nẵng")).toBe(true);
  });

  it("coTuyenTau('TP.HCM', 'Đà Lạt') -> false", () => {
    expect(coTuyenTau("TP.HCM", "Đà Lạt")).toBe(false);
  });

  it("coTuyenTau('TP.HCM', 'Phú Quốc') -> false", () => {
    expect(coTuyenTau("TP.HCM", "Phú Quốc")).toBe(false);
  });

  it("coTuyenTau('TP.HCM', 'Seoul') -> false", () => {
    expect(coTuyenTau("TP.HCM", "Seoul")).toBe(false);
  });

  it("coTuyenTau('Hà Nội', 'Đà Lạt') -> false", () => {
    expect(coTuyenTau("Hà Nội", "Đà Lạt")).toBe(false);
  });

  it("coTuyenTau('Hà Nội', 'Huế') -> true", () => {
    expect(coTuyenTau("Hà Nội", "Huế")).toBe(true);
  });

  it("coTuyenTau('TP.HCM', 'Nha Trang') -> true", () => {
    expect(coTuyenTau("TP.HCM", "Nha Trang")).toBe(true);
  });

  it("coTuyenTau('TP.HCM', 'Hội An') -> false", () => {
    expect(coTuyenTau("TP.HCM", "Hội An")).toBe(false);
  });

  it("coTuyenTau('TP.HCM', 'Vũng Tàu') -> false", () => {
    expect(coTuyenTau("TP.HCM", "Vũng Tàu")).toBe(false);
  });

  it("coTuyenTau('TP.HCM', 'Hà Tĩnh') -> false (đã đối chiếu dsvn.vn: TP Hà Tĩnh không có ga trực tiếp)", () => {
    expect(coTuyenTau("TP.HCM", "Hà Tĩnh")).toBe(false);
  });
});
