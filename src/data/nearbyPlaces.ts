import {buildMapsUrls} from "@/core/maps";
import { PlaceSuggestionSchema, getDiemDenTen } from "@/contracts";
import { getSnapshotDiemDen } from "./prepareDestination";
import { LiveDataSource } from "./live/LiveDataSource";
import { NEARBY_ACTIVITY_DURATION, NEARBY_CAFE_DURATION } from "@/core/assumptions";
export async function nearbyCandidates(destination: string, kind: "cafe" | "activity" | "restaurant") {
    const place = getSnapshotDiemDen(destination);
    // Do not silently search at fabricated coordinates for an unresolved destination.
    if (!place || !getDiemDenTen(place))
        return [];
    const source = new LiveDataSource("snapshot", undefined, place, undefined, 3, undefined, true);
    const items = kind === "cafe" ? await source.getCafes() : kind === "activity" ? await source.getHoatDongs() : await source.getQuanAns();
    return items.map(p => PlaceSuggestionSchema.parse({ id: p.id, name: p.ten, kind,address:p.diaChi,mapsUrl:buildMapsUrls(p,destination).xem,venueType:p.venueType,description:p.description, latitude: p.toaDo.lat, longitude: p.toaDo.lng, price: p.giaUocTinhNguoi, duration: kind === "activity" ? NEARBY_ACTIVITY_DURATION : NEARBY_CAFE_DURATION, source: p.nguon || "OpenStreetMap", fetchedAt: p.ngayLay, openingHours: p.gioMoCua, distanceKm: null, reason: "" }));
}
