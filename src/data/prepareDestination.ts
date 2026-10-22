/**
 * src/data/prepareDestination.ts
 *
 * Quản lý chuẩn bị dữ liệu điểm đến (Overpass OSM, phương tiện, giá điểm đến).
 * Tách riêng khỏi /api/plan để giải quyết triệt để lỗi timeout 60 giây.
 *
 * Tuân thủ AGENTS.md:
 * - Không gọi Gemini từ trình duyệt.
 * - Chỉ chạy một công việc nền cho cùng một điểm đến (dù gọi prepare nhiều lần).
 * - Production (Vercel): nếu không có snapshot thì trả khong_co_du_lieu_luu_san, KHÔNG gọi Overpass.
 */

import path from "node:path";
import fs from "node:fs";
import type { DiemDen, KhachSan, QuanAn, Cafe, HoatDong, Transport } from "@/contracts";
import { DEFAULT_DIEM_DI } from "@/contracts";
import {
  fetchKhachSansOSM,
  fetchQuanAnsOSM,
  fetchCafesOSM,
  fetchHoatDongsOSM,
  getLastOverpassStatsSummary,
} from "./live/overpassClient";
import { researchTransports } from "./live/researchTransport";
import { researchGiaDiemDen } from "./live/researchGiaDiemDen";

export type CategoryKey =
  | "khach_san"
  | "quan_an"
  | "cafe"
  | "hoat_dong"
  | "phuong_tien"
  | "gia_diem_den";

export type CategoryStatus = "cho" | "dang_chay" | "xong" | "thieu" | "loi";

export interface CategoryProgress {
  trangThai: CategoryStatus;
  soMuc?: number;
  mayChu?: string;
  ms?: number;
  lyDo?: string;
}

export type JobStatus = "cho" | "dang_chay" | "san_sang" | "thieu" | "loi";

export interface DestinationJob {
  id: string;
  destinationKey: string;
  diemDen: DiemDen;
  diemDi: DiemDen;
  soNgay: number;
  trangThai: JobStatus;
  taoLuc: number;
  capNhatLuc: number;
  tienTrinh: Record<CategoryKey, CategoryProgress>;
  lyDoLoi?: string;
  thieuChiTiet?: string[];
}

// Bộ nhớ trong lưu các công việc chuẩn bị dữ liệu
const jobsByDestinationKey = new Map<string, DestinationJob>();
const jobsById = new Map<string, DestinationJob>();

export function clearJobsForTest(): void {
  jobsByDestinationKey.clear();
  jobsById.clear();
}

export function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.VERCEL && process.env.VERCEL !== "0" && process.env.VERCEL !== "false") ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
  );
}

export function normalizeDestName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/^(thanh pho|tp|tinh|quan|huyen|city of)\s+/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Kiểm tra xem điểm đến đã có file snapshot lưu sẵn hay chưa
 */
export function hasSnapshotForDestination(diemDen: DiemDen | string): boolean {
  const dir = path.join(process.cwd(), "src", "data", "snapshots");
  if (!fs.existsSync(dir)) return false;

  const targetName = typeof diemDen === "string" ? diemDen : diemDen.ten;
  const targetNorm = normalizeDestName(targetName);
  if (!targetNorm) return false;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const f of files) {
    const fNorm = normalizeDestName(f.replace(".json", ""));
    if (fNorm && (fNorm.includes(targetNorm) || targetNorm.includes(fNorm))) {
      return true;
    }
  }

  // Khớp theo trường diemDen bên trong file
  for (const f of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      const dName = typeof raw.diemDen === "string" ? raw.diemDen : raw.diemDen?.ten ?? "";
      if (dName) {
        const dNorm = normalizeDestName(dName);
        if (dNorm && (dNorm.includes(targetNorm) || targetNorm.includes(dNorm))) {
          return true;
        }
      }
    } catch {
      // bỏ qua file lỗi
    }
  }

  return false;
}

import crypto from "node:crypto";

function hasSpecificCacheForDestination(diemDen: DiemDen, diemDi: DiemDen = DEFAULT_DIEM_DI): boolean {
  const cacheDir = path.join(process.cwd(), ".cache", "data");
  if (!fs.existsSync(cacheDir)) return false;

  const lat = diemDen.toaDo.lat;
  const lng = diemDen.toaDo.lng;

  // Key cho khach_san (bán kính chuẩn nuaCanhVi = 0.0450)
  const ksHash = crypto
    .createHash("sha256")
    .update(`${lat.toFixed(4)},${lng.toFixed(4)}_0.0450_khach_san`)
    .digest("hex");
  const ksPath = path.join(cacheDir, `osm_${ksHash}.json`);
  if (!fs.existsSync(ksPath)) return false;

  // Key cho quan_an
  const qaHash = crypto
    .createHash("sha256")
    .update(`${lat.toFixed(4)},${lng.toFixed(4)}_0.0450_quan_an`)
    .digest("hex");
  const qaPath = path.join(cacheDir, `osm_${qaHash}.json`);
  if (!fs.existsSync(qaPath)) return false;

  // Key cho hoat_dong (bán kính chuẩn 0.1800)
  const hdHash = crypto
    .createHash("sha256")
    .update(`${lat.toFixed(4)},${lng.toFixed(4)}_0.1800_hoat_dong`)
    .digest("hex");
  const hdPath = path.join(cacheDir, `osm_${hdHash}.json`);
  if (!fs.existsSync(hdPath)) return false;

  return true;
}

/**
 * Phân giải DiemDen từ file snapshot nếu có
 */
export function getSnapshotDiemDen(diemDen: DiemDen | string): DiemDen | null {
  if (typeof diemDen !== "string") {
    return diemDen;
  }
  const dir = path.join(process.cwd(), "src", "data", "snapshots");
  if (!fs.existsSync(dir)) return null;

  const targetNorm = normalizeDestName(diemDen);
  if (!targetNorm) return null;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const f of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      const dName = typeof raw.diemDen === "string" ? raw.diemDen : raw.diemDen?.ten ?? "";
      const fNorm = normalizeDestName(f.replace(".json", ""));
      const dNorm = normalizeDestName(dName);

      if (
        (fNorm && (fNorm.includes(targetNorm) || targetNorm.includes(fNorm))) ||
        (dNorm && (dNorm.includes(targetNorm) || targetNorm.includes(dNorm)))
      ) {
        const places = [
          ...(raw.khachSans || []),
          ...(raw.quanAns || []),
          ...(raw.cafes || []),
          ...(raw.hoatDongs || []),
        ];

        const lat =
          places.length > 0
            ? Number(
                (
                  places.reduce((s: number, p: any) => s + p.toaDo.lat, 0) /
                  places.length
                ).toFixed(4)
              )
            : 0;
        const lng =
          places.length > 0
            ? Number(
                (
                  places.reduce((s: number, p: any) => s + p.toaDo.lng, 0) /
                  places.length
                ).toFixed(4)
              )
            : 0;

        let quocGia = "Việt Nam";
        let maQuocGia = "VN";
        let tienTe = "VND";
        if (lat > 30) {
          quocGia = "Hàn Quốc";
          maQuocGia = "KR";
          tienTe = "KRW";
        } else if (lng < 101.5 && lat < 16) {
          quocGia = "Thái Lan";
          maQuocGia = "TH";
          tienTe = "THB";
        }

        const ten = dName || diemDen;
        const ngayLay = (raw.ngayTao || raw.createdAt || "2026-10-20").slice(0, 10);

        return {
          ten,
          quocGia,
          maQuocGia,
          toaDo: { lat, lng },
          tienTe,
          nguon: "nominatim" as const,
          ngayLay,
        };
      }
    } catch {
      // Bỏ qua file lỗi
    }
  }

  return null;
}

/**
 * Kiểm tra xem dữ liệu điểm đến đã sẵn sàng hay chưa (snapshot hoặc cache)
 */
export function isDataReadyForDestination(
  diemDen: DiemDen | string,
  diemDi: DiemDen = DEFAULT_DIEM_DI,
  soNgay: number = 3
): boolean {
  // 1. Nếu có snapshot thì luôn sẵn sàng
  if (hasSnapshotForDestination(diemDen)) {
    return true;
  }

  // 2. Nếu ở production mà không có snapshot thì không thể sẵn sàng
  if (isProductionEnvironment()) {
    return false;
  }

  const resolved = typeof diemDen === "string" ? getSnapshotDiemDen(diemDen) : diemDen;
  if (!resolved) {
    return false;
  }

  // 3. Nếu đã có công việc với trạng thái "san_sang" trong memory
  const key = `${resolved.maQuocGia || "VN"}_${normalizeDestName(resolved.ten)}`;
  const existingJob = jobsByDestinationKey.get(key);
  if (existingJob && existingJob.trangThai === "san_sang") {
    return true;
  }

  // 4. Kiểm tra cache chính xác trên đĩa
  return hasSpecificCacheForDestination(resolved, diemDi);
}

/**
 * Bắt đầu chạy tiến trình lấy dữ liệu trong nền cho một công việc
 */
async function runJobInBackground(job: DestinationJob): Promise<void> {
  job.trangThai = "dang_chay";
  job.capNhatLuc = Date.now();

  const diemDen = job.diemDen;
  const diemDi = job.diemDi;
  const coord = diemDen.toaDo;

  const thieuList: string[] = [];

  // 1. Khách sạn
  job.tienTrinh.khach_san.trangThai = "dang_chay";
  const startKS = Date.now();
  try {
    const ks = await fetchKhachSansOSM(coord);
    const msKS = Date.now() - startKS;
    job.tienTrinh.khach_san.ms = msKS;
    job.tienTrinh.khach_san.soMuc = ks.length;
    job.tienTrinh.khach_san.mayChu = getLastOverpassStatsSummary() || "overpass";
    if (ks.length >= 3) {
      job.tienTrinh.khach_san.trangThai = "xong";
    } else {
      job.tienTrinh.khach_san.trangThai = "thieu";
      job.tienTrinh.khach_san.lyDo = `Chỉ tìm thấy ${ks.length}/3 khách sạn`;
      thieuList.push(`khách sạn (${ks.length}/3)`);
    }
  } catch (err) {
    job.tienTrinh.khach_san.trangThai = "loi";
    job.tienTrinh.khach_san.lyDo = err instanceof Error ? err.message : String(err);
    thieuList.push("khách sạn (lỗi kết nối)");
  }
  job.capNhatLuc = Date.now();

  // 2. Quán ăn
  job.tienTrinh.quan_an.trangThai = "dang_chay";
  const startQA = Date.now();
  try {
    const qa = await fetchQuanAnsOSM(coord);
    const msQA = Date.now() - startQA;
    job.tienTrinh.quan_an.ms = msQA;
    job.tienTrinh.quan_an.soMuc = qa.length;
    job.tienTrinh.quan_an.mayChu = getLastOverpassStatsSummary() || "overpass";
    if (qa.length >= 2) {
      job.tienTrinh.quan_an.trangThai = "xong";
    } else {
      job.tienTrinh.quan_an.trangThai = "thieu";
      job.tienTrinh.quan_an.lyDo = `Chỉ tìm thấy ${qa.length}/2 quán ăn`;
      thieuList.push(`quán ăn (${qa.length}/2)`);
    }
  } catch (err) {
    job.tienTrinh.quan_an.trangThai = "loi";
    job.tienTrinh.quan_an.lyDo = err instanceof Error ? err.message : String(err);
    thieuList.push("quán ăn (lỗi kết nối)");
  }
  job.capNhatLuc = Date.now();

  // 3. Cafe
  job.tienTrinh.cafe.trangThai = "dang_chay";
  const startCafe = Date.now();
  try {
    const cafes = await fetchCafesOSM(coord);
    const msCafe = Date.now() - startCafe;
    job.tienTrinh.cafe.ms = msCafe;
    job.tienTrinh.cafe.soMuc = cafes.length;
    job.tienTrinh.cafe.trangThai = "xong";
  } catch (err) {
    job.tienTrinh.cafe.trangThai = "loi";
    job.tienTrinh.cafe.lyDo = err instanceof Error ? err.message : String(err);
  }
  job.capNhatLuc = Date.now();

  // 4. Hoạt động tham quan
  job.tienTrinh.hoat_dong.trangThai = "dang_chay";
  const startHD = Date.now();
  try {
    const hd = await fetchHoatDongsOSM(coord);
    const msHD = Date.now() - startHD;
    job.tienTrinh.hoat_dong.ms = msHD;
    job.tienTrinh.hoat_dong.soMuc = hd.length;
    job.tienTrinh.hoat_dong.mayChu = getLastOverpassStatsSummary() || "overpass";
    if (hd.length >= 3) {
      job.tienTrinh.hoat_dong.trangThai = "xong";
    } else {
      job.tienTrinh.hoat_dong.trangThai = "thieu";
      job.tienTrinh.hoat_dong.lyDo = `Chỉ tìm thấy ${hd.length}/3 hoạt động`;
      thieuList.push(`hoạt động (${hd.length}/3)`);
    }
  } catch (err) {
    job.tienTrinh.hoat_dong.trangThai = "loi";
    job.tienTrinh.hoat_dong.lyDo = err instanceof Error ? err.message : String(err);
    thieuList.push("hoạt động (lỗi kết nối)");
  }
  job.capNhatLuc = Date.now();

  // 5. Phương tiện di chuyển
  job.tienTrinh.phuong_tien.trangThai = "dang_chay";
  const startPT = Date.now();
  try {
    const ptResult = await researchTransports(diemDi, diemDen, job.soNgay);
    const msPT = Date.now() - startPT;
    job.tienTrinh.phuong_tien.ms = msPT;
    job.tienTrinh.phuong_tien.soMuc = ptResult.transports.length;
    if (ptResult.transports.length > 0) {
      job.tienTrinh.phuong_tien.trangThai = "xong";
    } else {
      job.tienTrinh.phuong_tien.trangThai = "thieu";
      job.tienTrinh.phuong_tien.lyDo = "Không tìm thấy phương tiện di chuyển phù hợp";
      thieuList.push("phương tiện di chuyển");
    }
  } catch (err) {
    job.tienTrinh.phuong_tien.trangThai = "loi";
    job.tienTrinh.phuong_tien.lyDo = err instanceof Error ? err.message : String(err);
  }
  job.capNhatLuc = Date.now();

  // 6. Giá điểm đến (ước tính trung bình)
  job.tienTrinh.gia_diem_den.trangThai = "dang_chay";
  const startGia = Date.now();
  try {
    await researchGiaDiemDen(diemDen);
    const msGia = Date.now() - startGia;
    job.tienTrinh.gia_diem_den.ms = msGia;
    job.tienTrinh.gia_diem_den.soMuc = 1;
    job.tienTrinh.gia_diem_den.trangThai = "xong";
  } catch (err) {
    job.tienTrinh.gia_diem_den.trangThai = "loi";
    job.tienTrinh.gia_diem_den.lyDo = err instanceof Error ? err.message : String(err);
  }

  job.capNhatLuc = Date.now();

  // Đánh giá trạng thái tổng thể của Job
  if (thieuList.length > 0) {
    job.trangThai = "thieu";
    job.lyDoLoi = `Thiếu dữ liệu: ${thieuList.join(", ")}`;
    job.thieuChiTiet = thieuList;
  } else {
    job.trangThai = "san_sang";
  }
}

/**
 * Lấy hoặc tạo công việc chuẩn bị dữ liệu (đảm bảo chỉ 1 công việc cho cùng điểm đến)
 */
export function prepareDestinationJob(params: {
  diemDen: DiemDen;
  diemDi?: DiemDen;
  soNgay?: number;
}): {
  trangThai: "san_sang" | "dang_chay" | "loi";
  jobId?: string;
  maLoi?: string;
  thongBao?: string;
} {
  const { diemDen, diemDi = DEFAULT_DIEM_DI, soNgay = 3 } = params;

  // 1. Kiểm tra môi trường Production
  if (isProductionEnvironment() && !hasSnapshotForDestination(diemDen)) {
    return {
      trangThai: "loi",
      maLoi: "khong_co_du_lieu_luu_san",
      thongBao:
        "Điểm đến này chưa có dữ liệu đã lưu. Hãy chạy chương trình trên máy để chuẩn bị dữ liệu.",
    };
  }

  // 2. Nếu đã có snapshot hoặc cache đủ -> trả "san_sang" ngay
  if (isDataReadyForDestination(diemDen, diemDi, soNgay)) {
    return {
      trangThai: "san_sang",
    };
  }

  // 3. Khóa định danh điểm đến
  const destKey = `${diemDen.maQuocGia || "VN"}_${normalizeDestName(diemDen.ten)}`;

  // Kiểm tra công việc đã tồn tại trong bộ nhớ hay chưa
  const existingJob = jobsByDestinationKey.get(destKey);
  if (existingJob) {
    if (existingJob.trangThai === "san_sang") {
      return { trangThai: "san_sang", jobId: existingJob.id };
    }
    // Nếu đang chạy hoặc đã có job -> trả về jobId hiện tại, không tạo thêm job mới
    return { trangThai: "dang_chay", jobId: existingJob.id };
  }

  // 4. Tạo công việc mới và chạy nền
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const newJob: DestinationJob = {
    id: jobId,
    destinationKey: destKey,
    diemDen,
    diemDi,
    soNgay,
    trangThai: "dang_chay",
    taoLuc: Date.now(),
    capNhatLuc: Date.now(),
    tienTrinh: {
      khach_san: { trangThai: "cho" },
      quan_an: { trangThai: "cho" },
      cafe: { trangThai: "cho" },
      hoat_dong: { trangThai: "cho" },
      phuong_tien: { trangThai: "cho" },
      gia_diem_den: { trangThai: "cho" },
    },
  };

  jobsByDestinationKey.set(destKey, newJob);
  jobsById.set(jobId, newJob);

  // Kích hoạt tiến trình không chặn (chạy nền)
  runJobInBackground(newJob).catch((err) => {
    newJob.trangThai = "loi";
    newJob.lyDoLoi = err instanceof Error ? err.message : String(err);
    newJob.capNhatLuc = Date.now();
  });

  return {
    trangThai: "dang_chay",
    jobId,
  };
}

/**
 * Lấy trạng thái công việc chuẩn bị theo jobId
 */
export function getDestinationJobStatus(jobId: string): DestinationJob | undefined {
  return jobsById.get(jobId);
}
