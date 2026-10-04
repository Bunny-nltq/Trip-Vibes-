import { z } from "zod";

export const schemaVersion = 1;

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

// ─── TripRequest ─────────────────────────────────────────────────────────────

export const TripRequestSchema = z.object({
  schemaVersion: z.number().int().default(schemaVersion),
  numDays: z.number().int().positive(),
  numPeople: z.number().int().positive(),
  /** Ngân sách tổng, VND, số nguyên */
  budgetVnd: z.number().int().positive(),
  preferences: z.array(z.string()),
  avoidances: z.array(z.string()),
});

export type TripRequest = z.infer<typeof TripRequestSchema>;

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
