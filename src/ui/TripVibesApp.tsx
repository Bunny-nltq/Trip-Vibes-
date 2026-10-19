"use client";
import React from "react";
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

function ScreenRouter() {
  const { screen } = useApp();

  const showTopBar = !["welcome", "login"].includes(screen);

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

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {showTopBar && <TopBar />}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {renderContent()}
      </main>
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
