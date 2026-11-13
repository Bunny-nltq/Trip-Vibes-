import {applyVenueVerification} from "./venueVerification";
import fs from "node:fs";import path from "node:path";
import {PlaceBaseSchema,VenuePublicSchema,type VenuePublic} from "@/contracts";
import {buildMapsUrls} from "@/core/maps";
import {osmVenueType} from "@/core/osmVenues";
export function canonicalCity(value:string){return value.replace(/^thành phố\s+/i,"").trim();}
export function loadVenueCatalog(){const dir=path.resolve("src/data/snapshots"),latest=new Map<string,any>();if(!fs.existsSync(dir))return [] as VenuePublic[];
 for(const file of fs.readdirSync(dir).filter(f=>f.endsWith(".json")&&!/bangkok|seoul/.test(f)).sort().reverse()){try{const data=JSON.parse(fs.readFileSync(path.join(dir,file),"utf-8"));const city=canonicalCity(typeof data.diemDen==="string"?data.diemDen:data.diemDen?.ten||"");if(city&&!latest.has(city))latest.set(city,data);}catch{}}
 const result:VenuePublic[]=[];for(const [city,data] of latest){for(const [key,group] of [["khachSans","accommodation"],["quanAns","dining"],["cafes","cafe"],["hoatDongs","experience"]] as const){for(const raw of data[key]||[]){const parsed=PlaceBaseSchema.safeParse(applyVenueVerification(raw));if(!parsed.success)continue;const p=parsed.data;const kind=p.venueType|| (group==="cafe"?"cafe":group==="dining"?"eatery":group==="accommodation"?raw.accommodationType||"unknown":osmVenueType({tourism:p.loai,historic:["memorial","monument","ruins","castle"].includes(p.loai)?p.loai:undefined,natural:p.loai==="beach"?"beach":undefined,leisure:p.loai==="park"?"park":undefined}));const maps=buildMapsUrls(p,city);const id=p.id.match(/^osm:(node|way|relation):(\d+)$/);if(!id)continue;
 const venue=VenuePublicSchema.safeParse({...p,id:p.id,name:p.ten,city,type:kind,group,address:p.diaChi,mapsUrl:maps.xem,directionsUrl:maps.chiDuong,source:"OpenStreetMap contributors",sourceUrl:`https://www.openstreetmap.org/${id[1]}/${id[2]}`,fetchedAt:p.ngayLay,openingHours:p.gioMoCua,accommodationStars:group==="accommodation"?p.soSao:null,price:p.giaUocTinhNguoi,priceEstimated:p.giaLaUocTinh});if(venue.success)result.push(venue.data);
 }}}return result;}
