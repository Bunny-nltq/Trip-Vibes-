/**
 * scripts/kiem-tra-ui.ts
 *
 * Kiểm tra HTML của "/" và "/lap-ke-hoach":
 * Không được chứa chuỗi cấm (không phân biệt hoa thường):
 * "Bunny", "Cài đặt", "Bạn muốn đi đâu hôm nay", "Good trip", "Đi để thấy thế giới",
 * "Tính năng nổi bật", "AI Agent", "thông minh"
 */

import { chuoiCam, DANH_SACH_CAM } from "./lib/chuoiCam";

export { chuoiCam, DANH_SACH_CAM };

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} khi truy cập ${url}`);
  }
  return await res.text();
}

export async function runKiemTraUI(port = process.env.PORT || "3000"): Promise<boolean> {
  const baseUrl = `http://localhost:${port}`;
  console.log(`================================================================================`);
  console.log(`KIỂM TRA CHUỖI CẤM GIAO DIỆN TẠI ${baseUrl}`);
  console.log(`================================================================================\n`);

  const routes = ["/", "/lap-ke-hoach"];
  let hasViolation = false;

  for (const route of routes) {
    const fullUrl = `${baseUrl}${route}`;
    try {
      console.log(`Đang kiểm tra: ${fullUrl}...`);
      const html = await fetchPage(fullUrl);
      const viPham = chuoiCam(html);

      if (viPham.length > 0) {
        console.error(`❌ PHÁT HIỆN CHUỖI CẤM tại ${route}:`);
        for (const tu of viPham) {
          console.error(`  - "${tu}"`);
        }
        hasViolation = true;
      } else {
        console.log(`✅ ${route}: Không chứa bất kỳ chuỗi cấm nào (${DANH_SACH_CAM.length}/${DANH_SACH_CAM.length} từ sạch)`);
      }
    } catch (err: any) {
      console.error(`❌ Lỗi khi truy cập ${fullUrl}:`, err?.message || err);
      hasViolation = true;
    }
  }

  if (hasViolation) {
    console.error(`\n❌ KIỂM TRA THẤT BẠI: Vẫn còn chuỗi cấm trong giao diện!`);
    return false;
  }

  console.log(`\n✅ TOÀN BỘ KIỂM TRA GIAO DIỆN ĐẠT CHUẨN: Sạch hoàn toàn chuỗi cấm!`);
  return true;
}

if (process.argv[1] && process.argv[1].includes("kiem-tra-ui")) {
  const portArg = process.argv.find((a) => a.startsWith("--port="));
  const port = portArg ? portArg.split("=")[1] : process.env.PORT || "3000";
  runKiemTraUI(port).then((ok) => {
    if (!ok) process.exit(1);
  });
}
