import sample from "@/data/mau/da-nang-3ngay.json";
import { PlanSchema } from "@/contracts";
/** Validated fixture for automated tests only; never imported by the application UI. */
export const DEFAULT_SAMPLE_PLAN = PlanSchema.parse({ ...sample.plan, request: { sothich: [], tranh: [], ghiChu: [], thieu: [], cauHoiLamRo: [], canhBao: [], ...sample.plan.request } });
