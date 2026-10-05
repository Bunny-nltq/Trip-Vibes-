import { z } from "zod";

export const schemaVersion = 4;

// ─── Enums cho TripRequest & Activity ────────────────────────────────────────

export const PreferenceSchema = z.enum([
  "bien",
  "am_thuc",
  "hai_san",
  "van_hoa_lich_su",
  "thien_nhien",
  "giai_tri_vui_choi",
  "thu_gian_spa",
  "check_in_chup_anh",
  "mua_sam",
]);
export type Preference = z.infer<typeof PreferenceSchema>;

export const AvoidanceSchema = z.enum([
  "khong_day_som",
  "khong_di_dem",
  "tranh_di_chuyen_lau",
  "tranh_dong_nguoi",
  "tranh_di_bo_nhieu",
]);
export type Avoidance = z.infer<typeof AvoidanceSchema>;

export const MissingFieldSchema = z.enum(["soNguoi", "soNgay", "ngansach"]);
export type MissingField = z.infer<typeof MissingFieldSchema>;

// ─── RawTripRequest (đầu ra LLM) ─────────────────────────────────────────────

export const RawBudgetSchema = z.object({
  /** Số tiền VND, số nguyên hoặc null nếu chưa có con số cụ thể */
  soTien: z.number().int().nullable(),
  /** "tong" (tổng cho cả nhóm) hoặc "moi_nguoi" (tính theo từng người) */
  theo: z.enum(["tong", "moi_nguoi"]).nullable(),
});
export type RawBudget = z.infer<typeof RawBudgetSchema>;

export const RawTripRequestSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  diemDi: z.string().nullable(),
  diemDen: z.string().nullable(),
  soNgay: z.number().int().nullable(),
  soNguoi: z.number().int().nullable(),
  ngansach: RawBudgetSchema,
  sothich: z.array(PreferenceSchema),
  tranh: z.array(AvoidanceSchema),
  ghiChu: z.array(z.string()),
  thieu: z.array(MissingFieldSchema),
  cauHoiLamRo: z.array(z.string()),
});
export type RawTripRequest = z.infer<typeof RawTripRequestSchema>;

// ─── TripRequest (kết quả chuẩn hoá cuối cùng) ────────────────────────────────

export const TripRequestSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  diemDi: z.string(),
  diemDen: z.string(),
  soNgay: z.number().int().nullable(),
  soNguoi: z.number().int().nullable(),
  /** Ngân sách tổng tính bằng VND (số nguyên), null nếu thiếu thông tin ngân sách */
  ngansachTongVND: z.number().int().nullable(),
  sothich: z.array(PreferenceSchema),
  tranh: z.array(AvoidanceSchema),
  ghiChu: z.array(z.string()),
  thieu: z.array(MissingFieldSchema),
  cauHoiLamRo: z.array(z.string()),
  canhBao: z.array(z.string()),
});
export type TripRequest = z.infer<typeof TripRequestSchema>;

// ─── Hotel ───────────────────────────────────────────────────────────────────

export const HotelSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  id: z.string(),
  name: z.string(),
  stars: z.number().int().min(1).max(5),
  /** Giá mỗi đêm, VND, số nguyên */
  pricePerNight: z.number().int().nonnegative(),
  area: z.string(),
  includesBreakfast: z.boolean(),
  hasPool: z.boolean(),
  openingDate: z.string().optional(), // ISO date string YYYY-MM-DD
  rating: z.number().min(0).max(10),
  reviewCount: z.number().int().nonnegative(),
  source: z.string().optional(),
  retrievedAt: z.string().optional(), // ISO date string
  praised: z.array(z.string()),
  watchOut: z.array(z.string()),
  tip: z.string().optional(),
});

export type Hotel = z.infer<typeof HotelSchema>;

// ─── Transport ───────────────────────────────────────────────────────────────

export const TransportTypeSchema = z.enum(["PLANE", "TRAIN", "BUS"]);
export type TransportType = z.infer<typeof TransportTypeSchema>;

export const TransportDirectionSchema = z.enum(["di", "ve"]);
export type TransportDirection = z.infer<typeof TransportDirectionSchema>;

export const TransportSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  id: z.string(),
  /** Chiều di chuyển: "di" = TP.HCM -> Đà Nẵng, "ve" = Đà Nẵng -> TP.HCM */
  huong: TransportDirectionSchema,
  type: TransportTypeSchema,
  provider: z.string(),
  origin: z.string(),
  destination: z.string(),
  departureTime: z.string(), // HH:mm (giờ đi)
  arrivalTime: z.string().optional(), // HH:mm (giờ đến)
  durationMinutes: z.number().int().positive(), // thời lượng tính bằng phút
  /** Giá mỗi người, VND, số nguyên */
  pricePerPerson: z.number().int().nonnegative(),
  seatClass: z.string(),
  boardingPoint: z.string(),
  dropOffPoint: z.string(),
  notes: z.string().optional(),
});

export type Transport = z.infer<typeof TransportSchema>;

// ─── Activity ────────────────────────────────────────────────────────────────

export const ActivitySchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  id: z.string(),
  ten: z.string(),
  khuVuc: z.string(),
  /** Giá vé mỗi người, VND, số nguyên */
  giaVeNguoi: z.number().int().nonnegative(),
  thoiLuongPhut: z.number().int().positive(),
  tuKhoaBanDo: z.string(),
  nhan: z.array(PreferenceSchema),
  dongNguoi: z.boolean(),
  diBoNhieu: z.boolean(),
  // Tương thích thêm nếu có
  name: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  pricePerPerson: z.number().int().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional(),
  description: z.string().optional(),
  openHours: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type Activity = z.infer<typeof ActivitySchema>;

// ─── Selection (Đầu ra của AI Agent) ─────────────────────────────────────────

export const SelectionSchema = z.object({
  transportDiId: z.string(),
  transportVeId: z.string(),
  hotelId: z.string(),
  hoatDongTheoNgay: z.array(z.array(z.string())),
});
export type Selection = z.infer<typeof SelectionSchema>;

// ─── Plan (Kế hoạch hoàn chỉnh sau khi code tính toán) ────────────────────────

export const PlanItemCategorySchema = z.enum([
  "Di chuyển",
  "Chỗ ở",
  "Ăn uống",
  "Vui chơi",
]);
export type PlanItemCategory = z.infer<typeof PlanItemCategorySchema>;

export const PlanItemSchema = z.object({
  /** Ngày trong chuyến đi (1..soNgay) */
  ngay: z.number().int().positive(),
  /** Giờ bắt đầu danh nghĩa (HH:mm) hoặc null */
  gio: z.string().nullable(),
  hangMuc: PlanItemCategorySchema,
  noiDung: z.string(),
  soLuong: z.number().int().positive(),
  /** Đơn giá VND, số nguyên */
  donGia: z.number().int().nonnegative(),
  /** Thành tiền = donGia * soLuong, VND, số nguyên */
  thanhTien: z.number().int().nonnegative(),
  /** ID tham chiếu trong mock data, null với hạng mục Ăn uống */
  refId: z.string().nullable(),
});
export type PlanItem = z.infer<typeof PlanItemSchema>;

export const PlanTongKetSchema = z.object({
  /** Tổng chi phí VND, số nguyên */
  tongVND: z.number().int().nonnegative(),
  /** Ngân sách còn lại VND (ngansachTongVND - tongVND) */
  conLaiVND: z.number().int(),
  /** Phần trăm ngân sách đã dùng (làm tròn 1 chữ số thập phân) */
  phanTramDaDung: z.number(),
  /** Chi phí theo từng hạng mục */
  theoHangMuc: z.record(PlanItemCategorySchema, z.number().int().nonnegative()),
  /** Tổng thời gian di chuyển chiều đi + chiều về (phút) */
  tongThoiGianDiChuyenPhut: z.number().int().nonnegative(),
  /** Trạng thái ngân sách: "trong" nếu tongVND <= ngansachTongVND, "vuot" nếu vượt */
  trangThaiNganSach: z.enum(["trong", "vuot"]),
});
export type PlanTongKet = z.infer<typeof PlanTongKetSchema>;

export const PlanSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  request: TripRequestSchema,
  items: z.array(PlanItemSchema),
  tongKet: PlanTongKetSchema,
  canhBao: z.array(z.string()),
});
export type Plan = z.infer<typeof PlanSchema>;
