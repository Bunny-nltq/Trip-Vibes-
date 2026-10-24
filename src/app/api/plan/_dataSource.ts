import { LiveDataSource } from "@/data/live/LiveDataSource";
import type { DiemDen, TripRequest } from "@/contracts";

/**
 * Tạo nguồn dữ liệu đúng điểm đi/đến của kế hoạch đang xem.
 * Thiếu bước này thì nguồn dữ liệu không biết lấy dữ liệu của đâu và mọi ID trong kế hoạch "không tồn tại".
 */
export function taoDataSourceTuRequest(request: TripRequest): LiveDataSource {
  const den = request.diemDen && typeof request.diemDen === "object" ? (request.diemDen as DiemDen) : undefined;
  const di = request.diemDi && typeof request.diemDi === "object" ? (request.diemDi as DiemDen) : undefined;
  return new LiveDataSource(undefined, undefined, den, di, request.soNgay ?? 3, request.giaVeTuNhap);
}
