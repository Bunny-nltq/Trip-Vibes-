import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { database, closeDatabase } from "../src/data/database";

const source=process.env.TRIP_VIBES_DB || resolve(".cache","trip-vibes.sqlite");
if(!existsSync(source))throw new Error("Chưa có cơ sở dữ liệu local để sao lưu.");
const folder=resolve(".cache","backups");
mkdirSync(folder,{recursive:true});
const target=resolve(folder,`trip-vibes-${new Date().toISOString().replace(/[:.]/g,"-")}.sqlite`);
try {
  // SQLite tạo bản sao nhất quán, kể cả khi ứng dụng đang dùng WAL.
  database().prepare("VACUUM INTO ?").run(target);
  console.log(`Đã sao lưu SQLite: ${target}`);
} finally { closeDatabase(); }
