import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
let connection: DatabaseSync | undefined;
export function database(): DatabaseSync {
    if (connection)
        return connection;
    const filename = process.env.TRIP_VIBES_DB || join(process.cwd(), ".cache", "trip-vibes.sqlite");
    mkdirSync(dirname(filename), { recursive: true });
    const db = new DatabaseSync(filename);
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, data TEXT NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL, algorithm TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS trips(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, version INTEGER NOT NULL, updated TEXT NOT NULL, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS trips_owner ON trips(user_id, updated);
    CREATE TABLE IF NOT EXISTS revisions(trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE, version INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY(trip_id, version));
    CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS migrations(name TEXT PRIMARY KEY, applied TEXT NOT NULL);
  `);
    connection = db;
    return db;
}
export function transaction<T>(work: () => T): T {
    const db = database();
    db.exec("BEGIN IMMEDIATE");
    try {
        const value = work();
        db.exec("COMMIT");
        return value;
    }
    catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}
export function closeDatabase() { connection?.close(); connection = undefined; }
