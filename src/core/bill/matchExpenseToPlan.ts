import type { Plan, PlanItem, ExpenseCategory } from "@/contracts";

export interface BillMatchingInput {
  tenCuaHang?: string | null;
  ngay?: string | null; // YYYY-MM-DD
  hangMucGoiY?: ExpenseCategory | null;
  tongTienVND?: number | null;
  dongChiTiet?: Array<{ ten: string; soLuong?: number | null; thanhTienVND?: number | null }>;
}

export interface MatchedPlanItem {
  item: PlanItem;
  score: number; // 0..100
  matchReasons: string[];
}

export interface MatchExpenseResult {
  bestMatch: MatchedPlanItem | null;
  candidates: MatchedPlanItem[];
  suggestedDay: number | null;
  suggestedCategory: ExpenseCategory | null;
}

export function normalizeVietnameseText(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "quan", "nha", "hang", "an", "tiem", "ca", "phe", "cafe", "coffee",
  "ks", "khach", "san", "hotel", "resort", "homestay", "villa",
  "bao", "tang", "khu", "du", "lich", "diem", "tham", "quan",
  "bua", "trua", "toi", "sang", "xe", "taxi", "ve", "tp", "thanh", "pho"
]);

export function extractSignificantKeywords(str: string): string[] {
  const norm = normalizeVietnameseText(str);
  return norm
    .split(" ")
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

export function mapPlanCategoryToExpenseCategory(planCategory: string): ExpenseCategory {
  switch (planCategory) {
    case "Ăn uống":
    case "an_uong":
    case "restaurant":
    case "cafe":
      return "an_uong";
    case "Vui chơi":
    case "hoat_dong":
    case "museum":
    case "attraction":
    case "entertainment":
    case "nature":
      return "vui_choi";
    case "Chỗ ở":
    case "cho_o":
    case "hotel":
    case "resort":
      return "cho_o";
    case "Di chuyển":
    case "di_chuyen":
    case "local_transfer":
    case "transport":
      return "di_chuyen";
    default:
      return "khac";
  }
}

/**
 * matchExpenseToPlan:
 * Thuật toán so khớp đa phương thức thông minh (Multimodal Semantic Matcher)
 * kết nối dữ liệu bóc tách từ ảnh hóa đơn với các hạng mục trong lịch trình du lịch.
 */
export function matchExpenseToPlan(
  plan: Plan | null | undefined,
  bill: BillMatchingInput,
  tickedPlaces: Record<string, boolean> = {}
): MatchExpenseResult {
  if (!plan || !plan.items || plan.items.length === 0) {
    return {
      bestMatch: null,
      candidates: [],
      suggestedDay: null,
      suggestedCategory: bill.hangMucGoiY || null,
    };
  }

  const results: MatchedPlanItem[] = [];
  const departureDate = plan.request?.travelDates?.departureDate;

  for (const item of plan.items) {
    const reasons: string[] = [];
    let score = 0;

    // 1. So khớp Tên Cửa Hàng / Địa Điểm (Trọng số lớn: 0 - 50 điểm)
    if (bill.tenCuaHang) {
      const storeNorm = normalizeVietnameseText(bill.tenCuaHang);
      const itemNorm = normalizeVietnameseText(item.noiDung);
      const destNorm = normalizeVietnameseText(item.destinationName || "");

      if (
        (storeNorm.length >= 4 && itemNorm.includes(storeNorm)) ||
        (itemNorm.length >= 4 && storeNorm.includes(itemNorm))
      ) {
        score += 50;
        reasons.push(`Tên cửa hàng khớp trực tiếp với "${item.noiDung}"`);
      } else {
        const storeKeywords = extractSignificantKeywords(bill.tenCuaHang);
        const itemKeywords = extractSignificantKeywords(`${item.noiDung} ${destNorm}`);

        if (storeKeywords.length > 0 && itemKeywords.length > 0) {
          const matchedWords = storeKeywords.filter((sw) =>
            itemKeywords.some((iw) => iw.includes(sw) || sw.includes(iw))
          );
          if (matchedWords.length > 0) {
            const ratio = matchedWords.length / storeKeywords.length;
            const points = Math.round(20 + ratio * 25);
            score += points;
            reasons.push(`Khớp từ khóa: ${matchedWords.join(", ")}`);
          }
        }
      }
    }

    // 1b. So khớp Món ăn trong dongChiTiet (nếu tên cửa hàng mờ hoặc viết tắt)
    if (score < 40 && bill.dongChiTiet && bill.dongChiTiet.length > 0) {
      const itemNorm = normalizeVietnameseText(`${item.noiDung} ${item.destinationName || ""}`);
      const itemKeywords = extractSignificantKeywords(itemNorm);

      for (const line of bill.dongChiTiet) {
        const lineNorm = normalizeVietnameseText(line.ten);
        if (lineNorm.length >= 4 && (itemNorm.includes(lineNorm) || lineNorm.includes(itemNorm))) {
          score += 25;
          reasons.push(`Món trên hóa đơn ("${line.ten}") khớp với lịch trình`);
          break;
        }

        const lineKeywords = extractSignificantKeywords(line.ten);
        if (lineKeywords.length > 0 && itemKeywords.length > 0) {
          const matchedWords = lineKeywords.filter((lw) =>
            itemKeywords.some((iw) => iw.includes(lw) || lw.includes(iw))
          );
          if (matchedWords.length >= 2 || (matchedWords.length === 1 && matchedWords[0].length >= 4)) {
            score += 20;
            reasons.push(`Món trên hóa đơn ("${line.ten}") chứa từ khóa: ${matchedWords.join(", ")}`);
            break;
          }
        }
      }
    }

    // 2. So khớp Hạng mục (0 - 20 điểm)
    if (bill.hangMucGoiY) {
      const mappedCategory = mapPlanCategoryToExpenseCategory(item.experienceType || item.hangMuc);
      if (mappedCategory === bill.hangMucGoiY) {
        score += 20;
        reasons.push("Khớp hạng mục chi tiêu");
      }
    }

    // 3. So khớp Ngày trong chuyến (0 - 25 điểm)
    if (bill.ngay && departureDate) {
      try {
        const dep = new Date(departureDate);
        const expected = new Date(dep);
        expected.setDate(dep.getDate() + (item.ngay - 1));
        const expectedStr = expected.toISOString().slice(0, 10);
        const billDateNorm = bill.ngay.replace(/\//g, "-").slice(0, 10);

        if (billDateNorm === expectedStr) {
          score += 25;
          reasons.push(`Khớp ngày ${item.ngay} trong hành trình (${billDateNorm})`);
        } else {
          const billTime = new Date(billDateNorm).getTime();
          const expTime = expected.getTime();
          if (!isNaN(billTime) && !isNaN(expTime)) {
            const diffDays = Math.abs(Math.round((billTime - expTime) / (1000 * 60 * 60 * 24)));
            if (diffDays === 1) {
              score += 10;
              reasons.push(`Gần ngày ${item.ngay} trong hành trình`);
            }
          }
        }
      } catch {
        // bỏ qua lỗi định dạng ngày
      }
    }

    // 4. So khớp Độ tương đồng giá dự toán (0 - 15 điểm)
    if (bill.tongTienVND && bill.tongTienVND > 0 && item.thanhTien > 0) {
      const ratio = Math.min(bill.tongTienVND, item.thanhTien) / Math.max(bill.tongTienVND, item.thanhTien);
      if (ratio >= 0.75) {
        score += 15;
        reasons.push(`Số tiền (${bill.tongTienVND.toLocaleString("vi-VN")} đ) rất sát dự toán (${item.thanhTien.toLocaleString("vi-VN")} đ)`);
      } else if (ratio >= 0.5) {
        score += 8;
        reasons.push("Chi phí tương đồng với dự toán");
      }
    }

    // 5. Điểm cộng cho địa điểm chưa hoàn thành (Ưu tiên thanh toán cho mục đang chờ)
    const isTicked = item.id ? Boolean(tickedPlaces[item.id]) : false;
    if (!isTicked) {
      score += 5;
    }

    // Chỉ giữ các ứng viên có điểm số đáng kể (>= 30 điểm)
    if (score >= 30) {
      results.push({
        item,
        score: Math.min(100, score),
        matchReasons: reasons,
      });
    }
  }

  // Sắp xếp giảm dần theo điểm số
  results.sort((a, b) => b.score - a.score);

  const bestMatch = results.length > 0 ? results[0] : null;

  return {
    bestMatch,
    candidates: results.slice(0, 5),
    suggestedDay: bestMatch ? bestMatch.item.ngay : null,
    suggestedCategory: bestMatch
      ? mapPlanCategoryToExpenseCategory(bestMatch.item.hangMuc)
      : bill.hangMucGoiY || null,
  };
}
