import { UserSchema, SavedTripSchema } from "@/contracts";
export async function accountRequest(url: string, method = "GET", body?: unknown) {
    const response = await fetch(url, { method, credentials: "same-origin", cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    if (!response.ok)
        throw new Error(data.thongDiep || data.error || "Không thể kết nối tài khoản.");
    if (data.user)
        data.user = UserSchema.parse(data.user);
    if (data.trip)
        data.trip = SavedTripSchema.parse(data.trip);
    if (data.trips)
        data.trips = SavedTripSchema.array().parse(data.trips);
    return data;
}
