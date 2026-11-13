import { describe, it, expect } from "vitest";
import { parseMapsReference } from "./mapsReference";
import { recalculatePlan, validateWorkspace, tripStatistics, ledgerTotal, nextTripIdeas, createManualTrip } from "./tripWorkspace";
import { rankNearby } from "./nearby";
import { PlanSchema, PlanItemSchema, TripRequestSchema, ExpenseSchema, schemaVersion, type PlaceSuggestion } from "@/contracts";
import sample from "@/data/mau/da-nang-3ngay.json";
const DEFAULT_SAMPLE_PLAN = PlanSchema.parse({ ...sample.plan, request: { sothich: [], tranh: [], ghiChu: [], thieu: [], cauHoiLamRo: [], canhBao: [], ...sample.plan.request } });
describe("V2 itinerary integrity", () => {
    it("supports one day and trips over seven days, including expense day 30", () => {
        for (const days of [1, 8, 14, 30])
            expect(TripRequestSchema.safeParse({ ...DEFAULT_SAMPLE_PLAN.request, soNgay: days }).success).toBe(true);
        expect(TripRequestSchema.safeParse({ ...DEFAULT_SAMPLE_PLAN.request, soNgay: 0 }).success).toBe(false);
        expect(ExpenseSchema.safeParse({ id: "x", nguon: "nhap_tay", tenCuaHang: "Cafe", ngay: null, ngayTrongChuyen: 30, hangMuc: "an_uong", soTienVND: 50000, giaTriAIDoc: null, daSuaTay: false, ghiChu: null }).success).toBe(true);
    });
    it("recalculates totals rather than trusting stale item totals and reports overlap/unknown price", () => {
        const item = PlanItemSchema.parse({ ngay: 1, gio: "10:00", hangMuc: "Vui chơi", noiDung: "Place", soLuong: 2, donGia: 100000, thanhTien: 999999, refId: null, priceKnown: false, durationMinutes: 90 });
        const plan = recalculatePlan(DEFAULT_SAMPLE_PLAN, [item, { ...item, gio: "11:00", donGia: 0 }]);
        expect(plan.tongKet.tongVND).toBe(200000);
        expect(plan.items[0].thanhTien).toBe(200000);
        expect(plan.canhBao).toContain("workspace_time_overlap");
        expect(plan.canhBao).toContain("workspace_missing_prices");
        expect(validateWorkspace(plan, { schemaVersion, expenses: [] })).toBe(true);
        expect(validateWorkspace({ ...plan, items: [{ ...item, ngay: 99 }] }, { schemaVersion, expenses: [] })).toBe(false);
    });
    it("computes statistics from actual ledger amounts and excludes cancelled trips", () => {
        const ledger = { schemaVersion, expenses: [ExpenseSchema.parse({ id: "x", nguon: "nhap_tay", tenCuaHang: "Cafe", ngay: "2026-10-26", ngayTrongChuyen: 1, hangMuc: "an_uong", soTienVND: 50000, giaTriAIDoc: null, daSuaTay: false, ghiChu: null })] };
        expect(ledgerTotal(ledger)).toBe(50000);
        const stats = tripStatistics([{ status: "completed", ledger }, { status: "cancelled", ledger }] as Parameters<typeof tripStatistics>[0]);
        expect(stats.actual).toBe(50000);
        expect(stats.completed).toBe(1);
        expect(stats.monthly["2026-10"]).toBe(50000);
    });
});
describe("Google Maps import", () => {
    it("extracts precise place coordinates, but never mistakes camera position for the place", () => {
        expect(parseMapsReference("https://www.google.com/maps/place/Test/@1,2,15z/data=!3d16.05!4d108.2").latitude).toBe(16.05);
        expect(parseMapsReference("https://www.google.com/maps/@1,2,15z").latitude).toBeNull();
        expect(parseMapsReference("https://maps.app.goo.gl/abc").needsConfirmation).toBe(true);
    });
    it("rejects lookalike hosts, credentials, unrelated google paths and invalid coordinates", () => {
        for (const url of ["https://google.com.attacker.test/maps", "http://google.com/maps", "https://user@google.com/maps", "https://google.com/search?q=test", "https://www.google.com/maps?q=100,200"])
            expect(() => parseMapsReference(url)).toThrow();
    });
});
describe("Nearby fallback", () => {
    it("excludes unavailable/visited IDs, respects budget/time and explains unknown opening hours", () => {
        const base: PlaceSuggestion = { id: "a", name: "cafe", kind: "cafe", latitude: 16, longitude: 108, price: 50000, duration: 45, source: "OSM", fetchedAt: "2026-10-20", openingHours: null, distanceKm: null, reason: "" };
        const result = rankNearby([base, { ...base, id: "visited" }, { ...base, id: "expensive", price: 500000 }, { ...base, id: "long", duration: 180 }], { latitude: 16, longitude: 108, exclude: ["visited"], budget: 100000, minutes: 90, interests: ["cafe"] });
        expect(result.map(p => p.id)).toEqual(["a"]);
        expect(result[0].distanceKm).toBe(0);
        expect(result[0].reason).toContain("chưa được xác minh");
    });
});
it("recommends an unvisited destination matching interests before completed destinations", () => {
    const trips = [{ status: "completed", diemDen: "Đà Nẵng" }] as Parameters<typeof nextTripIdeas>[0];
    const ideas = nextTripIdeas(trips, ["cà phê"]);
    expect(ideas[0].name).toBe("Đà Lạt");
    expect(ideas.some(idea => idea.name === "Đà Nẵng")).toBe(false);
});
it("applies nearby prices to the whole travelling group", () => {
    const candidate: PlaceSuggestion = { id: "x", name: "Cafe", kind: "cafe", latitude: 16, longitude: 108, price: 60000, duration: 45, source: "OSM", fetchedAt: "2026-10-20", openingHours: null, distanceKm: null, reason: "" };
    expect(rankNearby([candidate], { people: 2, exclude: [], interests: [], minutes: 90, budget: 100000 })).toHaveLength(0);
    expect(rankNearby([candidate], { people: 1, exclude: [], interests: [], minutes: 90, budget: 100000 })).toHaveLength(1);
});

it("creates a truly blank manual journey with no assumed origin, hotel or expenses",()=>{
 const plan=createManualTrip("Đà Lạt",15,5000000,3);
 expect(plan.items).toEqual([]);expect(plan.request.diemDi).toBe("");expect(plan.request.soNgay).toBe(15);expect(plan.request.soNguoi).toBe(3);expect(plan.tongKet.tongVND).toBe(0);expect(plan.tongKet.conLaiVND).toBe(5000000);
 expect(()=>createManualTrip("",15,5000000,3)).toThrow();expect(()=>createManualTrip("Đà Lạt",0,5000000,3)).toThrow();expect(()=>createManualTrip("Đà Lạt",15,0,3)).toThrow();
});
