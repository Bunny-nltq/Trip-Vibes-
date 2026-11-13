import {describe,it,expect,vi,beforeEach} from "vitest";
vi.mock("@/ai/planWithRepair",()=>({planWithRepair:vi.fn(async(request)=>({status:"ok",request,hard:[],soft:[],phuongThucLap:"quy_tac"}))}));
vi.mock("@/data/prepareDestination",()=>({isDataReadyForDestination:()=>true,hasSnapshotForDestination:()=>true,isProductionEnvironment:()=>false}));
import {POST} from "../plan/route";
import {createManualTrip} from "@/core/tripWorkspace";
const base=createManualTrip("Đà Lạt",3,20000000,2).request;
function post(request:unknown){return POST(new Request("http://localhost/api/plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({request})}));}
beforeEach(()=>vi.stubEnv("LIVE_AI_ENABLED","false"));
describe("V4 request API",()=>{
 it("rejects dates that disagree with the selected day count",async()=>{const r=await post({...base,soNgay:7,travelDates:{departureDate:"2026-10-27",returnDate:"2026-10-29"}});expect(r.status).toBe(400);});
 it("derives days from dates, clears missing-day state and preserves vehicle choices",async()=>{const r=await post({...base,soNgay:null,thieu:["soNgay"],travelDates:{departureDate:"2026-10-27",returnDate:"2026-10-29"},transportMode:"BUS",localTransportMode:"walking",reservePercent:12});const j=await r.json();expect(r.status).toBe(200);expect(j.request.soNgay).toBe(3);expect(j.request.thieu).toEqual([]);expect(j.request.transportMode).toBe("BUS");expect(j.request.localTransportMode).toBe("walking");expect(j.request.reservePercent).toBe(12);});
 it("does not offer new international plans",async()=>{const r=await post({...base,diemDen:"Seoul"});expect(r.status).toBe(422);});
 it("rejects a return before departure",async()=>{const r=await post({...base,travelDates:{departureDate:"2026-10-29",returnDate:"2026-10-27"}});expect(r.status).toBe(400);});
});
