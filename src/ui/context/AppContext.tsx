"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

type Screen =
  | "welcome"
  | "login"
  | "b1-chon-nhanh"
  | "b2-dang-chay"
  | "b3-ke-hoach"
  | "b4-phuong-tien"
  | "b5-khach-san"
  | "b6-xem-truoc"
  | "b7-xac-nhan"
  | "b8-chuyen-di"
  | "b9-chi-duong"
  | "b10-chon-nguon"
  | "b11-ngan-sach";

interface TripConfig {
  people: number;
  budget: number;
  avoids: string[];
  note: string;
}

interface AppState {
  screen: Screen;
  confirmed: boolean;
  tripConfig: TripConfig;
  activeDay: number;
  activeTab: string;
}

interface AppCtx extends AppState {
  nav: (s: Screen) => void;
  setTripConfig: (c: Partial<TripConfig>) => void;
  setConfirmed: (v: boolean) => void;
  setActiveDay: (d: number) => void;
  setActiveTab: (t: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [confirmed, setConfirmed] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [activeTab, setActiveTab] = useState("b8-list");
  const [tripConfig, setTripConfigState] = useState<TripConfig>({
    people: 2, budget: 10_000_000,
    avoids: ["Không dậy sớm"],
    note: "",
  });

  const nav = useCallback((s: Screen) => setScreen(s), []);
  const setTripConfig = useCallback((c: Partial<TripConfig>) => {
    setTripConfigState(prev => ({ ...prev, ...c }));
  }, []);

  return (
    <Ctx.Provider value={{
      screen, nav, confirmed, setConfirmed,
      tripConfig, setTripConfig,
      activeDay, setActiveDay,
      activeTab, setActiveTab,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
