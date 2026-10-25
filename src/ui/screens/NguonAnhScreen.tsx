"use client";
import React from "react";
import Link from "next/link";
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";

export interface HinhAnhGhiCongRow {
  diemDen: string;
  nguon: string;
  tacGia: string;
  giayPhep: string;
  url: string;
  ghiChu: string;
}

const ANH_MAU: HinhAnhGhiCongRow[] = [
  {
    diemDen: "Đà Nẵng",
    nguon: "Wikimedia Commons",
    tacGia: "Supanut Arunoprayote",
    giayPhep: "CC BY 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Da_Nang_Dragon_Bridge_(I).jpg",
    ghiChu: "Cầu Rồng Đà Nẵng bắc qua sông Hàn",
  },
  {
    diemDen: "Hà Nội",
    nguon: "Wikimedia Commons",
    tacGia: "DHN",
    giayPhep: "CC BY-SA 3.0",
    url: "https://commons.wikimedia.org/wiki/File:Th%C3%A1p_R%C3%B9a_3.jpg",
    ghiChu: "Tháp Rùa Hồ Hoàn Kiếm",
  },
  {
    diemDen: "Đà Lạt",
    nguon: "Wikimedia Commons",
    tacGia: "Diane Selwyn",
    giayPhep: "Public Domain (CC0)",
    url: "https://commons.wikimedia.org/wiki/File:Xuan_Huong_Lake_08.jpg",
    ghiChu: "Hồ Xuân Hương Đà Lạt",
  },
  {
    diemDen: "Bangkok",
    nguon: "Wikimedia Commons",
    tacGia: "Diliff",
    giayPhep: "CC BY 2.5",
    url: "https://commons.wikimedia.org/wiki/File:Wat_Arun_from_Chao_Phraya_River.jpg",
    ghiChu: "Chùa Wat Arun bên dòng sông Chao Phraya",
  },
  {
    diemDen: "Seoul",
    nguon: "Wikimedia Commons",
    tacGia: "Blmtduddl",
    giayPhep: "CC BY-SA 3.0",
    url: "https://commons.wikimedia.org/wiki/File:Gyeongbokgung-GeunJeongJeon.jpg",
    ghiChu: "Điện Cần Chính Cung điện Gyeongbokgung",
  },
  {
    diemDen: "Phú Quốc",
    nguon: "Wikimedia Commons",
    tacGia: "Trương Thái Du",
    giayPhep: "CC BY-SA 3.0",
    url: "https://commons.wikimedia.org/wiki/File:Saigon_Phuquoc_resort.jpg",
    ghiChu: "Bãi biển nghỉ dưỡng Phú Quốc",
  },
  {
    diemDen: "Nha Trang",
    nguon: "Wikimedia Commons",
    tacGia: "Vyacheslav Argenberg",
    giayPhep: "CC BY 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Nha_Trang_Beach_7.jpg",
    ghiChu: "Bờ biển và vịnh Nha Trang",
  },
  {
    diemDen: "Tokyo",
    nguon: "Wikimedia Commons",
    tacGia: "Benh LIEU SONG",
    giayPhep: "CC BY-SA 3.0",
    url: "https://commons.wikimedia.org/wiki/File:Tokyo_Tower_and_around_Skyscrapers.jpg",
    ghiChu: "Tháp Tokyo và đường chân trời Shinjuku",
  },
  {
    diemDen: "TP. Hồ Chí Minh",
    nguon: "Wikimedia Commons",
    tacGia: "Tran Qui Thinh",
    giayPhep: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Ho_Chi_Minh_City_skyline_at_night_(Tran_Qui_Thinh).jpg",
    ghiChu: "Skyline Bến Bạch Đằng về đêm",
  },
  {
    diemDen: "Hội An",
    nguon: "Wikimedia Commons",
    tacGia: "Thoai Phung",
    giayPhep: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Hoi_An_Lanterns_at_Night.jpg",
    ghiChu: "Phố cổ Hội An đèn lồng rực rỡ",
  },
  {
    diemDen: "Huế",
    nguon: "Wikimedia Commons",
    tacGia: "Diego Delso",
    giayPhep: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Puerta_Ngo_Mon,_Ciudad_Imperial,_Hue,_Vietnam,_2013-08-12,_DD_02.JPG",
    ghiChu: "Cửa Ngọ Môn Đại Nội Hoàng thành Huế",
  },
  {
    diemDen: "Ẩm thực & Cà phê",
    nguon: "Wikimedia Commons",
    tacGia: "CC Contributors (takeaway, Popcorn)",
    giayPhep: "CC BY-SA 3.0 / 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Beef_pho,_Hanoi,_Vietnam.jpg",
    ghiChu: "Phở bò truyền thống, Bánh mì và Cà phê phin sữa đá",
  },
];

export function NguonAnhScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-background)",
        color: "var(--color-text)",
        fontSize: 16,
      }}
    >
      <SiteHeader />

      <main id="main-content" style={{ flex: 1, maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px", width: "100%" }}>
        {/* Breadcrumb */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text-sub)",
            marginBottom: 20,
          }}
        >
          <Link href="/" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
            Trang chủ
          </Link>
          <span>/</span>
          <span style={{ color: "var(--color-primary-main)" }}>Nguồn ảnh & Bản quyền</span>
        </div>

        {/* Tiêu đề */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "var(--color-text)",
              margin: "0 0 12px",
              letterSpacing: "-0.5px",
            }}
          >
            Chính Sách Bản Quyền Hình Ảnh & Ghi Công
          </h1>
          <p style={{ fontSize: 16, color: "var(--color-text-sub)", margin: 0, lineHeight: 1.6 }}>
            Trip Vibes tuân thủ nghiêm ngặt quyền sở hữu trí tuệ. Toàn bộ hình ảnh sử dụng trên nền tảng đều có giấy phép mở hoặc được cấp quyền minh bạch.
          </p>
        </div>

        {/* Cam kết bản quyền */}
        <section
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--color-border)",
            padding: "28px 32px",
            marginBottom: 36,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <ShieldCheck size={22} color="var(--color-status-success)" />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
              Cam Kết Bản Quyền Hình Ảnh
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, lineHeight: 1.6, color: "var(--color-text-sub)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 size={18} color="var(--color-status-success)" style={{ flexShrink: 0, marginTop: 3 }} />
              <div>
                <strong style={{ color: "var(--color-text)" }}>Wikimedia Commons:</strong> Các ảnh tư liệu địa danh có liên kết thực thể Wikidata hoặc tài liệu Commons, được cấp phép theo Creative Commons (CC-BY, CC-BY-SA) hoặc thuộc phạm vi công cộng (Public Domain).
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 size={18} color="var(--color-status-success)" style={{ flexShrink: 0, marginTop: 3 }} />
              <div>
                <strong style={{ color: "var(--color-text)" }}>Unsplash:</strong> Ảnh nghệ thuật đại diện điểm đến và banner do nhóm phát triển tuyển chọn thủ công, tuân thủ giấy phép Unsplash License kèm UTM tracking.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 size={18} color="var(--color-status-success)" style={{ flexShrink: 0, marginTop: 3 }} />
              <div>
                <strong style={{ color: "var(--color-text)" }}>Tuyệt đối không sử dụng:</strong> Trip Vibes kiên quyết KHÔNG cào dữ liệu hoặc sử dụng trái phép hình ảnh từ Google Places, Airbnb, Expedia, Wanderlog hay bất kỳ dịch vụ thương mại có bản quyền đóng nào.
              </div>
            </div>
          </div>
        </section>

        {/* Bảng ghi công tham khảo */}
        <section
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--color-border)",
            padding: "28px 32px",
            marginBottom: 40,
            overflowX: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Camera size={22} color="var(--color-primary-main)" />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
              Danh Mục Ghi Công Điểm Đến
            </h2>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 14px", color: "var(--color-text)" }}>Điểm đến</th>
                <th style={{ padding: "12px 14px", color: "var(--color-text)" }}>Tác giả</th>
                <th style={{ padding: "12px 14px", color: "var(--color-text)" }}>Nguồn lưu trữ</th>
                <th style={{ padding: "12px 14px", color: "var(--color-text)" }}>Giấy phép</th>
                <th style={{ padding: "12px 14px", color: "var(--color-text)" }}>Nội dung đại diện</th>
              </tr>
            </thead>
            <tbody>
              {ANH_MAU.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "14px", fontWeight: 700, color: "var(--color-text)" }}>{row.diemDen}</td>
                  <td style={{ padding: "14px", color: "var(--color-text)" }}>{row.tacGia}</td>
                  <td style={{ padding: "14px", color: "var(--color-text-sub)" }}>
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--color-primary-main)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <span>{row.nguon}</span>
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td style={{ padding: "14px", color: "var(--color-text-sub)" }}>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: "var(--r-xs)",
                        background: "var(--color-surface-subtle)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {row.giayPhep}
                    </span>
                  </td>
                  <td style={{ padding: "14px", color: "var(--color-text-sub)" }}>{row.ghiChu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Nút quay lại */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "var(--color-text-sub)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            ← Về trang chủ
          </Link>
          <Link
            href="/diem-den"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 44,
              padding: "0 22px",
              borderRadius: "var(--r-md)",
              background: "var(--color-primary-main)",
              color: "var(--color-primary-text)",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <span>Khám phá điểm đến</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
