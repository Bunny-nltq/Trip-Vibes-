import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, clearOptionsCache } from "./route";
import { LiveDataSource } from "@/data/live/LiveDataSource";

describe("GET /api/options cache verification", () => {
  beforeEach(() => {
    clearOptionsCache();
    vi.restoreAllMocks();
  });

  it("mở lần thứ hai liên tiếp KHÔNG gọi lại nguồn ngoài (lần hai bằng 0 lượt gọi)", async () => {
    let externalCallsCount = 0;

    // Spy on getTransports của LiveDataSource
    vi.spyOn(LiveDataSource.prototype, "getTransports").mockImplementation(async () => {
      externalCallsCount++;
      return [
        {
          schemaVersion: 6,
          id: "t-test-1",
          huong: "di",
          type: "PLANE",
          provider: "Mock Carrier",
          seatClass: "Phổ thông",
          boardingPoint: "Sân bay Tân Sơn Nhất",
          dropOffPoint: "Sân bay Đà Nẵng",
          carrier: "Mock Carrier",
          departureTime: "07:00",
          arrivalTime: "08:15",
          durationMinutes: 75,
          origin: "TP.HCM",
          destination: "Đà Nẵng",
          pricePerPerson: 1_200_000,
        },
      ];
    });

    const req1 = new Request("http://localhost:3000/api/options?loai=phuong_tien&huong=di&soNguoi=2");
    const res1 = await GET(req1);
    const data1 = await res1.json();

    expect(data1.ok).toBe(true);
    expect(externalCallsCount).toBe(1); // Lần 1 gọi nguồn ngoài

    // Lần 2 với cùng tham số
    const countBeforeSecondCall = externalCallsCount;
    const req2 = new Request("http://localhost:3000/api/options?loai=phuong_tien&huong=di&soNguoi=2");
    const res2 = await GET(req2);
    const data2 = await res2.json();

    expect(data2.ok).toBe(true);
    const countInSecondCall = externalCallsCount - countBeforeSecondCall;
    expect(countInSecondCall).toBe(0); // Lần hai bằng 0
    expect(externalCallsCount).toBe(1); // Tổng vẫn là 1
  });

  it("mở khách sạn lần hai liên tiếp KHÔNG gọi lại getKhachSans", async () => {
    let hotelCalls = 0;

    vi.spyOn(LiveDataSource.prototype, "getKhachSans").mockImplementation(async () => {
      hotelCalls++;
      return [];
    });

    vi.spyOn(LiveDataSource.prototype, "getHotels").mockImplementation(async () => {
      return [];
    });

    const req1 = new Request("http://localhost:3000/api/options?loai=khach_san&soNguoi=2");
    const res1 = await GET(req1);
    const data1 = await res1.json();
    expect(data1.ok).toBe(true);
    expect(hotelCalls).toBe(1);

    const callsBefore = hotelCalls;
    const req2 = new Request("http://localhost:3000/api/options?loai=khach_san&soNguoi=2");
    const res2 = await GET(req2);
    const data2 = await res2.json();
    expect(data2.ok).toBe(true);
    expect(hotelCalls - callsBefore).toBe(0); // Lần 2 bằng 0
  });
});
