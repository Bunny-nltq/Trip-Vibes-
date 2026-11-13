import {OSM_ACTIVITY_DURATION_MINUTES} from "./assumptions";
import {z} from "zod";
import {KhachSanSchema,QuanAnSchema,CafeSchema,HoatDongSchema,PlaceBaseSchema,type Preference} from "@/contracts";
import {accommodationType} from "./accommodation";
import {buildMapsUrls} from "./maps";
import {osmAdmissionPrice} from "./osmAdmissionPrice";
export const OsmVenueSchema=z.object({type:z.enum(["node","way","relation"]),id:z.number().int(),lat:z.number().min(-90).max(90).optional(),lon:z.number().min(-180).max(180).optional(),center:z.object({lat:z.number().min(-90).max(90),lon:z.number().min(-180).max(180)}).optional(),tags:z.record(z.string()).default({})});
export function osmVenueType(tags:Record<string,string|undefined>){
 const lodging=accommodationType(tags);if(lodging!=="unknown")return lodging;
 if(tags.amenity==="cafe")return "cafe";if(tags.amenity==="restaurant")return "restaurant";if(["fast_food","food_court"].includes(tags.amenity||""))return "eatery";
 if(tags.tourism==="museum")return "museum";if(tags.historic==="memorial")return "memorial";if(tags.historic==="monument")return "monument";if(["castle","ruins","archaeological_site","building","fort","temple","city_gate"].includes(tags.historic||""))return "heritage";
 if(tags.leisure==="water_park"||tags.tourism==="theme_park")return "amusement_park";if(tags.leisure==="park")return "park";if(tags.natural==="beach")return "beach";if(tags.tourism==="viewpoint")return "viewpoint";if(tags.tourism==="gallery")return "gallery";if(tags.tourism==="attraction")return "tourist_attraction";return "unknown";
}
function website(value?:string){if(!value)return null;try{const url=new URL(/^https?:\/\//i.test(value)?value:`https://${value}`);return ["http:","https:"].includes(url.protocol)&&url.hostname.includes(".")?url.href:null;}catch{return null;}}
export function normalizeOsmVenues(raw:unknown[],city:string,fetchedAt:string){
 const result={khachSans:[] as z.infer<typeof KhachSanSchema>[],quanAns:[] as z.infer<typeof QuanAnSchema>[],cafes:[] as z.infer<typeof CafeSchema>[],hoatDongs:[] as z.infer<typeof HoatDongSchema>[]};const seen=new Set<string>();
 for(const input of raw){const parsed=OsmVenueSchema.safeParse(input);if(!parsed.success)continue;const el=parsed.data,t=el.tags;const ten=(t["official_name:vi"]||t["name:vi"]||t.official_name||t.name||"").normalize("NFC").trim().replace(/\s+/g," ");const lat=el.lat??el.center?.lat,lng=el.lon??el.center?.lon;
 if(!ten||lat===undefined||lng===undefined||Math.abs(lat)>90||Math.abs(lng)>180)continue;const id=`osm:${el.type}:${el.id}`;if(seen.has(id))continue;seen.add(id);
 const address=t["addr:full"]||[([t["addr:housenumber"],t["addr:street"]].filter(Boolean).join(" ")),t["addr:suburb"],t["addr:district"],t["addr:city"],t["addr:province"]].filter(Boolean).join(", ")||null;
 const venueType=osmVenueType(t),fee=osmAdmissionPrice(t);const common=PlaceBaseSchema.parse({id,osmId:id,ten,khuVuc:t["addr:suburb"]||t["addr:district"]||city,diaChi:address,toaDo:{lat,lng},loai:t.tourism||t.amenity||t.historic||t.leisure||t.natural||"unknown",gioMoCua:t.opening_hours||null,soSao:null,giaUocTinhNguoi:fee.amount,priceKnown:fee.known,nguon:id,ngayLay:fetchedAt,doTinCay:"tham_khao",giaLaUocTinh:!fee.known,venueType,description:(t["description:vi"]||t.description||"").slice(0,4000)||null,phone:(t["contact:phone"]||t.phone||"").slice(0,160)||null,website:website(t["contact:website"]||t.website),cuisine:t.cuisine||null,wheelchair:["yes","no","limited"].includes(t.wheelchair)?t.wheelchair:"unknown",addressStatus:t["addr:full"]||t["addr:street"]?"specific":address?"partial":"missing"});const mapsUrls=buildMapsUrls(common,city);
 if(["hotel","resort","villa","homestay","apartment","guest_house"].includes(venueType)||["chalet","hostel"].includes(t.tourism)){const stars=t.stars&&/^[1-5]$/.test(t.stars)?Number(t.stars):null;result.khachSans.push(KhachSanSchema.parse({...common,loai:"khach_san",accommodationType:accommodationType(t),nguonGia:[],soSao:stars,khoangGiaDemVND:null,includesBreakfast:t.breakfast==="yes"||t["breakfast:included"]==="yes",hasPool:t.swimming_pool==="yes",mapsUrls}));}
 else if(venueType==="cafe")result.cafes.push(CafeSchema.parse({...common,loai:"cafe"}));
 else if(venueType==="restaurant"||venueType==="eatery")result.quanAns.push(QuanAnSchema.parse({...common,loai:"quan_an",amThuc:t.cuisine||null}));
 else if(venueType!=="unknown"){const history=["museum","memorial","monument","heritage","gallery"].includes(venueType);const nhan:Preference[]=history?["van_hoa_lich_su"]:["thien_nhien","giai_tri_vui_choi"];result.hoatDongs.push(HoatDongSchema.parse({...common,giaVeNguoi:fee.amount??0,thoiLuongPhut:venueType==="museum"?OSM_ACTIVITY_DURATION_MINUTES.museum:OSM_ACTIVITY_DURATION_MINUTES.other,nhan,dongNguoi:false,diBoNhieu:false,mapsUrls}));}
 }return result;
}

export function osmElementsWithCenters(input:unknown[]){
 const schema=OsmVenueSchema.extend({nodes:z.array(z.number()).optional(),members:z.array(z.object({type:z.string(),ref:z.number()})).optional()});const elements=input.flatMap(value=>{const p=schema.safeParse(value);return p.success?[p.data]:[];});const locations=new Map<string,{lat:number;lon:number}>();
 for(const e of elements)if(e.lat!==undefined&&e.lon!==undefined)locations.set(`${e.type}:${e.id}`,{lat:e.lat,lon:e.lon});
 for(const type of ["way","relation"]){for(const e of elements.filter(e=>e.type===type)){const keys=type==="way"?(e.nodes??[]).map(ref=>`node:${ref}`):(e.members??[]).map(member=>`${member.type}:${member.ref}`);const points=keys.map(key=>locations.get(key)).filter((p):p is {lat:number;lon:number}=>Boolean(p));if(points.length)locations.set(`${e.type}:${e.id}`,{lat:points.reduce((s,p)=>s+p.lat,0)/points.length,lon:points.reduce((s,p)=>s+p.lon,0)/points.length});}}
 return elements.map(e=>e.type==="node"?e:{...e,center:e.center??locations.get(`${e.type}:${e.id}`)});
}
