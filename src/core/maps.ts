/** Named map links; coordinates remain available for internal distance calculations only. */
export interface MapsUrls{xem:string;chiDuong:string;apple:string;}
export interface PlaceForMaps{ten:string;toaDo?:{lat:number;lng:number};diaChi?:string|null;}
export function osmFeatureUrl(source?: string | null): string | undefined {
  const match = /^osm:(node|way|relation):(\d+)$/.exec(source ?? "");
  return match ? `https://www.openstreetmap.org/${match[1]}/${match[2]}` : undefined;
}
export function namedMapQuery(place: PlaceForMaps, city?: string) {
  const addressParts = (place.diaChi ?? "").split(",").map(part => part.trim());
  const parts = [place.ten.trim(), ...addressParts, city?.trim() ?? ""].filter(Boolean);
  return [...new Set(parts)].join(", ");
}
export function buildMapsUrls(place:PlaceForMaps,city?:string):MapsUrls{const query=encodeURIComponent(namedMapQuery(place,city));return {xem:`https://www.google.com/maps/search/?api=1&query=${query}`,chiDuong:`https://www.google.com/maps/dir/?api=1&destination=${query}`,apple:`https://maps.apple.com/?daddr=${query}`};}

export function accommodationMapUrls(place: PlaceForMaps, city: string) {
    const named = buildMapsUrls(place, city);
    const address = place.diaChi?.trim();
    if (!address) return named;
    const query = encodeURIComponent(namedMapQuery({ ten: address }, city));
    return {
        ...named,
        xem: `https://www.google.com/maps/search/?api=1&query=${query}`,
        chiDuong: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    };
}

export function planItemMaps(item:import("@/contracts").PlanItem,city:string):MapsUrls{const name=item.destinationName||item.noiDung.replace(/^(Lưu trú:|Trưa:|Tối:|Cà phê:|Vui chơi:)\s*/i,"").split("(")[0].trim();const maps=buildMapsUrls({ten:name,diaChi:item.diaChi},city);if(item.originName&&item.destinationName){const local=item.experienceType==="local_transfer";maps.chiDuong=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(namedMapQuery({ten:item.originName,diaChi:item.originAddress},local?city:undefined))}&destination=${encodeURIComponent(namedMapQuery({ten:item.destinationName,diaChi:item.diaChi},local?city:undefined))}`;try{const mode=item.mapsUrl?new URL(item.mapsUrl).searchParams.get("travelmode"):null;if(local&&mode&&["walking","driving","transit","bicycling"].includes(mode))maps.chiDuong+=`&travelmode=${mode}`;}catch{/* The named fallback remains usable for malformed legacy links. */}}return maps;}
