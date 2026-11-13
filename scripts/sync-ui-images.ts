import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
// Manifest ảnh tĩnh thuộc design; UI không import lớp dữ liệu nghiệp vụ.
copyFileSync(resolve("src/data/site/anh-diem-den.json"),resolve("src/design/anh-diem-den.json"));
console.log("Đã đồng bộ metadata ảnh và ghi công cho UI.");
