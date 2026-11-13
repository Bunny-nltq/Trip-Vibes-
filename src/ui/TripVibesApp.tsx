"use client";
import React, { useState, useSyncExternalStore } from "react";
import { AppProvider, useApp } from "@/ui/context/AppContext";
import { TopBar } from "@/ui/components/TopBar";
import { WelcomeScreen } from "@/ui/screens/WelcomeScreen";
import { LoginScreen } from "@/ui/screens/LoginScreen";
import { RegisterScreen } from "@/ui/screens/RegisterScreen";
import { SavedTripsScreen } from "@/ui/screens/SavedTripsScreen";
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
import { TripWorkspaceScreen } from "@/ui/screens/TripWorkspaceScreen";
import { ProfileScreen } from "@/ui/screens/ProfileScreen";
import styles from "@/ui/components/Workspace.module.css";
import tokens from "@/design/tokens.json";
import journeyScene from "@/design/assets/coastal-journey-v3.png";
import { useSessionLog } from "@/ui/hooks/useSessionLog";

import {JourneyTabs} from "@/ui/components/JourneyTabs";
import {SiteHeader} from "@/ui/components/site/SiteHeader";
import {SiteFooter} from "@/ui/components/site/SiteFooter";
import {publicTheme} from "@/ui/components/site/publicTheme";
import journeyStyles from "@/ui/components/Journey.module.css";
/**
 * Công cụ thử nghiệm:
 * Chỉ có khi NODE_ENV = development VÀ URL có ?dev=1; mặc định ẨN hoàn toàn.
 * Khi hiện thì đặt ở góc có nút đóng, không che menu hay nội dung.
 */
function DevTools() {
  const { nav, screen } = useApp();
  const hasDevParam = useSyncExternalStore(
    () => () => {},
    () =>
      process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).get("dev") === "1",
    () => false
  );
  const [isOpen, setIsOpen] = useState(true);

  if (!hasDevParam) {
    return null;
  }

  const ALL_SCREENS = [
    { id: "welcome", label: "Màn chào (Welcome)" },
    { id: "login", label: "Đăng nhập" },
    { id: "register", label: "Đăng ký" },
    { id: "saved-trips", label: "Nhật ký chuyến đi (Đã lưu)" },
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
  const { screen, plan, nav, user, templateLoading, templateError, newTrip } = useApp();

  const isAuthScreen = ["welcome", "login", "register"].includes(screen);

  const renderContent = () => {
    if(templateLoading) return <p aria-busy="true">Đang tải lịch trình mẫu…</p>;
    if(templateError) return <div role="alert"><p>{templateError}</p><button onClick={newTrip}>Tạo chuyến đi riêng</button></div>;
    if(!plan && ["b3-ke-hoach","b4-phuong-tien","b5-khach-san","b6-xem-truoc","b7-xac-nhan","b8-chuyen-di","b9-chi-duong","b10-chon-nguon","b11-ngan-sach"].includes(screen)) return <div className="DayCard"><h1 className="H1">Chưa có hành trình</h1><p className="Sub">Tạo một chuyến đi để xem lịch trình và quản lý chi tiêu của bạn.</p><button className="Btn BtnPrimary" onClick={()=>nav("b1-chon-nhanh")}>Lên kế hoạch</button></div>;
    switch (screen) {
      case "welcome":
        return <WelcomeScreen />;
      case "login":
        return <LoginScreen />;
      case "register":
        return <RegisterScreen />;
      case "workspace": return <TripWorkspaceScreen />;
      case "profile": return <ProfileScreen />;
      case "saved-trips":
        return <SavedTripsScreen />;
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

  const hasJourneyTabs = !isAuthScreen && plan && !["b1-chon-nhanh", "b2-dang-chay", "saved-trips", "profile"].includes(screen);
  const showActions = Boolean(hasJourneyTabs);
  return (
    <div className={journeyStyles.shell} style={{ ...publicTheme, "--v4-scene": `url(${journeyScene.src})` } as React.CSSProperties}>
      <SiteHeader account={user} onPlannerScreen={nav} />
      <UserTestModeBar /><DevTools />
      <SidebarContext.Provider value={true}>
        <main className={journeyStyles.content} id="main-content">
          {(hasJourneyTabs || showActions) && <div className={journeyStyles.journeyControls}>
            {hasJourneyTabs && <JourneyTabs screen={screen} onNavigate={nav} />}
            {showActions && <TopBar />}
          </div>}
          <div className={isAuthScreen ? undefined : journeyStyles.contentSurface}>{renderContent()}</div>
        </main>
      </SidebarContext.Provider>
      <SiteFooter />
    </div>
  );

}

export interface TripVibesAppProps {
  initialScreen?: string;
  initialMau?: string;
  initialDest?: string;
}

export function TripVibesApp({ initialScreen, initialMau, initialDest }: TripVibesAppProps = {}) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  if (!mounted) return <main aria-busy="true">Đang khôi phục chuyến đi…</main>;
  return (
    <AppProvider initialScreen={initialScreen} initialMau={initialMau} initialDest={initialDest}>
      <ScreenRouter />
    </AppProvider>
  );
}

export default TripVibesApp;

