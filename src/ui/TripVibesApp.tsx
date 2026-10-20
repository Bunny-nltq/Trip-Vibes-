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

/**
 * Công cụ thử nghiệm:
 * Chỉ có khi NODE_ENV = development VÀ URL có ?dev=1; mặc định ẨN hoàn toàn.
 * Khi hiện thì đặt ở góc có nút đóng, không che menu hay nội dung.
 */
function DevTools() {
  const { nav, screen, isSampleDataActive } = useApp();
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
    { id: "b2-dang-chay", label: "B2 · AI Đang chạy" },
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
      {/* Dải DỮ LIỆU MẪU - chỉ khi dev=1 và isSampleDataActive */}
      {isSampleDataActive && (
        <div
          style={{
            background: "#fef3c7",
            color: "#92400e",
            borderBottom: "1px solid #fcd34d",
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "0.5px",
            width: "100%",
          }}
        >
          DỮ LIỆU MẪU (Chỉ kích hoạt trong môi trường Development với ?dev=1)
        </div>
      )}

      {/* Bảng Chuyển nhanh màn hình - đặt ở góc phải, có nút đóng */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            width: 230,
            maxHeight: 380,
            background: "#FFFFFF",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            border: "1px solid #D5E0F3",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              background: "#F4F8FE",
              borderBottom: "1px solid #E1EAF8",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1F2A44" }}>
                Chuyển nhanh màn hình
              </div>
              <div style={{ fontSize: 11, color: "#5C6B88" }}>Thử nghiệm (?dev=1)</div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#5C6B88",
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
                  color: screen === s.id ? "#2B55D6" : "#34476E",
                  fontWeight: screen === s.id ? 700 : 500,
                  background: screen === s.id ? "#DCE8FB" : "transparent",
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
        <DevTools />
        <main>{renderContent()}</main>
      </div>
    );
  }

  return (
    <div className="Frame">
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
