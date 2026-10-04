import { Type } from "@google/genai";
import type { DataSource } from "@/data/DataSource";
import type { Selection, Preference } from "@/contracts";
import { calculateTransportFlags } from "@/core/flags";
import { removeVietnameseDiacritics } from "@/core/normalizeRequest";

export interface ToolContext {
  dataSource: DataSource;
  soNguoi: number;
  soNgay: number;
  soDem: number;
  soPhong: number;
  seenIds: Set<string>;
}

export const timPhuongTienDeclaration = {
  name: "timPhuongTien",
  description:
    "Tìm kiếm các chuyến phương tiện di chuyển theo chiều (di hoặc ve), có thể lọc theo giá và loại phương tiện.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      huong: {
        type: Type.STRING,
        enum: ["di", "ve"],
        description:
          "Chiều di chuyển: 'di' (TP.HCM -> Đà Nẵng) hoặc 've' (Đà Nẵng -> TP.HCM)",
      },
      toiDaGiaNguoi: {
        type: Type.INTEGER,
        description: "Giá vé tối đa cho một người (VND)",
      },
      loai: {
        type: Type.ARRAY,
        items: { type: Type.STRING, enum: ["PLANE", "TRAIN", "BUS"] },
        description: "Loại phương tiện mong muốn",
      },
    },
    required: ["huong"],
  },
};

export const timKhachSanDeclaration = {
  name: "timKhachSan",
  description:
    "Tìm kiếm khách sạn tại Đà Nẵng theo giá đêm, số sao, khu vực và tiện ích (hồ bơi, ăn sáng buffet).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      toiDaGiaDem: {
        type: Type.INTEGER,
        description: "Giá phòng tối đa cho một đêm (VND)",
      },
      saoToiThieu: {
        type: Type.INTEGER,
        description: "Số sao tối thiểu (1 - 5)",
      },
      khuVuc: {
        type: Type.STRING,
        description: "Khu vực mong muốn (ví dụ: Mỹ Khê, Hải Châu, Sơn Trà...)",
      },
      canHoBoi: {
        type: Type.BOOLEAN,
        description: "Yêu cầu có hồ bơi",
      },
      canBuffet: {
        type: Type.BOOLEAN,
        description: "Yêu cầu bao gồm buffet sáng",
      },
    },
  },
};

export const goiYHoatDongDeclaration = {
  name: "goiYHoatDong",
  description:
    "Gợi ý các hoạt động vui chơi, tham quan, ăn uống tại Đà Nẵng theo sở thích và điều cần tránh.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      sothich: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          enum: [
            "bien",
            "am_thuc",
            "hai_san",
            "van_hoa_lich_su",
            "thien_nhien",
            "giai_tri_vui_choi",
            "thu_gian_spa",
            "check_in_chup_anh",
            "mua_sam",
          ],
        },
        description: "Danh sách sở thích của khách",
      },
      tranhDongNguoi: {
        type: Type.BOOLEAN,
        description: "Nếu true, chỉ lấy các hoạt động không đông người",
      },
      tranhDiBoNhieu: {
        type: Type.BOOLEAN,
        description: "Nếu true, chỉ lấy các hoạt động không phải đi bộ nhiều",
      },
      toiDaGiaVe: {
        type: Type.INTEGER,
        description: "Giá vé tối đa mỗi người (VND)",
      },
    },
  },
};

export const chotKeHoachDeclaration = {
  name: "chotKeHoach",
  description:
    "Chốt lựa chọn phương tiện, khách sạn và các hoạt động theo ngày để tạo kế hoạch. MỌI ID PHẢI LẤY TỪ KẾT QUẢ CỦA CÁC CÔNG CỤ TRÊN.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      transportDiId: {
        type: Type.STRING,
        description: "ID phương tiện chiều đi đã tìm thấy",
      },
      transportVeId: {
        type: Type.STRING,
        description: "ID phương tiện chiều về đã tìm thấy",
      },
      hotelId: {
        type: Type.STRING,
        description: "ID khách sạn đã tìm thấy",
      },
      hoatDongTheoNgay: {
        type: Type.ARRAY,
        items: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách ID hoạt động cho ngày đó (0 đến 2 hoạt động)",
        },
        description:
          "Mảng các hoạt động theo từng ngày (độ dài mảng phải đúng bằng số ngày)",
      },
    },
    required: ["transportDiId", "transportVeId", "hotelId", "hoatDongTheoNgay"],
  },
};

export const AGENT_TOOLS_DECLARATIONS = [
  timPhuongTienDeclaration,
  timKhachSanDeclaration,
  goiYHoatDongDeclaration,
  chotKeHoachDeclaration,
];

// ─── THỰC THI CÔNG CỤ (CHỈ ĐỌC DỮ LIỆU VÀ TÍNH SỐ LIỆU TỪ CORE) ──────────────

export async function executeTimPhuongTien(
  args: { huong: "di" | "ve"; toiDaGiaNguoi?: number; loai?: string[] },
  ctx: ToolContext
) {
  const allTransports = await ctx.dataSource.getTransports();
  const filtered = allTransports.filter((t) => {
    if (t.huong !== args.huong) return false;
    if (args.toiDaGiaNguoi !== undefined && t.pricePerPerson > args.toiDaGiaNguoi)
      return false;
    if (args.loai && args.loai.length > 0 && !args.loai.includes(t.type))
      return false;
    return true;
  });

  return filtered.map((t) => {
    const flags = calculateTransportFlags(t.departureTime, t.durationMinutes);
    ctx.seenIds.add(t.id);
    return {
      id: t.id,
      loai: t.type,
      nhaCungCap: t.provider,
      gioDi: t.departureTime,
      gioDen: flags.gioDen, // tính từ core
      thoiLuongPhut: t.durationMinutes,
      giaNguoi: t.pricePerPerson,
      tongTienChoNhom: t.pricePerPerson * ctx.soNguoi,
      hangCho: t.seatClass,
      diemDon: t.boardingPoint,
      diemTra: t.dropOffPoint,
      ghiChu: t.notes || "",
      co: {
        khoiHanhSom: flags.khoiHanhSom,
        diDem: flags.diDem,
        denSom: flags.denSom,
        diChuyenLau: flags.diChuyenLau,
      },
    };
  });
}

export async function executeTimKhachSan(
  args: {
    toiDaGiaDem?: number;
    saoToiThieu?: number;
    khuVuc?: string;
    canHoBoi?: boolean;
    canBuffet?: boolean;
  },
  ctx: ToolContext
) {
  const allHotels = await ctx.dataSource.getHotels();
  const filtered = allHotels.filter((h) => {
    if (args.toiDaGiaDem !== undefined && h.pricePerNight > args.toiDaGiaDem)
      return false;
    if (args.saoToiThieu !== undefined && h.stars < args.saoToiThieu)
      return false;
    if (args.khuVuc) {
      const areaNorm = removeVietnameseDiacritics(h.area);
      const queryNorm = removeVietnameseDiacritics(args.khuVuc);
      if (!areaNorm.includes(queryNorm)) return false;
    }
    if (args.canHoBoi === true && !h.hasPool) return false;
    if (args.canBuffet === true && !h.includesBreakfast) return false;
    return true;
  });

  return filtered.map((h) => {
    ctx.seenIds.add(h.id);
    return {
      id: h.id,
      ten: h.name,
      sao: h.stars,
      giaDem: h.pricePerNight,
      khuVuc: h.area,
      buffetSang: h.includesBreakfast,
      hoBoi: h.hasPool,
      ngayKhaiTruong: h.openingDate || null,
      diem: h.rating,
      soLuotDanhGia: h.reviewCount,
      duocKhen: h.praised,
      canLuuY: h.watchOut,
      meo: h.tip || "",
      tongTienLuuTru: h.pricePerNight * ctx.soDem * ctx.soPhong,
    };
  });
}

export async function executeGoiYHoatDong(
  args: {
    sothich?: Preference[];
    tranhDongNguoi?: boolean;
    tranhDiBoNhieu?: boolean;
    toiDaGiaVe?: number;
  },
  ctx: ToolContext
) {
  const allActivities = await ctx.dataSource.getActivities();
  let filtered = allActivities.filter((a) => {
    if (args.tranhDongNguoi === true && a.dongNguoi) return false;
    if (args.tranhDiBoNhieu === true && a.diBoNhieu) return false;
    if (args.toiDaGiaVe !== undefined && a.giaVeNguoi > args.toiDaGiaVe)
      return false;
    return true;
  });

  // Ưu tiên đưa các hoạt động khớp sở thích lên trước
  if (args.sothich && args.sothich.length > 0) {
    const sothichSet = new Set(args.sothich);
    filtered = [...filtered].sort((a, b) => {
      const aMatch = a.nhan.some((n) => sothichSet.has(n));
      const bMatch = b.nhan.some((n) => sothichSet.has(n));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  return filtered.map((a) => {
    ctx.seenIds.add(a.id);
    return {
      id: a.id,
      ten: a.ten,
      khuVuc: a.khuVuc,
      giaVeNguoi: a.giaVeNguoi,
      thoiLuongPhut: a.thoiLuongPhut,
      nhan: a.nhan,
      dongNguoi: a.dongNguoi,
      diBoNhieu: a.diBoNhieu,
      tongTienChoNhom: a.giaVeNguoi * ctx.soNguoi,
    };
  });
}

export function executeChotKeHoach(
  args: Selection,
  ctx: ToolContext
): { ok: true; selection: Selection } | { ok: false; loi: string; unknownIds: string[] } {
  const unknownIds: string[] = [];

  if (!ctx.seenIds.has(args.transportDiId)) {
    unknownIds.push(args.transportDiId);
  }
  if (!ctx.seenIds.has(args.transportVeId)) {
    unknownIds.push(args.transportVeId);
  }
  if (!ctx.seenIds.has(args.hotelId)) {
    unknownIds.push(args.hotelId);
  }
  for (const dayActs of args.hoatDongTheoNgay || []) {
    for (const actId of dayActs) {
      if (!ctx.seenIds.has(actId)) {
        unknownIds.push(actId);
      }
    }
  }

  if (unknownIds.length > 0) {
    return {
      ok: false,
      loi: `Các mã ID sau không nằm trong kết quả tìm kiếm của các công cụ trong phiên này: ${unknownIds.join(
        ", "
      )}. Bạn chỉ được phép chọn mã ID xuất hiện trong kết quả các công cụ timPhuongTien, timKhachSan, goiYHoatDong.`,
      unknownIds,
    };
  }

  return { ok: true, selection: args };
}
