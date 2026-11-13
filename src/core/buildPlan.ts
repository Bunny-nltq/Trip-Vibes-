import {isDiningVenue, isIndependentAttraction} from "./venueDiscovery";
import {buildMapsUrls} from "./maps";
import {estimateLocalRoutes} from "./localRoutes";
import {localRouteWarnings} from "./flags";
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
  GIO_NHAN_PHONG, GIO_TRA_PHONG_DU_KIEN, NGHI_SAU_CHANG_DAI_PHUT,
  NGUONG_DI_CHUYEN_LAU_PHUT, BUFFER_DEN_KHACH_SAN_PHUT, BUFFER_RA_BEN_PHUT, GIA_AN_SANG_UOC_TINH_VND,
  GIO_CA_PHE_SANG, GIO_AN_TRUA_CO_NGAY, THOI_LUONG_BUA_AN_PHUT, THOI_LUONG_CA_PHE_PHUT, THOI_LUONG_THAM_QUAN_SANG_TOI_DA,
  SO_HOAT_DONG_TOI_DA_MOI_NGAY,
  GIO_HOAT_DONG_1,
  GIO_HOAT_DONG_2,
} from "./assumptions";
import { mealTimeOrNull, hhmm2min, min2hhmm } from "./mealTimes";
import { gioOHoatDongNgayDau } from "./gioONgayDau";
import { soDemOKhachSan } from "./soDem";
import { tinhOKhaDungTheoNgay } from "./oKhaDung";

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

function mealSpecialty(place: QuanAn): string | undefined {
  const name = place.ten.trim();
  const dish = /^(phở bò|phở gà|bún chả|bún ngan|bún riêu|bún bò(?: huế)?|bún đậu|bánh mì|bánh cuốn|cơm tấm|xôi|cháo|phở)(?=\s|$)/i.exec(name)?.[0];
  if (dish) return `Món theo tên quán: ${dish}`;
  const cuisine: Record<string, string> = { pizza: "Pizza", sushi: "Sushi", hotpot: "Lẩu", grill: "Món nướng", noodles: "Món sợi", noodle: "Món sợi", japanese: "Món Nhật", korean: "Món Hàn", vietnamese: "Món Việt" };
  const types = (place.amThuc ?? place.cuisine ?? "").split(";").map(tag => cuisine[tag.trim()]).filter(Boolean);
  return types.length ? `Theo dữ liệu ẩm thực: ${[...new Set(types)].join(", ")}` : undefined;
}

function dailyOpeningCovers(hours: string | null, start: string, end: string): boolean | undefined {
  if (hours === "24/7") return true;
  const range = /^(?:Mo-Su )?(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(hours ?? "");
  return range ? range[1] <= start && range[2] >= end : undefined;
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
    if (isIndependentAttraction(act)) activityMap.set(act.id, act);
  }
  for (const hd of data.hoatDongs ?? []) {
    if (isIndependentAttraction(hd)) activityMap.set(hd.id, hd);
  }

  // Build map quán ăn & cafe từ dữ liệu live
  const quanAnMap = new Map<string, QuanAn>();
  for (const qa of data.quanAns ?? []) if (isDiningVenue(qa)) quanAnMap.set(qa.id, qa);
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
  const gioDenNgay1Phut = hhmm2min(tDi.departureTime) + tDi.durationMinutes;
  const soDem = soDemOKhachSan(soNgay, gioDenNgay1Phut);
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
    noiDung: `Di chuyển chiều đi · ${tDi.type === "PLANE" ? "Máy bay" : tDi.type === "TRAIN" ? "Tàu hỏa" : "Xe khách"}: ${tDi.provider} (${tDi.origin} → ${tDi.destination})`,
    soLuong: soNguoi,
    donGia: donGiaDi,
    thanhTien: thanhTienDi,
    refId: tDi.id,originName:tDi.origin,destinationName:tDi.destination,
    nguon: tDi.nguon ?? null,
    doTinCay: tDi.doTinCay,
    giaLaUocTinh: tDi.giaLaUocTinh,
    thoiLuongPhut: tDi.durationMinutes,
  } as any);

  // 5.2. Chỗ ở (thuộc ngày đến, giờ nhận phòng là max(14:00, giờ đến mod 1440))
  const ngayChoO = Math.floor(gioDenNgay1Phut / 1440) + 1;
  const arrivalClock = gioDenNgay1Phut % 1440;
  const checkIn = Math.max(hhmm2min(GIO_NHAN_PHONG), Math.min(1439, arrivalClock + (request.travelDates ? BUFFER_DEN_KHACH_SAN_PHUT : 0)));
  const gioChoO = min2hhmm(checkIn);
  const checkInAbsolute = (ngayChoO - 1) * 1440 + checkIn;
  const restEnd = request.travelDates && soDem > 0 && tDi.durationMinutes >= NGUONG_DI_CHUYEN_LAU_PHUT
    ? checkInAbsolute + NGHI_SAU_CHANG_DAI_PHUT : 0;
  const checkout = Math.min(hhmm2min(GIO_TRA_PHONG_DU_KIEN), hhmm2min(tVe.departureTime) - BUFFER_RA_BEN_PHUT);
  const checkoutAbsolute = (soNgay - 1) * 1440 + checkout;
  if (request.travelDates && soDem > 0 && checkoutAbsolute <= checkInAbsolute) {
    return { ok: false, loi: ["Không đủ thời gian nhận và trả phòng giữa hai chặng di chuyển."] };
  }
  if (restEnd > checkoutAbsolute) return { ok: false, loi: ["Chặng đi dài không còn đủ thời gian nghỉ tại khách sạn trước khi trả phòng."] };
  const tenKhachSan = khachSanLive?.ten ?? hotelMock!.name;
  if (soDem > 0) items.push({
    ngay: ngayChoO,
    gio: gioChoO,
    hangMuc: "Chỗ ở",
    noiDung: request.travelDates
      ? `Nhận phòng dự kiến: ${tenKhachSan} (${soDem} đêm, ${soPhong} phòng)`
      : `Lưu trú: ${tenKhachSan} (${soDem} đêm, ${soPhong} phòng)`,
    destinationName: tenKhachSan,
    soLuong: soLuongPhongDem,
    donGia: giaDem,
    thanhTien: thanhTienHotel,
    refId: selection.hotelId,
    nguon: nguonKhachSan ?? null,
    giaLaUocTinh: giaKhachSanLaUocTinh,
    mapsUrl: khachSanLive?.mapsUrls?.xem,
  });

  if (request.travelDates && soDem > 0) {
    const hotelStop = {
      hangMuc: "Chỗ ở" as const, destinationName: tenKhachSan, diaChi: khachSanLive?.diaChi,
      soLuong: 1, donGia: 0, thanhTien: 0, refId: null, priceKnown: true,
      nguon: khachSanLive?.nguon,
    };
    if (restEnd) items.push({
      ...hotelStop, ngay: ngayChoO, gio: gioChoO,
      noiDung: `Nghỉ tại ${tenKhachSan} sau chặng dài · ${NGHI_SAU_CHANG_DAI_PHUT / 60} giờ`,
      durationMinutes: NGHI_SAU_CHANG_DAI_PHUT,
    });
    items.push({
      ...hotelStop, ngay: Math.floor(checkoutAbsolute / 1440) + 1,
      gio: min2hhmm((checkoutAbsolute + 1440) % 1440),
      noiDung: `Trả phòng dự kiến: ${tenKhachSan} · trước khi ra điểm khởi hành`,
    });
  }

  // 5.3. Dùng tên, địa chỉ và thông tin món từ nguồn dữ liệu.
  const restaurants = [...quanAnMap.values()];
  const breakfastPlaces = restaurants.filter(place => /^(phở|bún ngan|bún bò|bún riêu|bánh mì|xôi|cháo|bánh cuốn)\s/i.test(place.ten.trim()));
  const openForBreakfast = breakfastPlaces.filter(place => dailyOpeningCovers(place.gioMoCua, "07:30", "08:15"));
  const suitableBreakfast = openForBreakfast.length ? openForBreakfast : breakfastPlaces.filter(place => !place.gioMoCua);
  let tongAnUong = 0;

  for (let day = 1; day <= soNgay; day++) {
    const bua = selection.buaAnTheoNgay?.[day - 1];
    const mealCtx = {
      ngay: day,
      soNgay,
      gioDenNgay1Phut,
      gioKhoiHanhVe: tVe.departureTime,
    };

    function scheduleMeal(nominal: string, duration = THOI_LUONG_BUA_AN_PHUT) {
      if (!request.travelDates) return mealTimeOrNull(nominal, mealCtx);
      const time = hhmm2min(nominal);
      const start = (day - 1) * 1440 + time;
      if (start < gioDenNgay1Phut + BUFFER_DEN_KHACH_SAN_PHUT) return null;
      if (restEnd && start < restEnd && start + duration > checkInAbsolute) return null;
      if (day === soNgay && time + duration > hhmm2min(tVe.departureTime) - BUFFER_RA_BEN_PHUT) return null;
      return nominal;
    }

    const regularMeals = [
      { label: "Trưa", time: request.travelDates ? GIO_AN_TRUA_CO_NGAY : "12:00", place: quanAnMap.get(bua?.trua ?? "") ??
          (request.travelDates ? restaurants[(day * 2) % restaurants.length] : undefined) },
      { label: "Tối", time: "18:30", place: quanAnMap.get(bua?.toi ?? "") ??
          (request.travelDates ? restaurants[(day * 2 + 1) % restaurants.length] : undefined) },
    ];
    const meals = request.travelDates ? [
      { label: "Sáng", time: "07:30", place: suitableBreakfast[(day - 1) % suitableBreakfast.length] },
      ...regularMeals,
    ] : regularMeals;
    for (const { label, time, place } of meals) {
      const gio = scheduleMeal(time);
      if (request.travelDates && !gio) continue;
      const breakfast = label === "Sáng";
      const atHotel = breakfast && khachSanLive?.includesBreakfast && day > ngayChoO && day <= soNgay;
      const dish = atHotel ? undefined : place && mealSpecialty(place);
      const price = atHotel ? 0 : place?.giaUocTinhNguoi ??
        (breakfast ? GIA_AN_SANG_UOC_TINH_VND : AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA);
      const cost = price * soNguoi;
      tongAnUong += cost;
      items.push({
        ngay: day, gio, hangMuc: "Ăn uống", experienceType: "restaurant",
        durationMinutes: request.travelDates ? THOI_LUONG_BUA_AN_PHUT : undefined,
        noiDung: atHotel ? `Sáng: ${tenKhachSan} · Theo thông tin nguồn, có bữa sáng; xác nhận với chỗ ở`
          : place ? `${label}: ${place.ten}${dish ? ` · ${dish}` : request.travelDates ? " · Chưa có dữ liệu món" : ""}${breakfast && !place.gioMoCua ? " · Cần xác nhận giờ mở cửa" : ""}`
          : `${label} ngày ${day} – ${request.travelDates ? "chưa có quán trong dữ liệu, đã dự trù chi phí" : `ước tính (${soNguoi} người)`}`,
        destinationName: atHotel ? tenKhachSan : place?.ten,
        diaChi: atHotel ? khachSanLive?.diaChi : place?.diaChi,
        soLuong: soNguoi, donGia: price, thanhTien: cost,
        refId: atHotel ? selection.hotelId : place?.id ?? null,
        nguon: atHotel ? khachSanLive?.nguon : place?.nguon ?? null,
        doTinCay: place?.doTinCay,
        giaLaUocTinh: !atHotel && (place?.giaUocTinhNguoi == null || place.giaLaUocTinh),
        priceKnown: atHotel ? true : undefined,
      });
    }

    // --- Cafe (tuỳ chọn) ---
    if (bua?.cafe) {
      const selectedCafe = cafeMap.get(bua.cafe);
      const cafeEnd = min2hhmm(hhmm2min(GIO_CA_PHE_SANG) + THOI_LUONG_CA_PHE_PHUT);
      const fitsMorning = (place: Cafe) => dailyOpeningCovers(place.gioMoCua, GIO_CA_PHE_SANG, cafeEnd) !== false;
      const quanCafe = request.travelDates
        ? selectedCafe && fitsMorning(selectedCafe) ? selectedCafe : [...cafeMap.values()].find(fitsMorning)
        : selectedCafe;
      if (request.travelDates && !quanCafe) continue;
      const giaTriCafe = quanCafe?.giaUocTinhNguoi ?? CAFE_MAC_DINH_MOI_NGUOI;
      const thanhTienCafe = giaTriCafe * soNguoi;
      tongAnUong += thanhTienCafe;
      items.push({
        ngay: day,
        gio: scheduleMeal(request.travelDates ? GIO_CA_PHE_SANG : "09:00", THOI_LUONG_CA_PHE_PHUT),
        durationMinutes: request.travelDates ? THOI_LUONG_CA_PHE_PHUT : undefined,
        destinationName: quanCafe?.ten,
        experienceType:"cafe",
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
  const gioKhoiHanhVePhut = hhmm2min(tVe.departureTime);
  const oKhaDungTheoNgay = tinhOKhaDungTheoNgay(soNgay, gioDenNgay1Phut, gioKhoiHanhVePhut);
  const ngayDen = Math.floor(gioDenNgay1Phut / 1440) + 1;

  selection.hoatDongTheoNgay.forEach((dayActs, dayIdx) => {
    const day = dayIdx + 1;
    const soOKhaDungCuaNgay = oKhaDungTheoNgay[dayIdx] ?? 0;
    dayActs.forEach((actId, actIdx) => {
      const act = activityMap.get(actId)!;
      const donGiaVe = (act as any).giaVeNguoi ?? (act as any).pricePerPerson ?? 0;
      const thanhTienAct = donGiaVe * soNguoi;
      let gioDanhNghia: string;
      if (day === 1 && ngayDen === 1) {
        const slotNgay1 = gioOHoatDongNgayDau(gioDenNgay1Phut);
        if (actIdx === 0) {
          gioDanhNghia = slotNgay1 ? min2hhmm(slotNgay1) : min2hhmm(GIO_HOAT_DONG_1);
        } else {
          gioDanhNghia = min2hhmm(GIO_HOAT_DONG_2);
        }
      } else if (day === ngayDen) {
        if (soOKhaDungCuaNgay === 1) {
          gioDanhNghia = min2hhmm(GIO_HOAT_DONG_2);
        } else {
          gioDanhNghia = actIdx === 0 ? min2hhmm(GIO_HOAT_DONG_1) : min2hhmm(GIO_HOAT_DONG_2);
        }
      } else {
        gioDanhNghia = actIdx === 0 ? min2hhmm(GIO_HOAT_DONG_1) : min2hhmm(GIO_HOAT_DONG_2);
      }
      const activityStart = (day - 1) * 1440 + hhmm2min(gioDanhNghia);
      if (request.travelDates && activityStart < Math.max(gioDenNgay1Phut, restEnd)) return;
      if (request.travelDates && hhmm2min(gioDanhNghia) < 12 * 60 &&
          act.thoiLuongPhut > THOI_LUONG_THAM_QUAN_SANG_TOI_DA) return;
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
        destinationName: tenAct,
        experienceType:/museum|bảo tàng/i.test(actAny.loai||tenAct)?"museum":/park|beach|nature|biển|thác|hồ /i.test(actAny.loai||tenAct)?"nature":"attraction",
        durationMinutes:actAny.thoiLuongPhut||60,
        priceKnown:actAny.priceKnown===true,
        soLuong: soNguoi,
        donGia: donGiaVe,
        thanhTien: thanhTienAct,
        refId: act.id,
        nguon: actAny.nguon ?? null,
        doTinCay: actAny.doTinCay,
        giaLaUocTinh: request.travelDates?actAny.priceKnown!==true:actAny.giaLaUocTinh,
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
    noiDung: `Di chuyển chiều về · ${tVe.type === "PLANE" ? "Máy bay" : tVe.type === "TRAIN" ? "Tàu hỏa" : "Xe khách"}: ${tVe.provider} (${tVe.origin} → ${tVe.destination})`,
    soLuong: soNguoi,
    donGia: donGiaVeTransport,
    thanhTien: thanhTienVe,
    refId: tVe.id,originName:tVe.origin,destinationName:tVe.destination,
    nguon: tVe.nguon ?? null,
    doTinCay: tVe.doTinCay,
    giaLaUocTinh: tVe.giaLaUocTinh,
    thoiLuongPhut: tVe.durationMinutes,
  } as any);

  if(request.travelDates){for(let index=items.length-1;index>=0;index--)if(items[index].hangMuc==="Ăn uống"&&!items[index].gio)items.splice(index,1);}
  const sourcePlaces=new Map([...(data.khachSans??[]),...(data.quanAns??[]),...(data.cafes??[]),...(data.hoatDongs??[])].map(place=>[place.id,place]));
  for(const item of items){const place=item.refId?sourcePlaces.get(item.refId):null;if(place){item.diaChi=place.diaChi;item.mapsUrl=buildMapsUrls(place,tenDiemDen).xem;}else if(item.destinationName){item.mapsUrl=buildMapsUrls({ten:item.destinationName,diaChi:item.diaChi},item.hangMuc === "Di chuyển" ? undefined : tenDiemDen).xem;}}
  const routePlaces = [...sourcePlaces.values()];
  let route = estimateLocalRoutes(items, routePlaces, request);
  if (request.travelDates) {
    const cafesThatOverlap = new Set<PlanItem>();
    for (const leg of route.items) {
      if (leg.experienceType !== "local_transfer" || !leg.gio) continue;
      const departure = hhmm2min(leg.gio);
      const arrival = departure + (leg.durationMinutes ?? 0);
      const before = items.filter(item => item.ngay === leg.ngay && item.gio &&
        item.destinationName === leg.originName && hhmm2min(item.gio) <= arrival)
        .sort((a, b) => b.gio!.localeCompare(a.gio!))[0];
      const after = items.find(item => item.ngay === leg.ngay && item.gio &&
        item.destinationName === leg.destinationName && hhmm2min(item.gio) === arrival);
      if (!before?.gio || departure >= hhmm2min(before.gio) + (before.durationMinutes ?? 0)) continue;
      if (before.experienceType === "cafe") cafesThatOverlap.add(before);
      if (after?.experienceType === "cafe") cafesThatOverlap.add(after);
    }
    if (cafesThatOverlap.size) {
      for (let index = items.length - 1; index >= 0; index--) {
        if (cafesThatOverlap.has(items[index])) items.splice(index, 1);
      }
      route = estimateLocalRoutes(items, routePlaces, request);
    }
  }
  if (restEnd) {
    const conflicts = route.items.filter(item => {
      if (item.experienceType !== "local_transfer" || !item.gio) return false;
      const leaveAt = (item.ngay - 1) * 1440 + hhmm2min(item.gio);
      return leaveAt >= checkInAbsolute && leaveAt < restEnd;
    });
    for (const leg of conflicts) {
      const scheduledTime = hhmm2min(leg.gio!) + (leg.durationMinutes ?? 0);
      const index = items.findIndex(item => item.ngay === leg.ngay && item.gio &&
        hhmm2min(item.gio) === scheduledTime && item.destinationName === leg.destinationName &&
        (item.hangMuc === "Ăn uống" || item.hangMuc === "Vui chơi"));
      if (index >= 0) items.splice(index, 1);
    }
    if (conflicts.length) route = estimateLocalRoutes(items, routePlaces, request);
  }
  items.splice(0,items.length,...route.items);
  const theoHangMuc:Record<PlanItemCategory,number>={"Di chuyển":0,"Chỗ ở":0,"Ăn uống":0,"Vui chơi":0};
  for(const item of items)theoHangMuc[item.hangMuc]+=item.thanhTien;

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
    (tDi.durationMinutes ?? 0) + (tVe.durationMinutes ?? 0)+route.minutes;

  const trangThaiNganSach = tongVND > ngansachTongVND ? "vuot" : "trong";

  const canhBao = Array.from(new Set([...request.canhBao,...localRouteWarnings(items)]));
  if (restEnd && arrivalClock + BUFFER_DEN_KHACH_SAN_PHUT < checkIn) {
    canhBao.push("Đến trước giờ nhận phòng dự kiến. Hãy hỏi khách sạn về gửi hành lý hoặc nhận phòng sớm.");
  }
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
