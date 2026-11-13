import { MapsReferenceSchema } from "@/contracts";
/** Parse only; never fetch an untrusted URL or interpret map camera coordinates as a POI. */
export function parseMapsReference(input: string) {
    const url = new URL(input);
    const allowed = ["www.google.com", "google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"];
    if (url.protocol !== "https:" || !allowed.includes(url.hostname) || url.username || url.password || url.port)
        throw new Error("Chỉ nhận liên kết HTTPS Google Maps.");
    if (["www.google.com", "google.com"].includes(url.hostname) && !url.pathname.startsWith("/maps"))
        throw new Error("Liên kết chưa phải Google Maps.");
    if (url.hostname === "goo.gl" && !url.pathname.startsWith("/maps/"))
        throw new Error("Liên kết rút gọn chưa phải Google Maps.");
    const query = url.searchParams.get("query") || url.searchParams.get("q");
    const precise = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    const coordinates = query?.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    const match = precise || coordinates;
    const latitude = match ? Number(match[1]) : null, longitude = match ? Number(match[2]) : null;
    if (latitude !== null && (Math.abs(latitude) > 90 || Math.abs(longitude!) > 180))
        throw new Error("Tọa độ không hợp lệ.");
    const named = url.pathname.match(/\/place\/([^/]+)/);
    return MapsReferenceSchema.parse({ url: url.toString(), name: named ? decodeURIComponent(named[1]).replace(/\+/g, " ") : coordinates ? null : query, latitude, longitude, placeId: url.searchParams.get("query_place_id"), needsConfirmation: true });
}
