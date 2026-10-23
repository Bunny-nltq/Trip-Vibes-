"use client";
import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Database,
  Lock,
  ArrowRight,
  MapPin,
  Calendar,
} from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";

export function GioiHanScreen() {
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
          <span style={{ color: "var(--color-primary-main)" }}>Giới hạn & Tuyên bố hệ thống</span>
        </div>

        {/* Tiêu đề trang */}
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
            Giới Hạn Hệ Thống & Tuyên Bố Minh Bạch
          </h1>
          <p style={{ fontSize: 16, color: "var(--color-text-sub)", margin: 0, lineHeight: 1.6 }}>
            Trip Vibes cam kết minh bạch 100% về nguồn gốc dữ liệu, độ chính xác của các ước tính và giới hạn phạm vi hoạt động của đồ án.
          </p>
        </div>

        {/* Khung tóm tắt nhanh */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              padding: "20px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Calendar size={18} color="var(--color-primary-main)" />
              <strong style={{ fontSize: 15, color: "var(--color-text)" }}>Thời lượng hỗ trợ</strong>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-sub)", lineHeight: 1.5 }}>
              Hỗ trợ lập kế hoạch từ <strong>2 đến 7 ngày</strong> (tương ứng 1 đến 6 đêm lưu trú).
            </p>
          </div>

          <div
            style={{
              background: "var(--color-surface)",
              padding: "20px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <MapPin size={18} color="var(--color-category-am-thuc)" />
              <strong style={{ fontSize: 15, color: "var(--color-text)" }}>5 điểm đến chính thức</strong>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-sub)", lineHeight: 1.5 }}>
              Đà Nẵng, Hà Nội, Đà Lạt, Bangkok, Seoul có snapshot được kiểm định độc lập.
            </p>
          </div>

          <div
            style={{
              background: "var(--color-surface)",
              padding: "20px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Lock size={18} color="var(--color-status-success)" />
              <strong style={{ fontSize: 15, color: "var(--color-text)" }}>Bảo mật dữ liệu bill</strong>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-sub)", lineHeight: 1.5 }}>
              Ảnh hóa đơn chỉ xử lý trong bộ nhớ RAM, không lưu xuống ổ đĩa, không ghi log nhạy cảm.
            </p>
          </div>
        </div>

        {/* Nội dung chi tiết các mục */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Mục 1: Nguồn dữ liệu & Tính minh bạch */}
          <section
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--color-border)",
              padding: "28px 32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Database size={22} color="var(--color-primary-main)" />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
                1. Nguồn dữ liệu & Tính minh bạch
              </h2>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.6, color: "var(--color-text-sub)" }}>
              <li>
                <strong style={{ color: "var(--color-text)" }}>Địa điểm, Khách sạn, Quán ăn, Hoạt động:</strong> Thu thập từ <strong>OpenStreetMap (OSM)</strong> qua Overpass API và Geocoding bởi Nominatim với giới hạn tuân thủ 1 yêu cầu/giây.
              </li>
              <li>
                <strong style={{ color: "var(--color-text)" }}>Giá cả ước tính:</strong> Mọi mức giá khách sạn theo sao, chi phí bữa ăn và vé tham quan đều là số liệu ước tính tham khảo (được gắn nhãn <em>&quot;Giá ước tính&quot;</em>). Trip Vibes không bịa đặt đánh giá sao hoặc giá giả mạo.
              </li>
              <li>
                <strong style={{ color: "var(--color-text)" }}>Tỷ giá ngoại tệ:</strong> Quy đổi về VND dựa trên tỷ giá thị trường có nguồn và ngày trích xuất cụ thể.
              </li>
            </ul>
          </section>

          {/* Mục 2: Phạm vi KHÔNG thực hiện */}
          <section
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--color-border)",
              padding: "28px 32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <ShieldAlert size={22} color="var(--color-status-warning)" />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
                2. Phạm vi KHÔNG thực hiện (Non-Goals)
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.6, color: "var(--color-text-sub)" }}>
              <p style={{ margin: 0 }}>
                Để tập trung tối ưu năng lực thuật toán phân bổ ngân sách thông minh, ứng dụng KHÔNG bao gồm các nghiệp vụ thương mại sau:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <li><strong>Không đặt vé thật hay phòng khách sạn thật:</strong> Ứng dụng cung cấp kế hoạch tham khảo, không tích hợp cổng đặt phòng trực tiếp.</li>
                <li><strong>Không xử lý thanh toán tiền thật:</strong> Hệ thống không yêu cầu thẻ tín dụng hay tài khoản ngân hàng. Tính năng quét bill chỉ nhằm ghi chép vào sổ chi tiêu cá nhân.</li>
                <li><strong>Không tư vấn pháp lý xuất nhập cảnh hay visa:</strong> Người dùng cần tự kiểm tra quy định visa chính thức khi du lịch nước ngoài (Bangkok, Seoul).</li>
                <li><strong>Không nhúng bản đồ tương tác khi chưa có thỏa thuận cấp phép ô bản đồ (Map Tiles):</strong> Ứng dụng cung cấp liên kết ngoài mở chỉ đường trên Google Maps / Apple Maps.</li>
              </ul>
            </div>
          </section>

          {/* Mục 3: Xử lý hóa đơn & Quyền riêng tư */}
          <section
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--color-border)",
              padding: "28px 32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <ShieldCheck size={22} color="var(--color-status-success)" />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
                3. Xử lý hóa đơn & Bảo vệ quyền riêng tư
              </h2>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.6, color: "var(--color-text-sub)" }}>
              <li>
                <strong style={{ color: "var(--color-text)" }}>Xử lý hoàn toàn trong bộ nhớ (In-memory buffer):</strong> Khi tải ảnh hóa đơn chi tiêu lên, tệp ảnh chỉ được lưu tạm trong bộ nhớ RAM phục vụ trích xuất và bị hủy ngay lập tức, không bao giờ lưu trữ vào đĩa cứng máy chủ.
              </li>
              <li>
                <strong style={{ color: "var(--color-text)" }}>Xác nhận của người dùng:</strong> Mọi số tiền bóc tách được từ hóa đơn luôn hiển thị để người dùng kiểm tra và bấm nút xác nhận trước khi được lưu vào sổ chi tiêu.
              </li>
              <li>
                <strong style={{ color: "var(--color-text)" }}>Chế độ khách (Guest mode):</strong> Người dùng không cần tạo tài khoản hay đăng nhập. Mọi dữ liệu hành trình được lưu trữ an toàn trong trình duyệt cục bộ (Local Storage).
              </li>
            </ul>
          </section>
        </div>

        {/* Nút quay lại trang chủ & Lập kế hoạch */}
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
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
            href="/lap-ke-hoach"
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
              boxShadow: "0 2px 8px rgba(43, 85, 214, 0.25)",
            }}
          >
            <span>Trải nghiệm lập kế hoạch</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
