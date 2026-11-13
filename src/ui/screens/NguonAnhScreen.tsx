"use client";
import React from "react";
import photoManifest from "@/design/anh-diem-den.json";
import { getHotelImage, getRestaurantImage, getCafeImage, getActivityImage } from "@/ui/lib/imageMap";
import journeyScene from "@/design/assets/coastal-journey-v3.png";
import venueSamples from "@/design/assets/venue-samples.webp";
import experienceSamples from "@/design/assets/experience-samples.webp";
import lodgingSample from "@/design/assets/lodging-sample.webp";
import Link from "next/link";
import { Camera, ShieldCheck, CheckCircle2, ExternalLink, ArrowRight, } from "lucide-react";
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
const photoAssets = [...Object.entries(photoManifest).flatMap(([name, info]) => typeof info === "object" && info !== null ? [{ name, ...info }] : []), ...["Đà Nẵng", "Hà Nội", "Đà Lạt", "Bangkok", "Seoul"].map(name => ({ name: `Lưu trú · ${name}`, ...getHotelImage(null, undefined, name) })), ...[1, 2, 3, 4, 5].map(stars => ({ name: "Minh họa lưu trú", ...getHotelImage(stars) })), { name: "Ẩm thực · phở", ...getRestaurantImage() }, { name: "Ẩm thực · bánh mì", ...getRestaurantImage("bánh mì") }, { name: "Cà phê", ...getCafeImage() }, ...["biển", "chùa", "chợ", ""].map(name => ({ name: `Trải nghiệm · ${name}`, ...getActivityImage(undefined, name) }))];
const uniquePhotos = [...new Map(photoAssets.map(photo => [photo.url, photo])).values()].filter(photo=>photo.url!==journeyScene.src&&photo.tacGia!=="CC-Photographer"&&photo.tacGia!=="Wikimedia Commons");
const generatedSamples: HinhAnhGhiCongRow[] = [
    {
        diemDen: "Khu tưởng niệm, tượng đài, điểm ngắm cảnh, khu vui chơi, phòng trưng bày và điểm tham quan",
        nguon: "OpenAI Image Generation",
        tacGia: "Minh họa AI cho Trip Vibes",
        giayPhep: "Minh họa tạo bằng AI",
        url: experienceSamples.src,
        ghiChu: "Sáu cảnh mẫu minh họa theo loại trải nghiệm.",
    },
    {
        diemDen: "Ẩm thực, cà phê, bảo tàng, di tích, công viên và bãi biển",
        nguon: "OpenAI Image Generation",
        tacGia: "Minh họa AI cho Trip Vibes",
        giayPhep: "Minh họa tạo bằng AI",
        url: venueSamples.src,
        ghiChu: "Bộ ảnh minh họa theo loại địa điểm.",
    },
    {
        diemDen: "Phòng lưu trú",
        nguon: "OpenAI Image Generation",
        tacGia: "Minh họa AI cho Trip Vibes",
        giayPhep: "Minh họa tạo bằng AI",
        url: lodgingSample.src,
        ghiChu: "Ảnh phòng mẫu dùng trên các thẻ lưu trú.",
    },
];
const ANH_MAU: HinhAnhGhiCongRow[] = [...generatedSamples, { diemDen: "Nền hành trình biển–núi", nguon: "OpenAI Image Generation", tacGia: "Minh họa AI cho Trip Vibes", giayPhep: "Minh họa tạo bằng AI", url: journeyScene.src, ghiChu: "Phong cảnh minh họa, không đại diện một địa điểm thực. Tạo ngày 26/10/2026." }, ...uniquePhotos.map(photo => { const filename = photo.url.match(/\/commons\/(?:thumb\/)?[a-f0-9]\/[a-f0-9]{2}\/([^/]+)/)?.[1]; return { diemDen: photo.name, nguon: photo.nguon, tacGia: photo.tacGia, giayPhep: photo.giayPhep, url: filename ? `https://commons.wikimedia.org/wiki/File:${filename}` : photo.url, ghiChu: photo.alt || "Ảnh minh họa" }; })];
export function NguonAnhScreen() {
    return (<div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--home-wash)",
            backgroundImage: "var(--home-overlay), var(--v4-scene)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundAttachment: "fixed",
            color: "var(--color-text)",
            fontSize: 16,
        }}>
      <SiteHeader />

      <main id="main-content" style={{ flex: 1, maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px", width: "100%" }}>
        {/* Breadcrumb */}
        <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text-sub)",
            marginBottom: 20,
        }}>
          <Link href="/" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
            Trang chủ
          </Link>
          <span>/</span>
          <span style={{ color: "var(--color-primary-main)" }}>Nguồn ảnh & Bản quyền</span>
        </div>

        {/* Tiêu đề */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: "var(--color-text)",
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
        }}>
            Chính Sách Bản Quyền Hình Ảnh & Ghi Công
          </h1>
          <p style={{ fontSize: 16, color: "var(--color-text-sub)", margin: 0, lineHeight: 1.6 }}>
            Thông tin tác giả, nguồn và giấy phép ảnh được tập hợp tại đây. Ảnh minh họa không thay thế hình ảnh xác nhận của từng địa điểm hoặc nơi lưu trú.
          </p>
        </div>

        {/* Cam kết bản quyền */}
        <section style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--color-border)",
            padding: "28px 32px",
            marginBottom: 36,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <ShieldCheck size={22} color="var(--color-status-success)"/>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
              Cam Kết Bản Quyền Hình Ảnh
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, lineHeight: 1.6, color: "var(--color-text-sub)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 size={18} color="var(--color-status-success)" style={{ flexShrink: 0, marginTop: 3 }}/>
              <div>
                <strong style={{ color: "var(--color-text)" }}>Wikimedia Commons:</strong> Các ảnh tư liệu địa danh có liên kết thực thể Wikidata hoặc tài liệu Commons, được cấp phép theo Creative Commons (CC-BY, CC-BY-SA) hoặc thuộc phạm vi công cộng (Public Domain).
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 size={18} color="var(--color-status-success)" style={{ flexShrink: 0, marginTop: 3 }}/>
              <div>
                <strong style={{ color: "var(--color-text)" }}>Unsplash:</strong> Ảnh nghệ thuật đại diện điểm đến và banner do nhóm phát triển tuyển chọn thủ công, tuân thủ giấy phép Unsplash License kèm UTM tracking.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 size={18} color="var(--color-status-success)" style={{ flexShrink: 0, marginTop: 3 }}/>
              <div>
                <strong style={{ color: "var(--color-text)" }}>Tuyệt đối không sử dụng:</strong> Trip Vibes kiên quyết KHÔNG cào dữ liệu hoặc sử dụng trái phép hình ảnh từ Google Places, Airbnb, Expedia, Wanderlog hay bất kỳ dịch vụ thương mại có bản quyền đóng nào.
              </div>
            </div>
          </div>
        </section>

        {/* Bảng ghi công tham khảo */}
        <section style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--color-border)",
            padding: "28px 32px",
            marginBottom: 40,
            overflowX: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Camera size={22} color="var(--color-primary-main)"/>
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
              {ANH_MAU.map((row, idx) => (<tr key={idx} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "14px", fontWeight: 700, color: "var(--color-text)" }}>{row.diemDen}</td>
                  <td style={{ padding: "14px", color: "var(--color-text)" }}>{row.tacGia}</td>
                  <td style={{ padding: "14px", color: "var(--color-text-sub)" }}>
                    <a href={row.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary-main)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span>{row.nguon}</span>
                      <ExternalLink size={12}/>
                    </a>
                  </td>
                  <td style={{ padding: "14px", color: "var(--color-text-sub)" }}>
                    <span style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: "var(--r-xs)",
                background: "var(--color-surface-subtle)",
                border: "1px solid var(--color-border)",
            }}>
                      {row.giayPhep}
                    </span>
                  </td>
                  <td style={{ padding: "14px", color: "var(--color-text-sub)" }}>{row.ghiChu}</td>
                </tr>))}
            </tbody>
          </table>
        </section>

        {/* Nút quay lại */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{
            textDecoration: "none",
            color: "var(--color-text-sub)",
            fontSize: 14,
            fontWeight: 600,
        }}>
            ← Về trang chủ
          </Link>
          <Link href="/diem-den" style={{
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
        }}>
            <span>Khám phá điểm đến</span>
            <ArrowRight size={15}/>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>);
}
