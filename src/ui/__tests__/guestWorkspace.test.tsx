import { getDestinationImage } from "@/ui/lib/imageMap";
import React from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "@/ui/context/AppContext";
import { SavedTripsScreen } from "@/ui/screens/SavedTripsScreen";
import { TripWorkspaceScreen } from "@/ui/screens/TripWorkspaceScreen";
import { B6XemTruocScreen } from "@/ui/screens/B6XemTruocScreen";
import { HotelFacts } from "@/ui/components/site/HotelFacts";
import { HomeLanding } from "@/ui/components/site/HomeLanding";
import { createManualTrip } from "@/core/tripWorkspace";
import { schemaVersion } from "@/contracts";
function Probe() { const { plan, ledger } = useApp(); return <div>{`${plan ? `${typeof plan.request.diemDen === "string" ? plan.request.diemDen : plan.request.diemDen?.ten}:${plan.request.soNgay}` : "NO_PLAN"}|${ledger.expenses.length}`}</div>; }
function cache(value: unknown) { const storage = { getItem: (key: string) => key === "trip_workspace_v2" ? JSON.stringify(value) : null }; vi.stubGlobal("window", { location: { search: "" }, sessionStorage: storage, localStorage: { getItem: () => null } }); }
afterEach(() => vi.unstubAllGlobals());
describe("Guest privacy and empty workspace", () => {
    it("starts without an automatic city, itinerary or expenses", () => { expect(renderToString(<AppProvider><Probe /></AppProvider>)).toContain("NO_PLAN|0"); });
    it("shows a sign-in empty state rather than a current itinerary in the guest journal", () => { const html = renderToString(<AppProvider><SavedTripsScreen /></AppProvider>); expect(html).toContain("Đăng nhập"); expect(html).not.toContain("Kế hoạch hiện tại"); expect(html).not.toContain("Đà Nẵng"); });
    it("never restores an account-bound trip into an unauthenticated workspace", () => { cache({ plan: createManualTrip("Hành trình riêng tư", 10, 1000000, 1), ledger: { schemaVersion, expenses: [] }, saved: { userId: "another-owner" } }); expect(renderToString(<AppProvider><Probe /></AppProvider>)).toContain("NO_PLAN|0"); });
    it("preserves a real guest draft", () => { cache({ plan: createManualTrip("Đà Lạt", 12, 5000000, 1), ledger: { schemaVersion, expenses: [] }, saved: null }); expect(renderToString(<AppProvider><Probe /></AppProvider>)).toContain("Đà Lạt:12"); });
    it("uses a new home search instead of silently reopening the previous guest draft", () => { cache({ plan: createManualTrip("Đà Lạt", 12, 5000000, 1), ledger: { schemaVersion, expenses: [] }, saved: null }); window.location.search = "?diemDen=H%C3%A0%20N%E1%BB%99i&soNgay=5"; function SearchProbe() { const { plan, tripConfig } = useApp(); return <span>{`${plan ? "old" : "new"}:${tripConfig.diemDen && typeof tripConfig.diemDen !== "string" ? tripConfig.diemDen.ten : ""}:${tripConfig.soNgay}`}</span>; } expect(renderToString(<AppProvider><SearchProbe /></AppProvider>)).toContain("new:Hà Nội:5"); });
    it("offers a genuine empty manual editor without sample data", () => { const html = renderToString(<AppProvider><TripWorkspaceScreen /></AppProvider>); expect(html).toContain("Tạo lịch trình trống"); expect(html).not.toContain("QA Cafe"); expect(html).not.toContain("DỮ LIỆU MẪU"); });
    it("does not invent changes when the preview URL is opened directly", () => { const html = renderToString(<AppProvider><B6XemTruocScreen /></AppProvider>); expect(html).toContain("Chưa có thông tin xem trước thay đổi"); expect(html).not.toContain("Bà Nà Hills (mẫu)"); });
    it("shows known hotel facts and distinguishes missing amenities from confirmed absence", () => { const known = renderToString(<HotelFacts details={{ id: "x", ten: "Hotel", includesBreakfast: true, hasPool: true, diaChi: "Địa chỉ đã ghi nhận" }}/>); expect(known).toContain("Bữa sáng"); expect(known).toContain("Hồ bơi"); expect(known).toContain("Địa chỉ đã ghi nhận"); const unknown = renderToString(<HotelFacts details={{ id: "x", ten: "Hotel", includesBreakfast: false, hasPool: false }}/>); expect(unknown).toContain("chưa ghi nhận đầy đủ tiện ích"); expect(unknown).not.toContain("Không có hồ bơi"); });
    it("uses an illustration for an unknown destination instead of assuming Da Nang",()=>{const image=getDestinationImage("Unlisted destination");expect(image.nguon).toBe("OpenAI Image Generation");expect(typeof image.url).toBe("string");expect(image.url).not.toContain("Da_Nang_Dragon_Bridge");});
 it("does not preselect a budget or duration on the home search", () => { const html = renderToString(<HomeLanding diemDens={[]}/>); expect(html).toContain("screen=login"); expect(html).toContain("screen=register"); expect(html).not.toContain("Mặc định 2 người"); expect(html).not.toContain("10 triệu"); expect(html).not.toContain('value="3"'); });
});
