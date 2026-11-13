"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { usePlan, type PlanStatus, type PlanApiResponse, type PlanInput, type Violation, } from "@/ui/hooks/usePlan";
import { useTemplatePlan } from "@/ui/hooks/useTemplatePlan";
import { TemplateSlugSchema } from "@/contracts";
import { accountRequest } from "@/ui/hooks/accountApi";
import { TravelDatesSchema, PlanSchema, LedgerSchema, SavedTripSchema, schemaVersion } from "@/contracts";
import { usePlanHistory } from "@/ui/hooks/usePlanHistory";
import type { Plan, TripRequest, Selection, Expense, Ledger, ExpenseCategory, User, SavedTrip, } from "@/contracts";
import type { PlanDiff } from "@/core/diffPlan";
import type { ProgressPlace } from "@/core/tripProgress";
import { createLedger, addExpense, deleteExpense, updateExpense } from "@/core/ledger";
export type Screen = "welcome" | "login" | "register" | "workspace" | "profile" | "saved-trips" | "b1-chon-nhanh" | "b2-dang-chay" | "b3-ke-hoach" | "b4-phuong-tien" | "b5-khach-san" | "b6-xem-truoc" | "b7-xac-nhan" | "b8-chuyen-di" | "b9-chi-duong" | "b10-chon-nguon" | "b11-ngan-sach";
export const ALL_SCREENS: Screen[] = [
    "welcome",
    "login",
    "register",
    "saved-trips", "workspace", "profile",
    "b1-chon-nhanh",
    "b2-dang-chay",
    "b3-ke-hoach",
    "b4-phuong-tien",
    "b5-khach-san",
    "b6-xem-truoc",
    "b7-xac-nhan",
    "b8-chuyen-di",
    "b9-chi-duong",
    "b10-chon-nguon",
    "b11-ngan-sach",
];
import { POPULAR_DESTINATIONS, POPULAR_ORIGINS, toDiemDen, type DiemDen } from "@/contracts";
function incomingDates():TripRequest["travelDates"] {if(typeof window==="undefined")return undefined;const q=new URLSearchParams(window.location.search);const parsed=TravelDatesSchema.safeParse({departureDate:q.get("departureDate"),returnDate:q.get("returnDate")});return parsed.success?parsed.data:undefined;}
export interface TripConfig {
    travelDates?:TripRequest["travelDates"];
    transportMode?:TripRequest["transportMode"];
    localTransportMode?:TripRequest["localTransportMode"];
    diemDi: DiemDen | string | null;
    diemDen: DiemDen | string | null;
    soNgay: number;
    people: number;
    budget: number;
    nganSachSoTien?: number;
    nganSachTheo?: "tong" | "moi_nguoi";
    avoids: string[];
    note: string;
    giaVeTuNhap?: {
        chieuDiVND: number;
        chieuVeVND: number;
    };
}

function restoreSubmittedDraft(): TripConfig | null {
    if (typeof window === "undefined") return null;
    const id = window.history?.state?.tripVibesDraftId;
    const draft = loadSession<{ id: string; config: TripConfig } | null>("trip_submitted_draft", null);
    return typeof id === "string" && draft?.id === id ? draft.config : null;
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
    if (typeof window === "undefined")
        return fallback;
    try {
        const raw = window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    }
    catch {
        return fallback;
    }
}
function saveSession<T>(key: string, value: T): void {
    if (typeof window === "undefined")
        return;
    try {
        if (value === null || value === undefined) {
            window.sessionStorage.removeItem(key);
            window.localStorage.removeItem(key);
        }
        else {
            const json = JSON.stringify(value);
            window.sessionStorage.setItem(key, json);
            if (key.startsWith("tripvibes_")) {
                window.localStorage.setItem(key, json);
            }
        }
    }
    catch {
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
    const buaAnTheoNgay: Array<{
        trua: string | null;
        toi: string | null;
        cafe: string | null;
    }> = Array.from({ length: soNgay }, () => ({ trua: null, toi: null, cafe: null }));
    for (const item of plan.items) {
        if (item.hangMuc === "Di chuyển") {
            if (!item.refId || item.experienceType === "local_transfer") continue;
            if (/chiều về/i.test(item.noiDung) || (transportDiId && item.ngay !== 1)) transportVeId = item.refId;
            else if (!transportDiId) transportDiId = item.refId;
            else if (item.refId !== transportDiId) transportVeId = item.refId;
        }
        else if (item.hangMuc === "Chỗ ở") {
            if (!hotelId && item.refId) {
                hotelId = item.refId;
            }
        }
        else if (item.hangMuc === "Vui chơi" && item.refId) {
            const dayIdx = item.ngay - 1;
            if (dayIdx >= 0 && dayIdx < soNgay) {
                hoatDongTheoNgay[dayIdx].push(item.refId);
            }
        }
        else if (item.hangMuc === "Ăn uống" && item.refId) {
            const dayIdx = item.ngay - 1;
            if (dayIdx >= 0 && dayIdx < soNgay) {
                if (item.noiDung.toLowerCase().includes("trưa")) {
                    buaAnTheoNgay[dayIdx].trua = item.refId;
                }
                else if (item.noiDung.toLowerCase().includes("tối")) {
                    buaAnTheoNgay[dayIdx].toi = item.refId;
                }
                else if (item.noiDung.toLowerCase().includes("cà phê") ||
                    item.noiDung.toLowerCase().includes("cafe")) {
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
    ngayDuLieu?: string;
    tuoiGioCache?: number;
    phuongThucLap?: "ai" | "quy_tac";
    lyDoDuPhong?: string;
    // Plan History (Undo / Redo)
    canUndo: boolean;
    canRedo: boolean;
    undoPlan: () => void;
    redoPlan: () => void;
    applyPlan: (newPlan: Plan) => void;
    chooseBudgetAlternative: (plan: Plan) => void;
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
    setPlacesTicked: (ids: string[], checked: boolean) => void;
    activePopoverPlace: ProgressPlace | null;
    setActivePopoverPlace: (p: ProgressPlace | null) => void;
    // B10 & B11 (Sổ chi tiêu & Thêm chi tiêu)
    ledger: Ledger;
    addExpenseToLedger: (exp: Expense) => void;
    deleteExpenseFromLedger: (id: string) => void;
    updateExpenseInLedger: (exp: Expense) => void;
    b10Prefill: {
        soTienVND?:number;
        tenCuaHang?: string;
        ngayTrongChuyen?: number;
        hangMuc?: ExpenseCategory;
    } | null;
    setB10Prefill: (prefill: {
        soTienVND?:number;
        tenCuaHang?: string;
        ngayTrongChuyen?: number;
        hangMuc?: ExpenseCategory;
    } | null) => void;
    openB10: (prefill?: {
        soTienVND?:number;
        tenCuaHang?: string;
        ngayTrongChuyen?: number;
        hangMuc?: ExpenseCategory;
    }) => void;
    isSampleDataActive: boolean;
    templateLoading: boolean;
    templateError: string;
    activeSavedTrip: SavedTrip | null;
    newTrip: () => void;
    // Auth & Saved Trips
    user: User | null;
    savedTrips: SavedTrip[];
    isLoadingTrips: boolean;
    loginUser: (email: string, pass: string) => Promise<{
        ok: boolean;
        message?: string;
    }>;
    registerUser: (name: string, email: string, pass: string) => Promise<{
        ok: boolean;
        message?: string;
    }>;
    logoutUser: () => void;
    refreshSavedTrips: () => Promise<void>;
    returnScreen: Screen | null;
    setReturnScreen: (s: Screen | null) => void;
    pendingSaveTrip: boolean;
    setPendingSaveTrip: (b: boolean) => void;
    saveCurrentTripToAccount: (customTitle?: string, options?: Partial<Pick<SavedTrip, "status" | "journal" | "startDate">>) => Promise<{
        ok: boolean;
        id?: string;
        message?: string;
    }>;
    loadSavedTrip: (savedTrip: SavedTrip, targetScreen?: Screen) => void;
    deleteSavedTrip: (tripId: string) => Promise<{
        ok: boolean;
        message?: string;
    }>;
}
const Ctx = createContext<AppCtx | null>(null);
function normalizeStr(s: string) {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "");
}
function timDiemDenGoiY(ten?: string | null): DiemDen | null {
    if (!ten)
        return null;
    const norm = normalizeStr(ten);
    const matched = POPULAR_DESTINATIONS.find((d) => normalizeStr(d.ten) === norm);
    if (matched)
        return toDiemDen(matched);
    const matchedOrigin = POPULAR_ORIGINS.find((o) => normalizeStr(o.ten) === norm);
    if (matchedOrigin)
        return toDiemDen(matchedOrigin);
    return null;
}
export interface AppProviderProps {
    children: React.ReactNode;
    initialScreen?: string;
    initialMau?: string;
    initialDest?: string;
}
export function AppProvider({ children, initialScreen, initialMau, initialDest, }: AppProviderProps) {
    const [restored] = useState(() => {
        const raw = loadSession<Record<string, unknown> | null>("trip_workspace_v2", null);
        const incoming = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        if (!raw || initialMau || initialDest || incoming.has("mau") || incoming.has("diemDen") || incoming.has("den"))
            return null;
        const plan = PlanSchema.safeParse(raw.plan), ledger = LedgerSchema.safeParse(raw.ledger);
        if (!plan.success || !ledger.success)
            return null;
        const saved = SavedTripSchema.safeParse(raw.saved);
        // Account trips are fetched through the authenticated API, never restored into a guest session.
        if (saved.success || plan.data.items.some(item => item.noiDung === "QA Cafe") || (typeof raw.saved === "object" && raw.saved !== null))
            return null;
        return { plan: plan.data, ledger: ledger.data, confirmed: raw.confirmed === true,
            ticked: (raw.ticked && typeof raw.ticked === "object" ? raw.ticked : {}) as Record<string, boolean>, saved: null };
    });
    const [templateKey, setTemplateKey] = useState<string | null>(() => initialMau || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mau") : null));
    const template = useTemplatePlan(templateKey);
    const [activeSavedTrip, setActiveSavedTrip] = useState<SavedTrip | null>(restored?.saved || null);
    const [screen, setScreen] = useState<Screen>(() => {
        if (initialScreen && ALL_SCREENS.includes(initialScreen as Screen)) {
            return initialScreen as Screen;
        }
        if (initialMau && TemplateSlugSchema.safeParse(initialMau).success)
            return "b3-ke-hoach";
        if (typeof window !== "undefined") {
            const sp = new URLSearchParams(window.location.search);
            const q = sp.get("screen");
            if (q && ALL_SCREENS.includes(q as Screen))
                return q as Screen;
            const mau = sp.get("mau");
            if (mau && TemplateSlugSchema.safeParse(mau).success)
                return "b3-ke-hoach";
        }
        return "b1-chon-nhanh";
    });
    const [confirmed, setConfirmedState] = useState<boolean>(() => {
        if (restored) return restored.confirmed;
        if (typeof window !== "undefined") {
            const q = new URLSearchParams(window.location.search).get("confirmed");
            if (q === "true")
                return true;
            if (q === "false")
                return false;
        }
        return false;
    });
    const [activeDay, setActiveDay] = useState(1);
    const [activeTab, setActiveTab] = useState("b8-list");
    const [returnScreen, setReturnScreen] = useState<Screen | null>(null);
    const [pendingSaveTrip, setPendingSaveTrip] = useState<boolean>(false);
    const [tripConfig, setTripConfigState] = useState<TripConfig>(() => {
        const draft = !initialMau && restoreSubmittedDraft();
        if (draft && (!restored || screen === "b1-chon-nhanh" || screen === "b2-dang-chay")) return draft;
        if (restored)
            return { travelDates:restored.plan.request.travelDates,transportMode:restored.plan.request.transportMode,localTransportMode:restored.plan.request.localTransportMode,diemDi: restored.plan.request.diemDi, diemDen: restored.plan.request.diemDen, soNgay: restored.plan.request.soNgay || 1, people: restored.plan.request.soNguoi || 1, budget: restored.plan.request.ngansachTongVND || 0, avoids: restored.plan.request.tranh, note: restored.plan.request.ghiChu.join(", ") };
        const effectiveDestStr = initialDest ||
            (typeof window !== "undefined"
                ? new URLSearchParams(window.location.search).get("den") ||
                    new URLSearchParams(window.location.search).get("dest") ||
                    new URLSearchParams(window.location.search).get("diemDen")
                : null);
        const initialDiemDen = effectiveDestStr ? timDiemDenGoiY(effectiveDestStr) : null;
        const requestedDays = typeof window !== "undefined" ? Number(new URLSearchParams(window.location.search).get("soNgay")) : 0;
        return {
            diemDi: null,
            diemDen: initialDiemDen ?? effectiveDestStr ?? null,
            travelDates: incomingDates(),
            soNgay: Number.isSafeInteger(requestedDays) && requestedDays > 0 ? requestedDays : 3,
            people: 2,
            budget: 0,
            avoids: [],
            note: "",
        };
    });
    const [editContext, setEditContext] = useState<EditContext | null>(null);
    const [previewData, setPreviewDataState] = useState<PreviewData | null>(null);
    const setPreviewData = useCallback((data: PreviewData | null) => {
        setPreviewDataState(data);
    }, []);
    // Ticked places state (lưu AppContext & sessionStorage)
    const [tickedPlaces, setTickedPlaces] = useState<Record<string, boolean>>(() => restored?.ticked || {});
    // Popover B9
    const [activePopoverPlace, setActivePopoverPlace] = useState<ProgressPlace | null>(null);
    // Sổ chi tiêu (Ledger) lưu AppContext & sessionStorage
    const [ledger, setLedger] = useState<Ledger>(() => {
        return restored?.ledger || createLedger();
    });
    const [b10Prefill, setB10Prefill] = useState<{
        soTienVND?:number;
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
    const openB10 = useCallback((prefill?: {
        soTienVND?:number;
        tenCuaHang?: string;
        ngayTrongChuyen?: number;
        hangMuc?: ExpenseCategory;
    }) => {
        setB10Prefill(prefill ?? null);
        setScreen("b10-chon-nguon");
    }, []);
    const planState = usePlan();
    const initializedPlanRef = useRef<Plan | null>(null);
    const history = usePlanHistory(restored?.plan ?? null);
    useEffect(() => { if (templateKey && template.plan && !history.current) {
        history.init(template.plan);
        setTripConfigState({ travelDates:template.plan.request.travelDates,transportMode:template.plan.request.transportMode,localTransportMode:template.plan.request.localTransportMode,diemDi: template.plan.request.diemDi, diemDen: template.plan.request.diemDen, soNgay: template.plan.request.soNgay || 1, people: template.plan.request.soNguoi || 1, budget: template.plan.request.ngansachTongVND || 0, avoids: template.plan.request.tranh, note: template.plan.request.ghiChu.join(", ") });
    } }, [templateKey, template.plan, history]);
    useEffect(() => {
        if (planState.plan && initializedPlanRef.current !== planState.plan) {
            initializedPlanRef.current = planState.plan;
            history.init(planState.plan);
        }
    }, [planState.plan, history]);
    useEffect(() => {
        if (initialScreen && ALL_SCREENS.includes(initialScreen as Screen)) {
            setScreen(initialScreen as Screen);
        }
    }, [initialScreen]);
    useEffect(() => {
        const handleUrlScreen = () => {
            if (typeof window !== "undefined" && window.location.pathname === "/lap-ke-hoach") {
                const sp = new URLSearchParams(window.location.search);
                const q = sp.get("screen");
                if (!q || q === "b1-chon-nhanh") {
                    const draft = restoreSubmittedDraft();
                    if (draft) setTripConfigState(draft);
                }
                if (q && ALL_SCREENS.includes(q as Screen)) {
                    setScreen(q as Screen);
                } else if (!sp.has("mau")) {
                    setScreen("b1-chon-nhanh");
                }
            }
        };
        window.addEventListener("popstate", handleUrlScreen);
        window.addEventListener("tripvibes:screen", handleUrlScreen);
        return () => {
            window.removeEventListener("popstate", handleUrlScreen);
            window.removeEventListener("tripvibes:screen", handleUrlScreen);
        };
    }, []);
    const previousScreen = useRef(screen);
    useEffect(() => {
        if (previousScreen.current === screen) return;
        const fromScreen = previousScreen.current;
        previousScreen.current = screen;
        const url = new URL(window.location.href);
        if (url.pathname !== "/lap-ke-hoach") return;
        if (fromScreen === "b1-chon-nhanh" && screen === "b2-dang-chay" && url.searchParams.get("screen") !== screen) {
            // Both entries point to the same draft, including after a reload.
            const id = window.crypto.randomUUID?.() ?? String(Date.now());
            saveSession("trip_submitted_draft", { id, config: tripConfig });
            const state = { ...window.history.state, tripVibesDraftId: id, tripVibesPlanningEntry: false };
            window.history.replaceState(state, "", url.toString());
            url.searchParams.set("screen", screen);
            window.history.pushState({ ...state, tripVibesPlanningEntry: true }, "", url.toString());
        } else if (url.searchParams.get("screen") !== screen) {
            url.searchParams.set("screen", screen);
            if (screen === "b3-ke-hoach" && url.searchParams.get("mau") === null) {
                for (const key of ["diemDen", "den", "dest", "departureDate", "returnDate", "soNgay"]) {
                    url.searchParams.delete(key);
                }
            }
            window.history.replaceState(window.history.state, "", url.toString());
        }
        window.scrollTo({top:0,behavior:"auto"});
        document.querySelector(".Content")?.scrollTo({top:0,behavior:"auto"});
    }, [screen, tripConfig]);
    const nav = useCallback((s: Screen) => {
        setScreen(s);
    }, []);
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
    const setPlacesTicked = useCallback((ids: string[], checked: boolean) => {
        setTickedPlaces(previous => {
            const next = { ...previous };
            for (const id of ids) {
                if (checked) next[id] = true;
                else delete next[id];
            }
            saveSession("trip_ticked_places", next);
            return next;
        });
    }, []);
    const { executePlan: executePlanRequest, acceptBudgetAlternative } = planState;
    const { init: initPlanHistory } = history;
    const adoptPlan = useCallback((plan: Plan) => {
        setActiveSavedTrip(null);
        setLedger(createLedger());
        setTickedPlaces({});
        setConfirmedState(false);
        initializedPlanRef.current = plan;
        initPlanHistory(plan);
    }, [initPlanHistory]);
    const chooseBudgetAlternative = useCallback((plan: Plan) => {
        setTripConfigState(config => ({
            ...config,
            soNgay: plan.request.soNgay ?? config.soNgay,
            travelDates: plan.request.travelDates,
            transportMode: plan.request.transportMode,
            localTransportMode: plan.request.localTransportMode,
        }));
        adoptPlan(plan);
        acceptBudgetAlternative(plan);
        nav("b3-ke-hoach");
    }, [acceptBudgetAlternative, adoptPlan, nav]);
    const handleExecutePlan = useCallback(async (input?: PlanInput) => {
        const targetInput = input ?? {
            travelDates:tripConfig.travelDates,transportMode:tripConfig.transportMode,localTransportMode:tripConfig.localTransportMode,
            diemDi: tripConfig.diemDi,
            diemDen: tripConfig.diemDen,
            soNgay: tripConfig.soNgay,
            people: tripConfig.people,
            budget: tripConfig.budget,
            avoids: tripConfig.avoids,
            note: tripConfig.note,
            giaVeTuNhap: tripConfig.giaVeTuNhap,
        };
        const res = await executePlanRequest(targetInput);
        if (res?.plan) adoptPlan(res.plan);
        return res;
    }, [executePlanRequest, tripConfig, adoptPlan]);
    useEffect(() => { if (history.current?.items.some(item => item.noiDung === "QA Cafe")) {
        history.clear();
        setLedger(createLedger());
        setTickedPlaces({});
        setActiveSavedTrip(null);
        saveSession("trip_workspace_v2", null);
    } }, [history]);
    const isSampleDataActive = Boolean(templateKey) || planState.dataSourceUsed === "mock" || history.current?.dataSourceUsed === "mock";
    const activePlan = history.current ?? null;
    useEffect(() => {
        if (!history.current && !planState.plan)
            return;
        saveSession("trip_workspace_v2", { schemaVersion, plan: activePlan, ledger, ticked: tickedPlaces, confirmed, saved: activeSavedTrip });
    }, [activePlan, ledger, tickedPlaces, confirmed, activeSavedTrip, history.current, planState.plan]);
    const newTrip = useCallback(() => {
        const dirty = (Boolean(history.current?.items.length) || ledger.expenses.length > 0) && history.current && (!activeSavedTrip || JSON.stringify(history.current) !== JSON.stringify(activeSavedTrip.plan) || JSON.stringify(ledger) !== JSON.stringify(activeSavedTrip.ledger) || JSON.stringify(tickedPlaces) !== JSON.stringify(activeSavedTrip.tickedPlaces));
        if (dirty && !window.confirm("Chuyến hiện tại có thay đổi chưa lưu vào tài khoản. Bắt đầu chuyến mới sẽ thay bản đang làm trên thiết bị. Tiếp tục?"))
            return;
        setTemplateKey(null);
        const url = new URL(window.location.href);
        url.searchParams.delete("mau");
        const state = { ...window.history.state };
        delete state.tripVibesDraftId;
        delete state.tripVibesPlanningEntry;
        window.history.replaceState(state, "", url.toString());
        saveSession("trip_submitted_draft", null);
        setTripConfigState({ diemDi: null, diemDen: null, soNgay: 3, people: 2, budget: 0, avoids: [], note: "" });
        setActiveDay(1);
        setPreviewData(null);
        history.clear();
        setLedger(createLedger());
        setTickedPlaces({});
        setConfirmedState(false);
        setActiveSavedTrip(null);
        saveSession("trip_workspace_v2", null);
        setScreen("b1-chon-nhanh");
    }, [history, activeSavedTrip, ledger, tickedPlaces, setPreviewData]);
    const applyPreview = useCallback(() => {
        if (previewData && previewData.planSau) {
            history.apply(previewData.planSau);
            setPreviewData(null);
            setEditContext(null);
            setScreen("b3-ke-hoach");
        }
    }, [previewData, history, setPreviewData]);
    const cancelPreview = useCallback(() => {
        setPreviewData(null);
        setEditContext(null);
        setScreen("b3-ke-hoach");
    }, [setPreviewData]);
    // User Authentication & Saved Trips state
    const [user, setUser] = useState<User | null>(null);
    const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
    const [isLoadingTrips, setIsLoadingTrips] = useState(false);
    useEffect(() => {
        let live = true;
        accountRequest("/api/auth/me").then(data => { if (live)
            setUser(data.user || null); }).catch(() => { if (live)
            setUser(null); });
        return () => { live = false; };
    }, []);
    const refreshSavedTrips = useCallback(async () => {
        if (!user) {
            setSavedTrips([]);
            return;
        }
        setIsLoadingTrips(true);
        try {
            const data = await accountRequest("/api/user/trips");
            if (data.thanhCong && Array.isArray(data.trips)) {
                setSavedTrips(data.trips);
                saveSession("tripvibes_saved_trips", data.trips);
            }
        }
        catch {
            // ignore network errors
        }
        finally {
            setIsLoadingTrips(false);
        }
    }, [user]);
    useEffect(() => {
        if (user) {
            refreshSavedTrips();
        }
    }, [user, refreshSavedTrips]);
    const loginUser = useCallback(async (email: string, pass: string) => {
        try {
            const data = await accountRequest("/api/auth/login", "POST", { email, matKhau: pass });
            setUser(data.user);
            saveSession("tripvibes_user", data.user);
            return { ok: true };
        }
        catch (err: any) {
            return { ok: false, message: err?.message || "Lỗi kết nối máy chủ" };
        }
    }, []);
    const registerUser = useCallback(async (name: string, email: string, pass: string) => {
        try {
            const data = await accountRequest("/api/auth/register", "POST", { ten: name, email, matKhau: pass });
            setUser(data.user);
            saveSession("tripvibes_user", data.user);
            return { ok: true };
        }
        catch (err: any) {
            return { ok: false, message: err?.message || "Lỗi kết nối máy chủ" };
        }
    }, []);
    const logoutUser = useCallback(() => {
        void accountRequest("/api/auth/logout", "POST").then(() => {
            setUser(null);
            setActiveSavedTrip(null);
            setSavedTrips([]);
            history.clear();
            setLedger(createLedger());
            setTickedPlaces({});
            setConfirmedState(false);
            saveSession("trip_workspace_v2", null);
            saveSession("tripvibes_user", null);
            saveSession("tripvibes_saved_trips", null);
        }).catch(() => { if (typeof window !== "undefined")
            window.alert("Chưa đăng xuất được. Vui lòng thử lại khi kết nối ổn định."); });
    }, [history]);
    const saveCurrentTripToAccount = useCallback(async (customTitle?: string, options?: Partial<Pick<SavedTrip, "status" | "journal" | "startDate">>) => {
        if (!user) {
            setReturnScreen(screen);
            setPendingSaveTrip(true);
            setScreen("login");
            return { ok: false, message: "Vui lòng đăng nhập hoặc tạo tài khoản để lưu chuyến đi." };
        }
        const currentPlan = activePlan;
        if (!currentPlan) {
            return { ok: false, message: "Chưa có kế hoạch chuyến đi để lưu" };
        }
        const diemDiStr = typeof currentPlan.request.diemDi === "string"
            ? currentPlan.request.diemDi
            : "Hà Nội";
        const diemDenStr = typeof currentPlan.request.diemDen === "string"
            ? currentPlan.request.diemDen
            : currentPlan.request.diemDen?.ten || "Điểm đến";
        const title = customTitle ||
            `${diemDiStr} → ${diemDenStr} (${currentPlan.request.soNgay || 3} ngày)`;
        try {
            const data = await accountRequest("/api/user/trips", activeSavedTrip && activeSavedTrip.userId === user.id ? "PUT" : "POST", {
                id: activeSavedTrip?.id, version: activeSavedTrip?.version, title, plan: currentPlan, ledger, tickedPlaces,
                status: options?.status || activeSavedTrip?.status || "planned", startDate: options?.startDate ?? activeSavedTrip?.startDate ?? null,
                journal: options?.journal ?? activeSavedTrip?.journal ?? "",
            });
            setActiveSavedTrip(data.trip);
            setSavedTrips((prev) => {
                const next = [data.trip, ...prev.filter((t) => t.id !== data.trip.id)];
                saveSession("tripvibes_saved_trips", next);
                return next;
            });
            return { ok: true, id: data.trip.id };
        }
        catch (err: any) {
            return { ok: false, message: err?.message || "Lỗi mạng khi lưu chuyến đi" };
        }
    }, [user, activePlan, ledger, tickedPlaces, screen, activeSavedTrip]);
    const loadSavedTrip = useCallback((savedTrip: SavedTrip, targetScreen: Screen = "b8-chuyen-di") => {
        setActiveSavedTrip(savedTrip);
        history.init(savedTrip.plan);
        setLedger(savedTrip.ledger);
        saveSession("trip_ledger", savedTrip.ledger);
        setTickedPlaces(savedTrip.tickedPlaces || {});
        saveSession("trip_ticked_places", savedTrip.tickedPlaces || {});
        setTripConfigState({
            diemDi: savedTrip.plan.request.diemDi,
            diemDen: savedTrip.plan.request.diemDen,
            travelDates:savedTrip.plan.request.travelDates,transportMode:savedTrip.plan.request.transportMode,localTransportMode:savedTrip.plan.request.localTransportMode,
            soNgay: savedTrip.plan.request.soNgay ?? 1,
            people: savedTrip.plan.request.soNguoi ?? 2,
            budget: savedTrip.plan.request.ngansachTongVND ?? 10000000,
            avoids: savedTrip.plan.request.tranh ?? [],
            note: (savedTrip.plan.request.ghiChu || []).join(", "),
        });
        setConfirmedState(true);
        saveSession("trip_confirmed", true);
        setScreen(targetScreen);
    }, [history]);
    const deleteSavedTrip = useCallback(async (tripId: string) => {
        if (!user)
            return { ok: false, message: "Chưa đăng nhập" };
        try {
            await accountRequest(`/api/user/trips?id=${encodeURIComponent(tripId)}`, "DELETE");
            setSavedTrips((prev) => {
                const next = prev.filter((t) => t.id !== tripId);
                saveSession("tripvibes_saved_trips", next);
                return next;
            });
            return { ok: true };
        }
        catch (err: any) {
            return { ok: false, message: err?.message || "Lỗi mạng khi xóa" };
        }
    }, [user]);
    return (<Ctx.Provider value={{
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
            templateLoading: template.loading, templateError: template.error,
            activeSavedTrip, newTrip,
            // Auth & Saved Trips
            user,
            savedTrips,
            isLoadingTrips,
            returnScreen,
            setReturnScreen,
            pendingSaveTrip,
            setPendingSaveTrip,
            loginUser,
            registerUser,
            logoutUser,
            refreshSavedTrips,
            saveCurrentTripToAccount,
            loadSavedTrip,
            deleteSavedTrip,
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
            ngayDuLieu: planState.ngayDuLieu,
            tuoiGioCache: planState.tuoiGioCache,
            phuongThucLap: planState.phuongThucLap,
            lyDoDuPhong: planState.lyDoDuPhong,
            // History
            canUndo: history.canUndo,
            canRedo: history.canRedo,
            undoPlan: history.undo,
            redoPlan: history.redo,
            applyPlan: history.apply,
            chooseBudgetAlternative,
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
            setPlacesTicked,
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
        }}>
      {children}
    </Ctx.Provider>);
}
export function useApp() {
    const ctx = useContext(Ctx);
    if (!ctx)
        throw new Error("useApp must be used inside AppProvider");
    return ctx;
}
