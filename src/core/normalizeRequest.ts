import {
  type RawTripRequest,
  type TripRequest,
  type MissingField,
  schemaVersion,
} from "@/contracts";

/**
 * Bỏ dấu tiếng Việt và chuyển thành chữ thường không dấu để so sánh
 */
export function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Loại trùng trong mảng nguyên thủy (string, enum) giữ nguyên thứ tự xuất hiện
 */
function deduplicate<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Câu hỏi làm rõ mặc định cho từng trường còn thiếu
 */
const DEFAULT_QUESTIONS: Record<MissingField, string> = {
  soNguoi: "Chuyến đi này bạn dự định đi bao nhiêu người?",
  soNgay: "Bạn muốn đi du lịch trong mấy ngày?",
  ngansach: "Ngân sách dự kiến cho chuyến đi là khoảng bao nhiêu?",
};

/**
 * normalizeRequest: Hàm thuần chuẩn hoá RawTripRequest thành TripRequest.
 * - Không gọi AI, không phụ thuộc UI, không dùng Date.now() hay ngẫu nhiên.
 * - Xử lý giá trị mặc định, kiểm tra hợp lệ, thêm cảnh báo và tổng hợp trường còn thiếu.
 */
export function normalizeRequest(raw: RawTripRequest): TripRequest {
  const canhBao: string[] = [];
  const thieuSet = new Set<MissingField>();

  // 1. Điểm đi (mặc định TP.HCM nếu null hoặc rỗng)
  const rawDiemDi = raw.diemDi?.trim();
  const diemDi = rawDiemDi && rawDiemDi.length > 0 ? rawDiemDi : "TP.HCM";

  // 2. Điểm đến
  let diemDen: string;
  const rawDiemDen = raw.diemDen?.trim();
  if (!rawDiemDen || rawDiemDen.length === 0) {
    diemDen = "Đà Nẵng";
    canhBao.push("diem_den_mac_dinh");
  } else {
    diemDen = rawDiemDen;
    const normalizedDiemDen = removeVietnameseDiacritics(rawDiemDen);
    if (normalizedDiemDen !== "da nang") {
      canhBao.push("ngoai_pham_vi_diem_den");
    }
  }

  // 3. Số người (hợp lệ: 1 - 20)
  let soNguoi: number | null = null;
  if (raw.soNguoi !== null && raw.soNguoi !== undefined) {
    if (Number.isInteger(raw.soNguoi) && raw.soNguoi >= 1 && raw.soNguoi <= 20) {
      soNguoi = raw.soNguoi;
    } else {
      soNguoi = null;
      thieuSet.add("soNguoi");
      canhBao.push("so_nguoi_khong_hop_le");
    }
  } else {
    thieuSet.add("soNguoi");
  }

  // 4. Số ngày (hợp lệ: 1 - 7, phạm vi chuẩn hiện tại là 3 ngày)
  let soNgay: number | null = null;
  if (raw.soNgay !== null && raw.soNgay !== undefined) {
    if (Number.isInteger(raw.soNgay) && raw.soNgay >= 1 && raw.soNgay <= 7) {
      soNgay = raw.soNgay;
      if (soNgay !== 3) {
        canhBao.push("ngoai_pham_vi_so_ngay");
      }
    } else {
      soNgay = null;
      thieuSet.add("soNgay");
      canhBao.push("so_ngay_khong_hop_le");
    }
  } else {
    thieuSet.add("soNgay");
  }

  // 5. Ngân sách
  let ngansachTongVND: number | null = null;
  const rawSoTien = raw.ngansach?.soTien;
  const theo = raw.ngansach?.theo;

  if (rawSoTien === null || rawSoTien === undefined) {
    thieuSet.add("ngansach");
  } else if (!Number.isInteger(rawSoTien) || rawSoTien <= 0) {
    thieuSet.add("ngansach");
    canhBao.push("ngan_sach_khong_hop_le");
  } else {
    // rawSoTien là số nguyên dương hợp lệ
    if (theo === "moi_nguoi") {
      if (soNguoi !== null) {
        ngansachTongVND = rawSoTien * soNguoi;
      } else {
        ngansachTongVND = null;
        thieuSet.add("soNguoi");
      }
    } else {
      // theo === "tong" hoặc null
      ngansachTongVND = rawSoTien;
    }
  }

  // Gộp các trường thiếu từ raw.thieu (nếu trường đó thực sự còn null)
  for (const t of raw.thieu || []) {
    if (t === "soNguoi" && soNguoi === null) thieuSet.add("soNguoi");
    if (t === "soNgay" && soNgay === null) thieuSet.add("soNgay");
    if (t === "ngansach" && ngansachTongVND === null) thieuSet.add("ngansach");
  }

  const thieu: MissingField[] = [];
  if (thieuSet.has("soNguoi")) thieu.push("soNguoi");
  if (thieuSet.has("soNgay")) thieu.push("soNgay");
  if (thieuSet.has("ngansach")) thieu.push("ngansach");

  // 6. Câu hỏi làm rõ
  const questions: string[] = [];
  if (thieu.length > 0) {
    // Lấy câu hỏi có sẵn từ raw (nếu hợp lý)
    if (Array.isArray(raw.cauHoiLamRo)) {
      questions.push(...raw.cauHoiLamRo.filter((q) => typeof q === "string" && q.trim().length > 0));
    }
    // Đảm bảo mỗi trường thiếu có ít nhất một câu hỏi làm rõ
    for (const f of thieu) {
      const defaultQ = DEFAULT_QUESTIONS[f];
      const hasSpecificQ = questions.some((q) =>
        f === "soNguoi"
          ? /người|ai|bao nhiêu người/i.test(q)
          : f === "soNgay"
          ? /ngày|hôm|kéo dài/i.test(q)
          : /ngân sách|tiền|chi phí/i.test(q)
      );
      if (!hasSpecificQ && defaultQ) {
        questions.push(defaultQ);
      }
    }
    if (questions.length === 0) {
      for (const f of thieu) {
        questions.push(DEFAULT_QUESTIONS[f]);
      }
    }
  }

  return {
    schemaVersion,
    diemDi,
    diemDen,
    soNgay,
    soNguoi,
    ngansachTongVND,
    sothich: deduplicate(raw.sothich || []),
    tranh: deduplicate(raw.tranh || []),
    ghiChu: deduplicate(raw.ghiChu || []),
    thieu,
    cauHoiLamRo: deduplicate(questions),
    canhBao: deduplicate(canhBao),
  };
}
