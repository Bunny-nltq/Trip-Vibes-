import {TravelDatesSchema,TripRequestSchema,type TripRequest} from "@/contracts";
import {TRAVEL_BUDGET_WEIGHTS,DEFAULT_RESERVE_PERCENT} from "./assumptions";
export function travelDuration(departureDate:string,returnDate:string){
 const dates=TravelDatesSchema.safeParse({departureDate,returnDate});
 if(!dates.success)return null;
 const days=Math.round((Date.parse(returnDate+"T00:00:00Z")-Date.parse(departureDate+"T00:00:00Z"))/86400000)+1;
 return {days,nights:days-1};
}
export function allocateTravelBudget(total:number,reservePercent=DEFAULT_RESERVE_PERCENT){
 if(!Number.isSafeInteger(total)||total<0||!Number.isInteger(reservePercent)||reservePercent<0||reservePercent>30)throw new Error("Ngân sách hoặc dự phòng không hợp lệ");
 const base=Math.floor(total*100/(100+reservePercent));
 const entries=Object.entries(TRAVEL_BUDGET_WEIGHTS).map(([key,weight])=>({key,weight,amount:Math.floor(base*weight/100),fraction:base*weight%100}));
 let left=base-entries.reduce((sum,item)=>sum+item.amount,0);
 for(const item of [...entries].sort((a,b)=>b.fraction-a.fraction))if(left-->0)item.amount++;
 return {total,base,reserve:total-base,reservePercent,categories:Object.fromEntries(entries.map(({key,weight,amount})=>[key,{weight,amount}])) as Record<keyof typeof TRAVEL_BUDGET_WEIGHTS,{weight:number;amount:number}>};
}
export function normalizeTravelRequest(input:TripRequest):TripRequest{
 const request=TripRequestSchema.parse(input);
 if(!request.travelDates)return request;
 const duration=travelDuration(request.travelDates.departureDate,request.travelDates.returnDate);
 if(!duration)throw new Error("Khoảng ngày không hợp lệ");
 if(request.soNgay!==null&&request.soNgay!==duration.days)throw new Error("Số ngày không khớp ngày đi/ngày về");
 return TripRequestSchema.parse({...request,soNgay:duration.days,thieu:request.thieu.filter(field=>field!=="soNgay")});
}

export function spendingLimit(request:TripRequest){const total=request.ngansachTongVND??0;return request.reservePercent===undefined?total:allocateTravelBudget(total,request.reservePercent).base;}

export function budgetIncludingReserve(base: number, reservePercent = 0) {
 return Math.ceil(base * (100 + reservePercent) / 100);
}

export function unknownCostCount(plan:import("@/contracts").Plan){return plan.items.filter(item=>item.priceKnown===false||(item.thanhTien===0&&item.priceKnown!==true&&item.hangMuc!=="Di chuyển")).length;}

/** Date-only arithmetic avoids shifting a trip date across UTC/local midnight. */
export function expenseDateForTripDay(departureDate:string|undefined,day:number,now:Date){if(departureDate&&Number.isInteger(day)&&day>=1&&travelDuration(departureDate,departureDate)){return new Date(Date.parse(departureDate+"T00:00:00Z")+(day-1)*86400000).toISOString().slice(0,10);}return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;}
