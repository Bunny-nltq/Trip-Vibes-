import type { Hotel, Transport, Activity } from "@/contracts";

/**
 * Giao diện nguồn dữ liệu – có thể triển khai bằng JSON tĩnh, DB, hoặc API ngoài.
 */
export interface DataSource {
  getHotels(): Promise<Hotel[]>;
  getTransports(): Promise<Transport[]>;
  getActivities(): Promise<Activity[]>;
}
