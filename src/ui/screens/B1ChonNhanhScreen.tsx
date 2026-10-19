"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";

const PRESETS = [
  { id: "couple", icon: "💑", name: "Cặp đôi", people: 2, budget: 10_000_000 },
  { id: "group", icon: "👥", name: "Nhóm bạn", people: 4, budget: 20_000_000 },
  { id: "solo", icon: "🧳", name: "Đi một mình", people: 1, budget: 5_000_000 },
];

const BUDGETS = [5_000_000, 8_000_000, 10_000_000, 15_000_000, 20_000_000];
const AVOIDS = [
  "Không dậy sớm",
  "Không đi đêm",
  "Tránh đi lâu",
  "Tránh chỗ đông",
  "Tránh đi bộ nhiều",
];

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
    toiThieuVND,
    planRequest,
  } = useApp();

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

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

  return (
    <div className="center-layout animate-in" style={{ maxWidth: 680 }}>
      {/* Destination badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          background: "var(--p100)",
          borderRadius: "var(--r-full)",
          marginBottom: 20,
          fontSize: 13,
          color: "var(--p500)",
          fontWeight: 600,
        }}
      >
        🏖 Đà Nẵng · 3 ngày 2 đêm · khởi hành từ TP.HCM
      </div>

      <h1 className="page-title" style={{ fontSize: 28 }}>
        Chuyến Đà Nẵng của bạn
      </h1>
      <p className="page-sub">
        3 ngày 2 đêm từ TP.HCM. Chạm để chọn, hoặc bấm Lập kế hoạch ngay.
      </p>

      {/* Trạng thái đặc biệt: Ngân sách không đủ */}
      {planStatus === "khong_the_dat_ngan_sach" && (
        <div style={{ marginBottom: 24 }}>
          <div className="banner banner-error" style={{ marginBottom: 12 }}>
            <div className="banner-mark">!</div>
            <div>
              <div className="banner-title">
                Ngân sách {fmt(tripConfig.budget)} chưa đủ
              </div>
              <div className="banner-text">
                Với {tripConfig.people} người đi 3 ngày 2 đêm, cần tối thiểu{" "}
                {fmt(toiThieuVND)}.
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

      {/* Trạng thái đặc biệt: Không có phương án phù hợp điều kiện tránh */}
      {planStatus === "khong_co_phuong_an" && (
        <div style={{ marginBottom: 24 }}>
          <div className="banner banner-error" style={{ marginBottom: 12 }}>
            <div className="banner-mark">!</div>
            <div>
              <div className="banner-title">Không tìm thấy phương án phù hợp</div>
              <div className="banner-text">
                Các điều kiện muốn tránh đã loại bỏ hết phương tiện di chuyển. Vui lòng nới lỏng các điều cần tránh.
              </div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleClearAvoids}>
            Bỏ bớt điều muốn tránh
          </button>
        </div>
      )}

      {/* Trạng thái đặc biệt: Cần làm rõ */}
      {planStatus === "can_lam_ro" && (
        <div
          className="card"
          style={{
            background: "var(--g50)",
            padding: 20,
            marginBottom: 24,
            border: "1.5px solid var(--p500)",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "var(--navy)",
              marginBottom: 10,
            }}
          >
            Cho mình hỏi thêm một chút
          </div>
          {planRequest?.cauHoiLamRo && planRequest.cauHoiLamRo.length > 0 ? (
            planRequest.cauHoiLamRo.map((q, idx) => (
              <div
                key={idx}
                style={{ fontSize: 14, color: "var(--g700)", marginBottom: 8 }}
              >
                • {q}
              </div>
            ))
          ) : (
            <div style={{ fontSize: 14, color: "var(--g700)", marginBottom: 8 }}>
              Vui lòng chọn số người và ngân sách cụ thể bên dưới để AI lập kế hoạch chính xác.
            </div>
          )}
        </div>
      )}

      {/* Presets */}
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
          marginBottom: 28,
        }}
      >
        {PRESETS.map((p) => (
          <div
            key={p.id}
            className={`card card-hover ${
              selectedPreset === p.id ? "card-selected" : ""
            }`}
            style={{ padding: 18, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => pickPreset(p)}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              {p.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--g500)" }}>
              {p.people} người · {fmt(p.budget)}
            </div>
            {selectedPreset === p.id && (
              <div
                style={{
                  marginTop: 8,
                  color: "var(--p500)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                ✓ Đã chọn
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom */}
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

      <div className="field">
        <div className="field-label">Mấy người đi?</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
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
            className="btn btn-outline btn-sm"
            style={{ width: 36, padding: 0, fontWeight: 800, fontSize: 18 }}
            onClick={() => setTripConfig({ people: tripConfig.people + 1 })}
          >
            +
          </button>
        </div>
      </div>

      <div className="field">
        <div className="field-label">Ngân sách cả chuyến</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {BUDGETS.map((b) => (
            <button
              key={b}
              className={`chip ${tripConfig.budget === b ? "on" : ""}`}
              onClick={() => setTripConfig({ budget: b })}
            >
              {fmt(b)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">Muốn tránh gì?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {AVOIDS.map((a) => (
            <button
              key={a}
              className={`chip ${tripConfig.avoids.includes(a) ? "on" : ""}`}
              onClick={() => toggleAvoid(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">
          Muốn nói rõ hơn?{" "}
          <span style={{ fontWeight: 400, color: "var(--g500)" }}>
            Không bắt buộc
          </span>
        </div>
        <textarea
          className="textarea"
          placeholder="Ví dụ: đi cùng ba mẹ, thích ăn hải sản, không muốn đi bộ nhiều"
          value={tripConfig.note}
          onChange={(e) => setTripConfig({ note: e.target.value })}
        />
        <div className="hint">Bỏ trống cũng được, AI sẽ tự gợi ý.</div>
      </div>

      <div
        className="hint"
        style={{
          marginBottom: 14,
          padding: "10px 14px",
          background: "var(--p100)",
          borderRadius: "var(--r-md)",
          color: "var(--p500)",
          fontWeight: 500,
        }}
      >
        {tripConfig.people} người · {fmt(tripConfig.budget)} ·{" "}
        {tripConfig.avoids[0] ?? "AI tự gợi ý hoạt động"}
        {tripConfig.avoids.length > 1 &&
          ` · +${tripConfig.avoids.length - 1} điều tránh`}
      </div>

      <button
        className="btn btn-primary btn-full btn-lg"
        onClick={handleSubmit}
      >
        ✨ &nbsp; Lập kế hoạch
      </button>
    </div>
  );
}
