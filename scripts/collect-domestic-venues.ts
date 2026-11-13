import fs from "node:fs";
import path from "node:path";
import {loadEnvConfig} from "@next/env";
import {geocodeDestination} from "../src/data/live/geocodeClient";
import {normalizeOsmVenues} from "../src/core/osmVenues";
import {auditSnapshotData,computeSnapshotChecksum} from "../src/data/snapshots/snapshotAudit";
loadEnvConfig(process.cwd());
const destinations=[{name:"Nha Trang",query:"Thành phố Nha Trang",slug:"nha_trang"},{name:"Hội An",query:"Thành phố Hội An",slug:"hoi_an"},{name:"Huế",query:"Huế",slug:"hue"},{name:"Đà Nẵng",query:"Đà Nẵng",slug:"da_nang"},{name:"Hà Nội",query:"Hà Nội",slug:"ha_noi"},{name:"Đà Lạt",query:"Đà Lạt",slug:"da_lat"},{name:"TP.HCM",query:"Thành phố Hồ Chí Minh",slug:"tp_hcm"},{name:"Phú Quốc",query:"Thành phố Phú Quốc",slug:"phu_quoc"}];
const selected=process.argv.find(arg=>arg.startsWith("--cities="))?.split("=")[1]?.split(",");
const report:unknown[]=[];
async function main(){for(const dest of destinations.filter(d=>!selected||selected.includes(d.slug))){try{
 const geo=await geocodeDestination(dest.query);if(geo.status!=="thanh_cong"||geo.diemDen.maQuocGia!=="VN"){report.push({city:dest.name,status:"unresolved"});continue;}
 const {lat,lng}=geo.diemDen.toaDo;const around=`(around:18000,${lat},${lng})`;
 const query=`[out:json][timeout:25];(nwr["tourism"~"hotel|resort|villa|apartment|guest_house|chalet|hostel|museum|attraction|gallery|viewpoint|theme_park"]["name"]${around};nwr["amenity"~"restaurant|fast_food|food_court|cafe"]["name"]${around};nwr["historic"~"memorial|monument|castle|ruins|archaeological_site"]["name"]${around};nwr["leisure"~"park|water_park"]["name"]${around};nwr["natural"="beach"]["name"]${around};);out center tags 1800;`;
 let raw:any=null;let endpoint="";
 for(const candidate of ["https://maps.mail.ru/osm/tools/overpass/api/interpreter","https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter"]){try{const response=await fetch(candidate,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":process.env.NOMINATIM_USER_AGENT||"TripVibes research"},body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(35000)});if(response.status===429){console.log(`${dest.name}: rate limited, defer this source`);continue;}if(!response.ok){console.log(`${dest.name}: HTTP ${response.status}`);continue;}const value=await response.json();if(Array.isArray(value.elements)&&value.elements.length&&!value.remark){raw=value;endpoint=candidate;break;}}catch{console.log(`${dest.name}: source unavailable`);}}
 if(!raw){report.push({city:dest.name,status:"source_unavailable"});continue;}
 const now=new Date().toISOString();const groups=normalizeOsmVenues(raw.elements,dest.name,now);
 for(const key of ["khachSans","quanAns","cafes","hoatDongs"] as const)groups[key].sort((a,b)=>Number(Boolean(b.diaChi))+Number(Boolean(b.website))+Number(Boolean(b.phone))-Number(Boolean(a.diaChi))-Number(Boolean(a.website))-Number(Boolean(a.phone)));
 const counts=Object.fromEntries(Object.entries(groups).map(([key,value])=>[key,value.length]));
 if(groups.khachSans.length<3||groups.quanAns.length<3||groups.cafes.length<1||groups.hoatDongs.length<3){report.push({city:dest.name,status:"insufficient",counts});continue;}
 const snapshot={taoBoi:"script data:snapshot",ngayTao:now,createdAt:now,diemDen:dest.name,diemDenMetadata:geo.diemDen,...groups,transports:[],collection:{endpoint,osmBaseTimestamp:raw.osm3s?.timestamp_osm_base,queriedAt:now},checksum:""};snapshot.checksum=computeSnapshotChecksum(snapshot);const filename=`snapshot_${dest.slug}_${now.slice(0,10)}.json`;const audit=auditSnapshotData(snapshot,filename);if(audit.errors.length)throw new Error("Snapshot failed audit");
 const output=path.resolve("src/data/snapshots",filename);fs.writeFileSync(output,JSON.stringify(snapshot,null,2));report.push({city:dest.name,status:"saved",file:filename,counts,named:raw.elements.length});console.log(JSON.stringify(report.at(-1)));
 }catch(error){report.push({city:dest.name,status:"error",reason:error instanceof Error?error.message:"unknown"});}await new Promise(resolve=>setTimeout(resolve,1200));}
 fs.mkdirSync("docs/bang-chung",{recursive:true});fs.writeFileSync("docs/bang-chung/V4-domestic-collection.json",JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
main().catch(()=>{console.log("Collection failed");process.exitCode=1});
