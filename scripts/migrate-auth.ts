import { join } from "node:path";
import { migrateLegacy } from "../src/data/migrateLegacy";
import { closeDatabase } from "../src/data/database";
try {console.log(JSON.stringify(migrateLegacy(join(process.cwd(),".cache","auth"),process.argv.includes("--apply"))));}
catch {console.error("Không thể chuyển dữ liệu. Kiểm tra schema của bản JSON cũ; chưa xóa hay ghi đè dữ liệu nguồn.");process.exitCode=1;}
finally {closeDatabase();}
