import { Type } from "@google/genai";
import type { DataSource } from "@/data/DataSource";
import type { LiveDataSource } from "@/data/live/LiveDataSource";
import type { Selection, Preference, QuanAn, Cafe, KhachSan } from "@/contracts";
import { calculateTransportFlags } from "@/core/flags";
import { removeVietnameseDiacritics } from "@/core/normalizeRequest";
import { buildMapsUrls } from "@/core/maps";
import {
  HOTEL_GIA_THEO_SAO,
  HOTEL_GIA_MAC_DINH,
} from "@/core/assumptions";

export interface ToolContext {
  dataSource: DataSource;
  liveDataSource?: LiveDataSource;
  soNguoi: number;
  soNgay: number;
  soDem: number;
  soPhong: number;
  seenIds: Set<string>;
  /** ID hợp lệ: bao gồm cả quán ăn và cafe trong lần chạy này */
  validFoodIds: Set<string>;
}

// ─── KHAI BÁO CÔNG CỤ ────────────────────────────────────────────────────────

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
    "Tìm kiếm khách sạn tại Đà Nẵng theo giá đêm, số sao, khu vực và tiện ích.",
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
    },
  },
};

export const timQuanAnDeclaration = {
  name: "timQuanAn",
  description:
    "Tìm quán ăn tại Đà Nẵng theo khu vực, loại ẩm thực và giá. Dùng để chọn bữa trưa và tối.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      khuVuc: {
        type: Type.STRING,
        description: "Khu vực tìm kiếm",
      },
      amThuc: {
        type: Type.STRING,
        description: "Loại ẩm thực (ví dụ: hai_san, com, lau...)",
      },
      toiDaGiaNguoi: {
        type: Type.INTEGER,
        description: "Giá ước tính tối đa mỗi người (VND)",
      },
    },
  },
};

export const timCafeDeclaration = {
  name: "timCafe",
  description:
    "Tìm quán cà phê tại Đà Nẵng theo khu vực. Dùng để chọn cafe tùy chọn trong ngày.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      khuVuc: {
        type: Type.STRING,
        description: "Khu vực tìm kiếm",
      },
    },
  },
};

export const goiYHoatDongDeclaration = {
  name: "goiYHoatDong",
  description:
    "Gợi ý các hoạt động vui chơi, tham quan tại Đà Nẵng theo sở thích và điều cần tránh.",
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
    "Chốt lựa chọn phương tiện, khách sạn, hoạt động và bữa ăn theo ngày để tạo kế hoạch. MỌI ID PHẢI LẤY TỪ KẾT QUẢ CỦA CÁC CÔNG CỤ TRÊN.",
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
      buaAnTheoNgay: {
        type: Type.ARRAY,
        description:
          "Bữa ăn theo từng ngày; độ dài bằng số ngày. Mỗi ngày: { trua, toi, cafe } là ID quán hoặc null.",
        items: {
          type: Type.OBJECT,
          properties: {
            trua: { type: Type.STRING, description: "ID quán ăn trưa hoặc null" },
            toi: { type: Type.STRING, description: "ID quán ăn tối hoặc null" },
            cafe: { type: Type.STRING, description: "ID quán cafe hoặc null (tùy chọn)" },
          },
        },
      },
    },
    required: ["transportDiId", "transportVeId", "hotelId", "hoatDongTheoNgay"],
  },
};

export const AGENT_TOOLS_DECLARATIONS = [
  timPhuongTienDeclaration,
  timKhachSanDeclaration,
  timQuanAnDeclaration,
  timCafeDeclaration,
  goiYHoatDongDeclaration,
  chotKeHoachDeclaration,
];

// ─── THỰC THI CÔNG CỤ ────────────────────────────────────────────────────────

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
      gioDen: flags.gioDen,
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
      nguon: t.nguon ?? null,
      doTinCay: t.doTinCay ?? "tham_khao",
      giaLaUocTinh: t.giaLaUocTinh ?? false,
    };
  });
}

export async function executeTimKhachSan(
  args: {
    toiDaGiaDem?: number;
    saoToiThieu?: number;
    khuVuc?: string;
  },
  ctx: ToolContext
) {
  // Ưu tiên dữ liệu live
  const liveDS = ctx.liveDataSource;
  if (liveDS && liveDS.getMode() !== "mock") {
    const khachSans = await liveDS.getKhachSans();
    const filtered = khachSans.filter((h) => {
      if (args.saoToiThieu !== undefined && h.soSao !== null && h.soSao < args.saoToiThieu) return false;
      if (args.khuVuc) {
        const areaNorm = removeVietnameseDiacritics(h.khuVuc);
        const queryNorm = removeVietnameseDiacritics(args.khuVuc);
        if (!areaNorm.includes(queryNorm)) return false;
      }
      // Kiểm tra giá
      if (args.toiDaGiaDem !== undefined) {
        const giaDem = h.khoangGiaDemVND
          ? Math.round((h.khoangGiaDemVND.min + h.khoangGiaDemVND.max) / 2)
          : h.giaUocTinhNguoi ?? HOTEL_GIA_MAC_DINH;
        if (giaDem > args.toiDaGiaDem) return false;
      }
      return true;
    });

    return filtered.map((h) => {
      ctx.seenIds.add(h.id);
      const giaDem = h.khoangGiaDemVND
        ? Math.round((h.khoangGiaDemVND.min + h.khoangGiaDemVND.max) / 2)
        : h.giaUocTinhNguoi ??
          (h.soSao !== null && HOTEL_GIA_THEO_SAO[h.soSao]
            ? HOTEL_GIA_THEO_SAO[h.soSao]
            : HOTEL_GIA_MAC_DINH);
      const mapsUrls = buildMapsUrls(h);
      return {
        id: h.id,
        ten: h.ten,
        khuVuc: h.khuVuc,
        soSao: h.soSao,
        giaDem,
        giaLaUocTinh: h.giaLaUocTinh,
        doTinCay: h.doTinCay,
        nguon: h.nguon,
        tongTienLuuTru: giaDem * ctx.soDem * ctx.soPhong,
        mapsUrls,
        osmId: h.osmId,
      };
    });
  }

  // Fallback mock
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
    return true;
  });

  return filtered.map((h) => {
    ctx.seenIds.add(h.id);
    return {
      id: h.id,
      ten: h.name,
      khuVuc: h.area,
      soSao: h.stars,
      giaDem: h.pricePerNight,
      giaLaUocTinh: false,
      doTinCay: "tham_khao",
      nguon: h.source ?? null,
      buffetSang: h.includesBreakfast,
      hoBoi: h.hasPool,
      tongTienLuuTru: h.pricePerNight * ctx.soDem * ctx.soPhong,
    };
  });
}

export async function executeTimQuanAn(
  args: {
    khuVuc?: string;
    amThuc?: string;
    toiDaGiaNguoi?: number;
  },
  ctx: ToolContext
) {
  const liveDS = ctx.liveDataSource;
  if (!liveDS || liveDS.getMode() === "mock") return [];

  const quanAns = await liveDS.getQuanAns();
  const filtered = quanAns.filter((q: QuanAn) => {
    if (args.khuVuc) {
      const norm = removeVietnameseDiacritics(q.khuVuc);
      const qnorm = removeVietnameseDiacritics(args.khuVuc);
      if (!norm.includes(qnorm)) return false;
    }
    if (args.amThuc && q.amThuc) {
      if (!q.amThuc.toLowerCase().includes(args.amThuc.toLowerCase())) return false;
    }
    if (args.toiDaGiaNguoi !== undefined && q.giaUocTinhNguoi !== null) {
      if (q.giaUocTinhNguoi > args.toiDaGiaNguoi) return false;
    }
    return true;
  });

  return filtered.map((q: QuanAn) => {
    ctx.seenIds.add(q.id);
    ctx.validFoodIds.add(q.id);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q.ten + ", Đà Nẵng")}`;
    return {
      id: q.id,
      ten: q.ten,
      khuVuc: q.khuVuc,
      loai: "quan_an",
      amThuc: q.amThuc,
      giaUocTinhNguoi: q.giaUocTinhNguoi ?? 150_000,
      tongTienChoNhom: (q.giaUocTinhNguoi ?? 150_000) * ctx.soNguoi,
      gioMoCua: q.gioMoCua,
      doTinCay: q.doTinCay,
      nguon: q.nguon,
      mapsUrl,
    };
  });
}

export async function executeTimCafe(
  args: { khuVuc?: string },
  ctx: ToolContext
) {
  const liveDS = ctx.liveDataSource;
  if (!liveDS || liveDS.getMode() === "mock") return [];

  const cafes = await liveDS.getCafes();
  const filtered = cafes.filter((c: Cafe) => {
    if (args.khuVuc) {
      const norm = removeVietnameseDiacritics(c.khuVuc);
      const qnorm = removeVietnameseDiacritics(args.khuVuc);
      if (!norm.includes(qnorm)) return false;
    }
    return true;
  });

  return filtered.map((c: Cafe) => {
    ctx.seenIds.add(c.id);
    ctx.validFoodIds.add(c.id);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.ten + ", Đà Nẵng")}`;
    return {
      id: c.id,
      ten: c.ten,
      khuVuc: c.khuVuc,
      loai: "cafe",
      giaUocTinhNguoi: c.giaUocTinhNguoi ?? 50_000,
      tongTienChoNhom: (c.giaUocTinhNguoi ?? 50_000) * ctx.soNguoi,
      gioMoCua: c.gioMoCua,
      doTinCay: c.doTinCay,
      nguon: c.nguon,
      mapsUrl,
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
  // Ưu tiên dữ liệu live
  const liveDS = ctx.liveDataSource;
  if (liveDS && liveDS.getMode() !== "mock") {
    const hoatDongs = await liveDS.getHoatDongs();
    let filtered = hoatDongs.filter((a) => {
      if (args.tranhDongNguoi === true && a.dongNguoi) return false;
      if (args.tranhDiBoNhieu === true && a.diBoNhieu) return false;
      if (args.toiDaGiaVe !== undefined && a.giaVeNguoi > args.toiDaGiaVe)
        return false;
      return true;
    });

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
        mapsUrls: a.mapsUrls,
        nguon: a.nguon,
        doTinCay: a.doTinCay,
      };
    });
  }

  // Fallback mock
  const allActivities = await ctx.dataSource.getActivities();
  let filtered = allActivities.filter((a) => {
    if (args.tranhDongNguoi === true && a.dongNguoi) return false;
    if (args.tranhDiBoNhieu === true && a.diBoNhieu) return false;
    if (args.toiDaGiaVe !== undefined && a.giaVeNguoi > args.toiDaGiaVe)
      return false;
    return true;
  });

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

  // Validate buaAnTheoNgay IDs (chỉ ID quán ăn và cafe hợp lệ)
  for (const bua of args.buaAnTheoNgay ?? []) {
    for (const id of [bua.trua, bua.toi, bua.cafe]) {
      if (id && !ctx.validFoodIds.has(id) && !ctx.seenIds.has(id)) {
        unknownIds.push(id);
      }
    }
  }

  if (unknownIds.length > 0) {
    return {
      ok: false,
      loi: `Các mã ID sau không nằm trong kết quả tìm kiếm của các công cụ trong phiên này: ${unknownIds.join(
        ", "
      )}. Bạn chỉ được phép chọn mã ID xuất hiện trong kết quả các công cụ.`,
      unknownIds,
    };
  }

  return { ok: true, selection: args };
}
