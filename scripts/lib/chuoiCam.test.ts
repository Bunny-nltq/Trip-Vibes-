import { describe, it, expect } from "vitest";
import { chuoiCam } from "./chuoiCam";

describe("chuoiCam pure function", () => {
  it('trả ["Bunny"] cho "Xin chào Bunny"', () => {
    expect(chuoiCam("Xin chào Bunny")).toEqual(["Bunny"]);
  });

  it('trả [] cho "ok"', () => {
    expect(chuoiCam("ok")).toEqual([]);
  });

  it("không phân biệt hoa thường", () => {
    expect(chuoiCam("Trang web THÔNG MINH")).toEqual(["thông minh"]);
    expect(chuoiCam("bunny và cài đặt")).toEqual(["Bunny", "Cài đặt"]);
  });
});
