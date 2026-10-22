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
import { ChonDiem } from "@/ui/components/ChonDiem";
import { useDiemChon } from "@/ui/hooks/useDiemChon";
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
const DURATION_DAYS = [2, 3, 4, 5, 6, 7];

export function B1ChonNhanhScreen() {
  const {
    nav,
    tripConfig,
    setTripConfig,
    executePlan,
    planResult,
  } = useApp();
  const { aiBat } = useTrangThaiAI();
  const { data: diemChonData } = useDiemChon();

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
      if (ngay >= 2 && ngay <= 7 && !pkg) setSoNgay(ngay);
      if (ns > 0 && !pkg) {
        setNganSachSoTien(ns);
        setNganSachInputStr(dinhDangTien(ns));
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
    if (validationErrors.includes("diem_di_trung_diem_den"))
      return "Điểm đi và điểm đến không được trùng nhau.";
    if (validationErrors.includes("so_nguoi_ngoai_pham_vi"))
      return "Số người cần trong khoảng từ 1 đến 10 người.";
    if (validationErrors.includes("ngan_sach_khong_hop_le"))
      return "Vui lòng nhập ngân sách dự kiến hợp lệ.";
    if (validationErrors.includes("so_ngay_ngoai_pham_vi"))
      return "Số ngày cần trong khoảng từ 2 đến 7 ngày.";
    if (validationErrors.includes("ghi_chu_qua_dai"))
      return "Ghi chú vượt quá 500 ký tự.";
    if (validationErrors.includes("diem_di_thieu") || validationErrors.includes("diem_den_thieu") || tongNganSachQuyDoiVND <= 0)
      return "Vui lòng chọn điểm đi, điểm đến và ngân sách để tiếp tục.";
    return "Vui lòng hoàn thiện các thông tin để tiếp tục.";
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
        {/* HERO BANNER - NỀN GRADIENT TỪ TOKEN (PRIMARY SANG SKY) */}
        <div
          className="HeroGradientBanner"
          style={{
            position: "relative",
            height: 120,
            margin: "8px 8px 0",
            borderRadius: "var(--r-xl)",
            overflow: "hidden",
            flex: "none",
            background: "linear-gradient(135deg, var(--color-primary-main), var(--color-primary-sky))",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 36px",
          }}
        >
          <div
            style={{
              fontSize: 26,
              lineHeight: "32px",
              fontWeight: 800,
              color: "var(--color-primary-text)",
              marginBottom: 4,
            }}
          >
            {tenDiemDen ? `Chuyến đi ${tenDiemDen} của bạn` : "Bạn muốn đi đâu?"}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: "18px",
              color: "var(--color-primary-tint)",
            }}
          >
            {tenDiemDi
              ? `${soNgay} ngày ${soDem} đêm từ ${tenDiemDi}`
              : "Chọn điểm đi và điểm đến để bắt đầu"}
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
              <ChonDiem
                id="b1-diem-di"
                label="Điểm khởi hành"
                placeholder="Chọn điểm xuất phát..."
                value={diemDi}
                onChange={(val) => setDiemDi(val)}
                options={diemChonData.diemDi}
                disabledOptionTen={diemDen?.ten}
                error={hasDiemDiError}
                errorMessage="Vui lòng chọn điểm khởi hành trong danh sách."
              />

              {/* Ô 2: Điểm đến */}
              <ChonDiem
                id="b1-diem-den"
                label="Điểm đến"
                placeholder="Chọn điểm đến..."
                value={diemDen}
                onChange={(val) => setDiemDen(val)}
                options={diemChonData.diemDen}
                disabledOptionTen={diemDi?.ten}
                error={hasDiemDenMissingError || hasDiemTrungError}
                errorMessage={
                  hasDiemTrungError
                    ? "Điểm khởi hành và điểm đến không được trùng nhau."
                    : "Vui lòng chọn điểm đến trong danh sách."
                }
              />
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
                <div className="SSub">Thời lượng chuyến đi từ 2 đến 7 ngày</div>
              </div>
            </div>

            <div style={{ maxWidth: 360, marginTop: 10 }}>
              <select
                id="select-so-ngay-b1"
                aria-label="Chọn số ngày đi"
                value={soNgay}
                onChange={(e) => setSoNgay(parseInt(e.target.value, 10))}
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 14px",
                  fontSize: "var(--font-size-base)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {[2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {d} ngày {d - 1} đêm
                  </option>
                ))}
              </select>
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
                  Chuyến đi hỗ trợ từ 2 đến 7 ngày (tương ứng 1 đến 6 đêm).
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
                {diemDi && diemDen && tongNganSachQuyDoiVND > 0 ? (
                  <span>
                    <strong>{soNguoi}</strong> người · <strong>{dinhDangTien(tongNganSachQuyDoiVND)} đ</strong> ·{" "}
                    <strong>{soNgay} ngày {soDem} đêm</strong> ({diemDi.ten} → {diemDen.ten})
                    {tranh.length > 0 ? ` · Tránh: ${tranh.join(", ")}` : ""}
                  </span>
                ) : (
                  <span style={{ color: "var(--color-text-sub)" }}>
                    {soNguoi} người · {tongNganSachQuyDoiVND > 0 ? `${dinhDangTien(tongNganSachQuyDoiVND)} đ` : "Ngân sách đang trống"} · {soNgay} ngày {soDem} đêm · {diemDi ? (typeof diemDi === "string" ? diemDi : diemDi.ten) : "..."} → {diemDen ? (typeof diemDen === "string" ? diemDen : diemDen.ten) : "..."}
                  </span>
                )}
              </div>
            </div>

            {/* Cụm nút submit + Chú thích ngắn lý do bị tắt dưới nút */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
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
              {!isFormValid && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--color-status-errText)",
                    lineHeight: "14px",
                    marginTop: 2,
                    textAlign: "right",
                  }}
                >
                  {getLyDoTat()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default B1ChonNhanhScreen;
