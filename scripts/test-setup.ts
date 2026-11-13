import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vitest";
const dir = mkdtempSync(join(tmpdir(), "trip-vibes-test-"));
process.env.TRIP_VIBES_DB = join(dir, "test.sqlite");
process.env.LIVE_AI_ENABLED = "false";
afterAll(async () => { const { closeDatabase } = await import("../src/data/database"); closeDatabase(); try { rmSync(dir, {recursive:true, force:true}); } catch { /* Windows may hold SQLite handles until worker exits. */ } });
