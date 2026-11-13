import { TripRequestSchema, schemaVersion, PlanSchema, type Plan, type PlanItem, type Ledger, type SavedTrip } from "@/contracts";
import { workspaceFlags } from "./flags";
import { NEXT_TRIP_IDEAS } from "./assumptions";
import { removeVietnameseDiacritics } from "./normalizeRequest";
export function ledgerTotal(ledger: Ledger): number {
    return ledger.expenses.reduce((sum, expense) => sum + expense.soTienVND, 0);
}
export function recalculatePlan(plan: Plan, items: PlanItem[]): Plan {
    const normalized = items.map(item => ({ ...item, thanhTien: item.donGia * item.soLuong }));
    const categories = { "Di chuyển": 0, "Chỗ ở": 0, "Ăn uống": 0, "Vui chơi": 0 };
    for (const item of normalized)
        categories[item.hangMuc] += item.thanhTien;
    const total = Object.values(categories).reduce((a, b) => a + b, 0);
    const budget = plan.request.ngansachTongVND || 0;
    return PlanSchema.parse({ ...plan, schemaVersion, items: normalized,
        canhBao: [...new Set([...plan.canhBao.filter(flag => !flag.startsWith("workspace_")), ...workspaceFlags(normalized, budget)])],
        tongKet: { ...plan.tongKet, tongVND: total, conLaiVND: budget - total, phanTramDaDung: budget > 0 ? Math.round(total / budget * 1000) / 10 : 0, theoHangMuc: categories, trangThaiNganSach: total > budget ? "vuot" : "trong" },
    });
}
export function tripStatistics(trips: SavedTrip[]) {
    const categories: Record<string, number> = {};
    const monthly: Record<string, number> = {};
    let actual = 0;
    for (const trip of trips.filter(trip => trip.status !== "cancelled")) {
        for (const expense of trip.ledger.expenses) {
            actual += expense.soTienVND;
            categories[expense.hangMuc] = (categories[expense.hangMuc] || 0) + expense.soTienVND;
            const month = expense.ngay?.slice(0, 7) || "Chưa có ngày";
            monthly[month] = (monthly[month] || 0) + expense.soTienVND;
        }
    }
    return { total: trips.length, completed: trips.filter(t => t.status === "completed").length, ongoing: trips.filter(t => t.status === "in_progress").length, actual, categories, monthly };
}
export function planDiffSummary(before: Plan, after: Plan) {
    const key = (item: PlanItem) => item.id || `${item.refId || item.noiDung}:${item.ngay}:${item.gio ?? ""}`;
    const fields = (item: PlanItem) => JSON.stringify([
        item.ngay, item.gio, item.noiDung, item.hangMuc, item.durationMinutes, item.soLuong, item.donGia,
        item.thanhTien, item.state ?? "pending", Boolean(item.locked), item.diaChi, item.mapsUrl, item.priceKnown,
    ]);
    const remaining = [...before.items];
    const unmatched = after.items.filter(item => {
        const index = remaining.findIndex(previous => key(previous) === key(item) && fields(previous) === fields(item));
        if (index < 0) return true;
        remaining.splice(index, 1);
        return false;
    });
    const added: string[] = [], changed: string[] = [];
    for (const item of unmatched) {
        const index = remaining.findIndex(previous => key(previous) === key(item));
        if (index < 0) added.push(item.noiDung);
        else {
            remaining.splice(index, 1);
            changed.push(item.noiDung);
        }
    }
    return { cost: after.tongKet.tongVND - before.tongKet.tongVND, items: after.items.length - before.items.length,
        added, removed: remaining.map(item => item.noiDung), changed };
}
export function validateWorkspace(plan: Plan, ledger: Ledger): boolean {
    const days = plan.request.soNgay;
    return !!days && Number.isSafeInteger(days) && days > 0 &&
        plan.items.every(i => i.ngay <= days && Number.isSafeInteger(i.donGia * i.soLuong)) &&
        ledger.expenses.every(e => e.ngayTrongChuyen === null || e.ngayTrongChuyen <= days) &&
        Number.isSafeInteger(ledgerTotal(ledger));
}
export function unspentBudget(plan: Plan, ledger: Ledger) { return Math.max(0, (plan.request.ngansachTongVND || 0) - ledgerTotal(ledger)); }
export function nextTripIdeas(trips: SavedTrip[], interests: string[]) {
    const visited = new Set(trips.filter(trip => trip.status === "completed").map(trip => removeVietnameseDiacritics(trip.diemDen)));
    const preferences = interests.map(removeVietnameseDiacritics);
    return NEXT_TRIP_IDEAS.map(place => ({ name: place.name, visited: visited.has(removeVietnameseDiacritics(place.name)), match: place.tags.some(tag => preferences.some(preference => removeVietnameseDiacritics(tag).includes(preference))) }))
        .sort((a, b) => Number(a.visited) - Number(b.visited) || Number(b.match) - Number(a.match)).slice(0, 3)
        .map(place => ({ name: place.name, reason: `${place.visited ? "Có thể quay lại với lịch trình mới" : "Chưa có trong nhật ký hoàn thành"}${place.match ? "; có phong cách gần sở thích đã chọn" : ""}. Cần lập kế hoạch mới để kiểm tra giá và dữ liệu.` }));
}
export function visitedPlaceCount(plan:Plan,ticked:Record<string,boolean>={}){
 const places=plan.items.filter(item=>item.hangMuc==="Vui chơi"||item.hangMuc==="Ăn uống");const visited=new Set<string>();
 for(const item of places){const key=item.refId||item.id||`${item.ngay}:${item.gio}:${item.noiDung}`;if(item.state==="visited"||(item.state===undefined&&(ticked[key]||Boolean(item.id&&ticked[item.id]))))visited.add(key);}
 return visited.size;
}
export function tripNights(days: number) { return Math.max(0, days - 1); }
export function createManualTrip(name: string, days: number, budget: number, people: number): Plan {
    if (!name.trim() || !Number.isSafeInteger(budget) || budget <= 0 || !Number.isSafeInteger(people) || people < 1 || people > 20)
        throw new Error("Vui lòng nhập tên, số người và ngân sách hợp lệ.");
    const request = TripRequestSchema.parse({ schemaVersion, diemDi: "", diemDen: name.trim(), soNgay: days, soNguoi: people, ngansachTongVND: budget, sothich: [], tranh: [], ghiChu: [], thieu: [], cauHoiLamRo: [], canhBao: [] });
    return PlanSchema.parse({ schemaVersion, request, items: [], canhBao: [], dataSourceUsed: "nguoi_dung", tongKet: { tongVND: 0, conLaiVND: budget, phanTramDaDung: 0, theoHangMuc: { "Di chuyển": 0, "Chỗ ở": 0, "Ăn uống": 0, "Vui chơi": 0 }, tongThoiGianDiChuyenPhut: 0, trangThaiNganSach: "trong" } });
}
