import {describe,it,expect} from "vitest";
import {travelDuration,allocateTravelBudget,normalizeTravelRequest,spendingLimit} from "./travelRequest";
import {createManualTrip} from "./tripWorkspace";
import {estimateLocalRoutes} from "./localRoutes";
import {gomDiaDiemTheoNgay} from "./tripProgress";
import {accommodationType} from "./accommodation";
const request=createManualTrip("Đà Nẵng",3,20000000,2).request;

it("routes the traveler through the hotel on checkout day", () => {
  const zeroCost = { ngay: 3, soLuong: 1, donGia: 0, thanhTien: 0 };
  const items = [
    { ...zeroCost, gio: "09:00", hangMuc: "Ăn uống" as const, noiDung: "Cà phê", refId: "cafe" },
    { ...zeroCost, gio: "12:00", hangMuc: "Chỗ ở" as const, noiDung: "Trả phòng dự kiến: Khách sạn A", refId: null, nguon: "osm:node:1" },
    { ...zeroCost, gio: "12:30", hangMuc: "Ăn uống" as const, noiDung: "Quán trưa", refId: "lunch" },
  ];
  const places = [
    { id: "cafe", ten: "Cà phê", toaDo: { lat: 16, lng: 108 } },
    { id: "osm:node:1", ten: "Khách sạn A", toaDo: { lat: 16.01, lng: 108 } },
    { id: "lunch", ten: "Quán trưa", toaDo: { lat: 16.02, lng: 108 } },
  ];
  const legs = estimateLocalRoutes(items, places, { ...request, localTransportMode: "taxi" })
    .items.filter(item => item.experienceType === "local_transfer");
  expect(legs.map(leg => [leg.originName, leg.destinationName])).toEqual([
    ["Cà phê", "Khách sạn A"],
    ["Khách sạn A", "Quán trưa"],
  ]);
});
describe("V4 travel dates and budgets",()=>{
 it("counts dates across month, leap day and same-day trips",()=>{expect(travelDuration("2028-02-28","2028-03-01")).toEqual({days:3,nights:2});expect(travelDuration("2026-10-26","2026-10-26")).toEqual({days:1,nights:0});expect(travelDuration("2026-10-31","2026-11-02")?.days).toBe(3);});
 it("rejects invalid dates and return before departure",()=>{expect(travelDuration("2026-02-30","2026-03-01")).toBeNull();expect(travelDuration("2026-10-28","2026-10-26")).toBeNull();});
 it("derives days and rejects a conflicting day count",()=>{const dates={departureDate:"2026-10-26",returnDate:"2026-10-28"};expect(normalizeTravelRequest({...request,travelDates:dates}).soNgay).toBe(3);expect(()=>normalizeTravelRequest({...request,soNgay:4,travelDates:dates})).toThrow();});
 it.each([1,101,20000000,99999999])("preserves the whole budget including rounding for %s VND",total=>{const allocation=allocateTravelBudget(total);expect(allocation.base+allocation.reserve).toBe(total);expect(Object.values(allocation.categories).reduce((s,x)=>s+x.amount,0)).toBe(allocation.base);expect(Object.values(allocation.categories).reduce((s,x)=>s+x.weight,0)).toBe(100);});
 it("keeps reserve out of the plan spending limit",()=>{expect(spendingLimit({...request,reservePercent:12})).toBe(17857142);expect(spendingLimit(request)).toBe(20000000);});
 it("does not guess resort or villa from a marketing name",()=>{expect(accommodationType({name:"Royal Resort Villa"})).toBe("unknown");expect(accommodationType({tourism:"resort"})).toBe("resort");expect(accommodationType({tourism:"villa"})).toBe("villa");});
 it("keeps every category in the trip timeline",()=>{const p=createManualTrip("Đà Nẵng",1,1000000,1);p.items=["Di chuyển","Chỗ ở","Ăn uống","Vui chơi"].map((hangMuc,index)=>({ngay:1,gio:"12:00",hangMuc:hangMuc as "Di chuyển",noiDung:hangMuc,soLuong:1,donGia:1,thanhTien:1,refId:`item${index}`}));expect(gomDiaDiemTheoNgay(p)[1].map(x=>x.hangMuc)).toEqual(["Di chuyển","Chỗ ở","Ăn uống","Vui chơi"]);});
 it("uses the selected local mode for duration and does not mutate the source items",()=>{const items=[{ngay:1,gio:"10:00",hangMuc:"Vui chơi" as const,noiDung:"A",soLuong:1,donGia:0,thanhTien:0,refId:"a"},{ngay:1,gio:"14:00",hangMuc:"Vui chơi" as const,noiDung:"B",soLuong:1,donGia:0,thanhTien:0,refId:"b"}];const places=[{id:"a",toaDo:{lat:16,lng:108}},{id:"b",toaDo:{lat:16.03,lng:108}}];const walking=estimateLocalRoutes(items,places,{...request,localTransportMode:"walking"}),taxi=estimateLocalRoutes(items,places,{...request,localTransportMode:"taxi"});expect(walking.minutes).toBeGreaterThan(taxi.minutes);expect(taxi.items[2].noiDung).toContain("Taxi");expect(items).toHaveLength(2);expect(taxi.items[2].giaLaUocTinh).toBe(true);});
});

it("uses trip calendar dates and the local date rather than the previous UTC day",async()=>{const {expenseDateForTripDay}=await import("./travelRequest");const now=new Date(2026,9,27,0,5);expect(expenseDateForTripDay(undefined,1,now)).toBe("2026-10-27");expect(expenseDateForTripDay("2026-12-31",2,now)).toBe("2027-01-01");});
