"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";

const FAQS = [
  {
    q: "Trip Vibes hoạt động như thế nào?",
    a: "Trip Vibes là công cụ hỗ trợ bạn xây dựng kế hoạch du lịch dựa trên ngân sách thực tế. Bạn chỉ cần chọn điểm đến, số ngày (2-7 ngày), số người và mức tiền dự kiến; hệ thống sẽ tự động phân bổ chi phí phương tiện, khách sạn, ăn uống và gợi ý các điểm tham quan phù hợp từ OpenStreetMap.",
  },
  {
    q: "Làm thế nào để ghi nhận chi tiêu từ hóa đơn?",
    a: "Tại mục 'Nhật ký chuyến đi' (màn hình B8), chuyển sang tab 'Chi tiêu' và chọn 'Thêm khoản chi' -> 'Quét hóa đơn'. Bạn chỉ cần tải lên ảnh hóa đơn (JPEG/PNG dưới 5MB). AI sẽ tự động đọc tên cửa hàng, ngày và số tiền để bạn xác nhận trước khi lưu vào sổ.",
  },
  {
    q: "Dữ liệu hóa đơn và chi tiêu của tôi có bị lộ không?",
    a: "Tuyệt đối không! Ảnh hóa đơn chỉ được xử lý tạm thời trên bộ nhớ RAM để trích xuất số liệu và được giải phóng ngay sau đó. Hệ thống không lưu trữ tệp ảnh trên máy chủ và không thu thập bất kỳ thông tin cá nhân nào.",
  },
  {
    q: "Tại sao tôi thấy cờ cảnh báo 'Thời gian di chuyển dài'?",
    a: "Quy chuẩn của Trip Vibes đặt giới hạn thời gian di chuyển tối đa là 35% tổng thời lượng chuyến đi để đảm bảo chuyến du lịch thoải mái và không bị kiệt sức. Nếu các phương án bạn chọn chiếm quá 35% thời gian (ví dụ di chuyển bằng xe khách đường dài), cờ cảnh báo sẽ xuất hiện để bạn cân nhắc đổi sang máy bay hoặc tàu nhanh.",
  },
  {
    q: "Giá hiển thị trên ứng dụng có phải là giá chốt khi đặt thực tế?",
    a: "Không. Mọi mức giá trên Trip Vibes đều là 'Giá ước tính' dựa trên dữ liệu tham khảo và mức giá trung bình của các khách sạn theo phân khúc sao hoặc quán ăn. Khi đi du lịch thực tế, bạn sẽ ghi nhận số tiền thật qua tính năng Quét hóa đơn để theo dõi độ lệch ngân sách.",
  },
];

export function TroGiupScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
          <span style={{ color: "var(--color-primary-main)" }}>Trung tâm trợ giúp</span>
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
            Trung Tâm Hỗ Trợ & Hướng Dẫn
          </h1>
          <p style={{ fontSize: 16, color: "var(--color-text-sub)", margin: 0, lineHeight: 1.6 }}>
            Tìm hiểu quy trình lập kế hoạch du lịch thông minh, cách theo dõi chi tiêu và giải thích chi tiết các cờ cảnh báo rủi ro.
          </p>
        </div>

        {/* Khối 4 bước hướng dẫn */}
        <section
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--color-border)",
            padding: "32px",
            marginBottom: 40,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 24px", color: "var(--color-text)" }}>
            4 Bước Lập Kế Hoạch Chuyến Đi
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--r-full)",
                  background: "var(--color-primary-main)",
                  color: "var(--color-primary-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                1
              </div>
              <strong style={{ fontSize: 15, color: "var(--color-text)" }}>Nhập thông tin cơ bản</strong>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-sub)", lineHeight: 1.5 }}>
                Chọn điểm đến, thời lượng (2-7 ngày), số lượng người đi và ngân sách dự kiến của bạn.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--r-full)",
                  background: "var(--color-primary-main)",
                  color: "var(--color-primary-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                2
              </div>
              <strong style={{ fontSize: 15, color: "var(--color-text)" }}>Tinh chỉnh chi tiết</strong>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-sub)", lineHeight: 1.5 }}>
                Chọn phương tiện di chuyển, khách sạn lưu trú và thêm bớt các điểm vui chơi, ẩm thực.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--r-full)",
                  background: "var(--color-primary-main)",
                  color: "var(--color-primary-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                3
              </div>
              <strong style={{ fontSize: 15, color: "var(--color-text)" }}>Xem & Xuất hành trình</strong>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-sub)", lineHeight: 1.5 }}>
                Kiểm tra thứ tự từng ngày với thời gian hợp lý và mở chỉ đường trực tiếp trên Google Maps.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--r-full)",
                  background: "var(--color-primary-main)",
                  color: "var(--color-primary-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                4
              </div>
              <strong style={{ fontSize: 15, color: "var(--color-text)" }}>Ghi sổ & Quét hóa đơn</strong>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-sub)", lineHeight: 1.5 }}>
                Tải ảnh bill bữa ăn hoặc vé xe; AI đọc số tiền để bạn đối soát tiến độ ngân sách thực tế.
              </p>
            </div>
          </div>
        </section>

        {/* Khối giải thích Cờ cảnh báo (Flags) */}
        <section
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--color-border)",
            padding: "32px",
            marginBottom: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <AlertTriangle size={22} color="var(--color-status-warning)" />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
              Ý Nghĩa Các Cờ Cảnh Báo (System Flags)
            </h2>
          </div>
          <p style={{ fontSize: 14, color: "var(--color-text-sub)", margin: "0 0 20px" }}>
            Hệ thống quy tắc lõi tự động tính toán và gắn cờ cảnh báo khách quan để giúp bạn hạn chế rủi ro:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 14 }}>
            <div style={{ padding: "14px 16px", borderRadius: "var(--r-md)", background: "var(--color-surface-subtle)", border: "1px solid var(--color-border)" }}>
              <strong style={{ color: "var(--color-status-danger)" }}>Vượt ngân sách kế hoạch:</strong>
              <div style={{ color: "var(--color-text-sub)", marginTop: 4 }}>
                Xuất hiện khi tổng chi phí tối thiểu (vé xe + khách sạn + 2 bữa ăn) vượt quá ngân sách bạn thiết lập. Bạn có thể tăng ngân sách hoặc đổi sang phương án tiết kiệm hơn.
              </div>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: "var(--r-md)", background: "var(--color-surface-subtle)", border: "1px solid var(--color-border)" }}>
              <strong style={{ color: "var(--color-status-warning)" }}>Thời gian di chuyển dài ({">"} 35%):</strong>
              <div style={{ color: "var(--color-text-sub)", marginTop: 4 }}>
                Tổng thời gian ngồi trên xe, tàu hoặc máy bay chiếm hơn 35% tổng thời lượng chuyến đi.
              </div>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: "var(--r-md)", background: "var(--color-surface-subtle)", border: "1px solid var(--color-border)" }}>
              <strong style={{ color: "var(--color-primary-main)" }}>Khởi hành sớm / Đến sau nửa đêm:</strong>
              <div style={{ color: "var(--color-text-sub)", marginTop: 4 }}>
                Cảnh báo khi chuyến đi bắt đầu trước 06:00 sáng hoặc đến nơi sau 00:00 đêm để bạn chủ động chuẩn bị phương tiện đưa đón và nhận phòng trễ.
              </div>
            </div>
          </div>
        </section>

        {/* Khối Câu hỏi thường gặp */}
        <section
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--color-border)",
            padding: "32px",
            marginBottom: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <HelpCircle size={22} color="var(--color-primary-main)" />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
              Câu Hỏi Thường Gặp (FAQ)
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--r-md)",
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      background: isOpen ? "var(--color-surface-subtle)" : "var(--color-surface)",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--color-text)",
                      cursor: "pointer",
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                        color: "var(--color-text-sub)",
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: "16px 20px 20px",
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "var(--color-text-sub)",
                        background: "var(--color-surface)",
                        borderTop: "1px solid var(--color-border)",
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Nút hành động */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <Link
            href="/gioi-han"
            style={{
              textDecoration: "none",
              color: "var(--color-primary-main)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            ← Xem giới hạn hệ thống & tuyên bố pháp lý
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
            <span>Bắt đầu chuyến đi ngay</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
