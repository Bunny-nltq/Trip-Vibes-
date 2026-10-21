"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";

export const SidebarContext = React.createContext<boolean>(false);

export function SideNav() {
  const { screen, nav, confirmed } = useApp();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Xác định mục nào sáng duy nhất theo màn hình hiện tại
  const activeItem = (() => {
    if (showSettingsModal) return "cai-dat";
    if (
      [
        "b1-chon-nhanh",
        "b2-agent-dang-chay",
        "b3-ke-hoach",
        "b4-phuong-tien",
        "b5-khach-san",
        "b6-xem-truoc",
        "b7-da-chot",
      ].includes(screen)
    ) {
      return "ke-hoach";
    }
    if (["b8-chuyen-di", "b9-chi-duong"].includes(screen)) {
      return "chuyen-di";
    }
    if (["b10-chon-nguon", "b11-ngan-sach"].includes(screen)) {
      return "ngan-sach";
    }
    return "ke-hoach";
  })();

  const handleNavClick = (target: "ke-hoach" | "chuyen-di" | "ngan-sach" | "cai-dat") => {
    if (target === "ke-hoach") {
      setShowSettingsModal(false);
      nav("b1-chon-nhanh");
    } else if (target === "chuyen-di") {
      setShowSettingsModal(false);
      nav("b8-chuyen-di");
    } else if (target === "ngan-sach") {
      setShowSettingsModal(false);
      nav("b11-ngan-sach");
    } else if (target === "cai-dat") {
      setShowSettingsModal((prev) => !prev);
    }
  };

  return (
    <aside className="Sidebar" aria-label="Menu điều hướng chính">
      {/* Logo Block */}
      <div className="LogoBlock" onClick={() => nav("b1-chon-nhanh")} style={{ cursor: "pointer" }}>
        <svg width="56" height="44" viewBox="0 0 62 48" aria-hidden="true">
          <circle cx="43" cy="16" r="10" fill="var(--color-art-sun)" />
          <path d="M2 44 22 14l11 16 7-9 20 23z" fill="var(--color-art-mountain1)" />
          <path d="M12 44 30 22l10 14 6-8 14 16z" fill="var(--color-art-mountain2)" />
          <path d="M2 44h58" stroke="var(--color-art-line)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div>
          <div className="LogoName Script">Trip Vibes</div>
          <div className="LogoSub">Plan your next adventure</div>
        </div>
      </div>

      {/* Navigation: Chỉ đúng 1 mục sáng, mục khóa có icon khóa */}
      <nav className="Nav">
        {/* Lên kế hoạch */}
        <div
          className={`NavItem ${activeItem === "ke-hoach" ? "NavActive" : "NavOn"}`}
          onClick={() => handleNavClick("ke-hoach")}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 11.5 21 3l-8.5 18-2.2-7.3z" />
            <path d="m10.3 13.7 4.2-4.2" />
          </svg>
          <span>Lên kế hoạch</span>
        </div>

        {/* Chuyến đi */}
        <div
          className={`NavItem ${activeItem === "chuyen-di" ? "NavActive" : "NavOn"}`}
          onClick={() => handleNavClick("chuyen-di")}
          style={{ opacity: !confirmed ? 0.6 : 1 }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 15" />
          </svg>
          <span>Chuyến đi</span>
          {!confirmed && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: "auto", color: "var(--color-light-muted)" }}
              aria-label="Đang khóa"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </div>

        {/* Ngân sách */}
        <div
          className={`NavItem ${activeItem === "ngan-sach" ? "NavActive" : "NavOn"}`}
          onClick={() => handleNavClick("ngan-sach")}
          style={{ opacity: !confirmed ? 0.6 : 1 }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
            <path d="M4 7l11-3v3" />
            <circle cx="16.5" cy="13.5" r="1.2" />
          </svg>
          <span>Ngân sách</span>
          {!confirmed && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: "auto", color: "var(--color-light-muted)" }}
              aria-label="Đang khóa"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </div>

        {/* Cài đặt */}
        <div
          className={`NavItem ${activeItem === "cai-dat" ? "NavActive" : "NavOn"}`}
          onClick={() => handleNavClick("cai-dat")}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Cài đặt</span>
        </div>

        {/* Chú thích duy nhất một chỗ */}
        {!confirmed && (
          <div className="NavNote">
            Chuyến đi và Ngân sách mở sau khi xác nhận kế hoạch.
          </div>
        )}
      </nav>

      {/* Side Bottom */}
      <div className="SideBottom">
        {/* Promo */}
        <div className="Promo">
          <svg width="62" height="70" viewBox="0 0 62 70" aria-hidden="true">
            <ellipse cx="22" cy="14" rx="20" ry="8" fill="var(--color-surface)" opacity=".9" />
            <ellipse cx="42" cy="10" rx="14" ry="6" fill="var(--color-surface)" opacity=".9" />
            <rect x="12" y="24" width="38" height="42" rx="14" fill="var(--color-art-suit1)" />
            <rect x="18" y="44" width="26" height="16" rx="6" fill="var(--color-art-suit2)" />
            <path d="M19 30 C 24 22, 38 22, 43 30" stroke="var(--color-art-suit3)" strokeWidth="3" fill="none" />
            <rect x="26" y="48" width="10" height="4" rx="2" fill="var(--color-art-suit-light)" />
          </svg>
          <div className="PromoText Script">Mỗi chuyến đi là một câu chuyện đẹp!</div>
        </div>

        {/* Plant */}
        <div className="Plant">
          <svg width="150" height="190" viewBox="0 0 150 190" aria-hidden="true">
            <path
              d="M10 190 C 14 140, 28 110, 44 84"
              stroke="var(--color-art-plant1)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M44 84 C 24 80, 18 62, 24 48 C 40 54, 48 68, 44 84Z"
              fill="var(--color-art-plant2)"
            />
            <path
              d="M30 130 C 12 122, 8 106, 14 94 C 30 100, 36 114, 30 130Z"
              fill="var(--color-art-plant1)"
            />
            <path
              d="M36 110 C 54 104, 62 88, 58 76 C 42 80, 34 94, 36 110Z"
              fill="var(--color-art-plant3)"
            />
            <path
              d="M60 190 C 62 160, 74 140, 92 124"
              stroke="var(--color-art-plant1)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M92 124 C 76 118, 72 100, 80 90 C 94 98, 98 110, 92 124Z"
              fill="var(--color-art-plant2)"
            />
            <path
              d="M76 160 C 96 156, 108 140, 104 128 C 86 130, 74 144, 76 160Z"
              fill="var(--color-art-plant4)"
            />
          </svg>
        </div>

        {/* User Block */}
        <div className="UserBlock" onClick={() => nav("login")}>
          <div className="Avatar">B</div>
          <div style={{ flex: 1 }}>
            <div className="UserName">Bunny</div>
            <div className="UserSub">Khám phá thế giới</div>
          </div>
          <div style={{ color: "var(--color-text-sub)" }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Settings Modal - Hộp Về Trip Vibes & Cài đặt */}
      {showSettingsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="DayCard"
            style={{
              width: 440,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              background: "var(--color-surface)",
              borderRadius: 22,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div className="H1" style={{ fontSize: 18, margin: 0 }}>Về Trip Vibes</div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-sub)",
                  fontSize: 18,
                  fontWeight: 700,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: "12px 14px", background: "var(--color-surface-sub)", borderRadius: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text)" }}>Dữ liệu mẫu và ước tính</div>
                <div style={{ fontSize: 12, color: "var(--color-text-sub)", marginTop: 4, lineHeight: 1.5 }}>
                  Mọi chi phí và thời gian là ước tính phục vụ lập kế hoạch. Trip Vibes không đặt vé thật hay giữ phòng thực tế.
                </div>
              </div>
              <div style={{ padding: "12px 14px", background: "var(--color-surface-sub)", borderRadius: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text)" }}>Bảo mật hoá đơn (Bill)</div>
                <div style={{ fontSize: 12, color: "var(--color-text-sub)", marginTop: 4, lineHeight: 1.5 }}>
                  Ảnh hoá đơn chỉ xử lý trong bộ nhớ tạm của phiên làm việc: tuyệt đối không lưu đĩa, không ghi nhật ký.
                </div>
              </div>
              <div style={{ padding: "12px 14px", background: "var(--color-surface-sub)", borderRadius: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text)" }}>Nguồn dữ liệu & Tỷ giá</div>
                <div style={{ fontSize: 12, color: "var(--color-text-sub)", marginTop: 4, lineHeight: 1.5 }}>
                  Dữ liệu địa điểm từ OpenStreetMap contributors. Tỷ giá quy đổi ngoại tệ cung cấp bởi &quot;Rates By Exchange Rate API&quot; (khi có giá nước ngoài).
                </div>
              </div>
              <div style={{ padding: "12px 14px", background: "var(--color-surface-sub)", borderRadius: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text)" }}>Pháp lý & Thị thực (Visa)</div>
                <div style={{ fontSize: 12, color: "var(--color-text-sub)", marginTop: 4, lineHeight: 1.5 }}>
                  Trip Vibes không tư vấn thủ tục visa hay xuất nhập cảnh. Vui lòng tham khảo cơ quan thẩm quyền trước khi khởi hành.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="Btn BtnPrimary BtnFull"
              style={{ marginTop: 20 }}
              onClick={() => setShowSettingsModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default SideNav;
