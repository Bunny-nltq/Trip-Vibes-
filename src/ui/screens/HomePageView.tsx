"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  MapPin,
  CheckCircle2,
  Calendar,
  Wallet,
  Eye,
  Navigation,
  Receipt,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";
import { HeroSearch } from "@/ui/components/site/HeroSearch";
import { ThuDiemDen, type DiemDenThe } from "@/ui/components/site/ThuDiemDen";

export interface HomePageViewProps {
  diemDens: DiemDenThe[];
  ngayDuLieu?: string;
}

const FAQ_ITEMS = [
  {
    q: "Dữ liệu địa điểm và thông tin đến từ đâu?",
    a: "Dữ liệu địa điểm (POI) được thu thập từ cộng đồng OpenStreetMap thông qua Nominatim và Overpass API. Các thông số không có sẵn được ước tính danh nghĩa minh bạch từ bộ giả định an toàn."
  },
  {
    q: "Giá vé và khách sạn hiển thị có phải là giá thật để đặt không?",
    a: "Không. Mọi mức giá hiển thị đều là giá ước tính tham khảo phục vụ bài toán cân đối ngân sách. Trip Vibes không phải đại lý lữ hành, không giữ chỗ, không bán vé và không thực hiện thanh toán tiền thật."
  },
  {
    q: "Ảnh hóa đơn chi tiêu của tôi có được bảo mật không?",
    a: "Tuyệt đối an toàn. Ảnh hóa đơn chỉ được xử lý trong bộ nhớ tạm (in-memory buffer) để nhận diện số tiền và lập tức giải phóng, không lưu xuống ổ đĩa hay ghi nhật ký dữ liệu nhạy cảm."
  },
  {
    q: "Hệ thống hoạt động thế nào khi dịch vụ gặp sự cố hoặc quá tải?",
    a: "Khi dịch vụ chạm hạn mức hoặc bận, Trip Vibes tự động kích hoạt thuật toán dự phòng quy tắc thuần túy (lapKeHoachTuDong) để tạo lịch trình tức thì, đảm bảo trải nghiệm không bị gián đoạn."
  },
  {
    q: "Tại sao điểm đến Phú Quốc chưa có trong danh sách thẻ lưu sẵn?",
    a: "Hiện tại bộ dữ liệu snapshot chính thức hỗ trợ 5 điểm đến: Đà Nẵng, Hà Nội, Đà Lạt, Bangkok, Seoul. Điểm đến Phú Quốc chưa có snapshot đạt chuẩn kiểm toán và sẽ được hỗ trợ trong các phiên bản kế tiếp."
  }
];

export function HomePageView({ diemDens, ngayDuLieu = "20/10/2026" }: HomePageViewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-background)" }}>
      {/* Khối 1: Thanh trên (SiteHeader) */}
      <SiteHeader />

      <main id="main-content" style={{ flex: 1 }}>
        {/* Khối 2: Hero Section */}
        <section style={{
          background: "linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)",
          padding: "64px 24px 48px",
          textAlign: "center"
        }}>
          <div style={{ maxWidth: 840, margin: "0 auto 36px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: "var(--r-full)",
              background: "var(--color-primary-tint)",
              color: "var(--color-primary-main)",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 20
            }}>
              <Compass size={16} />
              <span>Lập Kế Hoạch Du Lịch Theo Ngân Sách</span>
            </div>

            <h1 style={{
              fontSize: "clamp(28px, 5vw, 46px)",
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
              color: "var(--color-text)",
              marginBottom: 18
            }}>
              Lên lịch trình du lịch chuẩn xác,{" "}
              <span style={{
                background: "linear-gradient(135deg, var(--color-primary-main), var(--color-secondary-500))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                vừa vặn ngân sách
              </span>
            </h1>

            <p style={{
              fontSize: "clamp(15px, 2vw, 18px)",
              lineHeight: 1.6,
              color: "var(--color-text-sub)",
              maxWidth: 680,
              margin: "0 auto"
            }}>
              Tối ưu lộ trình di chuyển, khách sạn và điểm tham quan bám sát chi phí thực tế. Minh bạch nguồn gốc dữ liệu, không tự ý thêm chi phí ẩn.
            </p>
          </div>

          {/* Form HeroSearch */}
          <HeroSearch />
        </section>

        {/* Khối 3: Thẻ Điểm đến từ Snapshot */}
        <section id="diem-den" style={{ maxWidth: 1200, margin: "48px auto", padding: "0 24px" }}>
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary-main)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                Dữ liệu lưu trữ sẵn
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)" }}>
                Điểm đến được hỗ trợ chính thức
              </h2>
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-sub)" }}>
              Dữ liệu kiểm toán cập nhật ngày {ngayDuLieu}
            </div>
          </div>

          <ThuDiemDen diemDens={diemDens} />
        </section>

        {/* Khối 4: 4 Khối tính năng cốt lõi */}
        <section id="tinh-nang" style={{ maxWidth: 1200, margin: "64px auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-secondary-500)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Khám phá tính năng
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)" }}>
              Trải nghiệm lập kế hoạch minh bạch và chủ động
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24
          }}>
            {/* Tính năng 1 */}
            <div style={{
              background: "var(--color-surface)",
              borderRadius: "var(--r-xl)",
              border: "1px solid var(--color-border)",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-lg)",
                background: "var(--color-primary-tint)",
                color: "var(--color-primary-main)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16
              }}>
                <Wallet size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", marginBottom: 10 }}>
                Kế hoạch có giá đúng ngân sách
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-sub)", margin: 0 }}>
                Mọi chi phí từ di chuyển, khách sạn đến ăn uống đều được tính toán bằng các hàm thuần túy và thuật toán tối ưu, cảnh báo rõ ràng khi vượt ngân sách.
              </p>
            </div>

            {/* Tính năng 2 */}
            <div style={{
              background: "var(--color-surface)",
              borderRadius: "var(--r-xl)",
              border: "1px solid var(--color-border)",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-lg)",
                background: "var(--color-primary-tint)",
                color: "var(--color-primary-main)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16
              }}>
                <Eye size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", marginBottom: 10 }}>
                Xem trước thay đổi trước khi chốt
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-sub)", margin: 0 }}>
                Dễ dàng so sánh chênh lệch chi phí, thời gian và địa điểm giữa phương án trước và sau khi thay đổi, giúp bạn luôn nắm toàn quyền quyết định.
              </p>
            </div>

            {/* Tính năng 3 */}
            <div style={{
              background: "var(--color-surface)",
              borderRadius: "var(--r-xl)",
              border: "1px solid var(--color-border)",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-lg)",
                background: "var(--color-primary-tint)",
                color: "var(--color-primary-main)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16
              }}>
                <Navigation size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", marginBottom: 10 }}>
                Chỉ đường bằng Google Maps
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-sub)", margin: 0 }}>
                Tích hợp liên kết mở Google Maps chỉ đường tức thì giữa các điểm tham quan, quán ăn và khách sạn trong suốt chuyến đi.
              </p>
            </div>

            {/* Tính năng 4 */}
            <div style={{
              background: "var(--color-surface)",
              borderRadius: "var(--r-xl)",
              border: "1px solid var(--color-border)",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-lg)",
                background: "var(--color-primary-tint)",
                color: "var(--color-primary-main)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16
              }}>
                <Receipt size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", marginBottom: 10 }}>
                Đọc bill & theo dõi chi tiêu
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-sub)", margin: 0 }}>
                Bóc tách số tiền từ hóa đơn với cơ chế xử lý in-memory an toàn; người dùng luôn xác nhận lại số tiền trước khi ghi vào sổ chi tiêu.
              </p>
            </div>
          </div>
        </section>

        {/* Khối 5: Minh bạch & 5 câu hỏi nhanh (FAQ) */}
        <section id="tro-giup" style={{
          maxWidth: 960,
          margin: "64px auto",
          padding: "0 24px"
        }}>
          {/* Thông điệp minh bạch */}
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--color-border)",
            padding: "28px",
            marginBottom: 40,
            display: "flex",
            alignItems: "flex-start",
            gap: 16
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "var(--r-md)",
              background: "var(--color-status-success-bg)",
              color: "var(--color-status-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
                Cam kết minh bạch và an toàn dữ liệu
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-sub)", margin: 0 }}>
                Trip Vibes là ứng dụng hỗ trợ lập kế hoạch du lịch, không phải đại lý bán vé và không thực hiện thanh toán thật. Mọi giá dịch vụ đều là ước tính tham khảo có gắn nhãn nguồn gốc rõ ràng. Ảnh chụp hóa đơn chỉ được xử lý tạm thời trong bộ nhớ và không bao giờ lưu trữ xuống ổ đĩa máy chủ.
              </p>
            </div>
          </div>

          {/* 5 câu hỏi nhanh */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)" }}>
              Câu hỏi thường gặp
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-sub)", marginTop: 6 }}>
              Giải đáp các thắc mắc về dữ liệu, tính năng và phạm vi hoạt động
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--r-lg)",
                    border: "1px solid var(--color-border)",
                    overflow: "hidden"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      background: "transparent",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--color-text)",
                      cursor: "pointer"
                    }}
                  >
                    <span>{item.q}</span>
                    {isOpen ? <ChevronUp size={18} color="var(--color-text-sub)" /> : <ChevronDown size={18} color="var(--color-text-sub)" />}
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: "0 20px 16px",
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "var(--color-text-sub)",
                      borderTop: "1px solid var(--color-border)",
                      paddingTop: 12
                    }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Khối 6: Chân trang (SiteFooter) */}
      <SiteFooter ngayDuLieu={ngayDuLieu} />
    </div>
  );
}
