/**
 * scripts/lib/quetMau.ts
 *
 * Hàm thuần quét phát hiện mã màu hex và tên font cứng trong mã nguồn UI.
 * Phục vụ script check:colors và test tự động.
 */

// Regex tìm mã màu HEX: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
export const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;

// Các tên font cứng không được viết trực tiếp trong src/ui
export const HARDCODED_FONTS = [
  "Be Vietnam Pro",
  "Dancing Script",
  "Inter",
  "Roboto",
  "Arial",
  "sans-serif",
  "cursive",
];

// Cấu hình danh sách tệp hoặc thư mục được miễn trừ:
// TUYỆT ĐỐI KHÔNG CÓ THƯ MỤC NÀO ĐƯỢC MIỄN TRỪ TRONG SRC/UI!
export const DANH_SACH_MIEN_TRU: string[] = [];

// Từ khóa cấm
export const TU_KHOA_CAM = {
  hexRegex: HEX_COLOR_REGEX,
  fonts: HARDCODED_FONTS,
};

export interface ViPhamMau {
  file: string;
  line: number;
  type: "Mã hex" | "Tên font";
  content: string;
}

/**
 * Hàm thuần quét nội dung file để tìm các vi phạm mã màu và font viết cứng.
 * @param noiDung Nội dung văn bản của file
 * @param tenFile Đường dẫn file để ghi nhận vi phạm
 */
export function quetNoiDung(noiDung: string, tenFile: string): ViPhamMau[] {
  const violations: ViPhamMau[] = [];
  const lines = noiDung.split(/\r?\n/);

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    // Bỏ qua dòng chú thích thuần
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return;
    }

    // Loại trừ các trường hợp href="#..." (liên kết neo trang web như href="#top")
    const lineWithoutHref = lineText.replace(/href\s*=\s*["']#[^"']*["']/g, "");

    // 1. Kiểm tra mã HEX
    const hexMatches = lineWithoutHref.match(HEX_COLOR_REGEX);
    if (hexMatches) {
      for (const match of hexMatches) {
        violations.push({
          file: tenFile,
          line: idx + 1,
          type: "Mã hex",
          content: lineText.trim(),
        });
      }
    }

    // 2. Kiểm tra tên font cứng (chỉ kiểm tra khi xuất hiện trong chuỗi định nghĩa style / font-family)
    for (const font of HARDCODED_FONTS) {
      if (
        (lineText.includes(`"${font}"`) ||
          lineText.includes(`'${font}'`) ||
          (lineText.includes("fontFamily") && lineText.includes(font))) &&
        !lineText.includes("var(--font-")
      ) {
        violations.push({
          file: tenFile,
          line: idx + 1,
          type: "Tên font",
          content: lineText.trim(),
        });
      }
    }
  });

  return violations;
}
