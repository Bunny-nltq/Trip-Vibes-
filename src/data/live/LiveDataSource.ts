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
} from "./overpassClient";
import { researchTransports } from "./researchTransport";
import { researchGiaDiemDen } from "./researchGiaDiemDen";

export type DataMode = "live" | "snapshot" | "mock";

const DEFAULT_COORD = { lat: 10.7769, lng: 106.7009 }; // default center if not specified

export class LiveDataSource implements DataSource {
  private readonly mode: DataMode;
  private readonly snapshotName?: string;
  private readonly mockSource: JsonDataSource;
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

  constructor(
    mode?: DataMode,
    snapshotName?: string,
    diemDen?: DiemDen,
    diemDi?: DiemDen,
    soNgay: number = 3,
    giaVeTuNhap?: { chieuDiVND: number; chieuVeVND: number }
  ) {
    this.mode =
      (process.env.DATA_MODE as DataMode | undefined) ?? mode ?? "live";
    this.snapshotName = snapshotName ?? process.env.DATA_SNAPSHOT_NAME;
    this.mockSource = new JsonDataSource();
    this.fetchedAt = new Date().toISOString();
    this.diemDen = diemDen;
    this.diemDi = diemDi ?? DEFAULT_DIEM_DI;
    this.soNgay = soNgay;
    this.giaVeTuNhap = giaVeTuNhap;
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
    return this.mockSource.getHotels();
  }

  async getTransports(): Promise<Transport[]> {
    if (this.memoTransports) return this.memoTransports;
    if (this.mode === "mock") return this.mockSource.getTransports();

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      if (snap?.transports && snap.transports.length > 0) return snap.transports;
      return this.mockSource.getTransports();
    }

    try {
      if (this.diemDen) {
        const res = await researchTransports(
          this.diemDi ?? DEFAULT_DIEM_DI,
          this.diemDen,
          this.soNgay,
          this.giaVeTuNhap
        );
        if (res.transports.length > 0) return res.transports;
      }
      return this.mockSource.getTransports();
    } catch {
      return this.mockSource.getTransports();
    }
  }

  async getActivities(): Promise<Activity[]> {
    return this.mockSource.getActivities();
  }

  // ─── Live data ────────────────────────────────────────────────────────────

  async getKhachSans(): Promise<KhachSan[]> {
    if (this.memoKhachSans) return this.memoKhachSans;
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      if (snap?.khachSans) return snap.khachSans;
      return [];
    }

    try {
      const coord = this.getToaDo();
      const ten = this.getTenDiemDen();
      const raw = await fetchKhachSansOSM(coord, ten);

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
      return (this.memoKhachSans = res);
    } catch (err) {
      console.error("[LiveDataSource] getKhachSans lỗi:", err instanceof Error ? err.message : err);
      const snap = this.loadLatestSnapshot();
      return (this.memoKhachSans = snap?.khachSans ?? []);
    }
  }

  async getQuanAns(): Promise<QuanAn[]> {
    if (this.memoQuanAns) return this.memoQuanAns;
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      if (snap?.quanAns) return (this.memoQuanAns = snap.quanAns);
      return [];
    }

    try {
      const coord = this.getToaDo();
      const ten = this.getTenDiemDen();
      const raw = await fetchQuanAnsOSM(coord, ten);

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
      return (this.memoQuanAns = res);
    } catch (err) {
      console.error("[LiveDataSource] getQuanAns lỗi:", err instanceof Error ? err.message : err);
      const snap = this.loadLatestSnapshot();
      return (this.memoQuanAns = snap?.quanAns ?? []);
    }
  }

  async getCafes(): Promise<Cafe[]> {
    if (this.memoCafes) return this.memoCafes;
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      if (snap?.cafes) return (this.memoCafes = snap.cafes);
      return [];
    }

    try {
      const coord = this.getToaDo();
      const ten = this.getTenDiemDen();
      const res = await fetchCafesOSM(coord, ten);
      return (this.memoCafes = res);
    } catch (err) {
      console.error("[LiveDataSource] getCafes lỗi:", err instanceof Error ? err.message : err);
      const snap = this.loadLatestSnapshot();
      return (this.memoCafes = snap?.cafes ?? []);
    }
  }

  async getHoatDongs(): Promise<HoatDong[]> {
    if (this.memoHoatDongs) return this.memoHoatDongs;
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      if (snap?.hoatDongs) return (this.memoHoatDongs = snap.hoatDongs);
      return [];
    }

    try {
      const coord = this.getToaDo();
      const ten = this.getTenDiemDen();
      const res = await fetchHoatDongsOSM(coord, ten);
      return (this.memoHoatDongs = res);
    } catch (err) {
      console.error("[LiveDataSource] getHoatDongs lỗi:", err instanceof Error ? err.message : err);
      const snap = this.loadLatestSnapshot();
      return (this.memoHoatDongs = snap?.hoatDongs ?? []);
    }
  }

  // ─── Snapshot helpers ─────────────────────────────────────────────────────

  private getSnapshotDir(): string {
    return path.join(process.cwd(), "src", "data", "snapshots");
  }

  private loadSnapshot(): SnapshotData | null {
    if (!this.snapshotName) return null;
    const p = path.join(this.getSnapshotDir(), `${this.snapshotName}.json`);
    if (!fs.existsSync(p)) return null;
    try {
      return JSON.parse(fs.readFileSync(p, "utf-8")) as SnapshotData;
    } catch {
      return null;
    }
  }

  private loadLatestSnapshot(): SnapshotData | null {
    const dir = this.getSnapshotDir();
    if (!fs.existsSync(dir)) return null;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({
        name: f,
        mtime: fs.statSync(path.join(dir, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) return null;
    try {
      return JSON.parse(
        fs.readFileSync(path.join(dir, files[0].name), "utf-8")
      ) as SnapshotData;
    } catch {
      return null;
    }
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

    const data: SnapshotData = {
      createdAt: new Date().toISOString(),
      khachSans,
      quanAns,
      cafes,
      hoatDongs,
      transports,
      diemDen: this.diemDen,
    };

    const filePath = path.join(dir, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return filePath;
  }
}

export interface SnapshotData {
  createdAt: string;
  khachSans: KhachSan[];
  quanAns: QuanAn[];
  cafes: Cafe[];
  hoatDongs: HoatDong[];
  transports: Transport[];
  diemDen?: DiemDen;
}
