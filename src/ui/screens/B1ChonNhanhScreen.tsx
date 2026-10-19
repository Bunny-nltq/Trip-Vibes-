"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";
import {
  POPULAR_DESTINATIONS,
  POPULAR_ORIGINS,
  toDiemDen,
  getDiemDenTen,
  type DiemDen,
} from "@/contracts";
import {
  MapPin,
  Search,
  Calendar,
  Users,
  Briefcase,
  AlertCircle,
  Check,
  Plane,
  Sparkles,
  Info,
  Globe,
  ExternalLink,
} from "lucide-react";

interface UngVienGeo {
  ten: string;
  quocGia: string;
  maQuocGia: string;
  toaDo: { lat: number; lng: number };
  tienTe: string;
}

const PRESETS = [
  { id: "couple", name: "Cặp đôi", people: 2, budget: 10_000_000, icon: Users },
  { id: "group", name: "Nhóm bạn", people: 4, budget: 20_000_000, icon: Users },
  { id: "solo", name: "Đi một mình", people: 1, budget: 5_000_000, icon: Briefcase },
];

const BUDGETS = [5_000_000, 8_000_000, 10_000_000, 15_000_000, 20_000_000, 25_000_000];
const AVOIDS = [
  "Không dậy sớm",
  "Không đi đêm",
  "Tránh đi lâu",
  "Tránh chỗ đông",
  "Tránh đi bộ nhiều",
];
const DURATION_DAYS = [2, 3, 4, 5];

const fmt = (n: number) => {
  if (n >= 1_000_000) {
    const tr = n / 1_000_000;
    return Number.isInteger(tr) ? `${tr} triệu` : `${tr.toFixed(1)} triệu`;
  }
  return `${n.toLocaleString("vi-VN")} đ`;
};

export function B1ChonNhanhScreen() {
  const {
    nav,
    tripConfig,
    setTripConfig,
    executePlan,
    planStatus,
    planResult,
    toiThieuVND,
    planRequest,
  } = useApp();

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customDestInput, setCustomDestInput] = useState("");
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Trạng thái ứng viên mơ hồ
  const [candidates, setCandidates] = useState<UngVienGeo[]>([]);

  // Trạng thái nhập giá vé tay
  const [chieuDiVND, setChieuDiVND] = useState<string>("1500000");
  const [chieuVeVND, setChieuVeVND] = useState<string>("1500000");
  const [forceNhapGiaTay, setForceNhapGiaTay] = useState(false);

  React.useEffect(() => {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("previewMoHo") === "1") {
        setCandidates([
          {
            ten: "Thành phố Băng Cốc",
            quocGia: "Thái Lan",
            maQuocGia: "TH",
            toaDo: { lat: 13.7525, lng: 100.4935 },
            tienTe: "THB",
          },
          {
            ten: "Bangkok Noi",
            quocGia: "Thái Lan",
            maQuocGia: "TH",
            toaDo: { lat: 13.76, lng: 100.47 },
            tienTe: "THB",
          },
        ]);
      }
      if (sp.get("previewNhapGiaTay") === "1") {
        setForceNhapGiaTay(true);
      }
    }
  }, []);

  const tenDiemDen = getDiemDenTen(tripConfig.diemDen) || "Điểm đến";
  const tenDiemDi = tripConfig.diemDi
    ? typeof tripConfig.diemDi === "string"
      ? tripConfig.diemDi
      : tripConfig.diemDi.ten
    : "TP.HCM";
  const soNgay = tripConfig.soNgay ?? 3;
  const soDem = Math.max(1, soNgay - 1);

  const isAbroad =
    typeof tripConfig.diemDen === "object" &&
    tripConfig.diemDen !== null &&
    tripConfig.diemDen.maQuocGia &&
    tripConfig.diemDen.maQuocGia !== "VN";

  const toggleAvoid = (a: string) => {
    setTripConfig({
      avoids: tripConfig.avoids.includes(a)
        ? tripConfig.avoids.filter((x) => x !== a)
        : [...tripConfig.avoids, a],
    });
  };

  const pickPreset = (p: (typeof PRESETS)[0]) => {
    setSelectedPreset(p.id);
    setTripConfig({ people: p.people, budget: p.budget });
  };

  const handleSelectPopularDest = (preset: (typeof POPULAR_DESTINATIONS)[0]) => {
    const diemDenObj = toDiemDen(preset);
    setTripConfig({ diemDen: diemDenObj });
    setCandidates([]);
    setSearchError(null);
  };

  const handleSearchCustomDest = async () => {
    const q = customDestInput.trim();
    if (!q) return;
    setIsSearchingDest(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/destination?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSearchError(data.error || "Không tìm thấy điểm đến này. Vui lòng thử lại.");
        return;
      }
      if (data.status === "thanh_cong" && data.diemDen) {
        setTripConfig({ diemDen: data.diemDen });
        setCandidates([]);
        setCustomDestInput("");
      } else if (data.status === "can_lam_ro" && data.ungVien && data.ungVien.length > 0) {
        setCandidates(data.ungVien);
      } else {
        setSearchError("Không tìm thấy điểm đến phù hợp. Vui lòng kiểm tra lại chính tả.");
      }
    } catch {
      setSearchError("Không thể kết nối đến dịch vụ tìm điểm đến.");
    } finally {
      setIsSearchingDest(false);
    }
  };

  const handleSelectCandidate = (cand: UngVienGeo) => {
    const diemDen: DiemDen = {
      ten: cand.ten,
      quocGia: cand.quocGia,
      maQuocGia: cand.maQuocGia,
      toaDo: cand.toaDo,
      tienTe: cand.tienTe,
      nguon: "nominatim",
      ngayLay: new Date().toISOString().slice(0, 10),
    };
    setTripConfig({ diemDen });
    setCandidates([]);
    setCustomDestInput("");
  };

  const handleSubmit = async () => {
    nav("b2-dang-chay");
    executePlan();
  };

  const handleRaiseBudget = () => {
    if (toiThieuVND > 0) {
      setTripConfig({ budget: toiThieuVND });
      nav("b2-dang-chay");
      executePlan({ ...tripConfig, budget: toiThieuVND });
    }
  };

  const handleClearAvoids = () => {
    setTripConfig({ avoids: [] });
    nav("b2-dang-chay");
    executePlan({ ...tripConfig, avoids: [] });
  };

  const handleSubmitManualFare = () => {
    const di = parseInt(chieuDiVND, 10) || 0;
    const ve = parseInt(chieuVeVND, 10) || 0;
    const giaVeTuNhap = { chieuDiVND: di, chieuVeVND: ve };
    setTripConfig({ giaVeTuNhap });
    nav("b2-dang-chay");
    executePlan({ ...tripConfig, giaVeTuNhap });
  };

  // Ứng viên từ kết quả planResult nếu backend trả can_lam_ro diem_den_mo_ho
  const activeCandidates =
    candidates.length > 0
      ? candidates
      : planStatus === "can_lam_ro" && planResult?.lyDo === "diem_den_mo_ho" && planResult.ungVien
      ? planResult.ungVien
      : [];

  return (
    <div className="center-layout animate-in" style={{ maxWidth: 720, paddingBottom: 60 }}>
      {/* Badge tóm tắt */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          background: "var(--p100)",
          borderRadius: "var(--r-full)",
          marginBottom: 16,
          fontSize: 13,
          color: "var(--p500)",
          fontWeight: 600,
        }}
      >
        <MapPin size={14} />
        {tenDiemDen} · {soNgay} ngày {soDem} đêm · khởi hành từ {tenDiemDi}
      </div>

      <h1 className="page-title" style={{ fontSize: 28, marginBottom: 8 }}>
        Chuyến {tenDiemDen} của bạn
      </h1>
      <p className="page-sub" style={{ marginBottom: 20 }}>
        {soNgay} ngày {soDem} đêm từ {tenDiemDi}. Chạm để chọn, hoặc bấm Lập kế hoạch ngay.
      </p>

      {/* Dòng ghi chú nhỏ cho điểm đến ngoài Việt Nam */}
      {isAbroad && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: "8px 12px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "var(--r-md)",
            color: "#1e40af",
            fontSize: 12,
            marginBottom: 20,
          }}
        >
          <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Dữ liệu ngoài Việt Nam có thể ít hơn và chỉ là ước tính. Trip Vibes không tư vấn visa.
          </span>
        </div>
      )}

      {/* ─── Khung Điểm đến mơ hồ (can_lam_ro) ─── */}
      {activeCandidates.length > 0 && (
        <div
          className="card"
          style={{
            background: "#eff6ff",
            border: "1.5px solid var(--p500)",
            padding: 20,
            marginBottom: 24,
            borderRadius: "var(--r-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: 16,
              color: "var(--navy)",
              marginBottom: 10,
            }}
          >
            <AlertCircle size={18} color="var(--p500)" />
            Có nhiều điểm đến trùng tên, bạn muốn đi đâu?
          </div>
          <p style={{ fontSize: 13, color: "var(--g700)", marginBottom: 14 }}>
            Vui lòng chọn chính xác điểm đến bên dưới để hệ thống tìm kiếm dịch vụ phù hợp:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeCandidates.map((cand, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-outline"
                style={{
                  justifyContent: "space-between",
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "#fff",
                }}
                onClick={() => handleSelectCandidate(cand)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cand.ten}</div>
                  <div style={{ fontSize: 12, color: "var(--g500)" }}>
                    Quốc gia: {cand.quocGia} ({cand.maQuocGia}) · Tiền tệ: {cand.tienTe}
                  </div>
                </div>
                <Check size={16} color="var(--p500)" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Khung Nhập giá vé tay (khong_co_phuong_an) ─── */}
      {(planStatus === "khong_co_phuong_an" || forceNhapGiaTay) && (
        <div
          className="card"
          style={{
            background: "#fffbeb",
            border: "1.5px solid #f59e0b",
            padding: 20,
            marginBottom: 24,
            borderRadius: "var(--r-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: 16,
              color: "#92400e",
              marginBottom: 8,
            }}
          >
            <AlertCircle size={18} color="#d97706" />
            Không có phương án di chuyển tự động cho tuyến này
          </div>
          <p style={{ fontSize: 13, color: "#78350f", marginBottom: 16, lineHeight: 1.5 }}>
            Hệ thống chưa tìm thấy vé trực tuyến hoặc quãng đường không có tuyến xe/tàu/máy bay mặc định.
            Bạn có thể tự nhập giá vé khứ hồi ước tính để tiếp tục lập kế hoạch:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#78350f", marginBottom: 6 }}>
                Vé chiều đi (VND / người)
              </label>
              <input
                type="number"
                className="input"
                style={{ width: "100%", background: "#fff" }}
                value={chieuDiVND}
                onChange={(e) => setChieuDiVND(e.target.value)}
                placeholder="Ví dụ: 1500000"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#78350f", marginBottom: 6 }}>
                Vé chiều về (VND / người)
              </label>
              <input
                type="number"
                className="input"
                style={{ width: "100%", background: "#fff" }}
                value={chieuVeVND}
                onChange={(e) => setChieuVeVND(e.target.value)}
                placeholder="Ví dụ: 1500000"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ background: "#d97706", borderColor: "#d97706" }}
              onClick={handleSubmitManualFare}
            >
              Tiếp tục với giá vé tự nhập
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleClearAvoids}>
              Bỏ bớt điều muốn tránh
            </button>
          </div>
        </div>
      )}

      {/* ─── Khung Không đủ dữ liệu địa phương (khong_du_du_lieu) ─── */}
      {planStatus === "khong_du_du_lieu" && (
        <div
          className="card"
          style={{
            background: "#fef2f2",
            border: "1.5px solid #ef4444",
            padding: 20,
            marginBottom: 24,
            borderRadius: "var(--r-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: 16,
              color: "#991b1b",
              marginBottom: 8,
            }}
          >
            <AlertCircle size={18} color="#ef4444" />
            Chưa đủ dữ liệu địa phương tại {tenDiemDen}
          </div>
          <p style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 16, lineHeight: 1.5 }}>
            Kho dữ liệu mở từ OpenStreetMap chưa có đủ tối thiểu 3 khách sạn, 3 điểm tham quan hoặc 2 quán ăn được gắn nhãn đầy đủ tại khu vực này để AI có thể lên lịch trình chất lượng cho bạn.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ background: "#dc2626", borderColor: "#dc2626" }}
              onClick={handleSubmit}
            >
              Thử lại lần nữa
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleSelectPopularDest(POPULAR_DESTINATIONS[0])}
            >
              Gợi ý: Đi Đà Nẵng
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleSelectPopularDest(POPULAR_DESTINATIONS[1])}
            >
              Gợi ý: Đi Hà Nội
            </button>
          </div>
        </div>
      )}

      {/* Trạng thái đặc biệt: Ngân sách không đủ */}
      {planStatus === "khong_the_dat_ngan_sach" && (
        <div style={{ marginBottom: 24 }}>
          <div className="banner banner-error" style={{ marginBottom: 12 }}>
            <AlertCircle size={20} style={{ marginRight: 8, flexShrink: 0 }} />
            <div>
              <div className="banner-title">
                Ngân sách {fmt(tripConfig.budget)} chưa đủ
              </div>
              <div className="banner-text">
                Với {tripConfig.people} người đi {soNgay} ngày {soDem} đêm, cần tối thiểu {fmt(toiThieuVND)}.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-outline btn-sm" onClick={handleRaiseBudget}>
              Nâng ngân sách lên {fmt(toiThieuVND)}
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleClearAvoids}>
              Bỏ bớt điều muốn tránh
            </button>
          </div>
        </div>
      )}

      {/* ─── PHẦN 1: ĐIỂM ĐẾN & ĐIỂM KHỞI HÀNH ─── */}
      <div className="field" style={{ marginBottom: 24 }}>
        <div className="field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={16} />
          Điểm đến
        </div>

        {/* Nút các điểm đến phổ biến */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {POPULAR_DESTINATIONS.map((p) => {
            const isSelected = getDiemDenTen(tripConfig.diemDen) === p.ten;
            return (
              <button
                key={p.ten}
                type="button"
                className={`chip ${isSelected ? "on" : ""}`}
                onClick={() => handleSelectPopularDest(p)}
                style={{ fontWeight: isSelected ? 700 : 500 }}
              >
                {p.ten}
              </button>
            );
          })}
        </div>

        {/* Ô Điểm đến khác + Nút Tìm */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="input"
              style={{ width: "100%", paddingLeft: 34 }}
              placeholder="Điểm đến khác (VD: Cần Thơ, Singapore, Paris...)"
              value={customDestInput}
              onChange={(e) => setCustomDestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchCustomDest();
                }
              }}
            />
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--g500)",
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleSearchCustomDest}
            disabled={isSearchingDest || !customDestInput.trim()}
            style={{ minWidth: 70 }}
          >
            {isSearchingDest ? "Đang tìm..." : "Tìm"}
          </button>
        </div>
        {searchError && (
          <div style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>
            {searchError}
          </div>
        )}
      </div>

      {/* Điểm khởi hành */}
      <div className="field" style={{ marginBottom: 24 }}>
        <div className="field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plane size={16} />
          Điểm khởi hành
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {POPULAR_ORIGINS.map((o) => {
            const isSelected = tenDiemDi === o.ten;
            return (
              <button
                key={o.ten}
                type="button"
                className={`chip ${isSelected ? "on" : ""}`}
                onClick={() => setTripConfig({ diemDi: o.ten })}
              >
                {o.ten}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── PHẦN 2: THỜI GIAN CHUYẾN ĐI (2..5 NGÀY BẬT HẾT) ─── */}
      <div className="field" style={{ marginBottom: 24 }}>
        <div className="field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={16} />
          Thời gian chuyến đi
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DURATION_DAYS.map((d) => (
            <button
              key={d}
              type="button"
              className={`chip ${soNgay === d ? "on" : ""}`}
              onClick={() => setTripConfig({ soNgay: d })}
              style={{ fontWeight: soNgay === d ? 700 : 500 }}
            >
              {d} ngày {d - 1} đêm
            </button>
          ))}
        </div>
      </div>

      {/* ─── PHẦN 3: CHỌN NHANH PRESET ─── */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--g500)",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Chọn nhanh
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPreset === p.id;
          return (
            <div
              key={p.id}
              className={`card card-hover ${isSelected ? "card-selected" : ""}`}
              style={{ padding: 18, cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => pickPreset(p)}
            >
              <div style={{ marginBottom: 8, color: "var(--p500)" }}>
                <Icon size={24} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--g500)" }}>
                {p.people} người · {fmt(p.budget)}
              </div>
              {isSelected && (
                <div
                  style={{
                    marginTop: 8,
                    color: "var(--p500)",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Check size={14} /> Đã chọn
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── PHẦN 4: TỰ CHỌN SỐ NGƯỜI & NGÂN SÁCH ─── */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--g500)",
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Hoặc tự chọn
      </div>

      <div className="field" style={{ marginBottom: 20 }}>
        <div className="field-label">Mấy người đi?</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ width: 36, padding: 0, fontWeight: 800, fontSize: 18 }}
            onClick={() =>
              setTripConfig({ people: Math.max(1, tripConfig.people - 1) })
            }
          >
            −
          </button>
          <span
            style={{
              minWidth: 32,
              textAlign: "center",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {tripConfig.people}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ width: 36, padding: 0, fontWeight: 800, fontSize: 18 }}
            onClick={() => setTripConfig({ people: tripConfig.people + 1 })}
          >
            +
          </button>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 20 }}>
        <div className="field-label">Ngân sách cả chuyến</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              className={`chip ${tripConfig.budget === b ? "on" : ""}`}
              onClick={() => setTripConfig({ budget: b })}
            >
              {fmt(b)}
            </button>
          ))}
        </div>
      </div>

      <div className="field" style={{ marginBottom: 20 }}>
        <div className="field-label">Muốn tránh gì?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {AVOIDS.map((a) => (
            <button
              key={a}
              type="button"
              className={`chip ${tripConfig.avoids.includes(a) ? "on" : ""}`}
              onClick={() => toggleAvoid(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="field" style={{ marginBottom: 20 }}>
        <div className="field-label">
          Muốn nói rõ hơn?{" "}
          <span style={{ fontWeight: 400, color: "var(--g500)" }}>
            Không bắt buộc
          </span>
        </div>
        <textarea
          className="textarea"
          placeholder="Ví dụ: đi cùng gia đình, thích ăn đặc sản địa phương, không muốn đi bộ nhiều"
          value={tripConfig.note}
          onChange={(e) => setTripConfig({ note: e.target.value })}
        />
        <div className="hint">Bỏ trống cũng được, AI sẽ tự gợi ý.</div>
      </div>

      {/* Tóm tắt lựa chọn */}
      <div
        className="hint"
        style={{
          marginBottom: 16,
          padding: "10px 14px",
          background: "var(--p100)",
          borderRadius: "var(--r-md)",
          color: "var(--p500)",
          fontWeight: 500,
        }}
      >
        {tenDiemDen} · {soNgay} ngày {soDem} đêm · {tripConfig.people} người · {fmt(tripConfig.budget)}
        {tripConfig.avoids.length > 0
          ? ` · Tránh: ${tripConfig.avoids.join(", ")}`
          : " · AI tự gợi ý hoạt động"}
      </div>

      {/* Nút Submit */}
      <button
        className="btn btn-primary btn-full btn-lg"
        onClick={handleSubmit}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <Sparkles size={18} />
        Lập kế hoạch
      </button>

      {/* Hộp Về Trip Vibes & nguồn tỷ giá */}
      <div
        style={{
          marginTop: 40,
          padding: 16,
          background: "var(--g50)",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--g200)",
          fontSize: 12,
          color: "var(--g600)",
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
          Về Trip Vibes
        </div>
        <div>
          Trợ lý AI lập kế hoạch du lịch thông minh, tối ưu ngân sách và thời gian di chuyển.
          Dữ liệu địa điểm từ OpenStreetMap contributors. Tỷ giá quy đổi ngoại tệ cung cấp bởi{" "}
          <a
            href="https://www.exchangerate-api.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--p500)", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 2 }}
          >
            Rates By Exchange Rate API <ExternalLink size={11} />
          </a>
          .
        </div>
      </div>
    </div>
  );
}
