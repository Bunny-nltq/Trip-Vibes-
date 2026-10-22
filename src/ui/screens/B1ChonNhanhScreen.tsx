"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "@/ui/context/AppContext";
import {
  getDiemDenTen,
  type DiemDen,
} from "@/contracts";
import {
  FormB1,
  FormB1ErrorCode,
  kiemTraFormB1,
  taoYeuCauTuForm,
  dinhDangTien,
  docTien,
} from "@/core/formB1";
import { layThongBaoLoi, type ThongBaoLoi } from "@/ui/messages/loi";
import { docGoiChuyenTuSession } from "@/ui/lib/chuyenB1";
import { useTrangThaiAI } from "@/ui/hooks/useTrangThaiAI";
import {
  MapPin,
  Search,
  Calendar,
  Wallet,
  Check,
  Plane,
  Paperclip,
  Moon,
  Sunrise,
  Timer,
  Users,
  Footprints,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";

interface UngVienGeo {
  ten: string;
  quocGia: string;
  maQuocGia: string;
  toaDo: { lat: number; lng: number };
  tienTe: string;
}

const PRESETS = [
  {
    id: "couple",
    name: "Cặp đôi",
    people: 2,
    sub: "2 người",
    iconType: "couple",
  },
  {
    id: "group",
    name: "Nhóm bạn",
    people: 4,
    sub: "4 người",
    iconType: "group",
  },
  {
    id: "family",
    name: "Gia đình",
    people: 4,
    sub: "4 người",
    iconType: "family",
  },
  {
    id: "solo",
    name: "Đi một mình",
    people: 1,
    sub: "1 người",
    iconType: "solo",
  },
];

const BUDGET_BUTTONS = [5_000_000, 8_000_000, 10_000_000, 15_000_000, 20_000_000];
const QUICK_ORIGINS = ["TP.HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ"];
const QUICK_DESTINATIONS = [
  "Đà Nẵng",
  "Hà Nội",
  "Đà Lạt",
  "Phú Quốc",
  "Nha Trang",
  "Bangkok",
  "Seoul",
  "Tokyo",
];

const AVOID_ITEMS = [
  { label: "Không dậy sớm", icon: Sunrise },
  { label: "Không đi đêm", icon: Moon },
  { label: "Tránh đi lâu", icon: Timer },
  { label: "Tránh chỗ đông", icon: Users },
  { label: "Tránh đi bộ nhiều", icon: Footprints },
];
const DURATION_DAYS = [2, 3, 4, 5];

export function B1ChonNhanhScreen() {
  const {
    nav,
    tripConfig,
    setTripConfig,
    executePlan,
    planResult,
  } = useApp();
  const { aiBat } = useTrangThaiAI();

  // ─── 1. Form state B1 ───
  const [diemDi, setDiemDi] = useState<DiemDen | null>(
    tripConfig.diemDi && typeof tripConfig.diemDi === "object"
      ? (tripConfig.diemDi as DiemDen)
      : null
  );
  const [diemDen, setDiemDen] = useState<DiemDen | null>(
    tripConfig.diemDen && typeof tripConfig.diemDen === "object"
      ? (tripConfig.diemDen as DiemDen)
      : null
  );
  const [soNguoi, setSoNguoi] = useState<number>(tripConfig.people || 2);
  const [nganSachSoTien, setNganSachSoTien] = useState<number>(
    tripConfig.nganSachSoTien || tripConfig.budget || 0
  );
  const [nganSachTheo, setNganSachTheo] = useState<"tong" | "moi_nguoi">(
    tripConfig.nganSachTheo || "tong"
  );
  const [nganSachInputStr, setNganSachInputStr] = useState<string>(
    tripConfig.nganSachSoTien || tripConfig.budget
      ? dinhDangTien(tripConfig.nganSachSoTien || tripConfig.budget)
      : ""
  );
  const [soNgay, setSoNgay] = useState<number>(tripConfig.soNgay || 3);
  const [tranh, setTranh] = useState<string[]>(tripConfig.avoids || []);
  const [ghiChu, setGhiChu] = useState<string>(tripConfig.note || "");

  // ─── Geocoding Search States ───
  const [diemDiInput, setDiemDiInput] = useState("");
  const [diemDiLoading, setDiemDiLoading] = useState(false);
  const [diemDiError, setDiemDiError] = useState<ThongBaoLoi | null>(null);
  const [diemDiCandidates, setDiemDiCandidates] = useState<UngVienGeo[]>([]);

  const [diemDenInput, setDiemDenInput] = useState("");
  const [diemDenLoading, setDiemDenLoading] = useState(false);
  const [diemDenError, setDiemDenError] = useState<ThongBaoLoi | null>(null);
  const [diemDenCandidates, setDiemDenCandidates] = useState<UngVienGeo[]>([]);

  // Đã từng thử submit hoặc tương tác
  const [hasInteracted, setHasInteracted] = useState(false);

  // Xem trước môi trường phát triển (preview URL) và đọc dữ liệu chuyển từ Home
  useEffect(() => {
    // 1. Đọc từ sessionStorage (gói chuyển taoGoiChuyenB1)
    const pkg = docGoiChuyenTuSession();
    if (pkg) {
      if (pkg.diemDiTen) {
        setDiemDi({
          ten: pkg.diemDiTen,
          quocGia: "Việt Nam",
          maQuocGia: "VN",
          toaDo: { lat: 10.7769, lng: 106.7009 },
          tienTe: "VND",
          nguon: "nominatim",
          ngayLay: new Date().toISOString(),
        });
      }
      if (pkg.diemDenTen) {
        setDiemDen({
          ten: pkg.diemDenTen,
          quocGia: "Việt Nam",
          maQuocGia: "VN",
          toaDo: { lat: 16.0544, lng: 108.2022 },
          tienTe: "VND",
          nguon: "nominatim",
          ngayLay: new Date().toISOString(),
        });
      }
      if (pkg.soNguoi) setSoNguoi(pkg.soNguoi);
      if (pkg.soNgay) setSoNgay(pkg.soNgay);
      if (pkg.nganSachSoTien) {
        setNganSachSoTien(pkg.nganSachSoTien);
        setNganSachInputStr(dinhDangTien(pkg.nganSachSoTien));
      }
      if (pkg.nganSachTheo) setNganSachTheo(pkg.nganSachTheo);
    }

    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      // 2. Fallback tham số URL
      const tu = sp.get("tu");
      const den = sp.get("den");
      const ngay = parseInt(sp.get("ngay") || "0", 10);
      const nguoi = parseInt(sp.get("nguoi") || "0", 10);
      const ns = parseInt(sp.get("ngansach") || "0", 10);
      if (den && !pkg) {
        setDiemDen({
          ten: den,
          quocGia: "Việt Nam",
          maQuocGia: "VN",
          toaDo: { lat: 16.0544, lng: 108.2022 },
          tienTe: "VND",
          nguon: "nominatim",
          ngayLay: new Date().toISOString(),
        });
      }
      if (tu && !pkg) {
        setDiemDi({
          ten: tu,
          quocGia: "Việt Nam",
          maQuocGia: "VN",
          toaDo: { lat: 10.7769, lng: 106.7009 },
          tienTe: "VND",
          nguon: "nominatim",
          ngayLay: new Date().toISOString(),
        });
      }
      if (nguoi >= 1 && nguoi <= 10 && !pkg) setSoNguoi(nguoi);
      if (ngay >= 2 && ngay <= 5 && !pkg) setSoNgay(ngay);
      if (ns > 0 && !pkg) {
        setNganSachSoTien(ns);
        setNganSachInputStr(dinhDangTien(ns));
      }

      // 3. Môi trường phát triển preview
      const isDev = process.env.NODE_ENV === "development";
      if (isDev && sp.get("previewMoHo") === "1") {
        setDiemDenCandidates([
          {
            ten: "Dalat",
            quocGia: "Malaysia",
            maQuocGia: "MY",
            toaDo: { lat: 2.701, lng: 111.96 },
            tienTe: "MYR",
          },
          {
            ten: "Đà Lạt",
            quocGia: "Việt Nam",
            maQuocGia: "VN",
            toaDo: { lat: 11.94, lng: 108.43 },
            tienTe: "VND",
          },
        ]);
      }
    }
  }, []);

  // Đồng bộ sang AppContext
  useEffect(() => {
    const tongNganSach =
      nganSachTheo === "tong" ? nganSachSoTien : nganSachSoTien * soNguoi;

    setTripConfig({
      diemDi,
      diemDen,
      people: soNguoi,
      budget: tongNganSach,
      nganSachSoTien,
      nganSachTheo,
      soNgay,
      avoids: tranh,
      note: ghiChu,
    });
  }, [diemDi, diemDen, soNguoi, nganSachSoTien, nganSachTheo, soNgay, tranh, ghiChu, setTripConfig]);

  // Đối tượng FormB1 thuần để kiểm tra
  const currentForm: FormB1 = {
    diemDi,
    diemDen,
    soNguoi,
    nganSach: {
      soTien: nganSachSoTien,
      theo: nganSachTheo,
    },
    soNgay,
    tranh,
    ghiChu,
  };

  const validationErrors = kiemTraFormB1(currentForm);
  const isFormValid = validationErrors.length === 0;

  // Tính tổng quy đổi ngân sách
  const tongNganSachQuyDoiVND =
    nganSachTheo === "tong" ? nganSachSoTien : nganSachSoTien * soNguoi;

  // Tìm kiếm địa điểm chung
  const executeSearch = async (
    query: string
  ): Promise<{
    diemDen?: DiemDen;
    candidates?: UngVienGeo[];
    error?: ThongBaoLoi;
  }> => {
    const q = query.trim();
    if (!q) {
      return { error: layThongBaoLoi("geocode_khong_thay", { tenDiaDiem: query }) };
    }
    try {
      const res = await fetch(`/api/destination?q=${encodeURIComponent(q)}`);
      if (res.status === 429 || res.status === 403) {
        return { error: layThongBaoLoi("geocode_ban") };
      }
      if (!res.ok) {
        return { error: layThongBaoLoi("mang_loi") };
      }
      const data = await res.json();
      if (data.status === "thanh_cong" && data.diemDen) {
        return { diemDen: data.diemDen };
      }
      if (data.status === "can_lam_ro" && data.ungVien && data.ungVien.length > 0) {
        return { candidates: data.ungVien.slice(0, 3) };
      }
      return { error: layThongBaoLoi("geocode_khong_thay", { tenDiaDiem: q }) };
    } catch {
      return { error: layThongBaoLoi("mang_loi") };
    }
  };

  // Tìm điểm đi
  const handleSearchDiemDi = async (overrideQ?: string) => {
    const q = overrideQ !== undefined ? overrideQ : diemDiInput;
    if (!q.trim()) return;
    setDiemDiLoading(true);
    setDiemDiError(null);
    setDiemDiCandidates([]);

    const res = await executeSearch(q);
    setDiemDiLoading(false);

    if (res.error) {
      setDiemDiError(res.error);
    } else if (res.candidates && res.candidates.length > 0) {
      setDiemDiCandidates(res.candidates);
    } else if (res.diemDen) {
      setDiemDi(res.diemDen);
      setDiemDiInput("");
      setDiemDiCandidates([]);
      setDiemDiError(null);
    }
  };

  // Tìm điểm đến
  const handleSearchDiemDen = async (overrideQ?: string) => {
    const q = overrideQ !== undefined ? overrideQ : diemDenInput;
    if (!q.trim()) return;
    setDiemDenLoading(true);
    setDiemDenError(null);
    setDiemDenCandidates([]);

    const res = await executeSearch(q);
    setDiemDenLoading(false);

    if (res.error) {
      setDiemDenError(res.error);
    } else if (res.candidates && res.candidates.length > 0) {
      setDiemDenCandidates(res.candidates);
    } else if (res.diemDen) {
      setDiemDen(res.diemDen);
      setDiemDenInput("");
      setDiemDenCandidates([]);
      setDiemDenError(null);
    }
  };

  // Chọn ứng viên cho điểm đi
  const handleSelectDiemDiCandidate = (c: UngVienGeo) => {
    setDiemDi({
      ten: c.ten,
      quocGia: c.quocGia,
      maQuocGia: c.maQuocGia,
      toaDo: c.toaDo,
      tienTe: c.tienTe,
      nguon: "nominatim",
      ngayLay: new Date().toISOString().slice(0, 10),
    });
    setDiemDiCandidates([]);
    setDiemDiInput("");
    setDiemDiError(null);
  };

  // Chọn ứng viên cho điểm đến
  const handleSelectDiemDenCandidate = (c: UngVienGeo) => {
    setDiemDen({
      ten: c.ten,
      quocGia: c.quocGia,
      maQuocGia: c.maQuocGia,
      toaDo: c.toaDo,
      tienTe: c.tienTe,
      nguon: "nominatim",
      ngayLay: new Date().toISOString().slice(0, 10),
    });
    setDiemDenCandidates([]);
    setDiemDenInput("");
    setDiemDenError(null);
  };

  // Xử lý gõ ngân sách (dấu chấm phân cách hàng nghìn)
  const handleNganSachChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = docTien(raw);
    if (num === null) {
      // Giữ nguyên ký tự người dùng gõ nếu đang xóa hoặc nhập dở
      setNganSachInputStr(raw);
      setNganSachSoTien(0);
    } else {
      setNganSachSoTien(num);
      setNganSachInputStr(dinhDangTien(num));
    }
  };

  // Bấm nút gợi ý ngân sách (5, 8, 10, 15, 20 triệu)
  const handlePickBudget = (val: number) => {
    setNganSachSoTien(val);
    setNganSachInputStr(dinhDangTien(val));
  };

  // Tăng giảm số người
  const handleStepPeople = (delta: number) => {
    const next = Math.max(1, Math.min(10, soNguoi + delta));
    setSoNguoi(next);
  };

  // Bật/tắt mục tránh
  const toggleAvoid = (label: string) => {
    setTranh((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  // Submit form B1
  const handleSubmit = async () => {
    setHasInteracted(true);
    if (!isFormValid) {
      return;
    }
    const yeuCau = taoYeuCauTuForm(currentForm);
    nav("b2-dang-chay");
    executePlan({
      diemDi: yeuCau.diemDi,
      diemDen: yeuCau.diemDen,
      soNgay: yeuCau.soNgay,
      people: yeuCau.soNguoi,
      budget: yeuCau.ngansachTongVND,
      avoids: yeuCau.tranh,
      note: yeuCau.ghiChu,
    });
  };

  // Chú thích lý do vì sao nút "Lập kế hoạch" đang tắt
  const getLyDoTat = (): string => {
    if (validationErrors.includes("diem_di_thieu")) return "Chưa chọn điểm đi";
    if (validationErrors.includes("diem_den_thieu")) return "Chưa chọn điểm đến";
    if (validationErrors.includes("diem_di_trung_diem_den"))
      return "Điểm đi trùng điểm đến";
    if (validationErrors.includes("so_nguoi_ngoai_pham_vi"))
      return "Số người ngoài phạm vi (1–10)";
    if (validationErrors.includes("ngan_sach_khong_hop_le"))
      return "Chưa nhập ngân sách hợp lệ";
    if (validationErrors.includes("so_ngay_ngoai_pham_vi"))
      return "Số ngày ngoài phạm vi (2–5)";
    if (validationErrors.includes("ghi_chu_qua_dai"))
      return "Ghi chú vượt quá 500 ký tự";
    return "";
  };

  const soDem = Math.max(1, soNgay - 1);
  const tenDiemDen = diemDen ? getDiemDenTen(diemDen) : null;
  const tenDiemDi = diemDi ? (typeof diemDi === "string" ? diemDi : diemDi.ten) : null;

  // Lỗi hiển thị theo vị trí
  const hasDiemDiError = validationErrors.includes("diem_di_thieu") && hasInteracted;
  const hasDiemDenMissingError =
    validationErrors.includes("diem_den_thieu") && hasInteracted;
  const hasDiemTrungError = validationErrors.includes("diem_di_trung_diem_den");
  const hasSoNguoiError = validationErrors.includes("so_nguoi_ngoai_pham_vi");
  const hasNganSachError =
    validationErrors.includes("ngan_sach_khong_hop_le") &&
    (hasInteracted || (nganSachInputStr.length > 0 && nganSachSoTien <= 0));
  const hasSoNgayError = validationErrors.includes("so_ngay_ngoai_pham_vi");
  const hasGhiChuError = validationErrors.includes("ghi_chu_qua_dai");

  return (
    <div className="HomeRow">
      {/* CỘT CHÍNH: HomeCard */}
      <div className="HomeCard">
        {/* HERO BANNER - ĐỘNG THEO TRẠNG THÁI */}
        <div className="Hero">
          {/* Scenic Coastal & Mountain background artwork */}
          <svg
            width="820"
            height="192"
            viewBox="0 0 820 192"
            fill="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
            }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-art-sky1)" />
                <stop offset="50%" stopColor="var(--color-art-sky2)" />
                <stop offset="100%" stopColor="var(--color-art-sky3)" />
              </linearGradient>
              <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-art-sea-deep1)" />
                <stop offset="100%" stopColor="var(--color-art-sea-deep2)" />
              </linearGradient>
              <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-art-hill1)" />
                <stop offset="100%" stopColor="var(--color-art-hill2)" />
              </linearGradient>
            </defs>
            <rect width="820" height="192" fill="url(#skyGrad)" />
            <path
              d="M260 130 C 380 70, 520 80, 680 125 L 820 120 L 820 192 L 260 192 Z"
              fill="var(--color-art-sea-light)"
              opacity="0.6"
            />
            <path
              d="M420 120 C 530 85, 660 75, 820 110 L 820 192 L 420 192 Z"
              fill="var(--color-art-hill3)"
              opacity="0.5"
            />
            <path
              d="M0 130 Q 350 125, 820 135 L 820 192 L 0 192 Z"
              fill="url(#seaGrad)"
              opacity="0.4"
            />
            <path
              d="M480 192 C 550 145, 620 120, 720 115 C 770 112, 800 130, 820 145 L 820 192 Z"
              fill="url(#mountainGrad)"
            />
            <path
              d="M620 192 C 670 140, 750 135, 820 150 L 820 192 Z"
              fill="var(--color-art-hill4)"
              opacity="0.8"
            />
          </svg>

          {/* Sun Doodle SVG */}
          <div className="HeroSun">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-art-sun)"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="5" fill="var(--color-art-sun-light)" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </div>

          {/* TIÊU ĐỀ & PHỤ ĐỀ THEO ĐÚNG YÊU CẦU */}
          <div className="HeroTitle">
            {tenDiemDen ? `Chuyến đi ${tenDiemDen} của bạn` : "Bạn muốn đi đâu?"}
          </div>
          <div className="HeroSub">
            {tenDiemDi
              ? `${soNgay} ngày ${soDem} đêm từ ${tenDiemDi}`
              : "Chọn điểm đi và điểm đến để bắt đầu"}
          </div>

          <div className="GoodTrip Script">
            Good trip<br />Good mood
          </div>
        </div>

        {/* BODY NỘI DUNG FORM (Theo đúng 5 mục đánh số) */}
        <div className="Body">
          {/* ═════════════════════════════════════════════════════════════════
              MỤC 1: ĐI TỪ ĐÂU, ĐẾN ĐÂU?
          ═════════════════════════════════════════════════════════════════ */}
          <div className="Section" id="sec-diem-di-den">
            <div className="Sec">
              <div className="NumC">1</div>
              <div>
                <div className="STitle">Đi từ đâu, đến đâu?</div>
                <div className="SSub">Nhập điểm khởi hành và điểm đến bạn mong muốn</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Ô 1: Điểm đi */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-neutral-navyText)" }}>
                  Điểm đi
                </label>

                {diemDi ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "var(--color-primary-brandSoft)",
                      border: "1.5px solid var(--color-primary-brand)",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <MapPin size={16} color="var(--color-primary-brand)" />
                      <span style={{ fontWeight: 600, color: "var(--color-neutral-navyText)" }}>
                        {diemDi.ten} ({diemDi.quocGia})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="Btn BtnSmall"
                      onClick={() => {
                        setDiemDi(null);
                        setDiemDiInput("");
                        setDiemDiError(null);
                        setDiemDiCandidates([]);
                      }}
                      style={{ padding: "4px 10px", fontSize: 12, background: "var(--color-surface)" }}
                    >
                      <RefreshCw size={12} style={{ marginRight: 4 }} />
                      Đổi
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        className="Input"
                        placeholder="Nhập nơi xuất phát..."
                        value={diemDiInput}
                        onChange={(e) => setDiemDiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearchDiemDi();
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="Btn BtnPrimary"
                        disabled={diemDiLoading || !diemDiInput.trim()}
                        onClick={() => handleSearchDiemDi()}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        {diemDiLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Search size={16} />
                        )}
                        <span>Tìm</span>
                      </button>
                    </div>

                    {/* Gợi ý nhanh điểm đi */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--color-neutral-mutedText)", alignSelf: "center" }}>
                        Gợi ý:
                      </span>
                      {QUICK_ORIGINS.map((city) => (
                        <button
                          key={city}
                          type="button"
                          className="Chip"
                          onClick={() => {
                            setDiemDiInput(city);
                            handleSearchDiemDi(city);
                          }}
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Ứng viên điểm đi mơ hồ */}
                {diemDiCandidates.length > 0 && !diemDi && (
                  <div
                    style={{
                      background: "var(--color-status-warnBg)",
                      border: "1px solid var(--color-status-warnBorder)",
                      borderRadius: 8,
                      padding: 10,
                      marginTop: 6,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-status-warnText)" }}>
                      Chọn điểm đi chính xác:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {diemDiCandidates.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          className="Btn BtnSmall"
                          onClick={() => handleSelectDiemDiCandidate(c)}
                          style={{ background: "var(--color-surface)", fontSize: 12 }}
                        >
                          <MapPin size={12} style={{ marginRight: 4 }} />
                          {c.ten} ({c.quocGia})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lỗi ở ô điểm đi */}
                {(diemDiError || hasDiemDiError) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      background: "var(--color-status-errBg)",
                      border: "1px solid var(--color-status-errBorder)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      marginTop: 4,
                    }}
                  >
                    <AlertCircle size={16} color="var(--color-status-errText)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-status-errText)" }}>
                        {diemDiError?.tieuDe || "Thiếu điểm khởi hành"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-status-errText)" }}>
                        {diemDiError?.noiDung || "Vui lòng chọn hoặc nhập điểm đi của chuyến đi."}
                      </div>
                      {diemDiError?.hanhDong && (
                        <button
                          type="button"
                          className="Btn BtnSmall"
                          onClick={() => {
                            if (diemDiError.hanhDong?.loai === "thu_lai") {
                              handleSearchDiemDi();
                            }
                          }}
                          style={{ marginTop: 6, padding: "2px 8px", fontSize: 11 }}
                        >
                          {diemDiError.hanhDong.nhan}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Ô 2: Điểm đến */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-neutral-navyText)" }}>
                  Điểm đến
                </label>

                {diemDen ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "var(--color-primary-brandSoft)",
                      border: "1.5px solid var(--color-primary-brand)",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <MapPin size={16} color="var(--color-primary-brand)" />
                      <span style={{ fontWeight: 600, color: "var(--color-neutral-navyText)" }}>
                        {diemDen.ten} ({diemDen.quocGia})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="Btn BtnSmall"
                      onClick={() => {
                        setDiemDen(null);
                        setDiemDenInput("");
                        setDiemDenError(null);
                        setDiemDenCandidates([]);
                      }}
                      style={{ padding: "4px 10px", fontSize: 12, background: "var(--color-surface)" }}
                    >
                      <RefreshCw size={12} style={{ marginRight: 4 }} />
                      Đổi
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        className="Input"
                        placeholder="Nhập nơi muốn đến..."
                        value={diemDenInput}
                        onChange={(e) => setDiemDenInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearchDiemDen();
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="Btn BtnPrimary"
                        disabled={diemDenLoading || !diemDenInput.trim()}
                        onClick={() => handleSearchDiemDen()}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        {diemDenLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Search size={16} />
                        )}
                        <span>Tìm</span>
                      </button>
                    </div>

                    {/* Gợi ý nhanh điểm đến */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--color-neutral-mutedText)", alignSelf: "center" }}>
                        Gợi ý:
                      </span>
                      {QUICK_DESTINATIONS.map((city) => (
                        <button
                          key={city}
                          type="button"
                          className="Chip"
                          onClick={() => {
                            setDiemDenInput(city);
                            handleSearchDiemDen(city);
                          }}
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Ứng viên điểm đến mơ hồ */}
                {diemDenCandidates.length > 0 && !diemDen && (
                  <div
                    style={{
                      background: "var(--color-status-warnBg)",
                      border: "1px solid var(--color-status-warnBorder)",
                      borderRadius: 8,
                      padding: 10,
                      marginTop: 6,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-status-warnText)" }}>
                      Chọn điểm đến chính xác (tối đa 3):
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {diemDenCandidates.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          className="Btn BtnSmall"
                          onClick={() => handleSelectDiemDenCandidate(c)}
                          style={{ background: "var(--color-surface)", fontSize: 12 }}
                        >
                          <MapPin size={12} style={{ marginRight: 4 }} />
                          {c.ten} ({c.quocGia})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lỗi ở ô điểm đến */}
                {(diemDenError || hasDiemDenMissingError || hasDiemTrungError) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      background: "var(--color-status-errBg)",
                      border: "1px solid var(--color-status-errBorder)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      marginTop: 4,
                    }}
                  >
                    <AlertCircle size={16} color="var(--color-status-errText)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-status-errText)" }}>
                        {hasDiemTrungError
                          ? "Điểm đi trùng điểm đến"
                          : diemDenError?.tieuDe || "Thiếu điểm đến"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-status-errText)" }}>
                        {hasDiemTrungError
                          ? "Điểm khởi hành và điểm đến nằm cùng khu vực (dưới 15 km). Vui lòng chọn điểm đến khác."
                          : diemDenError?.noiDung || "Vui lòng chọn hoặc nhập điểm đến bạn muốn tới."}
                      </div>
                      {diemDenError?.hanhDong && (
                        <button
                          type="button"
                          className="Btn BtnSmall"
                          onClick={() => {
                            if (diemDenError.hanhDong?.loai === "thu_lai") {
                              handleSearchDiemDen();
                            }
                          }}
                          style={{ marginTop: 6, padding: "2px 8px", fontSize: 11 }}
                        >
                          {diemDenError.hanhDong.nhan}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              MỤC 2: MẤY NGƯỜI ĐI?
          ═════════════════════════════════════════════════════════════════ */}
          <div className="Section" id="sec-so-nguoi">
            <div className="Sec">
              <div className="NumC">2</div>
              <div>
                <div className="STitle">Mấy người đi?</div>
                <div className="SSub">Tùy chỉnh số người từ 1 đến 10</div>
              </div>
            </div>

            {/* Stepper tăng giảm số người */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: "var(--color-neutral-gray50)",
                border: "1px solid var(--color-neutral-borderInput)",
                borderRadius: 10,
                padding: "6px 12px",
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                className="Btn BtnSmall"
                disabled={soNguoi <= 1}
                onClick={() => handleStepPeople(-1)}
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                }}
                aria-label="Giảm 1 người"
              >
                <Minus size={14} />
              </button>

              <span style={{ fontSize: 16, fontWeight: 700, minWidth: 70, textAlign: "center" }}>
                {soNguoi} người
              </span>

              <button
                type="button"
                className="Btn BtnSmall"
                disabled={soNguoi >= 10}
                onClick={() => handleStepPeople(1)}
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                }}
                aria-label="Tăng 1 người"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Thẻ nhóm (CHỈ đặt số người, KHÔNG CÓ CHỮ TRIỆU NÀO) */}
            <div className="Presets">
              {PRESETS.map((preset) => {
                const isSelected = soNguoi === preset.people;
                return (
                  <div
                    key={preset.id}
                    className={`Preset ${isSelected ? "PresetOn" : ""}`}
                    onClick={() => setSoNguoi(preset.people)}
                  >
                    {preset.iconType === "couple" && (
                      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="17" cy="17" r="16" fill="var(--color-art-icon-bg-blue)" />
                        <ellipse cx="17" cy="25" rx="10" ry="3.5" fill="var(--color-art-sand)" />
                        <path d="M12 25 C13 18, 15 15, 17 11 C19 15, 21 18, 22 25" stroke="var(--color-art-wood-trunk)" strokeWidth="2" strokeLinecap="round" />
                        <path d="M17 11 C14 8, 10 9, 8 13 C12 13, 15 12, 17 11 Z" fill="var(--color-art-palm1)" />
                        <path d="M17 11 C20 8, 24 9, 26 13 C22 13, 19 12, 17 11 Z" fill="var(--color-art-palm2)" />
                      </svg>
                    )}
                    {preset.iconType === "group" && (
                      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="17" cy="17" r="16" fill="var(--color-art-icon-bg-primary)" />
                        <circle cx="12" cy="14" r="3.5" fill="var(--color-art-blue-mid)" />
                        <circle cx="22" cy="14" r="3.5" fill="var(--color-art-blue-mid)" />
                        <circle cx="17" cy="11.5" r="4" fill="var(--color-art-blue-dark)" />
                        <path d="M9 25 C9 20, 15 20, 15 25" fill="var(--color-art-blue-dark)" />
                        <path d="M19 25 C19 20, 25 20, 25 25" fill="var(--color-art-blue-dark)" />
                        <path d="M13 25 C13 18.5, 21 18.5, 21 25" fill="var(--color-art-blue-deep)" />
                      </svg>
                    )}
                    {preset.iconType === "family" && (
                      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="17" cy="17" r="16" fill="var(--color-art-icon-bg-green)" />
                        <circle cx="13" cy="12" r="3.5" fill="var(--color-art-hill2)" />
                        <circle cx="21" cy="12" r="3.5" fill="var(--color-art-hill2)" />
                        <circle cx="17" cy="17" r="2.8" fill="var(--color-art-warm-amber)" />
                        <path d="M10 25 C10 19, 16 19, 16 25" fill="var(--color-art-hill2)" />
                        <path d="M18 25 C18 19, 24 19, 24 25" fill="var(--color-art-hill2)" />
                        <path d="M14 25 C14 22, 20 22, 20 25" fill="var(--color-art-orange)" />
                      </svg>
                    )}
                    {preset.iconType === "solo" && (
                      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="17" cy="17" r="16" fill="var(--color-art-icon-bg-tint)" />
                        <circle cx="17" cy="13" r="4.5" fill="var(--color-primary)" />
                        <path d="M11 25 C11 19, 23 19, 23 25" fill="var(--color-primary)" />
                      </svg>
                    )}

                    <div style={{ minWidth: 0 }}>
                      <div className="PName">{preset.name}</div>
                      <div className="PSub">{preset.sub}</div>
                    </div>

                    {isSelected && (
                      <div className="Badge">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {hasSoNguoiError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--color-status-errBg)",
                  border: "1px solid var(--color-status-errBorder)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginTop: 10,
                }}
              >
                <AlertCircle size={16} color="var(--color-status-errText)" />
                <span style={{ fontSize: 12, color: "var(--color-status-errText)", fontWeight: 600 }}>
                  Số người đi phải nằm trong khoảng từ 1 đến 10 người.
                </span>
              </div>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              MỤC 3: NGÂN SÁCH
          ═════════════════════════════════════════════════════════════════ */}
          <div className="Section" id="sec-ngan-sach">
            <div className="Sec">
              <div className="NumC">3</div>
              <div style={{ flex: 1 }}>
                <div className="STitle">Ngân sách</div>
                <div className="SSub">Nhập số tiền VND dự kiến và chọn cách tính</div>
              </div>

              {/* Nút chuyển chế độ: Cho cả nhóm vs Mỗi người */}
              <div
                style={{
                  display: "inline-flex",
                  background: "var(--color-neutral-gray100)",
                  borderRadius: 8,
                  padding: 3,
                }}
              >
                <button
                  type="button"
                  onClick={() => setNganSachTheo("tong")}
                  style={{
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: nganSachTheo === "tong" ? 700 : 500,
                    background: nganSachTheo === "tong" ? "var(--color-surface)" : "transparent",
                    color:
                      nganSachTheo === "tong"
                        ? "var(--color-primary-brand)"
                        : "var(--color-neutral-mutedText)",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    boxShadow:
                      nganSachTheo === "tong" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Cho cả nhóm
                </button>
                <button
                  type="button"
                  onClick={() => setNganSachTheo("moi_nguoi")}
                  style={{
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: nganSachTheo === "moi_nguoi" ? 700 : 500,
                    background: nganSachTheo === "moi_nguoi" ? "var(--color-surface)" : "transparent",
                    color:
                      nganSachTheo === "moi_nguoi"
                        ? "var(--color-primary-brand)"
                        : "var(--color-neutral-mutedText)",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    boxShadow:
                      nganSachTheo === "moi_nguoi" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Mỗi người
                </button>
              </div>
            </div>

            {/* Ô nhập số tiền có dấu chấm phân cách */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 360, marginBottom: 12 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  className="Input"
                  placeholder="Ví dụ: 10.000.000"
                  value={nganSachInputStr}
                  onChange={handleNganSachChange}
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    paddingRight: 32,
                    textAlign: "right",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontWeight: 700,
                    color: "var(--color-neutral-mutedText)",
                  }}
                >
                  đ
                </span>
              </div>
            </div>

            {/* Các nút điền số nhanh: 5, 8, 10, 15, 20 triệu */}
            <div className="ChipsNo" style={{ marginBottom: 10 }}>
              {BUDGET_BUTTONS.map((amt) => {
                const isSelected = nganSachSoTien === amt;
                return (
                  <div
                    key={amt}
                    className={`Chip ${isSelected ? "ChipOn" : ""}`}
                    onClick={() => handlePickBudget(amt)}
                  >
                    {amt / 1_000_000} triệu
                  </div>
                );
              })}
            </div>

            {/* Dòng nhỏ luôn hiện tổng quy đổi */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-primary-brand)",
                background: "var(--color-primary-brandSoft)",
                padding: "6px 12px",
                borderRadius: 6,
                display: "inline-block",
              }}
            >
              Tổng cả nhóm: {tongNganSachQuyDoiVND > 0 ? `${dinhDangTien(tongNganSachQuyDoiVND)} đ` : "0 đ"}
              {nganSachTheo === "moi_nguoi" && nganSachSoTien > 0 && (
                <span style={{ fontSize: 12, color: "var(--color-neutral-mutedText)", marginLeft: 6 }}>
                  ({dinhDangTien(nganSachSoTien)} đ × {soNguoi} người)
                </span>
              )}
            </div>

            {/* Lỗi ở ô ngân sách */}
            {hasNganSachError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--color-status-errBg)",
                  border: "1px solid var(--color-status-errBorder)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginTop: 10,
                }}
              >
                <AlertCircle size={16} color="var(--color-status-errText)" />
                <span style={{ fontSize: 12, color: "var(--color-status-errText)", fontWeight: 600 }}>
                  Ngân sách dự kiến phải là số nguyên dương hợp lệ (lớn hơn 0 đ).
                </span>
              </div>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              MỤC 4: THỜI GIAN
          ═════════════════════════════════════════════════════════════════ */}
          <div className="Section" id="sec-thoi-gian">
            <div className="Sec">
              <div className="NumC">4</div>
              <div>
                <div className="STitle">Thời gian</div>
                <div className="SSub">Thời lượng chuyến đi từ 2 đến 5 ngày</div>
              </div>
            </div>

            <div className="ChipsNo">
              {DURATION_DAYS.map((d) => {
                const isSelected = soNgay === d;
                return (
                  <div
                    key={d}
                    className={`Chip ${isSelected ? "ChipOn" : ""}`}
                    onClick={() => setSoNgay(d)}
                  >
                    {d} ngày {d - 1} đêm
                  </div>
                );
              })}
            </div>

            {hasSoNgayError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--color-status-errBg)",
                  border: "1px solid var(--color-status-errBorder)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginTop: 10,
                }}
              >
                <AlertCircle size={16} color="var(--color-status-errText)" />
                <span style={{ fontSize: 12, color: "var(--color-status-errText)", fontWeight: 600 }}>
                  Chuyến đi hỗ trợ từ 2 đến 5 ngày (tương ứng 1 đến 4 đêm).
                </span>
              </div>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              MỤC 5: MUỐN TRÁNH GÌ? VÀ GHI CHÚ
          ═════════════════════════════════════════════════════════════════ */}
          <div className="Section" id="sec-muon-tranh">
            <div className="Sec">
              <div className="NumC">5</div>
              <div>
                <div className="STitle">Muốn tránh gì?</div>
                <div className="SSub">Trip Vibes sẽ tối ưu lịch trình theo tiêu chí của bạn</div>
              </div>
            </div>

            <div className="ChipsWrap" style={{ marginBottom: 16 }}>
              {AVOID_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const isAvoided = tranh.includes(item.label);
                return (
                  <div
                    key={item.label}
                    className={`Chip ChipIcon ${isAvoided ? "ChipOn" : ""}`}
                    onClick={() => toggleAvoid(item.label)}
                  >
                    <IconComponent size={14} />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Ghi chú tùy chọn với bộ đếm ký tự chuẩn - chỉ hiện khi AI bật */}
            {aiBat && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-neutral-navyText)" }}>
                    Ghi chú thêm (không bắt buộc)
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: ghiChu.length > 500 ? "var(--color-status-error)" : "var(--color-neutral-mutedText)",
                    }}
                  >
                    {ghiChu.length}/500
                  </span>
                </div>

                <textarea
                  className="Area"
                  placeholder="Ví dụ: đi cùng gia đình, thích trải nghiệm văn hóa địa phương, muốn nghỉ ngơi thong thả..."
                  value={ghiChu}
                  maxLength={600}
                  onChange={(e) => setGhiChu(e.target.value)}
                  style={{ width: "100%", resize: "none", outline: "none", fontFamily: "inherit" }}
                />

                {hasGhiChuError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "var(--color-status-errBg)",
                      border: "1px solid var(--color-status-errBorder)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      marginTop: 6,
                    }}
                  >
                    <AlertCircle size={16} color="var(--color-status-errText)" />
                    <span style={{ fontSize: 12, color: "var(--color-status-errText)", fontWeight: 600 }}>
                      Nội dung ghi chú tối đa 500 ký tự. Vui lòng rút gọn lại.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            THANH TÓM TẮT DƯỚI CÙNG (DỰNG TỪ GIÁ TRỊ THẬT)
        ═════════════════════════════════════════════════════════════════ */}
        <div className="BarWrap">
          <div className="BarIn">
            <div className="BarText" style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <MapPin size={18} color="var(--color-primary-brand)" style={{ flexShrink: 0 }} />
              <div style={{ lineHeight: "20px", fontSize: 13 }}>
                {!diemDi && (
                  <span style={{ color: "var(--color-status-error)", fontWeight: 600, marginRight: 8 }}>
                    Chưa chọn điểm đi
                  </span>
                )}
                {!diemDen && (
                  <span style={{ color: "var(--color-status-error)", fontWeight: 600, marginRight: 8 }}>
                    Chưa chọn điểm đến
                  </span>
                )}
                {tongNganSachQuyDoiVND <= 0 && (
                  <span style={{ color: "var(--color-status-error)", fontWeight: 600, marginRight: 8 }}>
                    Chưa nhập ngân sách
                  </span>
                )}

                {diemDi && diemDen && tongNganSachQuyDoiVND > 0 && (
                  <span>
                    <strong>{soNguoi}</strong> người · <strong>{dinhDangTien(tongNganSachQuyDoiVND)} đ</strong> ·{" "}
                    <strong>{soNgay} ngày {soDem} đêm</strong> ({diemDi.ten} → {diemDen.ten})
                    {tranh.length > 0 ? ` · Tránh: ${tranh.join(", ")}` : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Cụm nút submit + Chú thích vì sao tắt */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {!isFormValid && (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--color-status-errText)",
                    background: "var(--color-status-errBg)",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontWeight: 600,
                    maxWidth: 220,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={getLyDoTat()}
                >
                  Đang tắt: {getLyDoTat()}
                </span>
              )}

              <button
                type="button"
                className="Go"
                disabled={!isFormValid}
                onClick={handleSubmit}
                style={{
                  opacity: !isFormValid ? 0.6 : 1,
                  cursor: !isFormValid ? "not-allowed" : "pointer",
                }}
              >
                <Plane size={18} />
                <span>Lập kế hoạch</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: HomeRight */}
      <div className="HomeRight">
        <div className="Quote Script">
          Đi để thấy thế giới rộng lớn và chính mình cũng thật tuyệt!
        </div>

        <div className="RightArt">
          <svg width="294" height="680" viewBox="0 0 294 680" fill="none">
            <defs>
              <linearGradient id="baySky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-art-sky4)" />
                <stop offset="40%" stopColor="var(--color-art-sky5)" />
                <stop offset="100%" stopColor="var(--color-art-sky6)" />
              </linearGradient>
              <linearGradient id="baySea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-art-sea1)" />
                <stop offset="60%" stopColor="var(--color-art-sea2)" />
                <stop offset="100%" stopColor="var(--color-art-sea3)" />
              </linearGradient>
              <linearGradient id="woodPost" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-art-wood1)" />
                <stop offset="100%" stopColor="var(--color-art-wood2)" />
              </linearGradient>
            </defs>

            <path d="M0 240 C 60 210, 140 215, 294 250 L 294 400 L 0 400 Z" fill="var(--color-art-bay-sea)" opacity="0.6" />
            <path d="M40 280 C 120 230, 220 240, 294 265 L 294 450 L 40 450 Z" fill="var(--color-art-hill5)" opacity="0.5" />
            <path d="M0 320 C 100 310, 200 330, 294 340 L 294 560 L 0 560 Z" fill="url(#baySea)" opacity="0.55" />
            <path d="M80 680 C 140 540, 180 430, 294 410 L 294 680 Z" fill="var(--color-art-hill6)" />
            <path d="M120 680 C 170 560, 230 490, 294 470 L 294 680 Z" fill="var(--color-art-hill7)" />

            <rect x="236" y="500" width="14" height="180" rx="3" fill="url(#woodPost)" />
            <path d="M180 540 L 255 540 L 270 552 L 255 564 L 180 564 Z" fill="var(--color-art-wood-sign1)" />
            <text x="220" y="556" fill="var(--color-art-cream)" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="var(--font-sans)">
              Travel
            </text>
            <path d="M170 575 L 260 575 L 275 587 L 260 599 L 170 599 Z" fill="var(--color-art-wood-sign2)" />
            <text x="218" y="591" fill="var(--color-art-cream)" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="var(--font-sans)">
              Explore
            </text>
            <path d="M190 610 L 255 610 L 268 622 L 255 634 L 190 634 Z" fill="var(--color-art-wood-sign3)" />
            <text x="226" y="626" fill="var(--color-art-cream)" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="var(--font-sans)">
              Love
            </text>

            <circle cx="160" cy="650" r="10" fill="var(--color-surface)" />
            <circle cx="160" cy="650" r="4" fill="var(--color-art-sun)" />
            <circle cx="190" cy="665" r="9" fill="var(--color-surface)" />
            <circle cx="190" cy="665" r="3.5" fill="var(--color-art-sun)" />
            <circle cx="130" cy="660" r="8" fill="var(--color-surface)" />
            <circle cx="130" cy="660" r="3" fill="var(--color-art-sun)" />
          </svg>
        </div>

        <div className="Fade" />
      </div>
    </div>
  );
}

export default B1ChonNhanhScreen;
