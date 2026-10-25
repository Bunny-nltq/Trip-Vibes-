"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";
import {
  MapPin,
  Calendar,
  Users,
  Trash2,
  PlusCircle,
  Save,
  LogOut,
  LogIn,
  UserPlus,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Receipt,
  RotateCw,
  Download,
} from "lucide-react";
import { getDestinationImage } from "@/ui/lib/imageMap";
import type { SavedTrip } from "@/contracts";

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

export function SavedTripsScreen() {
  const {
    user,
    savedTrips,
    isLoadingTrips,
    logoutUser,
    refreshSavedTrips,
    loadSavedTrip,
    deleteSavedTrip,
    saveCurrentTripToAccount,
    plan,
    nav,
  } = useApp();

  const [savingCurrent, setSavingCurrent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSaveCurrent = async () => {
    setSavingCurrent(true);
    setSaveSuccess(null);
    const res = await saveCurrentTripToAccount();
    setSavingCurrent(false);
    if (res.ok) {
      setSaveSuccess("Đã lưu kế hoạch chuyến đi hiện tại vào nhật ký!");
      setTimeout(() => setSaveSuccess(null), 4000);
    } else {
      alert(res.message || "Không thể lưu chuyến đi.");
    }
  };

  const handleDelete = async (tripId: string) => {
    const ok = window.confirm("Bạn có chắc chắn muốn xóa nhật ký chuyến đi này?");
    if (!ok) return;

    setDeletingId(tripId);
    await deleteSavedTrip(tripId);
    setDeletingId(null);
  };

  const handleExportJson = (trip: SavedTrip) => {
    try {
      const jsonStr = JSON.stringify(trip, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trip-vibes-${trip.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Không thể tải file sao lưu.");
    }
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <BookOpen size={22} color="var(--color-primary-main)" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
              Nhật ký các chuyến đi
            </h1>
          </div>
          <p style={{ fontSize: 14, color: "var(--color-text-sub)", margin: 0 }}>
            Lưu trữ lịch trình, hóa đơn chi tiêu thực tế và địa điểm đã ghé thăm qua các chuyến đi.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="Btn BtnPrimary"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40 }}
            onClick={() => nav("b1-chon-nhanh")}
          >
            <PlusCircle size={16} />
            <span>Tạo chuyến đi mới</span>
          </button>
        </div>
      </div>

      {/* User Status Bar */}
      {user ? (
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-lg)",
            padding: "14px 20px",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "var(--r-full)",
                background: "var(--color-primary-tint)",
                color: "var(--color-primary-main)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)" }}>
                {user.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-sub)" }}>{user.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="Btn BtnGhost BtnSmall"
              onClick={() => refreshSavedTrips()}
              disabled={isLoadingTrips}
              title="Cập nhật danh sách"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RotateCw size={14} className={isLoadingTrips ? "animate-spin" : ""} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              className="Btn BtnGhost BtnSmall"
              onClick={logoutUser}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-status-errText)" }}
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-primary-tint)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--r-lg)",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-primary-main)", marginBottom: 4 }}>
              Bạn đang trải nghiệm ở chế độ Khách (Guest)
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text)" }}>
              Đăng nhập hoặc đăng ký tài khoản để đồng bộ nhật ký các chuyến đi và lưu trữ dữ liệu an toàn.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="Btn BtnSmall"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => nav("login")}
            >
              <LogIn size={14} />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              className="Btn BtnSmall BtnPrimary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => nav("register")}
            >
              <UserPlus size={14} />
              <span>Đăng ký</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner lưu chuyến đi hiện tại nếu có */}
      {plan && plan.items && plan.items.length > 0 && (
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-lg)",
            border: "1.5px dashed var(--color-primary-main)",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--r-md)",
                background: "var(--color-primary-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary-main)",
              }}
            >
              <Save size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)" }}>
                Kế hoạch hiện tại: {typeof plan.request.diemDen === "string" ? plan.request.diemDen : plan.request.diemDen?.ten || "Điểm đến"} ({plan.request.soNgay} ngày)
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-sub)" }}>
                Dự kiến chi phí: {fmt(plan.tongKet.tongVND)} • {plan.items.length} hạng mục lịch trình
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saveSuccess ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-status-successText)", fontSize: 13, fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>{saveSuccess}</span>
              </div>
            ) : (
              <button
                type="button"
                className="Btn BtnPrimary BtnSmall"
                onClick={handleSaveCurrent}
                disabled={savingCurrent}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Save size={14} />
                <span>{savingCurrent ? "Đang lưu..." : "Lưu vào nhật ký"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trips Grid */}
      {savedTrips.length === 0 ? (
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--color-border)",
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--r-full)",
              background: "var(--color-surface-sub)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-sub)",
              marginBottom: 16,
            }}
          >
            <BookOpen size={26} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
            Chưa có nhật ký chuyến đi nào
          </h3>
          <p style={{ fontSize: 14, color: "var(--color-text-sub)", maxWidth: 460, margin: "0 auto 24px" }}>
            Mỗi khi bạn lập kế hoạch hoặc hoàn thành chuyến đi, hãy bấm lưu để lưu giữ toàn bộ lịch trình, điểm đã ghé thăm và sổ chi tiêu hóa đơn.
          </p>
          <button
            type="button"
            className="Btn BtnPrimary"
            onClick={() => nav("b1-chon-nhanh")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <PlusCircle size={16} />
            <span>Khám phá & Lập chuyến đi ngay</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {savedTrips.map((trip) => {
            const expenseCount = trip.ledger?.expenses?.length || 0;
            const tickedCount = Object.values(trip.tickedPlaces || {}).filter(Boolean).length;
            const diff = trip.tongChiPhiKeHoachVND - trip.tongChiTieuThucTeVND;
            const destImg = getDestinationImage(trip.diemDen);

            return (
              <div
                key={trip.id}
                style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--r-xl)",
                  border: "1px solid var(--color-border)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                }}
              >
                <div>
                  {/* Real Photo Banner */}
                  <div
                    style={{
                      position: "relative",
                      height: 140,
                      borderRadius: "var(--r-lg)",
                      overflow: "hidden",
                      marginBottom: 14,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-sub)",
                    }}
                  >
                    <img
                      src={destImg.urlThumb || destImg.url}
                      alt={destImg.alt || trip.title}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 8,
                        background: "rgba(0,0,0,0.65)",
                        color: "var(--color-primary-text)",
                        padding: "2px 8px",
                        borderRadius: "var(--r-full)",
                        fontSize: 10,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {destImg.nguon} • {destImg.giayPhep}
                    </div>
                  </div>

                  {/* Card Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--color-text)",
                          marginBottom: 4,
                        }}
                      >
                        {trip.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-sub)" }}>
                        <Clock size={12} />
                        <span>Lưu ngày {new Date(trip.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="Btn BtnGhost BtnSmall"
                      onClick={() => handleDelete(trip.id)}
                      disabled={deletingId === trip.id}
                      title="Xóa chuyến đi"
                      style={{ color: "var(--color-text-sub)", padding: 6 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Badges */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--r-full)",
                        background: "var(--color-primary-tint)",
                        color: "var(--color-primary-main)",
                        fontSize: 12,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MapPin size={12} />
                      <span>{trip.diemDi} → {trip.diemDen}</span>
                    </span>

                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--r-full)",
                        background: "var(--color-surface-sub)",
                        color: "var(--color-text)",
                        fontSize: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Calendar size={12} />
                      <span>{trip.soNgay} ngày</span>
                    </span>

                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--r-full)",
                        background: "var(--color-surface-sub)",
                        color: "var(--color-text)",
                        fontSize: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Users size={12} />
                      <span>{trip.soNguoi} người</span>
                    </span>
                  </div>

                  {/* Financial Stats */}
                  <div
                    style={{
                      background: "var(--color-surface-sub)",
                      borderRadius: "var(--r-lg)",
                      padding: "12px 14px",
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "var(--color-text-sub)" }}>Kế hoạch:</span>
                      <strong style={{ color: "var(--color-text)" }}>{fmt(trip.tongChiPhiKeHoachVND)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "var(--color-text-sub)" }}>Thực tế đã chi ({expenseCount} khoản):</span>
                      <strong style={{ color: "var(--color-primary-main)" }}>{fmt(trip.tongChiTieuThucTeVND)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, borderTop: "1px solid var(--color-border)", paddingTop: 6 }}>
                      <span style={{ color: "var(--color-text-sub)" }}>Chênh lệch:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: diff >= 0 ? "var(--color-status-successText)" : "var(--color-status-errText)",
                        }}
                      >
                        {diff >= 0 ? `Dư ${fmt(diff)}` : `Vượt ${fmt(Math.abs(diff))}`}
                      </span>
                    </div>
                  </div>

                  {/* Visited Places Count */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-sub)", marginBottom: 16 }}>
                    <CheckCircle2 size={14} color="var(--color-status-successText)" />
                    <span>Đã ghé thăm {tickedCount} địa điểm trong chuyến đi</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
                  <button
                    type="button"
                    className="Btn BtnPrimary BtnSmall"
                    style={{ flex: 1, minWidth: 110, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    onClick={() => loadSavedTrip(trip, "b8-chuyen-di")}
                  >
                    <ArrowRight size={14} />
                    <span>Mở chuyến đi</span>
                  </button>
                  <button
                    type="button"
                    className="Btn BtnSmall"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    title="Chỉnh sửa hoặc xem lại lịch trình"
                    onClick={() => loadSavedTrip(trip, "b3-ke-hoach")}
                  >
                    <Calendar size={14} />
                    <span>Lịch trình</span>
                  </button>
                  <button
                    type="button"
                    className="Btn BtnSmall"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    title="Xem sổ chi tiêu & hóa đơn"
                    onClick={() => loadSavedTrip(trip, "b11-ngan-sach")}
                  >
                    <Receipt size={14} />
                    <span>Sổ chi tiêu</span>
                  </button>
                  <button
                    type="button"
                    className="Btn BtnGhost BtnSmall"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "4px 8px" }}
                    title="Tải file JSON sao lưu"
                    onClick={() => handleExportJson(trip)}
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SavedTripsScreen;
