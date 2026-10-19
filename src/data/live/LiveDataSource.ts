/**
 * src/data/live/LiveDataSource.ts
 *
 * DataSource triển khai dữ liệu live:
 * - OSM: khách sạn, quán ăn, cafe, điểm tham quan
 * - Tavily + Gemini: giá phương tiện, giá phòng khách sạn
 * - Dự phòng: snapshot mới nhất → mock JSON
 *
 * DATA_MODE = "live" | "snapshot" | "mock"
 */

import path from "node:path";
import fs from "node:fs";
import type { DataSource } from "../DataSource";
import type { Hotel, Transport, Activity, KhachSan, QuanAn, Cafe } from "@/contracts";
import { JsonDataSource } from "../JsonDataSource";
import {
  fetchKhachSansOSM,
  fetchQuanAnsOSM,
  fetchCafesOSM,
  fetchHoatDongsOSM,
} from "./overpassClient";
import { researchTransports } from "./researchTransport";
import { enrichHotelPrices } from "./researchHotelPrice";

export type DataMode = "live" | "snapshot" | "mock";

export class LiveDataSource implements DataSource {
  private readonly mode: DataMode;
  private readonly snapshotName?: string;
  private readonly mockSource: JsonDataSource;
  private readonly fetchedAt: string;

  constructor(mode?: DataMode, snapshotName?: string) {
    this.mode =
      (process.env.DATA_MODE as DataMode | undefined) ?? mode ?? "live";
    this.snapshotName = snapshotName ?? process.env.DATA_SNAPSHOT_NAME;
    this.mockSource = new JsonDataSource();
    this.fetchedAt = new Date().toISOString();
  }

  getMode(): string {
    return this.mode;
  }

  getNgayLay(): string {
    return this.fetchedAt;
  }

  // ─── Legacy interface (backward compat) ───────────────────────────────────

  async getHotels(): Promise<Hotel[]> {
    return this.mockSource.getHotels();
  }

  async getTransports(): Promise<Transport[]> {
    if (this.mode === "mock") return this.mockSource.getTransports();
    try {
      return await researchTransports();
    } catch {
      return this.mockSource.getTransports();
    }
  }

  async getActivities(): Promise<Activity[]> {
    return this.mockSource.getActivities();
  }

  // ─── Live data ────────────────────────────────────────────────────────────

  async getKhachSans(): Promise<KhachSan[]> {
    if (this.mode === "mock") return [];

    // snapshot mode
    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      if (snap?.khachSans) return snap.khachSans;
      return [];
    }

    try {
      const raw = await fetchKhachSansOSM();
      const enriched = await enrichHotelPrices(raw);
      return enriched;
    } catch (err) {
      console.error("[LiveDataSource] getKhachSans lỗi:", err instanceof Error ? err.message : err);
      // Dự phòng snapshot
      const snap = this.loadLatestSnapshot();
      return snap?.khachSans ?? [];
    }
  }

  async getQuanAns(): Promise<QuanAn[]> {
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      return snap?.quanAns ?? [];
    }

    try {
      return await fetchQuanAnsOSM();
    } catch (err) {
      console.error("[LiveDataSource] getQuanAns lỗi:", err instanceof Error ? err.message : err);
      const snap = this.loadLatestSnapshot();
      return snap?.quanAns ?? [];
    }
  }

  async getCafes(): Promise<Cafe[]> {
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      return snap?.cafes ?? [];
    }

    try {
      return await fetchCafesOSM();
    } catch (err) {
      console.error("[LiveDataSource] getCafes lỗi:", err instanceof Error ? err.message : err);
      const snap = this.loadLatestSnapshot();
      return snap?.cafes ?? [];
    }
  }

  async getHoatDongs(): Promise<import("@/contracts").HoatDong[]> {
    if (this.mode === "mock") return [];

    if (this.mode === "snapshot") {
      const snap = this.loadSnapshot();
      return snap?.hoatDongs ?? [];
    }

    try {
      return await fetchHoatDongsOSM();
    } catch (err) {
      console.error("[LiveDataSource] getHoatDongs lỗi:", err instanceof Error ? err.message : err);
      const snap = this.loadLatestSnapshot();
      return snap?.hoatDongs ?? [];
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
  hoatDongs: import("@/contracts").HoatDong[];
  transports: Transport[];
}
