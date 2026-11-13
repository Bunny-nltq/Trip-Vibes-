import { z } from "zod";
import { MAX_STORED_TRIP_DAYS } from "@/core/assumptions";

export const schemaVersion = 18;
export const TemplateSlugSchema=z.enum(["da-nang","ha-noi","da-lat","bangkok","seoul"]);

// ─── Destination Job & Category Progress ──────────────────────────────────────

export const CategoryKeySchema = z.enum([
  "khach_san",
  "quan_an",
  "cafe",
  "hoat_dong",
  "phuong_tien",
  "gia_diem_den",
]);
export type CategoryKey = z.infer<typeof CategoryKeySchema>;

export const CategoryStatusSchema = z.enum(["cho", "dang_chay", "xong", "thieu", "loi"]);
export type CategoryStatus = z.infer<typeof CategoryStatusSchema>;

export interface CategoryProgress {
  trangThai: CategoryStatus;
  soMuc?: number;
  mayChu?: string;
  ms?: number;
  lyDo?: string;
}

export const JobStatusSchema = z.enum(["cho", "dang_chay", "san_sang", "thieu", "loi"]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

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

export const MissingFieldSchema = z.enum(["soNguoi", "soNgay", "ngansach", "diemDen"]);
export type MissingField = z.infer<typeof MissingFieldSchema>;

// ─── Điểm đến & Tọa độ ────────────────────────────────────────────────────────

export const DiemDenSchema = z.object({
  ten: z.string(),
  quocGia: z.string(),
  maQuocGia: z.string(), // mã ISO 2 ký tự (VN, TH, KR, JP, ...)
  toaDo: z.object({ lat: z.number(), lng: z.number() }),
  tienTe: z.string(), // mã ISO (VND, THB, USD, ...)
  nguon: z.enum(["nominatim", "danh_sach_co_dinh"]),
  ngayLay: z.string(),
});
export type DiemDen = z.infer<typeof DiemDenSchema>;

export const DEFAULT_DIEM_DI: DiemDen = {
  ten: "TP.HCM",
  quocGia: "Việt Nam",
  maQuocGia: "VN",
  toaDo: { lat: 10.7769, lng: 106.7009 },
  tienTe: "VND",
  nguon: "nominatim",
  ngayLay: "2026-10-19T00:00:00.000Z",
};

// ─── Giá gốc & Tỷ giá ─────────────────────────────────────────────────────────

export const GiaGocSchema = z.object({
  soTien: z.number(),
  tienTe: z.string(),
  tyGia: z.number(),
  ngayTyGia: z.string(),
});
export type GiaGoc = z.infer<typeof GiaGocSchema>;

// ─── Độ tin cậy nguồn dữ liệu ────────────────────────────────────────────────

export const DoTinCaySchema = z.enum([
  "xac_minh",        // lấy trực tiếp từ nguồn chính thức, khớp hoàn toàn
  "uoc_tinh",        // ước lượng từ nhiều nguồn web, có thể sai lệch
  "tham_khao",       // lấy từ dữ liệu tham khảo tĩnh (snapshot/mock)
  "mau",             // dữ liệu mẫu cứng, không từ bất kỳ nguồn thực nào
  "nguoi_dung_nhap", // người dùng tự nhập thủ công khi không tìm thấy phương án
]);
export type DoTinCay = z.infer<typeof DoTinCaySchema>;

// ─── Place chung (base cho QuanAn, Cafe, HoatDong, KhachSan) ─────────────────

export const VenueTypeSchema=z.enum(["hotel","resort","villa","homestay","apartment","guest_house","restaurant","eatery","cafe","museum","memorial","monument","heritage","tourist_attraction","amusement_park","park","beach","viewpoint","gallery","unknown"]);
export const VenueDetailsSchema=z.object({
 websiteStatus:z.enum(["verified","reachable_unverified","unavailable","unknown"]).optional(),websiteCheckedAt:z.string().optional(),
 verifiedSource:z.string().url().optional(),verifiedAt:z.string().optional(),bookingUnit:z.enum(["room","entire_property","mixed","unknown"]).optional(),
 venueType:VenueTypeSchema.optional(),description:z.string().max(4000).nullable().optional(),phone:z.string().max(160).nullable().optional(),website:z.string().url().nullable().optional(),cuisine:z.string().nullable().optional(),wheelchair:z.enum(["yes","no","limited","unknown"]).optional(),addressStatus:z.enum(["specific","partial","missing"]).optional(),
});
export const PlaceBaseSchema = VenueDetailsSchema.extend({
  priceKnown:z.boolean().optional(),
  id: z.string(),
  osmId: z.string().nullable(),
  ten: z.string(),
  khuVuc: z.string(),
  diaChi: z.string().nullable(),
  toaDo: z.object({ lat: z.number(), lng: z.number() }),
  loai: z.string(),
  gioMoCua: z.string().nullable(),
  soSao: z.number().nullable(),               // chỉ khách sạn (OSM tag stars)
  giaUocTinhNguoi: z.number().int().nonnegative().safe().nullable(),
  giaGoc: GiaGocSchema.optional(),
  nguon: z.string().nullable(),               // url hoặc osmId; null nếu không có
  ngayLay: z.string(),                        // ISO datetime
  doTinCay: DoTinCaySchema,
  giaLaUocTinh: z.boolean(),
});
export type PlaceBase = z.infer<typeof PlaceBaseSchema>;

export const QuanAnSchema = PlaceBaseSchema.extend({
  loai: z.literal("quan_an"),
  amThuc: z.string().nullable(),             // cuisine tag từ OSM
});
export type QuanAn = z.infer<typeof QuanAnSchema>;

export const CafeSchema = PlaceBaseSchema.extend({
  loai: z.literal("cafe"),
});
export type Cafe = z.infer<typeof CafeSchema>;

export const HoatDongSchema = PlaceBaseSchema.extend({
  loai: z.string(),                          // attraction | museum | viewpoint | beach | ...
  giaVeNguoi: z.number().int().nonnegative().safe(), // alias của giaUocTinhNguoi cho backward compat
  thoiLuongPhut: z.number().int().positive(),
  nhan: z.array(PreferenceSchema),
  dongNguoi: z.boolean(),
  diBoNhieu: z.boolean(),
  mapsUrls: z.object({
    xem: z.string(),
    chiDuong: z.string(),
    apple: z.string(),
  }).optional(),
});
export type HoatDong = z.infer<typeof HoatDongSchema>;

export const AccommodationTypeSchema=z.enum(["hotel","resort","villa","homestay","apartment","guest_house","unknown"]);
export const KhachSanSchema = PlaceBaseSchema.extend({
  accommodationType:AccommodationTypeSchema.optional(),
  loai: z.literal("khach_san"),
  soSao: z.number().nullable(),
  khoangGiaDemVND: z.object({
    min: z.number().int().nonnegative().safe(),
    max: z.number().int().nonnegative().safe(),
  }).nullable(),
  includesBreakfast: z.boolean(),
  hasPool: z.boolean(),
  mapsUrls: z.object({
    xem: z.string(),
    chiDuong: z.string(),
    apple: z.string(),
  }).optional(),
  nguonGia: z.array(z.string()),             // list url nguồn giá
});
export type KhachSan = z.infer<typeof KhachSanSchema>;

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

export const TravelDatesSchema = z.object({
 departureDate:z.string().date(), returnDate:z.string().date(),
 departureTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
 returnTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
}).refine(value=>value.returnDate>=value.departureDate,{message:"Ngày về phải từ ngày đi trở đi"});
export const TravelModeSchema=z.enum(["auto","PLANE","TRAIN","BUS"]);
export const LocalTravelModeSchema=z.enum(["taxi","motorbike","car","transit","walking"]);

export const TripRequestSchema = z.object({
  travelDates:TravelDatesSchema.optional(),
  transportMode:TravelModeSchema.optional(),
  localTransportMode:LocalTravelModeSchema.optional(),
  reservePercent:z.number().int().min(0).max(30).optional(),
  schemaVersion: z.number().int().default(schemaVersion),
  diemDi: z.union([DiemDenSchema, z.string()]).default(DEFAULT_DIEM_DI),
  diemDen: z.union([DiemDenSchema, z.string()]).nullable(),
  soNgay: z.number().int().positive().safe().max(MAX_STORED_TRIP_DAYS).nullable(),
  soNguoi: z.number().int().nullable(),
  /** Ngân sách tổng tính bằng VND (số nguyên), null nếu thiếu thông tin ngân sách */
  ngansachTongVND: z.number().int().nullable(),
  sothich: z.array(PreferenceSchema),
  tranh: z.array(AvoidanceSchema),
  ghiChu: z.array(z.string()),
  thieu: z.array(MissingFieldSchema),
  cauHoiLamRo: z.array(z.string()),
  canhBao: z.array(z.string()),
  giaVeTuNhap: z.object({
    chieuDiVND: z.number().int().nonnegative().safe(),
    chieuVeVND: z.number().int().nonnegative().safe(),
  }).optional(),
});
export type TripRequest = z.infer<typeof TripRequestSchema>;

export function getDiemDenTen(diemDen: DiemDen | string | null | undefined): string {
  if (!diemDen) return "";
  if (typeof diemDen === "string") return diemDen;
  return diemDen.ten;
}

// ─── Hotel (legacy, giữ để backward compat với mock JSON) ──────────────────

export const HotelSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  id: z.string(),
  name: z.string(),
  stars: z.number().int().min(1).max(5),
  /** Giá mỗi đêm, VND, số nguyên */
  pricePerNight: z.number().int().nonnegative().safe(),
  area: z.string(),
  includesBreakfast: z.boolean(),
  hasPool: z.boolean(),
  openingDate: z.string().optional(), // ISO date string YYYY-MM-DD
  rating: z.number().min(0).max(10),
  reviewCount: z.number().int().nonnegative().safe(),
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
  /** Chiều di chuyển: "di" = điểm đi -> điểm đến, "ve" = điểm đến -> điểm đi */
  huong: TransportDirectionSchema,
  type: TransportTypeSchema,
  provider: z.string(),
  origin: z.string(),
  destination: z.string(),
  departureTime: z.string(), // HH:mm (giờ đi)
  arrivalTime: z.string().optional(), // HH:mm (giờ đến)
  durationMinutes: z.number().int().positive(), // thời lượng tính bằng phút
  /** Giá mỗi người, VND, số nguyên */
  pricePerPerson: z.number().int().nonnegative().safe(),
  seatClass: z.string(),
  boardingPoint: z.string(),
  dropOffPoint: z.string(),
  notes: z.string().optional(),
  // ─── Bước 5B: nguồn dữ liệu ───
  nguon: z.string().nullable().optional(),
  ngayLay: z.string().optional(),
  doTinCay: DoTinCaySchema.optional(),
  giaLaUocTinh: z.boolean().optional(),
  nguonGia: z.array(z.string()).optional(),
  giaGoc: GiaGocSchema.optional(),
});

export type Transport = z.infer<typeof TransportSchema>;

// ─── Activity (legacy) ────────────────────────────────────────────────────────

export const ActivitySchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  id: z.string(),
  ten: z.string(),
  khuVuc: z.string(),
  /** Giá vé mỗi người, VND, số nguyên */
  giaVeNguoi: z.number().int().nonnegative().safe(),
  thoiLuongPhut: z.number().int().positive(),
  tuKhoaBanDo: z.string(),
  nhan: z.array(PreferenceSchema),
  dongNguoi: z.boolean(),
  diBoNhieu: z.boolean(),
  // Tương thích thêm nếu có
  name: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  pricePerPerson: z.number().int().nonnegative().safe().optional(),
  durationMinutes: z.number().int().positive().optional(),
  description: z.string().optional(),
  openHours: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type Activity = z.infer<typeof ActivitySchema>;

// ─── Selection (Đầu ra của AI Agent) ─────────────────────────────────────────

/** Bữa ăn theo từng ngày (trưa, tối, cafe) – id của QuanAn/Cafe hoặc null */
export const BuaAnSchema = z.object({
  trua: z.string().nullable(),
  toi: z.string().nullable(),
  cafe: z.string().nullable(),
});
export type BuaAn = z.infer<typeof BuaAnSchema>;

export const SelectionSchema = z.object({
  transportDiId: z.string(),
  transportVeId: z.string(),
  hotelId: z.string(),
  hoatDongTheoNgay: z.array(z.array(z.string())),
  /** Bữa ăn theo từng ngày; độ dài bằng soNgay */
  buaAnTheoNgay: z.array(BuaAnSchema).optional(),
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
  originName:z.string().optional(),originAddress:z.string().nullable().optional(),destinationName:z.string().optional(),
  diaChi:z.string().nullable().optional(),
  experienceType:z.enum(["cafe","museum","attraction","nature","entertainment","restaurant","local_transfer"]).optional(),
  id: z.string().optional(),
  state: z.enum(["pending", "visited", "skipped", "closed"]).optional(),
  locked: z.boolean().optional(),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  priceKnown: z.boolean().optional(),
  leg: z.string().max(150).optional(),
  /** Ngày trong chuyến đi (1..soNgay) */
  ngay: z.number().int().positive(),
  /** Giờ bắt đầu danh nghĩa (HH:mm) hoặc null */
  gio: z.string().nullable(),
  hangMuc: PlanItemCategorySchema,
  noiDung: z.string(),
  soLuong: z.number().int().positive(),
  /** Đơn giá VND, số nguyên */
  donGia: z.number().int().nonnegative().safe(),
  /** Thành tiền = donGia * soLuong, VND, số nguyên */
  thanhTien: z.number().int().nonnegative().safe(),
  /** ID tham chiếu trong data, null với hạng mục Ăn uống tổng hợp */
  refId: z.string().nullable(),
  /** URL Google Maps xem địa điểm (nếu có) */
  mapsUrl: z.string().optional(),
  /** Nguồn dữ liệu (url hoặc osmId) */
  nguon: z.string().nullable().optional(),
  doTinCay: DoTinCaySchema.optional(),
  giaLaUocTinh: z.boolean().optional(),
  giaGoc: GiaGocSchema.optional(),
  nhan: z.array(PreferenceSchema).optional(),
});
export type PlanItem = z.infer<typeof PlanItemSchema>;

export const PlanTongKetSchema = z.object({
  /** Tổng chi phí VND, số nguyên */
  tongVND: z.number().int().nonnegative().safe(),
  /** Ngân sách còn lại VND (ngansachTongVND - tongVND) */
  conLaiVND: z.number().int(),
  /** Phần trăm ngân sách đã dùng (làm tròn 1 chữ số thập phân) */
  phanTramDaDung: z.number(),
  /** Chi phí theo từng hạng mục */
  theoHangMuc: z.record(PlanItemCategorySchema, z.number().int().nonnegative().safe()),
  /** Tổng thời gian di chuyển chiều đi + chiều về (phút) */
  tongThoiGianDiChuyenPhut: z.number().int().nonnegative().safe(),
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
  /** Nguồn dữ liệu đã sử dụng: "live" | "snapshot" | "mock" */
  dataSourceUsed: z.string().optional(),
  /** Phương thức lập kế hoạch: "ai" hoặc "quy_tac" */
  phuongThucLap: z.enum(["ai", "quy_tac"]).optional(),
  /** Lý do dự phòng nếu dùng quy tắc */
  lyDoDuPhong: z
    .enum([
      "het_luot_ai",
      "qua_thoi_gian",
      "loi_mang_ai",
      "ai_khong_sua_duoc_ngan_sach",
      "vuot_so_luot_goi_ai",
      "gioi_han_luot_ai",
      "gioi_han_ip",
      "gioi_han_ngay",
      "live_ai_tat",
    ])
    .optional(),
});
export type Plan = z.infer<typeof PlanSchema>;

export const BudgetAlternativeSchema = z.object({
  plan: PlanSchema,
  changes: z.array(z.enum(["shorter", "flexible_transport", "public_transit"])).min(1),
});
export type BudgetAlternative = z.infer<typeof BudgetAlternativeSchema>;


// ─── Bills & Expenses (Tính năng Quản lý chi tiêu) ──────────────────────────

export const ExpenseCategorySchema = z.enum([
  "an_uong",
  "vui_choi",
  "di_chuyen",
  "cho_o",
  "khac",
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

export const BillExtractionRawSchema = z.object({
  laChungTu: z.boolean(),
  loaiChungTu: z.enum(["hoa_don", "ve", "khac"]).nullable(),
  tenCuaHang: z.string().nullable(),
  ngay: z.string().nullable(), // ISO YYYY-MM-DD
  tongTienVND: z.number().int().nullable(),
  tamTinhVND: z.number().int().nullable(),
  giamGiaVND: z.number().int().nullable(),
  phuThuVND: z.number().int().nullable(),
  thueVND: z.number().int().nonnegative().safe().nullable(),
  dongChiTiet: z.array(
    z.object({
      ten: z.string(),
      soLuong: z.number().int().nullable(),
      thanhTienVND: z.number().int().nullable(),
    })
  ),
  hangMucGoiY: ExpenseCategorySchema.nullable(),
  doTinCay: z.enum(["cao", "trung_binh", "thap"]),
  ghiChu: z.array(z.string()),
});
export type BillExtractionRaw = z.infer<typeof BillExtractionRawSchema>;

export const BillExtractionSchema = BillExtractionRawSchema.extend({
  status: z.enum(["can_xac_nhan", "khong_phai_chung_tu", "khong_doc_duoc_so_tien"]),
  khopCacDong: z.boolean().nullable(),
  chenhLechVND: z.number().nullable(),
  canhBao: z.array(z.string()),
});
export type BillExtraction = z.infer<typeof BillExtractionSchema>;

export const ExpenseSchema = z.object({
  id: z.string(),
  nguon: z.enum(["anh_bill", "nhap_tay"]),
  tenCuaHang: z.string().nullable(),
  ngay: z.string().nullable(),
  ngayTrongChuyen: z.number().int().positive().safe().nullable(),
  hangMuc: ExpenseCategorySchema,
  soTienVND: z.number().int().positive().safe(),
  giaTriAIDoc: z.number().int().nullable(),
  daSuaTay: z.boolean(),
  ghiChu: z.string().nullable(),
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const LedgerSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  expenses: z.array(ExpenseSchema),
});
export type Ledger = z.infer<typeof LedgerSchema>;

// ─── Người dùng & Nhật ký Chuyến đi đã lưu ──────────────────────────────────

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string(),
  profile: z.object({
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    gender: z.enum(["female", "male", "other", "undisclosed"]).optional(),
    interests: z.array(z.string().min(1).max(60)).max(20).optional(),
    personalize: z.boolean().optional(),
  }).optional(),
});
export type User = z.infer<typeof UserSchema>;

export const SavedTripSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  diemDi: z.string(),
  diemDen: z.string(),
  soNgay: z.number().int(),
  soNguoi: z.number().int(),
  nganSachDuKienVND: z.number().int(),
  tongChiPhiKeHoachVND: z.number().int(),
  tongChiTieuThucTeVND: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  plan: PlanSchema,
  ledger: LedgerSchema,
  tickedPlaces: z.record(z.boolean()).default({}),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
  version: z.number().int().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  journal: z.string().max(10000).optional(),
});
export type SavedTrip = z.infer<typeof SavedTripSchema>;

export * from "./destinations";



// Requests are normalized at the server boundary; aliases preserve existing clients.
export const LoginInputSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});
export const RegisterInputSchema = LoginInputSchema.extend({
  name: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(128),
});
export const ProfileInputSchema = UserSchema.shape.profile.unwrap();
export const TripWriteSchema = SavedTripSchema.pick({title:true, plan:true, ledger:true, tickedPlaces:true, status:true, startDate:true, journal:true}).extend({
  title: z.string().trim().min(1).max(200).optional(),
});
export const TripUpdateSchema = TripWriteSchema.partial().extend({id:z.string().min(1),version:z.number().int().positive()});

export const PlaceSuggestionSchema = z.object({
  id:z.string(), name:z.string(), kind:z.enum(["cafe","activity","restaurant"]),
  latitude:z.number().min(-90).max(90), longitude:z.number().min(-180).max(180),
  price:z.number().int().nonnegative().safe().nullable(), duration:z.number().int().positive(),
  address:z.string().nullable().optional(),mapsUrl:z.string().optional(),venueType:VenueTypeSchema.optional(),description:z.string().nullable().optional(),
  source:z.string(), fetchedAt:z.string(), openingHours:z.string().nullable(),
  distanceKm:z.number().nonnegative().nullable(), reason:z.string(),
});
export type PlaceSuggestion = z.infer<typeof PlaceSuggestionSchema>;
export const NearbyInputSchema = z.object({
  destination:z.string().trim().min(1).max(200), kind:z.enum(["cafe","activity","restaurant"]),
  latitude:z.number().min(-90).max(90).optional(), longitude:z.number().min(-180).max(180).optional(),
  people:z.number().int().min(1).max(20).default(1),
  exclude:z.array(z.string()).max(2000).default([]), budget:z.number().nonnegative().optional(),
  minutes:z.number().positive().optional(), interests:z.array(z.string().max(60)).max(20).default([]),
});
export const NearbyResultSchema = z.object({ok:z.boolean(), suggestions:z.array(PlaceSuggestionSchema), method:z.enum(["rules","ai"]), note:z.string()});
export const MapsReferenceSchema = z.object({
  url:z.string().url(), name:z.string().nullable(), latitude:z.number().nullable(),longitude:z.number().nullable(),placeId:z.string().nullable(),needsConfirmation:z.literal(true),
});

// Public hotel facts: only fields actually present in the upstream data.
export const HotelPublicDetailsSchema=VenueDetailsSchema.merge(KhachSanSchema.pick({id:true,ten:true,includesBreakfast:true,hasPool:true,accommodationType:true})).extend({
 diaChi:PlaceBaseSchema.shape.diaChi.optional(),toaDo:PlaceBaseSchema.shape.toaDo.optional(),gioMoCua:PlaceBaseSchema.shape.gioMoCua.optional(),ngayLay:PlaceBaseSchema.shape.ngayLay.optional(),nguon:PlaceBaseSchema.shape.nguon.optional(),
 praised:HotelSchema.shape.praised.optional(),watchOut:HotelSchema.shape.watchOut.optional(),tip:HotelSchema.shape.tip,
});
export type HotelPublicDetails=z.infer<typeof HotelPublicDetailsSchema>;

export const VenuePublicSchema=VenueDetailsSchema.extend({id:z.string(),name:z.string(),city:z.string(),type:VenueTypeSchema,group:z.enum(["accommodation","dining","cafe","experience"]),address:z.string().nullable(),mapsUrl:z.string().url(),directionsUrl:z.string().url(),source:z.string(),sourceUrl:z.string().url(),fetchedAt:z.string(),openingHours:z.string().nullable(),accommodationStars:z.number().nullable(),price:z.number().nonnegative().nullable(),priceEstimated:z.boolean()});
export type VenuePublic=z.infer<typeof VenuePublicSchema>;
export const VenueCatalogResultSchema=z.object({ok:z.literal(true),cities:z.array(z.string()),places:z.array(VenuePublicSchema),total:z.number().int().nonnegative(),offset:z.number().int().nonnegative(),limit:z.number().int().positive()});
export const VenueCatalogInputSchema=z.object({city:z.string().trim().max(150).default(""),type:z.union([VenueTypeSchema,z.enum(["all","accommodation","dining","experience"])]).default("all"),query:z.string().trim().max(150).default(""),offset:z.coerce.number().int().min(0).default(0),limit:z.coerce.number().int().min(1).max(60).default(24)});

export const WebsiteBusinessSchema=z.object({name:z.string().max(500),"@type":z.union([z.string(),z.array(z.string()).max(20)]),telephone:z.string().max(160).optional(),address:z.object({streetAddress:z.string().max(300).optional(),addressLocality:z.string().max(150).optional(),addressRegion:z.string().max(150).optional(),postalCode:z.string().max(30).optional(),addressCountry:z.union([z.string(),z.object({name:z.string()})]).optional()}).passthrough().optional()}).passthrough();
