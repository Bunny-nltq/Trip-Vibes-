"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";

export interface PhapLyScreenProps {
  loai: "dieu-khoan" | "quyen-rieng-tu";
}

export function PhapLyScreen({ loai }: PhapLyScreenProps) {
  const isDieuKhoan = loai === "dieu-khoan";

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

      <main id="main-content" style={{ flex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px", width: "100%" }}>
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
          <span style={{ color: "var(--color-primary-main)" }}>
            {isDieuKhoan ? "Điều khoản dịch vụ" : "Chính sách quyền riêng tư"}
          </span>
        </div>

        {/* Khung thông báo đồ án */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "var(--r-md)",
            background: "var(--color-surface-subtle)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
            fontSize: 14,
            color: "var(--color-text-sub)",
          }}
        >
          <Info size={18} color="var(--color-primary-main)" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: "var(--color-text)" }}>Lưu ý đồ án:</strong> Đây là bản quy chế phục vụ nghiên cứu và trình bày đồ án công nghệ, không cấu thành tư vấn pháp lý thương mại.
          </span>
        </div>

        {/* Tiêu đề */}
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "var(--color-text)",
            margin: "0 0 16px",
            letterSpacing: "-0.5px",
          }}
        >
          {isDieuKhoan ? "Điều Khoản Sử Dụng Nền Tảng" : "Chính Sách Bảo Vệ Quyền Riêng Tư"}
        </h1>

        {isDieuKhoan ? (
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--color-border)",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              lineHeight: 1.6,
              color: "var(--color-text-sub)",
            }}
          >
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px" }}>
                1. Mục đích hoạt động
              </h2>
              <p style={{ margin: 0 }}>
                Trip Vibes là công cụ hỗ trợ người dùng xây dựng kế hoạch du lịch dựa trên thuật toán tối ưu hóa chi phí. Ứng dụng cung cấp các ước tính giá và gợi ý thời gian mang tính tham khảo và học thuật.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px" }}>
                2. Miễn trừ trách nhiệm về giao dịch thực tế
              </h2>
              <p style={{ margin: 0 }}>
                Nền tảng không thực hiện bất kỳ giao dịch tài chính, thanh toán hay giữ chỗ khách sạn/vé xe thực tế. Người dùng chịu trách nhiệm kiểm tra lại tính sẵn sàng, giờ mở cửa và giá bán chính thức tại thời điểm khởi hành.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px" }}>
                3. Sở hữu trí tuệ và dữ liệu mở
              </h2>
              <p style={{ margin: 0 }}>
                Dữ liệu địa điểm và tọa độ được cung cấp theo giấy phép mở OpenStreetMap Contributors (ODbL). Mã nguồn và giao diện người dùng tuân thủ các quy tắc bảo mật không lưu trữ thông tin nhạy cảm.
              </p>
            </section>
          </div>
        ) : (
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--color-border)",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              lineHeight: 1.6,
              color: "var(--color-text-sub)",
            }}
          >
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px" }}>
                1. Thu thập dữ liệu cá nhân
              </h2>
              <p style={{ margin: 0 }}>
                Trip Vibes hoạt động hoàn toàn ở chế độ khách (Guest mode). Chúng tôi <strong>không yêu cầu đăng ký tài khoản</strong>, không thu thập địa chỉ email, số điện thoại hay thông tin tài khoản ngân hàng của bạn.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px" }}>
                2. Quy trình xử lý ảnh hóa đơn chi tiêu
              </h2>
              <p style={{ margin: 0 }}>
                Khi bạn sử dụng tính năng bóc tách hóa đơn, tệp ảnh được chuyển trực tiếp vào bộ nhớ đệm (in-memory buffer) để mô hình OCR trích xuất số tiền. Tệp ảnh <strong>không bao giờ được ghi xuống đĩa cứng máy chủ</strong> và bị giải phóng khỏi bộ nhớ ngay sau khi xử lý xong.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px" }}>
                3. Lưu trữ cục bộ (Local Storage)
              </h2>
              <p style={{ margin: 0 }}>
                Kế hoạch chuyến đi và sổ chi tiêu của bạn được lưu trong bộ nhớ cục bộ của trình duyệt máy bạn (localStorage). Bạn có thể xóa dữ liệu này bất kỳ lúc nào bằng cách xóa lịch sử duyệt web hoặc bấm nút xóa hành trình trong ứng dụng.
              </p>
            </section>
          </div>
        )}

        {/* Nút điều hướng */}
        <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            href="/gioi-han"
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
            <span>Xem giới hạn hệ thống</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
