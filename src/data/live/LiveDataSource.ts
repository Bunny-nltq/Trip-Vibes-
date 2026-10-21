/**
 * src/data/live/LiveDataSource.ts
 *
 * DataSource triển khai dữ liệu live mở rộng cho điểm đến bất kỳ:
 * - OSM (Overpass): khách sạn, quán ăn, cafe, điểm tham quan theo bán kính toạ độ điểm đến
 * - Tavily + Gemini: giá phương tiện, giá phòng khách sạn và bữa ăn theo điểm đến
 * - Dự phòng: snapshot mới nhất → mock JSON
 *
 * DATA_MODE = "live" | "snapshot" | "mock"
 */

import path from "node:path";
import fs from "node:fs";
import type { DataSource } from "../DataSource";
import type {
  Hotel,
  Transport,
  Activity,
  KhachSan,
  QuanAn,
  Cafe,
  HoatDong,
  DiemDen,
} from "@/contracts";
import { DEFAULT_DIEM_DI } from "@/contracts";
import { JsonDataSource } from "../JsonDataSource";
import {
  fetchKhachSansOSM,
  fetchQuanAnsOSM,
  fetchCafesOSM,
  fetchHoatDongsOSM,
  lastOverpassStats,
} from "./overpassClient";
import {
  researchTransports,
  taoPhuongTienUocLuong,
} from "./researchTransport";
import { researchGiaDiemDen } from "./researchGiaDiemDen";
import { computeSnapshotChecksum } from "../snapshots/snapshotAudit";

export type DataMode = "live" | "snapshot" | "mock";

const DEFAULT_COORD = { lat: 10.7769, lng: 106.7009 }; // default center if not specified

function ensureDoTinCay<T extends { nguon?: string | null; doTinCay?: any }>(item: T): T {
  if (!item.nguon || item.nguon.trim() === "") {
    return {
      ...item,
      doTinCay: "uoc_tinh",
    };
  }
  return item;
}

export class LiveDataSource implements DataSource {
  private readonly mode: DataMode;
  private readonly snapshotName?: string;
  private readonly mockSource?: JsonDataSource;
  private readonly fetchedAt: string;
  private diemDen?: DiemDen;
  private diemDi?: DiemDen;
  private soNgay: number;
  private giaVeTuNhap?: { chieuDiVND: number; chieuVeVND: number };

  private memoKhachSans?: KhachSan[];
  private memoQuanAns?: QuanAn[];
  private memoCafes?: Cafe[];
  private memoHoatDongs?: HoatDong[];
  private memoTransports?: Transport[];

  private dataSourceUsed: "live" | "snapshot" | "mock" | "cache" = "live";
  private snapshotDate?: string;

  constructor(
    mode?: DataMode,
    snapshotName?: string,
    diemDen?: DiemDen,
    diemDi?: DiemDen,
    soNgay: number = 3,
    giaVeTuNhap?: { chieuDiVND: number; chieuVeVND: number }
  ) {
    // Khi process.env.VERCEL có giá trị: DATA_MODE mặc định "snapshot"; chế độ live chỉ khi LIVE_DATA_ENABLED=true.
    const isVercel = Boolean(
      process.env.VERCEL && process.env.VERCEL !== "0" && process.env.VERCEL !== "false"
    );
    if (isVercel) {
      if (process.env.LIVE_DATA_ENABLED === "true") {
        this.mode = (process.env.DATA_MODE as DataMode) ?? "live";
      } else {
        this.mode = "snapshot";
      }
    } else {
      this.mode =
        (process.env.DATA_MODE as DataMode | undefined) ?? mode ?? "live";
    }
    this.snapshotName = snapshotName ?? process.env.DATA_SNAPSHOT_NAME;
    if (this.mode === "mock") {
      this.mockSource = new JsonDataSource();
      this.dataSourceUsed = "mock";
    } else if (this.mode === "snapshot") {
      this.dataSourceUsed = "snapshot";
    } else {
      this.dataSourceUsed = "live";
    }
    this.fetchedAt = new Date().toISOString();
    this.diemDen = diemDen;
    this.diemDi = diemDi ?? DEFAULT_DIEM_DI;
    this.soNgay = soNgay;
    this.giaVeTuNhap = giaVeTuNhap;
  }

  isFallbackAllowed(): boolean {
    return process.env.DATA_FALLBACK !== "off";
  }

  getDataSourceUsed(): {
    source: "live" | "snapshot" | "mock" | "cache";
    ngayDuLieu: string;
    snapshotDate?: string;
    tuoiGio?: number;
  } {
    if (this.mode === "mock") {
      return {
        source: "mock",
        ngayDuLieu: this.fetchedAt,
      };
    }
    if (this.dataSourceUsed === "snapshot" || this.mode === "snapshot") {
      return {
        source: "snapshot",
        ngayDuLieu: this.snapshotDate ?? this.fetchedAt,
        snapshotDate: this.snapshotDate,
      };
    }

    const cachedItems = lastOverpassStats.filter((s) => s.fromCache);
    if (cachedItems.length > 0 && cachedItems.length >= lastOverpassStats.length / 2) {
      const avgAge =
        cachedItems.reduce((acc, c) => acc + (c.cacheAgeHours ?? 0), 0) /
        cachedItems.length;
      return {
        source: "cache",
        ngayDuLieu: this.fetchedAt,
        tuoiGio: Number(avgAge.toFixed(1)),
      };
    }

    return {
      source: "live",
      ngayDuLieu: this.fetchedAt,
    };
  }

  setDestination(diemDen: DiemDen, diemDi?: DiemDen): void {
    this.diemDen = diemDen;
    if (diemDi) this.diemDi = diemDi;
    this.memoKhachSans = undefined;
    this.memoQuanAns = undefined;
    this.memoCafes = undefined;
    this.memoHoatDongs = undefined;
    this.memoTransports = undefined;
  }

  getMode(): string {
    return this.mode;
  }

  getNgayLay(): string {
    return this.fetchedAt;
  }

  private getToaDo(): { lat: number; lng: number } {
    return this.diemDen?.toaDo ?? DEFAULT_COORD;
  }

  private getTenDiemDen(): string {
    return this.diemDen?.ten ?? "";
  }

  // ─── Legacy interface (backward compat) ───────────────────────────────────

  async getHotels(): Promise<Hotel[]> {
    if (this.mode === "mock") return this.mockSource?.getHotels() ?? [];
    return [];
  }

  async getTransports(): Promise<Transport[]> {
    if (this.memoTransports) return this.memoTransports;
    if (this.mode === "mock") {
      this.dataSourceUsed = "mock";
      return (this.memoTransports = ((await this.mockSource?.getTransports()) ?? []).map(ensureDoTinCay));
    }

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      const realTransports = (snap?.transports ?? []).filter(
        (t) => !t.id.startsWith("est_") && !(t.nguon && t.nguon.startsWith("uoc_luong:"))
      );
      if (realTransports.length > 0) {
        this.dataSourceUsed = "snapshot";
        this.snapshotDate = snap?.createdAt;
        return (this.memoTransports = realTransports.map(ensureDoTinCay));
      }
      if (this.diemDen) {
        const est = taoPhuongTienUocLuong(this.diemDi ?? DEFAULT_DIEM_DI, this.diemDen);
        if (est.length > 0) {
          this.dataSourceUsed = "snapshot";
          this.snapshotDate = snap?.createdAt;
          return (this.memoTransports = est.map(ensureDoTinCay));
        }
      }
      return (this.memoTransports = []);
    }

    try {
      if (this.diemDen) {
        const res = await researchTransports(
          this.diemDi ?? DEFAULT_DIEM_DI,
          this.diemDen,
          this.soNgay,
          this.giaVeTuNhap
        );
        const realTransports = res.transports.filter(
          (t) => !t.id.startsWith("est_") && !(t.nguon && t.nguon.startsWith("uoc_luong:"))
        );
        if (realTransports.length > 0) return (this.memoTransports = realTransports.map(ensureDoTinCay));
      }
    } catch {
      // ignore
    }

    if (this.isFallbackAllowed()) {
      const snap = this.loadSnapshotForDestination();
      const realTransports = (snap?.transports ?? []).filter(
        (t) => !t.id.startsWith("est_") && !(t.nguon && t.nguon.startsWith("uoc_luong:"))
      );
      if (realTransports.length > 0) {
        this.dataSourceUsed = "snapshot";
        this.snapshotDate = snap?.createdAt;
        return (this.memoTransports = realTransports.map(ensureDoTinCay));
      }
    }

    if (this.diemDen) {
      const est = taoPhuongTienUocLuong(this.diemDi ?? DEFAULT_DIEM_DI, this.diemDen);
      if (est.length > 0) {
        return (this.memoTransports = est.map(ensureDoTinCay));
      }
    }

    return (this.memoTransports = []);
  }

  async getActivities(): Promise<Activity[]> {
    if (this.mode === "mock") return this.mockSource?.getActivities() ?? [];
    return [];
  }

  // ─── Live data ────────────────────────────────────────────────────────────

  async getKhachSans(): Promise<KhachSan[]> {
    if (this.memoKhachSans) return this.memoKhachSans;
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      if (snap?.khachSans) return (this.memoKhachSans = snap.khachSans.map(ensureDoTinCay));
      return [];
    }

    try {
      const coord = this.getToaDo();
      const ten = this.getTenDiemDen();
      const raw = await fetchKhachSansOSM(coord, ten);

      if (raw.length === 0) {
        if (!this.isFallbackAllowed()) {
          return (this.memoKhachSans = []);
        }
        const snap = this.loadSnapshotForDestination();
        if (snap?.khachSans && snap.khachSans.length > 0) {
          this.dataSourceUsed = "snapshot";
          this.snapshotDate = snap.createdAt;
          return (this.memoKhachSans = snap.khachSans.map(ensureDoTinCay));
        }
      }

      // Điền giá theo sao từ researchGiaDiemDen
      let giaTheoSao: Record<number, number> | null = null;
      if (this.diemDen) {
        try {
          const res = await researchGiaDiemDen(this.diemDen);
          giaTheoSao = res.giaKhachSanTheoSao;
        } catch {
          // ignore
        }
      }

      const res = raw.map((ks) => {
        const stars = ks.soSao ?? 3;
        const estimatedNight = giaTheoSao?.[stars] ?? 700_000;
        return {
          ...ks,
          giaUocTinhNguoi: Math.round(estimatedNight / 2),
          khoangGiaDemVND: {
            min: Math.round(estimatedNight * 0.85),
            max: Math.round(estimatedNight * 1.15),
          },
        };
      });
      return (this.memoKhachSans = res.map(ensureDoTinCay));
    } catch (err) {
      console.error("[LiveDataSource] getKhachSans lỗi:", err instanceof Error ? err.message : err);
      if (!this.isFallbackAllowed()) {
        return (this.memoKhachSans = []);
      }
      const snap = this.loadSnapshotForDestination();
      if (snap?.khachSans && snap.khachSans.length > 0) {
        this.dataSourceUsed = "snapshot";
        this.snapshotDate = snap.createdAt;
        return (this.memoKhachSans = snap.khachSans.map(ensureDoTinCay));
      }
      return (this.memoKhachSans = []);
    }
  }

  async getQuanAns(): Promise<QuanAn[]> {
    if (this.memoQuanAns) return this.memoQuanAns;
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      if (snap?.quanAns) return (this.memoQuanAns = snap.quanAns.map(ensureDoTinCay));
      return [];
    }

    try {
      const coord = this.getToaDo();
      const ten = this.getTenDiemDen();
      const raw = await fetchQuanAnsOSM(coord, ten);

      if (raw.length === 0) {
        if (!this.isFallbackAllowed()) {
          return (this.memoQuanAns = []);
        }
        const snap = this.loadSnapshotForDestination();
        if (snap?.quanAns && snap.quanAns.length > 0) {
          this.dataSourceUsed = "snapshot";
          this.snapshotDate = snap.createdAt;
          return (this.memoQuanAns = snap.quanAns.map(ensureDoTinCay));
        }
      }

      let giaBuaAn = 150_000;
      if (this.diemDen) {
        try {
          const res = await researchGiaDiemDen(this.diemDen);
          giaBuaAn = res.giaBuaAnTrungBinh;
        } catch {
          // ignore
        }
      }

      const res = raw.map((qa) => ({
        ...qa,
        giaUocTinhNguoi: giaBuaAn,
      }));
      return (this.memoQuanAns = res.map(ensureDoTinCay));
    } catch (err) {
      console.error("[LiveDataSource] getQuanAns lỗi:", err instanceof Error ? err.message : err);
      if (!this.isFallbackAllowed()) {
        return (this.memoQuanAns = []);
      }
      const snap = this.loadSnapshotForDestination();
      if (snap?.quanAns && snap.quanAns.length > 0) {
        this.dataSourceUsed = "snapshot";
        this.snapshotDate = snap.createdAt;
        return (this.memoQuanAns = snap.quanAns.map(ensureDoTinCay));
      }
      return (this.memoQuanAns = []);
    }
  }

  async getCafes(): Promise<Cafe[]> {
    if (this.memoCafes) return this.memoCafes;
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      if (snap?.cafes) return (this.memoCafes = snap.cafes.map(ensureDoTinCay));
      return [];
    }

    try {
      const coord = this.getToaDo();
      const ten = this.getTenDiemDen();
      const res = await fetchCafesOSM(coord, ten);
      if (res.length === 0) {
        if (!this.isFallbackAllowed()) {
          return (this.memoCafes = []);
        }
        const snap = this.loadSnapshotForDestination();
        if (snap?.cafes && snap.cafes.length > 0) {
          this.dataSourceUsed = "snapshot";
          this.snapshotDate = snap.createdAt;
          return (this.memoCafes = snap.cafes.map(ensureDoTinCay));
        }
      }
      return (this.memoCafes = res.map(ensureDoTinCay));
    } catch (err) {
      console.error("[LiveDataSource] getCafes lỗi:", err instanceof Error ? err.message : err);
      if (!this.isFallbackAllowed()) {
        return (this.memoCafes = []);
      }
      const snap = this.loadSnapshotForDestination();
      if (snap?.cafes && snap.cafes.length > 0) {
        this.dataSourceUsed = "snapshot";
        this.snapshotDate = snap.createdAt;
        return (this.memoCafes = snap.cafes.map(ensureDoTinCay));
      }
      return (this.memoCafes = []);
    }
  }

  async getHoatDongs(): Promise<HoatDong[]> {
    if (this.memoHoatDongs) return this.memoHoatDongs;
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      if (snap?.hoatDongs) return (this.memoHoatDongs = snap.hoatDongs.map(ensureDoTinCay));
      return [];
    }

    try {
      const coord = this.getToaDo();
      const ten = this.getTenDiemDen();
      const res = await fetchHoatDongsOSM(coord, ten);
      if (res.length === 0) {
        if (!this.isFallbackAllowed()) {
          return (this.memoHoatDongs = []);
        }
        const snap = this.loadSnapshotForDestination();
        if (snap?.hoatDongs && snap.hoatDongs.length > 0) {
          this.dataSourceUsed = "snapshot";
          this.snapshotDate = snap.createdAt;
          return (this.memoHoatDongs = snap.hoatDongs.map(ensureDoTinCay));
        }
      }
      return (this.memoHoatDongs = res.map(ensureDoTinCay));
    } catch (err) {
      console.error("[LiveDataSource] getHoatDongs lỗi:", err instanceof Error ? err.message : err);
      if (!this.isFallbackAllowed()) {
        return (this.memoHoatDongs = []);
      }
      const snap = this.loadSnapshotForDestination();
      if (snap?.hoatDongs && snap.hoatDongs.length > 0) {
        this.dataSourceUsed = "snapshot";
        this.snapshotDate = snap.createdAt;
        return (this.memoHoatDongs = snap.hoatDongs.map(ensureDoTinCay));
      }
      return (this.memoHoatDongs = []);
    }
  }

  // ─── Snapshot helpers ─────────────────────────────────────────────────────

  private getSnapshotDir(): string {
    return path.join(process.cwd(), "src", "data", "snapshots");
  }

  private loadSnapshotForDestination(destName?: string): SnapshotData | null {
    const dir = this.getSnapshotDir();
    if (!fs.existsSync(dir)) return null;

    // 1. Tên snapshot cụ thể từ biến môi trường / constructor
    if (this.snapshotName) {
      const p = path.join(dir, `${this.snapshotName}.json`);
      if (fs.existsSync(p)) {
        try {
          return JSON.parse(fs.readFileSync(p, "utf-8")) as SnapshotData;
        } catch {}
      }
    }

    const target = (destName ?? this.getTenDiemDen()).toLowerCase();
    const normalizeStr = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const targetNorm = normalizeStr(target);

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

    // 2. Ưu tiên khớp theo tên file
    for (const f of files) {
      const fNorm = normalizeStr(f);
      if (targetNorm && fNorm.includes(targetNorm)) {
        try {
          return JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) as SnapshotData;
        } catch {}
      }
    }

    // 3. Khớp theo trường diemDen bên trong file
    for (const f of files) {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) as SnapshotData;
        const dName = (typeof raw.diemDen === "string" ? raw.diemDen : (raw.diemDen as any)?.ten ?? "").toLowerCase();
        if (dName) {
          const dNorm = normalizeStr(dName);
          if (targetNorm && (dNorm.includes(targetNorm) || targetNorm.includes(dNorm))) {
            return raw;
          }
        }
      } catch {}
    }

    // Fallback Đà Nẵng với file cũ nếu có
    if (target.includes("đà nẵng") || target.includes("da nang")) {
      const oldSnap = path.join(dir, "snapshot_2026-10-19.json");
      if (fs.existsSync(oldSnap)) {
        try {
          return JSON.parse(fs.readFileSync(oldSnap, "utf-8")) as SnapshotData;
        } catch {}
      }
    }

    return null;
  }

  private loadSnapshot(): SnapshotData | null {
    return this.loadSnapshotForDestination();
  }

  /** Đóng băng dữ liệu hiện tại vào snapshot */
  async saveSnapshot(name: string): Promise<string> {
    const dir = this.getSnapshotDir();
    fs.mkdirSync(dir, { recursive: true });

    const [khachSans, quanAns, cafes, hoatDongs, transports] =
      await Promise.all([
        this.getKhachSans(),
        this.getQuanAns(),
        this.getCafes(),
        this.getHoatDongs(),
        this.getTransports(),
      ]);

    // Không lưu phương tiện ước lượng vào snapshot
    const realTransports = transports.filter(
      (t) => !t.id.startsWith("est_") && !(t.nguon && t.nguon.startsWith("uoc_luong:"))
    );

    const now = new Date().toISOString();
    const diemDenTen = this.diemDen?.ten ?? "Chưa xác định";
    const checksum = computeSnapshotChecksum({
      khachSans,
      quanAns,
      cafes,
      hoatDongs,
      transports: realTransports,
    });

    const data: SnapshotData = {
      taoBoi: "script data:snapshot",
      ngayTao: now,
      diemDen: diemDenTen,
      checksum,
      createdAt: now,
      khachSans,
      quanAns,
      cafes,
      hoatDongs,
      transports: realTransports,
    };

    const filePath = path.join(dir, `${name}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      // ignore in read-only / serverless env
    }
    return filePath;
  }

  /** Kiểm tra tính đầy đủ của kho dữ liệu */
  async kiemTraDuLieu(): Promise<
    | { status: "du" }
    | { status: "khong_du_du_lieu"; loaiThieu: string[]; chiTiet: Record<string, number> }
  > {
    const [ks, qa, hd, pt] = await Promise.all([
      this.getKhachSans(),
      this.getQuanAns(),
      this.getHoatDongs(),
      this.getTransports(),
    ]);
    const loaiThieu: string[] = [];
    if (ks.length < 3) loaiThieu.push("khach_san");
    if (qa.length < 2) loaiThieu.push("quan_an");
    if (hd.length < 3) loaiThieu.push("hoat_dong");
    if (pt.length === 0) loaiThieu.push("phuong_tien");

    if (loaiThieu.length > 0) {
      return {
        status: "khong_du_du_lieu",
        loaiThieu,
        chiTiet: {
          khachSan: ks.length,
          quanAn: qa.length,
          hoatDong: hd.length,
          phuongTien: pt.length,
        },
      };
    }
    return { status: "du" };
  }
}

export interface SnapshotData {
  taoBoi?: string;
  ngayTao?: string;
  diemDen?: DiemDen | string;
  checksum?: string;
  createdAt: string;
  khachSans: KhachSan[];
  quanAns: QuanAn[];
  cafes: Cafe[];
  hoatDongs: HoatDong[];
  transports: Transport[];
}
