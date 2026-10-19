import {
  type TripRequest,
  type Selection,
  type Transport,
  type Hotel,
  type Activity,
  type Plan,
  type PlanItem,
  type PlanItemCategory,
  schemaVersion,
  getDiemDenTen,
} from "@/contracts";
import type { KhachSan, QuanAn, Cafe, HoatDong } from "@/contracts";
import {
  AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA,
  CAFE_MAC_DINH_MOI_NGUOI,
  HOTEL_GIA_THEO_SAO,
  HOTEL_GIA_MAC_DINH,
  NGUOI_MOI_PHONG,
  SO_HOAT_DONG_TOI_DA_MOI_NGAY,
} from "./assumptions";
import { mealTimeOrNull, hhmm2min } from "./mealTimes";

export interface PlanData {
  transports: Transport[];
  hotels: Hotel[];
  activities: Activity[];
  /** Khách sạn từ dữ liệu live (nếu có) */
  khachSans?: KhachSan[];
  /** Quán ăn từ dữ liệu live (nếu có) */
  quanAns?: QuanAn[];
  /** Quán cà phê từ dữ liệu live (nếu có) */
  cafes?: Cafe[];
  /** Hoạt động từ dữ liệu live (nếu có) */
  hoatDongs?: HoatDong[];
}

export type BuildPlanResult =
  | { ok: true; plan: Plan }
  | { ok: false; loi: string[] };

/**
 * buildPlan: Hàm thuần xây dựng kế hoạch du lịch chi tiết và tính toán toàn bộ số liệu.
 * - AI chỉ chọn các mã ID (Selection).
 * - Code (core) tính toàn bộ tiền, số phòng, thời gian và trạng thái ngân sách.
 * - Không import AI hay UI, không dùng Date.now() hay hàm ngẫu nhiên.
 *
 * Bước 5B: Ăn uống tính theo từng bữa (quanAns/cafes); giá lấy giaUocTinhNguoi
 * của quán, null thì dùng mặc định. Mỗi ngày 2 bữa (trưa + tối), cafe tuỳ chọn.
 */
export function buildPlan(
  request: TripRequest,
  selection: Selection,
  data: PlanData,
  dataSourceUsed?: string
): BuildPlanResult {
  const loi: string[] = [];

  // 1. Kiểm tra tính hợp lệ cơ bản của request
  if (request.soNguoi === null || request.soNguoi <= 0) {
    loi.push("Thiếu thông tin số người (soNguoi).");
  }
  if (request.soNgay === null || request.soNgay <= 0) {
    loi.push("Thiếu thông tin số ngày (soNgay).");
  }
  if (request.ngansachTongVND === null || request.ngansachTongVND <= 0) {
    loi.push("Thiếu thông tin ngân sách tổng (ngansachTongVND).");
  }

  const soNguoi = request.soNguoi ?? 0;
  const soNgay = request.soNgay ?? 0;
  const ngansachTongVND = request.ngansachTongVND ?? 0;

  // 2. Kiểm tra độ dài hoatDongTheoNgay
  if (soNgay > 0 && selection.hoatDongTheoNgay.length !== soNgay) {
    loi.push(
      `hoatDongTheoNgay có độ dài (${selection.hoatDongTheoNgay.length}) khác soNgay (${soNgay}).`
    );
  }

  // 3. Kiểm tra số hoạt động mỗi ngày và phát hiện hoạt động trùng
  const seenActivityIds = new Set<string>();
  selection.hoatDongTheoNgay.forEach((dayActs, dayIdx) => {
    if (dayIdx === 0 && dayActs.length > 1) {
      loi.push(`Ngày đầu chỉ được tối đa 1 hoạt động, vượt quá mức tối đa (hiện có ${dayActs.length}).`);
    } else if (dayIdx === soNgay - 1 && dayActs.length > 1) {
      loi.push(`Ngày cuối chỉ được tối đa 1 hoạt động, vượt quá mức tối đa (hiện có ${dayActs.length}).`);
    } else if (dayIdx > 0 && dayIdx < soNgay - 1 && dayActs.length > 2) {
      loi.push(`Ngày giữa chỉ được tối đa 2 hoạt động, vượt quá mức tối đa (hiện có ${dayActs.length}).`);
    } else if (dayActs.length > SO_HOAT_DONG_TOI_DA_MOI_NGAY) {
      loi.push(
        `Ngày ${dayIdx + 1} có ${dayActs.length} hoạt động, vượt quá mức tối đa ${SO_HOAT_DONG_TOI_DA_MOI_NGAY}.`
      );
    }
    for (const actId of dayActs) {
      if (seenActivityIds.has(actId)) {
        loi.push(`Hoạt động bị trùng lặp: ${actId}.`);
      }
      seenActivityIds.add(actId);
    }
  });

  // 4. Tìm kiếm các thực thể theo ID
  const transportDi = data.transports.find(
    (t) => t.id === selection.transportDiId
  );
  if (!transportDi) {
    loi.push(`ID phương tiện chiều đi không tồn tại: ${selection.transportDiId}`);
  } else if (transportDi.huong !== "di") {
    loi.push(
      `Phương tiện chiều đi (${selection.transportDiId}) không phải huong 'di'.`
    );
  }

  const transportVe = data.transports.find(
    (t) => t.id === selection.transportVeId
  );
  if (!transportVe) {
    loi.push(`ID phương tiện chiều về không tồn tại: ${selection.transportVeId}`);
  } else if (transportVe.huong !== "ve") {
    loi.push(
      `Phương tiện chiều về (${selection.transportVeId}) không phải huong 've'.`
    );
  }

  // Tìm khách sạn: ưu tiên KhachSan (live) trước, rồi Hotel (mock)
  const khachSanLive = data.khachSans?.find((h) => h.id === selection.hotelId);
  const hotelMock = data.hotels.find((h) => h.id === selection.hotelId);

  if (!khachSanLive && !hotelMock) {
    loi.push(`ID khách sạn không tồn tại: ${selection.hotelId}`);
  }

  const activityMap = new Map<string, Activity | HoatDong>();
  for (const act of data.activities) {
    activityMap.set(act.id, act);
  }
  for (const hd of data.hoatDongs ?? []) {
    activityMap.set(hd.id, hd);
  }

  // Build map quán ăn & cafe từ dữ liệu live
  const quanAnMap = new Map<string, QuanAn>();
  for (const qa of data.quanAns ?? []) quanAnMap.set(qa.id, qa);
  const cafeMap = new Map<string, Cafe>();
  for (const c of data.cafes ?? []) cafeMap.set(c.id, c);

  // Validate ID hoạt động (chỉ hoạt động cổ điển, không phải quán ăn)
  for (const actId of seenActivityIds) {
    if (!activityMap.has(actId)) {
      loi.push(`ID hoạt động không tồn tại: ${actId}`);
    }
  }

  if (loi.length > 0) {
    return { ok: false, loi };
  }

  // Chắc chắn các thực thể đã tồn tại và hợp lệ
  const tDi = transportDi!;
  const tVe = transportVe!;

  // 5. Tính toán các thông số phòng và đêm
  const soDem = soNgay - 1;
  const soPhong = Math.ceil(soNguoi / NGUOI_MOI_PHONG);
  const tenDiemDen = getDiemDenTen(request.diemDen);

  // Tính giá đêm khách sạn
  let giaDem: number;
  let giaKhachSanLaUocTinh = false;
  let nguonKhachSan: string | undefined;

  if (khachSanLive) {
    // Ưu tiên lấy giá từ khoangGiaDemVND (trung bình min+max)
    if (khachSanLive.khoangGiaDemVND) {
      giaDem = Math.round(
        (khachSanLive.khoangGiaDemVND.min + khachSanLive.khoangGiaDemVND.max) / 2
      );
      giaKhachSanLaUocTinh = khachSanLive.giaLaUocTinh;
    } else if (khachSanLive.giaUocTinhNguoi !== null) {
      giaDem = khachSanLive.giaUocTinhNguoi;
      giaKhachSanLaUocTinh = true;
    } else {
      // Fallback về HOTEL_GIA_THEO_SAO
      const sao = khachSanLive.soSao;
      giaDem =
        sao !== null && HOTEL_GIA_THEO_SAO[sao] !== undefined
          ? HOTEL_GIA_THEO_SAO[sao]
          : HOTEL_GIA_MAC_DINH;
      giaKhachSanLaUocTinh = true;
    }
    nguonKhachSan = khachSanLive.nguon ?? undefined;
  } else {
    // Mock hotel
    giaDem = hotelMock!.pricePerNight;
    giaKhachSanLaUocTinh = false;
    nguonKhachSan = hotelMock!.source;
  }

  const soLuongPhongDem = soDem * soPhong;
  const thanhTienHotel = giaDem * soLuongPhongDem;

  const items: PlanItem[] = [];

  // 5.1. Di chuyển chiều đi (Ngày 1)
  const donGiaDi = tDi.pricePerPerson;
  const thanhTienDi = donGiaDi * soNguoi;
  items.push({
    ngay: 1,
    gio: tDi.departureTime,
    hangMuc: "Di chuyển",
    noiDung: `Di chuyển chiều đi: ${tDi.provider} (${tDi.origin} → ${tDi.destination})`,
    soLuong: soNguoi,
    donGia: donGiaDi,
    thanhTien: thanhTienDi,
    refId: tDi.id,
    nguon: tDi.nguon ?? null,
    doTinCay: tDi.doTinCay,
    giaLaUocTinh: tDi.giaLaUocTinh,
  });

  // 5.2. Chỗ ở (Ngày 1, danh nghĩa 14:00)
  const tenKhachSan = khachSanLive?.ten ?? hotelMock!.name;
  items.push({
    ngay: 1,
    gio: "14:00",
    hangMuc: "Chỗ ở",
    noiDung: `Lưu trú: ${tenKhachSan} (${soDem} đêm, ${soPhong} phòng)`,
    soLuong: soLuongPhongDem,
    donGia: giaDem,
    thanhTien: thanhTienHotel,
    refId: selection.hotelId,
    nguon: nguonKhachSan ?? null,
    giaLaUocTinh: giaKhachSanLaUocTinh,
    mapsUrl: khachSanLive?.mapsUrls?.xem,
  });

  // 5.3. Ăn uống theo ngày (tính theo từng bữa hoặc dùng mặc định)
  // Tính giờ đến ngày 1 cho mealTimeOrNull
  const gioDenNgay1Phut = hhmm2min(tDi.departureTime) + tDi.durationMinutes;
  let tongAnUong = 0;

  for (let day = 1; day <= soNgay; day++) {
    const bua = selection.buaAnTheoNgay?.[day - 1];
    const mealCtx = {
      ngay: day,
      soNgay,
      gioDenNgay1Phut,
      gioKhoiHanhVe: tVe.departureTime,
    };

    // --- Bữa trưa ---
    const quanTrua = bua?.trua ? (quanAnMap.get(bua.trua) ?? null) : null;
    const giaTriTrua = quanTrua?.giaUocTinhNguoi ?? AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA;
    const thanhTienTrua = giaTriTrua * soNguoi;
    tongAnUong += thanhTienTrua;
    items.push({
      ngay: day,
      gio: mealTimeOrNull("12:00", mealCtx),
      hangMuc: "Ăn uống",
      noiDung: quanTrua
        ? `Trưa: ${quanTrua.ten} (${soNguoi} người)`
        : `Trưa ngày ${day} – ước tính (${soNguoi} người)`,
      soLuong: soNguoi,
      donGia: giaTriTrua,
      thanhTien: thanhTienTrua,
      refId: quanTrua?.id ?? null,
      nguon: quanTrua?.nguon ?? null,
      doTinCay: quanTrua?.doTinCay,
      giaLaUocTinh: quanTrua?.giaLaUocTinh ?? true,
      mapsUrl: quanTrua?.nguon
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(quanTrua.ten + (tenDiemDen ? `, ${tenDiemDen}` : ""))}`
        : undefined,
    });

    // --- Bữa tối ---
    const quanToi = bua?.toi ? (quanAnMap.get(bua.toi) ?? null) : null;
    const giaTriToi = quanToi?.giaUocTinhNguoi ?? AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA;
    const thanhTienToi = giaTriToi * soNguoi;
    tongAnUong += thanhTienToi;
    items.push({
      ngay: day,
      gio: mealTimeOrNull("18:30", mealCtx),
      hangMuc: "Ăn uống",
      noiDung: quanToi
        ? `Tối: ${quanToi.ten} (${soNguoi} người)`
        : `Tối ngày ${day} – ước tính (${soNguoi} người)`,
      soLuong: soNguoi,
      donGia: giaTriToi,
      thanhTien: thanhTienToi,
      refId: quanToi?.id ?? null,
      nguon: quanToi?.nguon ?? null,
      doTinCay: quanToi?.doTinCay,
      giaLaUocTinh: quanToi?.giaLaUocTinh ?? true,
      mapsUrl: quanToi?.nguon
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(quanToi.ten + (tenDiemDen ? `, ${tenDiemDen}` : ""))}`
        : undefined,
    });

    // --- Cafe (tuỳ chọn) ---
    if (bua?.cafe) {
      const quanCafe = cafeMap.get(bua.cafe) ?? null;
      const giaTriCafe = quanCafe?.giaUocTinhNguoi ?? CAFE_MAC_DINH_MOI_NGUOI;
      const thanhTienCafe = giaTriCafe * soNguoi;
      tongAnUong += thanhTienCafe;
      items.push({
        ngay: day,
        gio: mealTimeOrNull("09:00", mealCtx),
        hangMuc: "Ăn uống",
        noiDung: quanCafe
          ? `Cà phê: ${quanCafe.ten} (${soNguoi} người)`
          : `Cà phê ngày ${day} – ước tính (${soNguoi} người)`,
        soLuong: soNguoi,
        donGia: giaTriCafe,
        thanhTien: thanhTienCafe,
        refId: quanCafe?.id ?? null,
        nguon: quanCafe?.nguon ?? null,
        doTinCay: quanCafe?.doTinCay,
        giaLaUocTinh: quanCafe?.giaLaUocTinh ?? true,
        mapsUrl: quanCafe?.nguon
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((quanCafe.ten) + (tenDiemDen ? `, ${tenDiemDen}` : ""))}`
          : undefined,
      });
    }
  }

  // 5.4. Vui chơi theo ngày
  selection.hoatDongTheoNgay.forEach((dayActs, dayIdx) => {
    const day = dayIdx + 1;
    dayActs.forEach((actId, actIdx) => {
      const act = activityMap.get(actId)!;
      const donGiaVe = (act as any).giaVeNguoi ?? (act as any).pricePerPerson ?? 0;
      const thanhTienAct = donGiaVe * soNguoi;
      const gioDanhNghia = actIdx === 0 ? "09:30" : "15:30";
      const tenAct = (act as any).ten || (act as any).name || "Hoạt động";
      const actAny = act as any;
      const mapsUrl =
        actAny.mapsUrls?.xem ??
        (actAny.nguon
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenAct + (tenDiemDen ? `, ${tenDiemDen}` : ""))}`
          : undefined);

      items.push({
        ngay: day,
        gio: gioDanhNghia,
        hangMuc: "Vui chơi",
        noiDung: tenAct,
        soLuong: soNguoi,
        donGia: donGiaVe,
        thanhTien: thanhTienAct,
        refId: act.id,
        nguon: actAny.nguon ?? null,
        doTinCay: actAny.doTinCay,
        giaLaUocTinh: actAny.giaLaUocTinh,
        mapsUrl,
        nhan: actAny.nhan ?? [],
      });
    });
  });

  // 5.5. Di chuyển chiều về (Ngày cuối cùng)
  const donGiaVeTransport = tVe.pricePerPerson;
  const thanhTienVe = donGiaVeTransport * soNguoi;
  items.push({
    ngay: soNgay,
    gio: tVe.departureTime,
    hangMuc: "Di chuyển",
    noiDung: `Di chuyển chiều về: ${tVe.provider} (${tVe.origin} → ${tVe.destination})`,
    soLuong: soNguoi,
    donGia: donGiaVeTransport,
    thanhTien: thanhTienVe,
    refId: tVe.id,
    nguon: tVe.nguon ?? null,
    doTinCay: tVe.doTinCay,
    giaLaUocTinh: tVe.giaLaUocTinh,
  });

  // 6. Tính tổng kết
  const theoHangMuc: Record<PlanItemCategory, number> = {
    "Di chuyển": thanhTienDi + thanhTienVe,
    "Chỗ ở": thanhTienHotel,
    "Ăn uống": tongAnUong,
    "Vui chơi": 0,
  };

  for (const item of items) {
    if (item.hangMuc === "Vui chơi") {
      theoHangMuc["Vui chơi"] += item.thanhTien;
    }
  }

  const tongVND =
    theoHangMuc["Di chuyển"] +
    theoHangMuc["Chỗ ở"] +
    theoHangMuc["Ăn uống"] +
    theoHangMuc["Vui chơi"];

  const conLaiVND = ngansachTongVND - tongVND;
  const phanTramDaDung =
    ngansachTongVND > 0
      ? Math.round((tongVND / ngansachTongVND) * 1000) / 10
      : 0;

  const tongThoiGianDiChuyenPhut =
    (tDi.durationMinutes ?? 0) + (tVe.durationMinutes ?? 0);

  const trangThaiNganSach = tongVND > ngansachTongVND ? "vuot" : "trong";

  const canhBao = Array.from(new Set(request.canhBao));
  if (trangThaiNganSach === "vuot") {
    canhBao.push("vuot_ngan_sach");
  }

  // Sắp xếp items theo ngày, sau đó theo giờ (nếu có)
  items.sort((a, b) => {
    if (a.ngay !== b.ngay) return a.ngay - b.ngay;
    if (a.gio && b.gio) return a.gio.localeCompare(b.gio);
    if (a.gio && !b.gio) return -1;
    if (!a.gio && b.gio) return 1;
    return 0;
  });

  const plan: Plan = {
    schemaVersion,
    request,
    items,
    tongKet: {
      tongVND,
      conLaiVND,
      phanTramDaDung,
      theoHangMuc,
      tongThoiGianDiChuyenPhut,
      trangThaiNganSach,
    },
    canhBao,
    dataSourceUsed,
  };

  return { ok: true, plan };
}
