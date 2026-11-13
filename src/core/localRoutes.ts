import type {PlanItem,TripRequest} from "@/contracts";
import {LOCAL_ROUTE_ASSUMPTIONS as A} from "./assumptions";
import {khoangCachKm} from "./haversine";
import {namedMapQuery} from "./maps";
import {getDiemDenTen} from "@/contracts";
import {hhmm2min,min2hhmm} from "./mealTimes";
type Point={id:string;ten?:string;diaChi?:string|null;toaDo:{lat:number;lng:number}|null};
export function estimateLocalRoutes(items:PlanItem[],places:Point[],request:TripRequest){
 if(!request.localTransportMode)return {items:[...items],minutes:0};
 const mode=request.localTransportMode,rule=A.modes[mode],people=request.soNguoi||1;
 const labels={taxi:"Taxi / xe công nghệ",motorbike:"Xe máy",car:"Ô tô",transit:"Công cộng",walking:"Đi bộ"};
 const byId=new Map(places.filter(p=>p.toaDo).map(p=>[p.id,p]));const result=[...items];let total=0;
 const days=[...new Set(items.map(item=>item.ngay))];
 function stopPoint(item: PlanItem) {
   if (item.refId) return byId.get(item.refId);
   if (item.hangMuc === "Chỗ ở" && item.noiDung.startsWith("Trả phòng dự kiến:") && item.nguon) {
     return byId.get(item.nguon);
   }
 }
 for(const day of days){
 const stops = items.flatMap(item => {
   if (item.ngay !== day || item.hangMuc === "Di chuyển" || !item.gio) return [];
   const point = stopPoint(item);
   return point ? [{ item, point }] : [];
 }).sort((a,b)=>a.item.gio!.localeCompare(b.item.gio!));
 for(let index=1;index<stops.length;index++){
 const { item: prev, point: from } = stops[index-1];
 const { item: next, point: to } = stops[index];
 const km=khoangCachKm(from.toaDo!,to.toaDo!)*A.roadFactor;if(km<0.1)continue;
 const minutes=Math.max(1,Math.ceil(km/rule.speed*60)+rule.wait);const departure=hhmm2min(next.gio!)-minutes;
 if(departure<0)continue;
 const origin=from.ten||prev.noiDung,destination=to.ten||next.noiDung,city=getDiemDenTen(request.diemDen);
 const group=Math.ceil(people/rule.seats);const fare=mode==="transit"?A.transitFare*people:Math.ceil(km*rule.perKm*group/1000)*1000;
 result.push({refId:null,id:`local:${day}:${from.id}:${to.id}`,ngay:day,gio:min2hhmm(departure),hangMuc:"Di chuyển",experienceType:"local_transfer",originName:origin,originAddress:from.diaChi,destinationName:destination,diaChi:to.diaChi,noiDung:`${labels[mode]} · ${origin} → ${destination} (khoảng ${km.toFixed(1)} km, ${minutes} phút)`,soLuong:1,donGia:fare,thanhTien:fare,giaLaUocTinh:true,priceKnown:mode==="taxi"||mode==="walking",durationMinutes:minutes,nguon:"Ước tính từ tọa độ nguồn và giả định di chuyển; chưa phải tuyến đường/báo giá xác nhận",mapsUrl:`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(namedMapQuery({ten:origin,diaChi:from.diaChi},city))}&destination=${encodeURIComponent(namedMapQuery({ten:destination,diaChi:to.diaChi},city))}&travelmode=${mode==="walking"?"walking":mode==="transit"?"transit":"driving"}`});total+=minutes;
 }}return {items:result,minutes:total};
}
