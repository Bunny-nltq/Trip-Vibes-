"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  usePlan,
  type PlanStatus,
  type PlanApiResponse,
  type PlanInput,
  type Violation,
} from "@/ui/hooks/usePlan";
import { usePlanHistory } from "@/ui/hooks/usePlanHistory";
import type { Plan, TripRequest, Selection, Expense, Ledger, ExpenseCategory } from "@/contracts";
import type { PlanDiff } from "@/core/diffPlan";
import type { ProgressPlace } from "@/core/tripProgress";
import { createLedger, addExpense, deleteExpense, updateExpense } from "@/core/ledger";

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

import {
  POPULAR_DESTINATIONS,
  POPULAR_ORIGINS,
  toDiemDen,
  type DiemDen,
  getDiemDenTen,
} from "@/contracts";

export interface TripConfig {
  diemDi: string | DiemDen;
  diemDen: DiemDen | string | null;
  soNgay: number;
  people: number;
  budget: number;
  avoids: string[];
  note: string;
  giaVeTuNhap?: { chieuDiVND: number; chieuVeVND: number };
}

export interface EditContext {
  type: "phuong_tien_di" | "phuong_tien_ve" | "khach_san" | "hoat_dong";
  dayIndex?: number;
  slotIndex?: number;
  currentId?: string;
  huong?: "di" | "ve";
}

export interface PreviewData {
  planSau: Plan;
  selection: Selection;
  diff: PlanDiff;
  hard: Violation[];
  soft: Violation[];
  thayDoi?: {
    loai: string;
    viTri?: number;
    idMoi: string;
  };
  diemKhopTruoc?: number;
  diemKhopSau?: number;
}

interface AppState {
  screen: Screen;
  confirmed: boolean;
  tripConfig: TripConfig;
  activeDay: number;
  activeTab: string;
}

function loadSession<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveSession<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/** Tái tạo Selection từ Plan hiện tại */
export function extractSelectionFromPlan(plan: Plan): Selection {
  const soNgay = plan.request.soNgay || 3;
  let transportDiId = "";
  let transportVeId = "";
  let hotelId = "";
  const hoatDongTheoNgay: string[][] = Array.from({ length: soNgay }, () => []);
  const buaAnTheoNgay: Array<{ trua: string | null; toi: string | null; cafe: string | null }> =
    Array.from({ length: soNgay }, () => ({ trua: null, toi: null, cafe: null }));

  for (const item of plan.items) {
    if (item.hangMuc === "Di chuyển") {
      if (item.ngay === 1 && !transportDiId) {
        transportDiId = item.refId || "";
      } else {
        transportVeId = item.refId || "";
      }
    } else if (item.hangMuc === "Chỗ ở") {
      if (!hotelId && item.refId) {
        hotelId = item.refId;
      }
    } else if (item.hangMuc === "Vui chơi" && item.refId) {
      const dayIdx = item.ngay - 1;
      if (dayIdx >= 0 && dayIdx < soNgay) {
        hoatDongTheoNgay[dayIdx].push(item.refId);
      }
    } else if (item.hangMuc === "Ăn uống" && item.refId) {
      const dayIdx = item.ngay - 1;
      if (dayIdx >= 0 && dayIdx < soNgay) {
        if (item.noiDung.toLowerCase().includes("trưa")) {
          buaAnTheoNgay[dayIdx].trua = item.refId;
        } else if (item.noiDung.toLowerCase().includes("tối")) {
          buaAnTheoNgay[dayIdx].toi = item.refId;
        } else if (
          item.noiDung.toLowerCase().includes("cà phê") ||
          item.noiDung.toLowerCase().includes("cafe")
        ) {
          buaAnTheoNgay[dayIdx].cafe = item.refId;
        }
      }
    }
  }

  return {
    transportDiId: transportDiId || "trans-001",
    transportVeId: transportVeId || "trans-004",
    hotelId: hotelId || "hotel-002",
    hoatDongTheoNgay,
    buaAnTheoNgay,
  };
}

export interface AppCtx extends AppState {
  nav: (s: Screen) => void;
  setTripConfig: (c: Partial<TripConfig>) => void;
  setConfirmed: (v: boolean) => void;
  setActiveDay: (d: number) => void;
  setActiveTab: (t: string) => void;

  // Plan backend state
  plan: Plan | null;
  planRequest: TripRequest | null;
  planStatus: PlanStatus;
  planResult: PlanApiResponse | null;
  planError: string | null;
  loadingStep: number;
  executePlan: (input?: PlanInput) => Promise<PlanApiResponse | undefined>;
  retryPlan: () => void;
  abortPlan: () => void;
  toiThieuVND: number;
  hardViolations: Violation[];
  softViolations: Violation[];
  dataSourceUsed: string;

  // Plan History (Undo / Redo)
  canUndo: boolean;
  canRedo: boolean;
  undoPlan: () => void;
  redoPlan: () => void;
  applyPlan: (newPlan: Plan) => void;

  // Edit & Preview state
  editContext: EditContext | null;
  setEditContext: (ctx: EditContext | null) => void;
  previewData: PreviewData | null;
  setPreviewData: (data: PreviewData | null) => void;
  applyPreview: () => void;
  cancelPreview: () => void;

  // B8 & B9 (Chuyến đi & Chỉ đường)
  tickedPlaces: Record<string, boolean>;
  toggleTickPlace: (id: string) => boolean;
  untickPlace: (id: string) => void;
  activePopoverPlace: ProgressPlace | null;
  setActivePopoverPlace: (p: ProgressPlace | null) => void;

  // B10 & B11 (Sổ chi tiêu & Thêm chi tiêu)
  ledger: Ledger;
  addExpenseToLedger: (exp: Expense) => void;
  deleteExpenseFromLedger: (id: string) => void;
  updateExpenseInLedger: (exp: Expense) => void;
  b10Prefill: { tenCuaHang?: string; ngayTrongChuyen?: number; hangMuc?: ExpenseCategory } | null;
  setB10Prefill: (prefill: { tenCuaHang?: string; ngayTrongChuyen?: number; hangMuc?: ExpenseCategory } | null) => void;
  openB10: (prefill?: { tenCuaHang?: string; ngayTrongChuyen?: number; hangMuc?: ExpenseCategory }) => void;
  isSampleDataActive: boolean;
}

const Ctx = createContext<AppCtx | null>(null);

const sampleDest = toDiemDen(POPULAR_DESTINATIONS[0]);
const sampleOrigin = POPULAR_ORIGINS[0];

export const DEFAULT_SAMPLE_PLAN: Plan = {
  schemaVersion: 7,
  request: {
    schemaVersion: 7,
    diemDi: sampleOrigin.ten,
    diemDen: sampleDest,
    soNguoi: 2,
    soNgay: 3,
    ngansachTongVND: 10_000_000,
    sothich: ["bien", "van_hoa_lich_su", "giai_tri_vui_choi"],
    tranh: ["khong_day_som"],
    ghiChu: [],
    thieu: [],
    cauHoiLamRo: [],
    canhBao: [],
  },
  items: [
    {
      ngay: 1,
      gio: "06:30",
      hangMuc: "Di chuyển",
      noiDung: `Di chuyển chiều đi: Máy bay VietJet Air (${sampleOrigin.ten} → ${sampleDest.ten})`,
      soLuong: 2,
      donGia: 980_000,
      thanhTien: 1_960_000,
      refId: "ref_vj_di_06",
    },
    {
      ngay: 1,
      gio: "14:00",
      hangMuc: "Chỗ ở",
      noiDung: "Lưu trú: Khách sạn 4 sao trung tâm (2 đêm, 1 phòng)",
      soLuong: 2,
      donGia: 1_100_000,
      thanhTien: 2_200_000,
      refId: "hotel-002",
      doTinCay: "tham_khao",
    },
    {
      ngay: 1,
      gio: "12:00",
      hangMuc: "Ăn uống",
      noiDung: "Trưa ngày 1 – ước tính (2 người)",
      soLuong: 2,
      donGia: 150_000,
      thanhTien: 300_000,
      refId: null,
    },
    {
      ngay: 1,
      gio: "15:30",
      hangMuc: "Vui chơi",
      noiDung: "Bãi biển trung tâm",
      soLuong: 2,
      donGia: 0,
      thanhTien: 0,
      refId: "act-bien",
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Bãi biển trung tâm, " + sampleDest.ten)}`,
    },
    {
      ngay: 1,
      gio: "18:30",
      hangMuc: "Ăn uống",
      noiDung: "Tối ngày 1 – ước tính (2 người)",
      soLuong: 2,
      donGia: 150_000,
      thanhTien: 300_000,
      refId: null,
    },
    {
      ngay: 2,
      gio: "08:30",
      hangMuc: "Vui chơi",
      noiDung: "Điểm tham quan danh thắng",
      soLuong: 2,
      donGia: 40_000,
      thanhTien: 80_000,
      refId: "act-thang-canh",
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Điểm tham quan danh thắng, " + sampleDest.ten)}`,
    },
    {
      ngay: 2,
      gio: "12:00",
      hangMuc: "Ăn uống",
      noiDung: "Trưa ngày 2 – ước tính (2 người)",
      soLuong: 2,
      donGia: 150_000,
      thanhTien: 300_000,
      refId: null,
    },
    {
      ngay: 2,
      gio: "15:00",
      hangMuc: "Vui chơi",
      noiDung: "Khu phố cổ văn hóa",
      soLuong: 2,
      donGia: 120_000,
      thanhTien: 240_000,
      refId: "act-pho-co",
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Khu phố cổ văn hóa, " + sampleDest.ten)}`,
    },
    {
      ngay: 2,
      gio: "18:30",
      hangMuc: "Ăn uống",
      noiDung: "Tối ngày 2 – ước tính (2 người)",
      soLuong: 2,
      donGia: 150_000,
      thanhTien: 300_000,
      refId: null,
    },
    {
      ngay: 3,
      gio: "08:30",
      hangMuc: "Vui chơi",
      noiDung: "Khu du lịch sinh thái",
      soLuong: 2,
      donGia: 650_000,
      thanhTien: 1_300_000,
      refId: "act-sinh-thai",
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Khu du lịch sinh thái, " + sampleDest.ten)}`,
    },
    {
      ngay: 3,
      gio: "12:00",
      hangMuc: "Ăn uống",
      noiDung: "Trưa ngày 3 – ước tính (2 người)",
      soLuong: 2,
      donGia: 150_000,
      thanhTien: 300_000,
      refId: null,
    },
    {
      ngay: 3,
      gio: "18:00",
      hangMuc: "Di chuyển",
      noiDung: `Di chuyển chiều về: Máy bay VietJet Air (${sampleDest.ten} → ${sampleOrigin.ten})`,
      soLuong: 2,
      donGia: 980_000,
      thanhTien: 1_960_000,
      refId: "ref_vj_ve_17",
    },
    {
      ngay: 3,
      gio: "18:30",
      hangMuc: "Ăn uống",
      noiDung: "Tối ngày 3 – ước tính (2 người)",
      soLuong: 2,
      donGia: 150_000,
      thanhTien: 300_000,
      refId: null,
    },
  ],
  tongKet: {
    tongVND: 9_540_000,
    conLaiVND: 460_000,
    phanTramDaDung: 95.4,
    theoHangMuc: {
      "Di chuyển": 3_920_000,
      "Chỗ ở": 2_200_000,
      "Ăn uống": 1_800_000,
      "Vui chơi": 1_620_000,
    },
    tongThoiGianDiChuyenPhut: 170,
    trangThaiNganSach: "trong",
  },
  canhBao: [],
};

export const BANGKOK_SAMPLE_PLAN: Plan = {
  ...DEFAULT_SAMPLE_PLAN,
  request: {
    ...DEFAULT_SAMPLE_PLAN.request,
    diemDen: {
      ten: "Bangkok",
      quocGia: "Thái Lan",
      maQuocGia: "TH",
      toaDo: { lat: 13.7563, lng: 100.5018 },
      tienTe: "THB",
      nguon: "nominatim",
      ngayLay: "2026-10-19",
    },
    ngansachTongVND: 25_000_000,
  },
  items: DEFAULT_SAMPLE_PLAN.items.map((item) => {
    if (item.hangMuc === "Chỗ ở") {
      return {
        ...item,
        noiDung: "Khách sạn 4 sao Sukhumvit (2 đêm, 1 phòng)",
        donGia: 1_270_000,
        thanhTien: 2_540_000,
        giaGoc: { soTien: 50, tienTe: "USD", tyGia: 25400, ngayTyGia: "2026-10-19" },
      };
    }
    if (item.hangMuc === "Vui chơi" && item.thanhTien > 0) {
      return {
        ...item,
        giaGoc: { soTien: 25, tienTe: "USD", tyGia: 25400, ngayTyGia: "2026-10-19" },
      };
    }
    return item;
  }),
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("screen");
      if (q) return q as Screen;
    }
    return "welcome";
  });
  const [confirmed, setConfirmedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("confirmed");
      if (q === "true") return true;
      if (q === "false") return false;
    }
    return loadSession("trip_confirmed", false);
  });
  const [activeDay, setActiveDay] = useState(1);
  const [activeTab, setActiveTab] = useState("b8-list");
  const isDev = process.env.NODE_ENV === "development";
  const [tripConfig, setTripConfigState] = useState<TripConfig>(() => {
    if (isDev && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("dest") === "bangkok") {
        return {
          diemDi: sampleOrigin.ten,
          diemDen: BANGKOK_SAMPLE_PLAN.request.diemDen,
          soNgay: 3,
          people: 2,
          budget: 25_000_000,
          avoids: ["Không dậy sớm"],
          note: "",
        };
      }
    }
    return {
      diemDi: sampleOrigin.ten,
      diemDen: sampleDest,
      soNgay: 3,
      people: 2,
      budget: 10_000_000,
      avoids: ["Không dậy sớm"],
      note: "",
    };
  });

  const [editContext, setEditContext] = useState<EditContext | null>(null);
  const [previewData, setPreviewDataState] = useState<PreviewData | null>(() =>
    loadSession<PreviewData | null>("trip_preview", null)
  );

  const setPreviewData = useCallback((data: PreviewData | null) => {
    setPreviewDataState(data);
    saveSession("trip_preview", data);
  }, []);

  // Ticked places state (lưu AppContext & sessionStorage)
  const [tickedPlaces, setTickedPlaces] = useState<Record<string, boolean>>(() =>
    loadSession("trip_ticked_places", {})
  );

  // Popover B9
  const [activePopoverPlace, setActivePopoverPlace] = useState<ProgressPlace | null>(null);

  // Sổ chi tiêu (Ledger) lưu AppContext & sessionStorage
  const [ledger, setLedger] = useState<Ledger>(() => {
    const loaded = loadSession<Ledger>("trip_ledger", createLedger());
    if (!loaded || !Array.isArray(loaded.expenses)) return createLedger();
    return loaded;
  });

  const [b10Prefill, setB10Prefill] = useState<{
    tenCuaHang?: string;
    ngayTrongChuyen?: number;
    hangMuc?: ExpenseCategory;
  } | null>(null);

  const addExpenseToLedger = useCallback((exp: Expense) => {
    setLedger((prev) => {
      const next = addExpense(prev, exp);
      saveSession("trip_ledger", next);
      return next;
    });
  }, []);

  const deleteExpenseFromLedger = useCallback((id: string) => {
    setLedger((prev) => {
      const next = deleteExpense(prev, id);
      saveSession("trip_ledger", next);
      return next;
    });
  }, []);

  const updateExpenseInLedger = useCallback((exp: Expense) => {
    setLedger((prev) => {
      const next = updateExpense(prev, exp);
      saveSession("trip_ledger", next);
      return next;
    });
  }, []);

  const openB10 = useCallback(
    (prefill?: {
      tenCuaHang?: string;
      ngayTrongChuyen?: number;
      hangMuc?: ExpenseCategory;
    }) => {
      setB10Prefill(prefill ?? null);
      setScreen("b10-chon-nguon");
    },
    []
  );

  const planState = usePlan();
  const history = usePlanHistory();

  useEffect(() => {
    if (planState.plan && !history.current) {
      history.init(planState.plan);
    }
  }, [planState.plan, history]);

  const nav = useCallback((s: Screen) => setScreen(s), []);

  const setConfirmed = useCallback((v: boolean) => {
    setConfirmedState(v);
    saveSession("trip_confirmed", v);
  }, []);

  const setTripConfig = useCallback((c: Partial<TripConfig>) => {
    setTripConfigState((prev) => ({ ...prev, ...c }));
  }, []);

  const toggleTickPlace = useCallback((id: string): boolean => {
    let nextValue = false;
    setTickedPlaces((prev) => {
      nextValue = !prev[id];
      const next = { ...prev, [id]: nextValue };
      saveSession("trip_ticked_places", next);
      return next;
    });
    return nextValue;
  }, []);

  const untickPlace = useCallback((id: string) => {
    setTickedPlaces((prev) => {
      const next = { ...prev, [id]: false };
      saveSession("trip_ticked_places", next);
      return next;
    });
  }, []);

  const handleExecutePlan = useCallback(
    async (input?: PlanInput) => {
      const targetInput = input ?? {
        diemDi: tripConfig.diemDi,
        diemDen: tripConfig.diemDen,
        soNgay: tripConfig.soNgay,
        people: tripConfig.people,
        budget: tripConfig.budget,
        avoids: tripConfig.avoids,
        note: tripConfig.note,
        giaVeTuNhap: tripConfig.giaVeTuNhap,
      };
      const res = await planState.executePlan(targetInput);
      if (res && res.plan) {
        history.init(res.plan);
      }
      return res;
    },
    [planState, tripConfig, history]
  );

  const isBangkokParam =
    isDev &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("dest") === "bangkok";
  const isPreviewParam =
    isDev &&
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).get("previewMoHo") === "1" ||
      new URLSearchParams(window.location.search).get("previewNhapGiaTay") === "1");
  const fallbackPlan = isBangkokParam ? BANGKOK_SAMPLE_PLAN : DEFAULT_SAMPLE_PLAN;
  const isUsingFallbackPlan = !history.current && !planState.plan;
  const isSampleDataActive =
    isDev && (isBangkokParam || isPreviewParam || isUsingFallbackPlan);
  const activePlan = history.current ?? planState.plan ?? fallbackPlan;

  const applyPreview = useCallback(() => {
    if (previewData && previewData.planSau) {
      history.apply(previewData.planSau);
      setPreviewData(null);
      setEditContext(null);
      setScreen("b3-ke-hoach");
    }
  }, [previewData, history]);

  const cancelPreview = useCallback(() => {
    setPreviewData(null);
    setEditContext(null);
    setScreen("b3-ke-hoach");
  }, []);

  return (
    <Ctx.Provider
      value={{
        screen,
        nav,
        confirmed,
        setConfirmed,
        tripConfig,
        setTripConfig,
        activeDay,
        setActiveDay,
        activeTab,
        setActiveTab,
        isSampleDataActive,

        // Plan fields
        plan: activePlan,
        planRequest: activePlan?.request ?? planState.request,
        planStatus: planState.status,
        planResult: planState.result,
        planError: planState.error,
        loadingStep: planState.loadingStep,
        executePlan: handleExecutePlan,
        retryPlan: planState.retry,
        abortPlan: planState.abort,
        toiThieuVND: planState.toiThieuVND,
        hardViolations: planState.hardViolations,
        softViolations: planState.softViolations,
        dataSourceUsed: planState.dataSourceUsed,

        // History
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        undoPlan: history.undo,
        redoPlan: history.redo,
        applyPlan: history.apply,

        // Edit & Preview
        editContext,
        setEditContext,
        previewData,
        setPreviewData,
        applyPreview,
        cancelPreview,

        // B8 & B9
        tickedPlaces,
        toggleTickPlace,
        untickPlace,
        activePopoverPlace,
        setActivePopoverPlace,

        // B10 & B11
        ledger,
        addExpenseToLedger,
        deleteExpenseFromLedger,
        updateExpenseInLedger,
        b10Prefill,
        setB10Prefill,
        openB10,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
