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
} from "@/contracts";
import {
  AN_UONG_MOI_NGUOI_MOI_NGAY,
  NGUOI_MOI_PHONG,
  SO_HOAT_DONG_TOI_DA_MOI_NGAY,
} from "./assumptions";

export interface PlanData {
  transports: Transport[];
  hotels: Hotel[];
  activities: Activity[];
}

export type BuildPlanResult =
  | { ok: true; plan: Plan }
  | { ok: false; loi: string[] };

/**
 * buildPlan: Hàm thuần xây dựng kế hoạch du lịch chi tiết và tính toán toàn bộ số liệu.
 * - AI chỉ chọn các mã ID (Selection).
 * - Code (core) tính toàn bộ tiền, số phòng, thời gian và trạng thái ngân sách.
 * - Không import AI hay UI, không dùng Date.now() hay hàm ngẫu nhiên.
 */
export function buildPlan(
  request: TripRequest,
  selection: Selection,
  data: PlanData
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
    if (dayActs.length > SO_HOAT_DONG_TOI_DA_MOI_NGAY) {
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

  const hotel = data.hotels.find((h) => h.id === selection.hotelId);
  if (!hotel) {
    loi.push(`ID khách sạn không tồn tại: ${selection.hotelId}`);
  }

  const activityMap = new Map<string, Activity>();
  for (const act of data.activities) {
    activityMap.set(act.id, act);
  }

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
  const hHotel = hotel!;

  // 5. Tính toán các thông số phòng và đêm
  const soDem = Math.max(1, soNgay - 1);
  const soPhong = Math.ceil(soNguoi / NGUOI_MOI_PHONG);

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
  });

  // 5.2. Chỗ ở (Ngày 1, danh nghĩa 14:00)
  const giaDem = hHotel.pricePerNight;
  const soLuongPhongDem = soDem * soPhong;
  const thanhTienHotel = giaDem * soLuongPhongDem;
  items.push({
    ngay: 1,
    gio: "14:00",
    hangMuc: "Chỗ ở",
    noiDung: `Lưu trú: ${hHotel.name} (${soDem} đêm, ${soPhong} phòng)`,
    soLuong: soLuongPhongDem,
    donGia: giaDem,
    thanhTien: thanhTienHotel,
    refId: hHotel.id,
  });

  // 5.3. Ăn uống (Mỗi ngày 1 mục)
  for (let day = 1; day <= soNgay; day++) {
    const thanhTienAnUong = AN_UONG_MOI_NGUOI_MOI_NGAY * soNguoi;
    items.push({
      ngay: day,
      gio: null,
      hangMuc: "Ăn uống",
      noiDung: `Ăn uống ngày ${day} (${soNguoi} người)`,
      soLuong: soNguoi,
      donGia: AN_UONG_MOI_NGUOI_MOI_NGAY,
      thanhTien: thanhTienAnUong,
      refId: null,
    });
  }

  // 5.4. Vui chơi theo ngày
  selection.hoatDongTheoNgay.forEach((dayActs, dayIdx) => {
    const day = dayIdx + 1;
    dayActs.forEach((actId, actIdx) => {
      const act = activityMap.get(actId)!;
      const donGiaVe = act.giaVeNguoi ?? act.pricePerPerson ?? 0;
      const thanhTienAct = donGiaVe * soNguoi;
      const gioDanhNghia = actIdx === 0 ? "09:30" : "15:30";
      const tenAct = act.ten || act.name || "Hoạt động";

      items.push({
        ngay: day,
        gio: gioDanhNghia,
        hangMuc: "Vui chơi",
        noiDung: tenAct,
        soLuong: soNguoi,
        donGia: donGiaVe,
        thanhTien: thanhTienAct,
        refId: act.id,
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
  });

  // 6. Tính tổng kết
  const theoHangMuc: Record<PlanItemCategory, number> = {
    "Di chuyển": thanhTienDi + thanhTienVe,
    "Chỗ ở": thanhTienHotel,
    "Ăn uống": AN_UONG_MOI_NGUOI_MOI_NGAY * soNguoi * soNgay,
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
  };

  return { ok: true, plan };
}
