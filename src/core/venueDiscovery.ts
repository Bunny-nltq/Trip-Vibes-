/** Give each city a turn before repeating a city in unfiltered discovery results. */
export function balanceVenuesByCity<T extends {city:string}>(places:T[]):T[]{const groups=new Map<string,T[]>();for(const place of places){const list=groups.get(place.city)||[];list.push(place);groups.set(place.city,list);}const result:T[]=[];const longest=Math.max(0,...[...groups.values()].map(list=>list.length));for(let i=0;i<longest;i++)for(const list of groups.values())if(list[i])result.push(list[i]);return result;}

/** Enclosure and species records are map features inside a venue. */
export function isIndependentAttraction(place: { ten?: string; name?: string }): boolean {
  const name = (place.ten ?? place.name ?? "").toLocaleLowerCase("vi-VN")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").trim();
  if (/^(vuon thu|vuon bach thu|cong vien|khu du lich|safari|bao tang|khu bao ton)\b/.test(name)) return true;
  return !/^(chuong|khu nuoi|o nuoi|huou cao co|khi|vet|ca sau|qua den|ngong|su tu|ho bengal|voi chau|gau ngua|ngua van|lac da|te giac|da dieu|ha ma|chim cong|trau rung|nai)(?:\b|$)/.test(name);
}

export function isDiningVenue(place: { ten: string }): boolean {
  return !/^(khách sạn|khach san|hotel|resort|homestay|nhà nghỉ)\b/i.test(place.ten.trim());
}

/** OSM may describe one attraction using several nodes/way fragments. */
export function uniqueNamedOsmVenues<T extends {id:string;ten?:string;name?:string}>(places:T[]){const seen=new Set<string>();return places.filter(p=>{if(!isIndependentAttraction(p))return false;if(!p.id.startsWith("osm:"))return true;const name=(p.ten||p.name||p.id).normalize("NFC").trim().toLocaleLowerCase("vi-VN");if(seen.has(name))return false;seen.add(name);return true;});}
