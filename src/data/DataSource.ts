import type { Hotel, Transport, Activity, KhachSan, QuanAn, Cafe } from "@/contracts";

/**
 * Giao diện nguồn dữ liệu – có thể triển khai bằng JSON tĩnh, DB, hoặc API ngoài.
 */
export interface DataSource {
  getHotels(): Promise<Hotel[]>;
  getTransports(): Promise<Transport[]>;
  getActivities(): Promise<Activity[]>;
  /** Bước 5B: dữ liệu live từ OSM */
  getKhachSans(): Promise<KhachSan[]>;
  getQuanAns(): Promise<QuanAn[]>;
  getCafes(): Promise<Cafe[]>;
  /** Metadata */
  getMode(): string;
  getNgayLay(): string;
}
