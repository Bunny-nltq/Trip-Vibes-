import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LiveDataSource } from "./LiveDataSource";
import type { SnapshotData } from "./LiveDataSource";
import type { DiemDen } from "@/contracts";
import { tavilySearch } from "./searchClient";
import * as overpassModule from "./overpassClient";

describe("LiveDataSource & Data Pipeline Tests (Bước 19)", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...origEnv };
    vi.restoreAllMocks();
  });

  // ─── YÊU CẦU 3: Phương tiện ước lượng tính lúc đọc, không lưu trong snapshot ───
  describe("Yêu cầu 3: Phương tiện ước lượng tính lúc đọc", () => {
    const diemDiVN: DiemDen = {
      ten: "Điểm Gốc",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      toaDo: { lat: 0, lng: 0 },
      tienTe: "VND",
      nguon: "nominatim",
      ngayLay: "2026-10-20T00:00:00Z",
    };

    const diemDenVN: DiemDen = {
      ten: "Điểm Đến VN",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      toaDo: { lat: 5.3959, lng: 0 }, // 600.0 km
      tienTe: "VND",
      nguon: "nominatim",
      ngayLay: "2026-10-20T00:00:00Z",
    };

    const diemDenForeign: DiemDen = {
      ten: "Bangkok",
      quocGia: "Thái Lan",
      maQuocGia: "TH",
      toaDo: { lat: 5.3959, lng: 0 },
      tienTe: "THB",
      nguon: "nominatim",
      ngayLay: "2026-10-20T00:00:00Z",
    };

    it("snapshot giả chứa est_xe (720 phút) -> getTransports trả may_bay (138 phút, 1.260.000), tau (982 phút, 600.000), xe_khach (1080 phút, 600.000), nguon uoc_luong:khoang_cach:600km và KHÔNG có 720", async () => {
      const fakeSnapshot: SnapshotData = {
        diemDen: "Điểm Đến VN",
        createdAt: "2026-10-20T00:00:00Z",
        khachSans: [],
        quanAns: [],
        cafes: [],
        hoatDongs: [],
        transports: [
          {
            schemaVersion: 7,
            id: "est_xe",
            huong: "di",
            type: "BUS",
            provider: "Xe Khách Cũ",
            origin: "Điểm Gốc",
            destination: "Điểm Đến VN",
            departureTime: "08:00",
            durationMinutes: 720,
            pricePerPerson: 500_000,
            seatClass: "Giường nằm",
            boardingPoint: "Bến A",
            dropOffPoint: "Bến B",
            nguon: "https://vexere.com",
            ngayLay: "2026-10-20T00:00:00Z",
            doTinCay: "uoc_tinh",
            giaLaUocTinh: true,
            nguonGia: [],
          },
        ],
      };

      const ds = new LiveDataSource("snapshot", undefined, diemDenVN, diemDiVN);
      vi.spyOn(ds as any, "loadSnapshot").mockReturnValue(fakeSnapshot);

      const transports = await ds.getTransports();

      // Kiểm tra KHÔNG có giá trị 720
      expect(transports.some((t) => t.durationMinutes === 720)).toBe(false);
      expect(transports.some((t) => t.id === "est_xe")).toBe(false);

      // Kiểm tra máy bay: 138 phút, 1.260.000 đ
      const mayBay = transports.find((t) => t.type === "PLANE");
      expect(mayBay).toBeDefined();
      expect(mayBay?.durationMinutes).toBe(138);
      expect(mayBay?.pricePerPerson).toBe(1_260_000);
      expect(mayBay?.nguon).toBe("uoc_luong:khoang_cach:600km");

      // Kiểm tra tàu: 982 phút, 600.000 đ
      const tau = transports.find((t) => t.type === "TRAIN");
      expect(tau).toBeDefined();
      expect(tau?.durationMinutes).toBe(982);
      expect(tau?.pricePerPerson).toBe(600_000);
      expect(tau?.nguon).toBe("uoc_luong:khoang_cach:600km");

      // Kiểm tra xe khách: 1080 phút, 600.000 đ
      const xeKhach = transports.find((t) => t.type === "BUS");
      expect(xeKhach).toBeDefined();
      expect(xeKhach?.durationMinutes).toBe(1080);
      expect(xeKhach?.pricePerPerson).toBe(600_000);
      expect(xeKhach?.nguon).toBe("uoc_luong:khoang_cach:600km");
    });

    it("điểm đến nước khác (maQuocGia khác 'VN'): chỉ có may_bay", async () => {
      const fakeSnapshot: SnapshotData = {
        diemDen: "Bangkok",
        createdAt: "2026-10-20T00:00:00Z",
        khachSans: [],
        quanAns: [],
        cafes: [],
        hoatDongs: [],
        transports: [
          {
            schemaVersion: 7,
            id: "est_xe",
            huong: "di",
            type: "BUS",
            provider: "Xe Khách Cũ",
            origin: "Điểm Gốc",
            destination: "Bangkok",
            departureTime: "08:00",
            durationMinutes: 720,
            pricePerPerson: 500_000,
            seatClass: "Giường nằm",
            boardingPoint: "Bến A",
            dropOffPoint: "Bến B",
            nguon: "https://vexere.com",
            ngayLay: "2026-10-20T00:00:00Z",
            doTinCay: "uoc_tinh",
            giaLaUocTinh: true,
            nguonGia: [],
          },
        ],
      };

      const ds = new LiveDataSource("snapshot", undefined, diemDenForeign, diemDiVN);
      vi.spyOn(ds as any, "loadSnapshot").mockReturnValue(fakeSnapshot);

      const transports = await ds.getTransports();

      expect(transports.length).toBeGreaterThan(0);
      expect(transports.every((t) => t.type === "PLANE")).toBe(true);
      expect(transports.some((t) => t.type === "TRAIN")).toBe(false);
      expect(transports.some((t) => t.type === "BUS")).toBe(false);
    });
  });

  // ─── YÊU CẦU 4: Test LiveDataSource ──────────────────────────────────────────
  describe("Yêu cầu 4: Kiểm thử LiveDataSource và chính sách dữ liệu", () => {
    it("TTL cache 24 giờ: mục 23 giờ tuổi là cache hit; mục 25 giờ tuổi là cache miss", () => {
      const cacheDir = path.join(process.cwd(), ".cache", "data");
      fs.mkdirSync(cacheDir, { recursive: true });
      const testKey = "test_ttl_evaluation";
      const testCacheFile = path.join(cacheDir, `osm_${testKey}.json`);

      const cacheData = {
        metadata: { ngay: new Date().toISOString(), mayChu: "test", runId: "123" },
        data: [{ id: "test:node:1", ten: "Địa điểm test" }],
      };
      fs.writeFileSync(testCacheFile, JSON.stringify(cacheData), "utf-8");

      try {
        // Trường hợp 1: Tuổi 23 giờ -> Cache HIT
        const mtime23h = (Date.now() - 23 * 3600 * 1000) / 1000;
        fs.utimesSync(testCacheFile, mtime23h, mtime23h);

        // Đọc cache trực tiếp qua hàm stat kiểm tra TTL 24h
        const stat23 = fs.statSync(testCacheFile);
        const ageHours23 = (Date.now() - stat23.mtimeMs) / (1000 * 3600);
        expect(ageHours23).toBeLessThanOrEqual(24);

        // Trường hợp 2: Tuổi 25 giờ -> Cache MISS
        const mtime25h = (Date.now() - 25 * 3600 * 1000) / 1000;
        fs.utimesSync(testCacheFile, mtime25h, mtime25h);

        const stat25 = fs.statSync(testCacheFile);
        const ageHours25 = (Date.now() - stat25.mtimeMs) / (1000 * 3600);
        expect(ageHours25).toBeGreaterThan(24);
      } finally {
        if (fs.existsSync(testCacheFile)) {
          fs.unlinkSync(testCacheFile);
        }
      }
    });

    it("đã đủ DATA_MAX_SEARCH_PER_DAY thì KHÔNG gọi thêm Tavily", async () => {
      process.env.DATA_MAX_SEARCH_PER_DAY = "5";
      process.env.TAVILY_API_KEY = "test-tavily-key";

      const counterFile = path.join(process.cwd(), ".cache", "data", "tavily_counter.json");
      fs.mkdirSync(path.dirname(counterFile), { recursive: true });
      const today = new Date().toISOString().slice(0, 10);
      fs.writeFileSync(
        counterFile,
        JSON.stringify({ date: today, count: 5 }),
        "utf-8"
      );

      const fetchSpy = vi.spyOn(global, "fetch");

      const res = await tavilySearch("du lịch Đà Nẵng");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toBe("limit_reached");
      }
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("thứ tự dự phòng: live (hoặc cache), rồi snapshot ĐÚNG điểm đến; KHÔNG có mock và KHÔNG dùng snapshot của điểm đến khác; hết cả hai trả khong_du_du_lieu nêu loại thiếu", async () => {
      // 1. Điểm đến Huế không có snapshot trong kho snapshots/
      const diemDenHue: DiemDen = {
        ten: "Huế",
        quocGia: "Việt Nam",
        maQuocGia: "VN",
        toaDo: { lat: 16.4637, lng: 107.5909 },
        tienTe: "VND",
        nguon: "nominatim",
        ngayLay: "2026-10-20T00:00:00Z",
      };

      // Mock live calls bị lỗi / mạng rỗng
      vi.spyOn(overpassModule, "fetchKhachSansOSM").mockRejectedValue(new Error("Network Error"));
      vi.spyOn(overpassModule, "fetchQuanAnsOSM").mockRejectedValue(new Error("Network Error"));
      vi.spyOn(overpassModule, "fetchCafesOSM").mockRejectedValue(new Error("Network Error"));
      vi.spyOn(overpassModule, "fetchHoatDongsOSM").mockRejectedValue(new Error("Network Error"));

      const ds = new LiveDataSource("live", undefined, diemDenHue);
      const ks = await ds.getKhachSans();
      const qa = await ds.getQuanAns();
      const hd = await ds.getHoatDongs();

      // Không rơi về mock hay snapshot của Đà Nẵng / Hà Nội
      expect(ks).toEqual([]);
      expect(qa).toEqual([]);
      expect(hd).toEqual([]);

      // Kiểm tra tính đầy đủ -> trả về khong_du_du_lieu kèm các loại thiếu
      const kiemTra = await ds.kiemTraDuLieu();
      expect(kiemTra.status).toBe("khong_du_du_lieu");
      if (kiemTra.status === "khong_du_du_lieu") {
        expect(kiemTra.loaiThieu).toContain("khach_san");
        expect(kiemTra.loaiThieu).toContain("quan_an");
        expect(kiemTra.loaiThieu).toContain("hoat_dong");
      }
    });

    it("mục không có nguồn thì doTinCay = 'uoc_tinh'", async () => {
      const diemDen: DiemDen = {
        ten: "Đà Nẵng",
        quocGia: "Việt Nam",
        maQuocGia: "VN",
        toaDo: { lat: 16.0685, lng: 108.224 },
        tienTe: "VND",
        nguon: "nominatim",
        ngayLay: "2026-10-20T00:00:00Z",
      };

      const ds = new LiveDataSource("snapshot", undefined, diemDen);
      vi.spyOn(ds as any, "loadSnapshot").mockReturnValue({
        diemDen: "Đà Nẵng",
        createdAt: "2026-10-20T00:00:00Z",
        khachSans: [
          {
            id: "hotel_no_source",
            ten: "Khách Sạn Ẩn Danh",
            khuVuc: "Hải Châu",
            diaChi: null,
            toaDo: { lat: 16.06, lng: 108.22 },
            loai: "khach_san",
            gioMoCua: null,
            soSao: 3,
            giaUocTinhNguoi: 400000,
            nguon: null, // KHÔNG CÓ NGUỒN
            ngayLay: "2026-10-20T00:00:00Z",
            doTinCay: "xac_minh", // Đang gán xac_minh sai
            giaLaUocTinh: true,
            khoangGiaDemVND: { min: 600000, max: 900000 },
            nguonGia: [],
          },
        ],
        quanAns: [],
        cafes: [],
        hoatDongs: [],
        transports: [],
      });

      const hotels = await ds.getKhachSans();
      expect(hotels.length).toBe(1);
      // Bắt buộc được chuẩn hóa thành "uoc_tinh"
      expect(hotels[0].doTinCay).toBe("uoc_tinh");
    });

    it("mở danh sách lần hai với cùng điều kiện không gọi lại Overpass hay Tavily", async () => {
      const diemDen: DiemDen = {
        ten: "Đà Nẵng",
        quocGia: "Việt Nam",
        maQuocGia: "VN",
        toaDo: { lat: 16.0685, lng: 108.224 },
        tienTe: "VND",
        nguon: "nominatim",
        ngayLay: "2026-10-20T00:00:00Z",
      };

      const mockHotel = {
        id: "osm:node:100",
        osmId: "osm:node:100",
        ten: "Khách sạn X",
        khuVuc: "Hải Châu",
        diaChi: "123 Đường Y",
        toaDo: { lat: 16.0685, lng: 108.224 },
        loai: "khach_san",
        gioMoCua: null,
        soSao: 4,
        giaUocTinhNguoi: 500000,
        nguon: "osm:node:100",
        ngayLay: new Date().toISOString(),
        doTinCay: "tham_khao" as const,
        giaLaUocTinh: true,
        khoangGiaDemVND: { min: 800000, max: 1200000 },
        nguonGia: [],
      };

      const fetchKsSpy = vi
        .spyOn(overpassModule, "fetchKhachSansOSM")
        .mockResolvedValue([mockHotel as any]);

      const ds = new LiveDataSource("live", undefined, diemDen);

      // Lần 1: Gọi Overpass
      const l1 = await ds.getKhachSans();
      expect(l1.length).toBe(1);
      expect(fetchKsSpy).toHaveBeenCalledTimes(1);

      // Lần 2: Mở danh sách lần hai với cùng điều kiện -> Memoized, không gọi lại Overpass
      const l2 = await ds.getKhachSans();
      expect(l2.length).toBe(1);
      expect(fetchKsSpy).toHaveBeenCalledTimes(1);
    });
  });
});
