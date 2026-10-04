import { z } from "zod";

export const schemaVersion = 2;

// ─── Enums cho TripRequest ───────────────────────────────────────────────────

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

export const TransportSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  id: z.string(),
  type: TransportTypeSchema,
  provider: z.string(),
  origin: z.string(),
  destination: z.string(),
  departureTime: z.string(), // HH:mm
  arrivalTime: z.string(),   // HH:mm
  durationMinutes: z.number().int().positive(),
  /** Giá mỗi người, VND, số nguyên */
  pricePerPerson: z.number().int().nonnegative(),
  seatClass: z.string(),
  boardingPoint: z.string(),
  dropOffPoint: z.string(),
  notes: z.string().optional(),
});

export type Transport = z.infer<typeof TransportSchema>;

// ─── Activity ────────────────────────────────────────────────────────────────

export const ActivityCategorySchema = z.enum([
  "FOOD_AND_DRINK",
  "SIGHTSEEING",
  "ADVENTURE",
  "CULTURE",
  "SHOPPING",
  "RELAXATION",
]);
export type ActivityCategory = z.infer<typeof ActivityCategorySchema>;

export const ActivitySchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  id: z.string(),
  name: z.string(),
  category: ActivityCategorySchema,
  location: z.string(),
  /** Giá vé/suất, VND, số nguyên */
  pricePerPerson: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive(),
  description: z.string(),
  openHours: z.string().optional(),
  tags: z.array(z.string()),
});

export type Activity = z.infer<typeof ActivitySchema>;

// ─── Plan ────────────────────────────────────────────────────────────────────

export const PlanItemCategorySchema = z.enum([
  "Di chuyển",
  "Chỗ ở",
  "Ăn uống",
  "Vui chơi",
]);
export type PlanItemCategory = z.infer<typeof PlanItemCategorySchema>;

export const PlanItemSchema = z.object({
  category: PlanItemCategorySchema,
  name: z.string(),
  description: z.string().optional(),
  /** Đơn giá VND, số nguyên */
  unitPriceVnd: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  /** Thành tiền = unitPriceVnd * quantity, VND, số nguyên */
  totalPriceVnd: z.number().int().nonnegative(),
});

export type PlanItem = z.infer<typeof PlanItemSchema>;

export const PlanDaySchema = z.object({
  day: z.number().int().positive(),
  items: z.array(PlanItemSchema),
});

export type PlanDay = z.infer<typeof PlanDaySchema>;

export const PlanSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  request: TripRequestSchema,
  days: z.array(PlanDaySchema),
  /** Tổng chi phí VND, số nguyên */
  totalCostVnd: z.number().int().nonnegative(),
  notes: z.string().optional(),
});

export type Plan = z.infer<typeof PlanSchema>;
