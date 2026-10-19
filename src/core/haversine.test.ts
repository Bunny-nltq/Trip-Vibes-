import { describe, it, expect } from "vitest";
import { khoangCachKm } from "./haversine";

describe("haversine", () => {
  it("(0,0) tới (0,1) = 111,2", () => {
    const d = khoangCachKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(d).toBe(111.2);
  });

  it("TP.HCM tới Đà Nẵng nằm trong khoảng 608 đến 610", () => {
    const hcm = { lat: 10.7769, lng: 106.7009 };
    const daNang = { lat: 16.0544, lng: 108.2022 };
    const d = khoangCachKm(hcm, daNang);
    expect(d).toBeGreaterThanOrEqual(608);
    expect(d).toBeLessThanOrEqual(610);
  });

  it("TP.HCM tới Hà Nội trong khoảng 1140 đến 1147", () => {
    const hcm = { lat: 10.7769, lng: 106.7009 };
    const haNoi = { lat: 21.0285, lng: 105.8542 };
    const d = khoangCachKm(hcm, haNoi);
    expect(d).toBeGreaterThanOrEqual(1140);
    expect(d).toBeLessThanOrEqual(1147);
  });
});
