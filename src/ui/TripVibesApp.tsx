"use client";
import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "@/ui/context/AppContext";
import { TopBar } from "@/ui/components/TopBar";
import { WelcomeScreen } from "@/ui/screens/WelcomeScreen";
import { LoginScreen } from "@/ui/screens/LoginScreen";
import { B1ChonNhanhScreen } from "@/ui/screens/B1ChonNhanhScreen";
import { B2AgentScreen } from "@/ui/screens/B2AgentScreen";
import { B3KeHoachScreen } from "@/ui/screens/B3KeHoachScreen";
import { B4PhuongTienScreen } from "@/ui/screens/B4PhuongTienScreen";
import { B5KhachSanScreen } from "@/ui/screens/B5KhachSanScreen";
import { B6XemTruocScreen } from "@/ui/screens/B6XemTruocScreen";
import { B7XacNhanScreen } from "@/ui/screens/B7XacNhanScreen";
import { B8ChuyenDiScreen } from "@/ui/screens/B8ChuyenDiScreen";
import { B9ChiDuongScreen, B10ChonNguonScreen, B11NganSachScreen } from "@/ui/screens/B9to11Screens";
import { SideNav, SidebarContext } from "@/ui/components/SideNav";
import { useSessionLog } from "@/ui/hooks/useSessionLog";

/**
 * Công cụ thử nghiệm:
 * Chỉ có khi NODE_ENV = development VÀ URL có ?dev=1; mặc định ẨN hoàn toàn.
 * Khi hiện thì đặt ở góc có nút đóng, không che menu hay nội dung.
 */
function DevTools() {
  const { nav, screen } = useApp();
  const [hasDevParam, setHasDevParam] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("dev") === "1") {
        setHasDevParam(true);
      }
    }
  }, []);

  if (!hasDevParam) {
    return null;
  }

  const ALL_SCREENS = [
    { id: "welcome", label: "Màn chào (Welcome)" },
    { id: "login", label: "Đăng nhập" },
    { id: "b1-chon-nhanh", label: "B1 · Chọn nhanh" },
    { id: "b2-dang-chay", label: "B2 · Đang tạo lịch trình" },
    { id: "b3-ke-hoach", label: "B3 · Kế hoạch" },
    { id: "b4-phuong-tien", label: "B4 · Phương tiện" },
    { id: "b5-khach-san", label: "B5 · Khách sạn" },
    { id: "b6-xem-truoc", label: "B6 · Xem trước" },
    { id: "b7-xac-nhan", label: "B7 · Xác nhận" },
    { id: "b8-chuyen-di", label: "B8 · Chuyến đi" },
    { id: "b9-chi-duong", label: "B9 · Chỉ đường" },
    { id: "b10-chon-nguon", label: "B10 · Đọc bill / Chi tiêu" },
    { id: "b11-ngan-sach", label: "B11 · Sổ ngân sách" },
  ] as const;

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            width: 230,
            maxHeight: 380,
            background: "var(--color-surface)",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            border: "1px solid var(--color-border)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              background: "var(--color-surface-sub)",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--color-text)" }}>
                Chuyển nhanh màn hình
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-sub)" }}>Thử nghiệm (?dev=1)</div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-sub)",
                fontSize: 16,
                fontWeight: 700,
                padding: "2px 6px",
              }}
              title="Đóng bảng thử nghiệm"
            >
              ✕
            </button>
          </div>
          <div style={{ overflowY: "auto", padding: 6, flex: 1 }}>
            {ALL_SCREENS.map((s) => (
              <div
                key={s.id}
                onClick={() => nav(s.id as Parameters<typeof nav>[0])}
                style={{
                  padding: "7px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: "pointer",
                  color: screen === s.id ? "var(--color-primary)" : "var(--color-text)",
                  fontWeight: screen === s.id ? 700 : 500,
                  background: screen === s.id ? "var(--color-primary-tint)" : "transparent",
                  marginBottom: 2,
                }}
              >
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function MockDataBanner() {
  const { dataSourceUsed, isSampleDataActive, plan } = useApp();
  const showBanner =
    dataSourceUsed === "mock" ||
    plan?.dataSourceUsed === "mock" ||
    isSampleDataActive;

  if (!showBanner) return null;

  return (
    <div
      role="status"
      aria-label="Thông báo dữ liệu mẫu"
      style={{
        background: "var(--color-warning-bg)",
        color: "var(--color-warning-text)",
        borderBottom: "1.5px solid var(--color-border-input)",
        padding: "6px 16px",
        fontSize: 12,
        fontWeight: 800,
        textAlign: "center",
        letterSpacing: "1px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        zIndex: 9999,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span>DỮ LIỆU MẪU</span>
    </div>
  );
}

/**
 * Thanh trạng thái và xuất dữ liệu kiểm thử người dùng (chỉ bật khi URL có ?test=1)
 */
function UserTestModeBar() {
  const {
    isTestMode,
    hasConsented,
    acceptConsent,
    events,
    exportJson,
    exportCsv,
  } = useSessionLog();

  if (!isTestMode) return null;

  if (!hasConsented) {
    return (
      <div
        role="region"
        aria-label="Đồng ý chế độ kiểm thử"
        style={{
          background: "var(--color-primary-tint)",
          color: "var(--color-primary)",
          borderBottom: "1px solid var(--color-border)",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 13,
          zIndex: 9999,
        }}
      >
        <div>
          <strong>Chế độ kiểm thử người dùng đang bật (?test=1):</strong> Các thao tác trong phiên làm việc này sẽ được lưu cục bộ trên trình duyệt để đánh giá trải nghiệm và hoàn toàn không gửi đi đâu.
        </div>
        <button
          type="button"
          className="Btn BtnSmall BtnPrimary"
          onClick={acceptConsent}
          style={{ marginLeft: 16 }}
        >
          Đồng ý & Bắt đầu
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 20,
        bottom: 20,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 20,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        zIndex: 9999,
        fontSize: 13,
      }}
    >
      <span style={{ color: "var(--color-text)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
          <path d="M8.5 2h7" />
          <path d="M7 16h10" />
        </svg>
        Test Mode: {events.length} sự kiện
      </span>
      <button
        type="button"
        className="Btn BtnSmall"
        onClick={exportJson}
        title="Tải kết quả kiểm thử dạng JSON"
      >
        Tải JSON
      </button>
      <button
        type="button"
        className="Btn BtnSmall BtnPrimary"
        onClick={exportCsv}
        title="Tải kết quả kiểm thử dạng CSV"
      >
        Tải CSV
      </button>
    </div>
  );
}

function ScreenRouter() {
  const { screen } = useApp();

  const isAuthScreen = ["welcome", "login"].includes(screen);

  const renderContent = () => {
    switch (screen) {
      case "welcome":
        return <WelcomeScreen />;
      case "login":
        return <LoginScreen />;
      case "b1-chon-nhanh":
        return <B1ChonNhanhScreen />;
      case "b2-dang-chay":
        return <B2AgentScreen />;
      case "b3-ke-hoach":
        return <B3KeHoachScreen />;
      case "b4-phuong-tien":
        return <B4PhuongTienScreen />;
      case "b5-khach-san":
        return <B5KhachSanScreen />;
      case "b6-xem-truoc":
        return <B6XemTruocScreen />;
      case "b7-xac-nhan":
        return <B7XacNhanScreen />;
      case "b8-chuyen-di":
        return <B8ChuyenDiScreen />;
      case "b9-chi-duong":
        return <B9ChiDuongScreen />;
      case "b10-chon-nguon":
        return <B10ChonNguonScreen />;
      case "b11-ngan-sach":
        return <B11NganSachScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  if (isAuthScreen) {
    return (
      <div className="Frame">
        <MockDataBanner />
        <UserTestModeBar />
        <DevTools />
        <main>{renderContent()}</main>
      </div>
    );
  }

  return (
    <div className="Frame">
      <MockDataBanner />
      <UserTestModeBar />
      <DevTools />
      <div className="Shell">
        <SideNav />
        <SidebarContext.Provider value={true}>
          <div className="Content">
            <TopBar />
            <main style={{ minWidth: 0, position: "relative" }}>
              {renderContent()}
            </main>
          </div>
        </SidebarContext.Provider>
      </div>
    </div>
  );
}

export function TripVibesApp() {
  return (
    <AppProvider>
      <ScreenRouter />
    </AppProvider>
  );
}

export default TripVibesApp;
