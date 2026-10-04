import path from "path";
import fs from "fs/promises";
import { HotelSchema, TransportSchema, ActivitySchema } from "@/contracts";
import type { Hotel, Transport, Activity } from "@/contracts";
import type { DataSource } from "./DataSource";

/**
 * Đọc dữ liệu từ các file JSON trong src/data/mock.
 * Chỉ dùng phía server (Node.js).
 */
export class JsonDataSource implements DataSource {
  private readonly mockDir: string;

  constructor(mockDir?: string) {
    this.mockDir =
      mockDir ?? path.join(process.cwd(), "src", "data", "mock");
  }

  private async readJson<T>(filename: string): Promise<T> {
    const filePath = path.join(this.mockDir, filename);
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  }

  async getHotels(): Promise<Hotel[]> {
    const raw = await this.readJson<unknown[]>("hotels.json");
    return raw.map((item) => HotelSchema.parse(item));
  }

  async getTransports(): Promise<Transport[]> {
    const raw = await this.readJson<unknown[]>("transports.json");
    return raw.map((item) => TransportSchema.parse(item));
  }

  async getActivities(): Promise<Activity[]> {
    const raw = await this.readJson<unknown[]>("activities.json");
    return raw.map((item) => ActivitySchema.parse(item));
  }
}
