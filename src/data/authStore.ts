import crypto from "node:crypto";
import { UserSchema, SavedTripSchema, RegisterInputSchema, LoginInputSchema, ProfileInputSchema, schemaVersion, getDiemDenTen, type User, type SavedTrip, type Plan, type Ledger } from "@/contracts";
import { database, transaction } from "./database";
import { ledgerTotal } from "@/core/tripWorkspace";
type Credentials = {
    id: string;
    data: string;
    password_hash: string;
    salt: string;
    algorithm: string;
};
const publicUser = (data: string): User => UserSchema.parse(JSON.parse(data));
export function registerUser(name: string, email: string, password: string): {
    ok: true;
    user: User;
} | {
    ok: false;
    error: string;
} {
    const parsed = RegisterInputSchema.safeParse({ name, email, password });
    if (!parsed.success)
        return { ok: false, error: "Tên/email không hợp lệ hoặc mật khẩu chưa đủ 8 ký tự." };
    const input = parsed.data;
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(input.password, salt, 64).toString("hex");
    const user = UserSchema.parse({ id: `usr_${crypto.randomUUID()}`, name: input.name, email: input.email.toLowerCase(), createdAt: new Date().toISOString() });
    try {
        database().prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(user.id, user.email, JSON.stringify(user), hash, salt, "scrypt");
    }
    catch (error) {
        if (String(error).includes("UNIQUE"))
            return { ok: false, error: "Email này đã được sử dụng." };
        throw error;
    }
    return { ok: true, user };
}
export function loginUser(email: string, password: string): {
    ok: true;
    user: User;
} | {
    ok: false;
    error: string;
} {
    const parsed = LoginInputSchema.safeParse({ email, password });
    if (!parsed.success)
        return { ok: false, error: "Email hoặc mật khẩu không chính xác." };
    const row = database().prepare("SELECT * FROM users WHERE email = ?").get(parsed.data.email.toLowerCase()) as Credentials | undefined;
    // Equal-cost dummy work avoids a fast missing-account branch.
    const salt = row?.salt || "missing-account-dummy-salt";
    const hash = row?.algorithm === "pbkdf2" ? crypto.pbkdf2Sync(password, salt, 1000, 32, "sha256") : crypto.scryptSync(password, salt, 64);
    if (!row || !crypto.timingSafeEqual(Buffer.from(row.password_hash, "hex"), hash))
        return { ok: false, error: "Email hoặc mật khẩu không chính xác." };
    if (row.algorithm !== "scrypt")
        database().prepare("UPDATE users SET password_hash=?,algorithm='scrypt' WHERE id=?").run(crypto.scryptSync(password, salt, 64).toString("hex"), row.id);
    return { ok: true, user: publicUser(row.data) };
}
export function getUserById(id: string): User | null { const row = database().prepare("SELECT data FROM users WHERE id=?").get(id) as {
    data: string;
} | undefined; return row ? publicUser(row.data) : null; }
export function updateProfile(id: string, profile: unknown): User | null {
    const user = getUserById(id);
    if (!user)
        return null;
    const next = UserSchema.parse({ ...user, profile: ProfileInputSchema.parse(profile) });
    database().prepare("UPDATE users SET data=? WHERE id=?").run(JSON.stringify(next), id);
    return next;
}
const tokenHash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
export function createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString("base64url");
    const db = database();
    db.prepare("DELETE FROM sessions WHERE expires <= ?").run(Date.now());
    db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(tokenHash(token), userId, Date.now() + SESSION_SECONDS * 1000);
    return token;
}
export function sessionUser(token: string): User | null {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token))
        return null;
    const row = database().prepare("SELECT user_id FROM sessions WHERE hash=? AND expires>?").get(tokenHash(token), Date.now()) as {
        user_id: string;
    } | undefined;
    return row ? getUserById(row.user_id) : null;
}
export function revokeSession(token: string) { database().prepare("DELETE FROM sessions WHERE hash=?").run(tokenHash(token)); }
export function allowAttempt(key: string, max = 10, windowMs = 15 * 60 * 1000): boolean {
    return transaction(() => {
        const db = database();
        const now = Date.now();
        db.prepare("DELETE FROM limits WHERE reset<=?").run(now);
        const row = db.prepare("SELECT count FROM limits WHERE key=?").get(key) as {
            count: number;
        } | undefined;
        if (row && row.count >= max)
            return false;
        db.prepare("INSERT INTO limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1").run(key, now + windowMs);
        return true;
    });
}
export function getUserTrips(userId: string): SavedTrip[] { return (database().prepare("SELECT data FROM trips WHERE user_id=? ORDER BY updated DESC").all(userId) as {
    data: string;
}[]).map(r => SavedTripSchema.parse(JSON.parse(r.data))); }
export function getUserTrip(userId: string, id: string): SavedTrip | null { const row = database().prepare("SELECT data FROM trips WHERE id=? AND user_id=?").get(id, userId) as {
    data: string;
} | undefined; return row ? SavedTripSchema.parse(JSON.parse(row.data)) : null; }
export function saveUserTrip(input: {
    userId: string;
    title?: string;
    plan: Plan;
    ledger: Ledger;
    tickedPlaces?: Record<string, boolean>;
    status?: SavedTrip["status"];
    startDate?: string | null;
    journal?: string;
}): SavedTrip {
    const now = new Date().toISOString();
    const plan = input.plan;
    const trip = SavedTripSchema.parse({ schemaVersion, id: `trip_${crypto.randomUUID()}`, userId: input.userId, title: input.title || `Chuyến đi ${getDiemDenTen(plan.request.diemDen)}`, diemDi: getDiemDenTen(plan.request.diemDi), diemDen: getDiemDenTen(plan.request.diemDen), soNgay: plan.request.soNgay || 1, soNguoi: plan.request.soNguoi || 1, nganSachDuKienVND: plan.request.ngansachTongVND || 0, tongChiPhiKeHoachVND: plan.tongKet.tongVND, tongChiTieuThucTeVND: ledgerTotal(input.ledger), createdAt: now, updatedAt: now, plan, ledger: input.ledger, tickedPlaces: input.tickedPlaces || {}, status: input.status || "planned", version: 1, startDate: input.startDate || null, journal: input.journal || "" });
    database().prepare("INSERT INTO trips VALUES(?,?,?,?,?)").run(trip.id, trip.userId, 1, now, JSON.stringify(trip));
    return trip;
}
export class TripConflict extends Error {
}
export function updateUserTrip(userId: string, tripId: string, updates: Partial<Pick<SavedTrip, "title" | "ledger" | "tickedPlaces" | "plan" | "status" | "startDate" | "journal">>, expectedVersion?: number): SavedTrip | null {
    return transaction(() => {
        const current = getUserTrip(userId, tripId);
        if (!current)
            return null;
        if (expectedVersion !== undefined && expectedVersion !== (current.version || 1))
            throw new TripConflict("Chuyến đi đã được cập nhật ở nơi khác. Hãy tải lại trước khi lưu.");
        const plan = updates.plan || current.plan;
        const ledger = updates.ledger || current.ledger;
        const next = SavedTripSchema.parse({ ...current, ...updates, schemaVersion, plan, ledger, soNgay: plan.request.soNgay, soNguoi: plan.request.soNguoi, diemDen: getDiemDenTen(plan.request.diemDen), diemDi: getDiemDenTen(plan.request.diemDi), nganSachDuKienVND: plan.request.ngansachTongVND, tongChiPhiKeHoachVND: plan.tongKet.tongVND, tongChiTieuThucTeVND: ledgerTotal(ledger), version: (current.version || 1) + 1, updatedAt: new Date().toISOString() });
        const db = database();
        db.prepare("INSERT INTO revisions VALUES(?,?,?)").run(tripId, current.version || 1, JSON.stringify(current));
        db.prepare("UPDATE trips SET data=?,version=?,updated=? WHERE id=? AND user_id=?").run(JSON.stringify(next), next.version!, next.updatedAt, tripId, userId);
        return next;
    });
}
export function deleteUserTrip(userId: string, tripId: string): boolean { return database().prepare("DELETE FROM trips WHERE id=? AND user_id=?").run(tripId, userId).changes > 0; }
