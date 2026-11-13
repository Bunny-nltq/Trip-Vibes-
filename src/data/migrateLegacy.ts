import { readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { UserSchema, SavedTripSchema, schemaVersion } from "@/contracts";
import { database, transaction } from "./database";
/** Explicit, repeat-safe import. Source files remain intact and are never logged. */
export function migrateLegacy(directory: string, apply = false) {
    const read = (name: string) => existsSync(join(directory, name)) ? JSON.parse(readFileSync(join(directory, name), "utf8")) : [];
    const rawUsers = z.array(z.unknown()).parse(read("users.json")), rawTrips = z.array(z.unknown()).parse(read("trips.json"));
    const userResults = rawUsers.map(value => UserSchema.extend({ passwordHash: z.string().regex(/^[a-f0-9]{64}$/i), salt: z.string().min(16) }).safeParse(value));
    const tripResults = rawTrips.map(value => SavedTripSchema.safeParse(value));
    const credentials = userResults.filter(result => result.success).map(result => result.data!);
    const trips = tripResults.filter(result => result.success).map(result => result.data!);
    const users = credentials.filter(u => process.env.NODE_ENV !== "production" || u.id !== "usr_demo_tripvibes");
    const eligible = trips.filter(t => users.some(u => u.id === t.userId));
    const rejectedUsers = userResults.flatMap((result, index) => result.success ? [] : [index]);
    const rejectedTrips = tripResults.flatMap((result, index) => result.success ? [] : [index]);
    const result = { users: users.length, trips: eligible.length, rejectedUsers, rejectedTrips, applied: apply };
    if (!apply)
        return result;
    if (rejectedUsers.length || rejectedTrips.length)
        throw new Error("Legacy records require repair; source unchanged.");
    const backup = join(directory, `backup-${Date.now()}`);
    mkdirSync(backup, { recursive: true });
    for (const file of ["users.json", "trips.json"])
        if (existsSync(join(directory, file)))
            copyFileSync(join(directory, file), join(backup, file));
    transaction(() => {
        const db = database();
        for (const user of users)
            db.prepare("INSERT OR IGNORE INTO users VALUES(?,?,?,?,?,?)").run(user.id, user.email, JSON.stringify(UserSchema.parse(user)), user.passwordHash, user.salt, "pbkdf2");
        for (const t of eligible) {
            const owner = db.prepare("SELECT id FROM users WHERE id=?").get(t.userId);
            if (!owner)
                continue;
            const migrated = SavedTripSchema.parse({ ...t, schemaVersion, version: 1, status: t.status || "planned" });
            db.prepare("INSERT OR IGNORE INTO trips VALUES(?,?,?,?,?)").run(t.id, t.userId, 1, t.updatedAt, JSON.stringify(migrated));
        }
        db.prepare("INSERT OR REPLACE INTO migrations VALUES(?,?)").run("legacy-json-import", new Date().toISOString());
    });
    return result;
}
