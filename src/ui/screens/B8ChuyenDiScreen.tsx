"use client";
import React, { useState, useMemo } from "react";
import { useApp } from "@/ui/context/AppContext";
import {
  gomDiaDiemTheoNgay,
  tinhTienDo,
  type ProgressPlace,
} from "@/core/tripProgress";
import { soSanhKeHoachThucTe } from "@/core/soSanhThucTe";
import { B9ChiDuongPopover } from "@/ui/components/B9ChiDuongPopover";
import { NhatKyTabBar } from "@/ui/components/NhatKyTabBar";
import { BookOpen } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

export function B8ChuyenDiScreen() {
  const {
    nav,
    confirmed,
    plan,
    tripConfig,
    ledger,
    activeDay,
    setActiveDay,
    tickedPlaces,
    toggleTickPlace,
    untickPlace,
    openB10,
    isSampleDataActive,
  } = useApp();

  // Toast khi tick địa điểm
  const [toast, setToast] = useState<{ id: string; ten: string } | null>(null);

  // Popover B9
  const [popoverPlace, setPopoverPlace] = useState<ProgressPlace | null>(null);

  // Gom địa điểm thực tế từ plan
  const placesByDay = useMemo(() => {
    if (!plan) return {};
    return gomDiaDiemTheoNgay(plan);
  }, [plan]);

  const soNgay = plan?.request.soNgay || 3;
  const dayNumbers = useMemo(() => {
    return Array.from({ length: soNgay }, (_, i) => i + 1);
  }, [soNgay]);

  const currentDayPlaces = placesByDay[activeDay] || [];

  // Tiến độ tổng = tổng số địa điểm của mọi ngày
  const progress = useMemo(() => {
    return tinhTienDo(placesByDay, tickedPlaces);
  }, [placesByDay, tickedPlaces]);

  // Ngân sách tính chuẩn theo soSanhKeHoachThucTe (ngân sách - đặt trước - chi tiêu thực tế)
  const budgetData = useMemo(() => {
    if (!plan) {
      const tongNganSach = tripConfig.budget || 10_000_000;
      const daChi = ledger.expenses.reduce((s, e) => s + e.soTienVND, 0);
      return {
        tongNganSach,
        datTruoc: 0,
        daChi,
        conLai: Math.max(0, tongNganSach - daChi),
        percentSpent: tongNganSach > 0 ? Math.min(100, Math.round((daChi / tongNganSach) * 100)) : 0,
      };
    }

    const comp = soSanhKeHoachThucTe(plan, ledger, activeDay);
    const tongNganSach = comp.datTruocVND + comp.conLaiVND + comp.thucTeTongVND;
    const datTruoc = comp.datTruocVND;
    const daChi = comp.thucTeTongVND;
    const conLai = comp.conLaiVND;
    const tongDaDung = datTruoc + daChi;
    const percentSpent =
      tongNganSach > 0 ? Math.min(100, Math.round((tongDaDung / tongNganSach) * 100)) : 0;

    return {
      tongNganSach,
      datTruoc,
      daChi,
      conLai,
      percentSpent,
    };
  }, [plan, ledger, activeDay, tripConfig.budget]);

  // Nếu chưa xác nhận kế hoạch: màn trống "Chưa có chuyến nào" kèm nút "Lập kế hoạch"
  if (!confirmed) {
    return (
      <div className="Row2" style={{ padding: "0 0 40px" }}>
        <div className="MainWide">
          <div
            className="DayCard"
            style={{
              padding: "56px 32px",
              textAlign: "center",
              maxWidth: 560,
              margin: "60px auto",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--r-full)",
                background: "var(--color-surface-sub)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "var(--color-primary-main)",
              }}
            >
              <BookOpen size={28} />
            </div>
            <h1 className="H1" style={{ fontSize: 24, marginBottom: 8, color: "var(--color-text)" }}>
              Chưa có chuyến nào
            </h1>
            <div className="Sub" style={{ marginBottom: 24, color: "var(--color-text-sub)", lineHeight: 1.6 }}>
              Bạn chưa có chuyến đi nào được xác nhận. Hãy bắt đầu lập kế hoạch ngay để theo dõi hành trình và chi tiêu.
            </div>
            <button
              type="button"
              className="Btn BtnPrimary"
              style={{ margin: "0 auto" }}
              onClick={() => nav("b1-chon-nhanh")}
            >
              Lập kế hoạch
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nếu kế hoạch rỗng hoặc chưa có dữ liệu
  if (!plan || plan.items.length === 0) {
    return (
      <div className="Row2" style={{ padding: "0 0 40px" }}>
        <div className="MainWide">
          <div
            className="DayCard"
            style={{
              padding: "48px 32px",
              textAlign: "center",
              maxWidth: 560,
              margin: "60px auto",
            }}
          >
            <h1 className="H1" style={{ fontSize: 22, marginBottom: 8 }}>
              Chưa có dữ liệu kế hoạch
            </h1>
            <div className="Sub" style={{ marginBottom: 24 }}>
              Kế hoạch chuyến đi của bạn hiện đang rỗng. Hãy quay lại tạo kế hoạch.
            </div>
            <button
              type="button"
              className="Btn BtnPrimary"
              style={{ margin: "0 auto" }}
              onClick={() => nav("b1-chon-nhanh")}
            >
              Lập kế hoạch
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleToggle = (place: ProgressPlace) => {
    const isNowTicked = toggleTickPlace(place.id);
    if (isNowTicked) {
      setToast({ id: place.id, ten: place.ten });
    } else {
      if (toast?.id === place.id) {
        setToast(null);
      }
    }
  };

  const handleUndoToast = () => {
    if (toast) {
      untickPlace(toast.id);
      setToast(null);
    }
  };

  const currentDayDone = currentDayPlaces.filter((p) => tickedPlaces[p.id]).length;

  return (
    <div className="Row2" style={{ padding: "0 0 40px" }}>
      {/* CỘT CHÍNH (780px) */}
      <div className="Main">
        {/* Ba tab Nhật ký chuyến đi: Hành trình, Chi tiêu, Ngân sách */}
        <NhatKyTabBar activeTab="hanh-trinh" />

        <h1 className="H1">Chuyến đi</h1>
        <div className="Sub">
          {progress.tong > 0
            ? `${progress.daDen} trong ${progress.tong} địa điểm đã đến`
            : "Chưa có địa điểm tham quan trong kế hoạch"}
        </div>

        {isSampleDataActive && (
          <div
            style={{
              background: "var(--color-warning-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-warning-text)",
              padding: "10px 16px",
              borderRadius: 14,
              fontSize: 13,
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            Lưu ý: Kế hoạch đang sử dụng dữ liệu mẫu để thử nghiệm.
          </div>
        )}

        {/* TABS NGÀY - có cùng kiểu ở mọi trạng thái */}
        <div className="Tabs">
          {dayNumbers.map((d) => (
            <button
              type="button"
              key={d}
              className={`Tab ${activeDay === d ? "TabOn" : ""}`}
              onClick={() => setActiveDay(d)}
            >
              Ngày {d}
            </button>
          ))}
        </div>

        {/* CARD LỊCH TRÌNH NGÀY HIỆN TẠI */}
        <div className="DayCard">
          <div className="DayHead">
            <div className="DayName">Ngày {activeDay}</div>
            <div className="DayTotal">
              {currentDayDone}/{currentDayPlaces.length} địa điểm đã đến
            </div>
          </div>

          {currentDayPlaces.length === 0 && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--color-text-sub)" }}>
              Chưa có lịch trình hoạt động nào cho Ngày {activeDay}.
            </div>
          )}

          {currentDayPlaces.map((place, idx) => {
            const isDone = Boolean(tickedPlaces[place.id]);
            const isLast = idx === currentDayPlaces.length - 1;
            const hasRealAddress =
              Boolean(place.diaChi) &&
              place.diaChi!.trim().toLowerCase() !== place.ten.trim().toLowerCase();

            return (
              <div key={place.id} className={`Item ${isLast ? "NoLine" : ""}`}>
                {/* Checkbox Box */}
                <div
                  className={`Box ${isDone ? "BoxOn" : ""}`}
                  onClick={() => handleToggle(place)}
                  title={isDone ? "Bỏ tick đã đến" : "Đánh dấu đã đến"}
                >
                  {isDone ? "✓" : ""}
                </div>

                {/* Giờ */}
                <div className="Time">{place.gio || "—"}</div>

                {/* Thông tin: nếu thiếu địa chỉ thì chỉ hiện tên, không lặp tên làm địa chỉ */}
                <div className="Info">
                  <div className="InfoTitle">{place.ten}</div>
                  {hasRealAddress && (
                    <div className="InfoSub">{place.diaChi}</div>
                  )}
                </div>

                {/* Chi phí & thời gian tới điểm kế */}
                <div className="Amount">
                  {fmt(place.thanhTien || 0)}
                  <span className="AmountSub">
                    {place.thoiGianDiChuyenPhut
                      ? `${place.thoiGianDiChuyenPhut} phút tới điểm kế`
                      : "Điểm trong ngày"}
                  </span>
                </div>

                {/* Nút chỉ đường */}
                <div className="Action" style={{ width: 104 }}>
                  <button
                    type="button"
                    className="Btn BtnSmall"
                    onClick={() => setPopoverPlace(place)}
                  >
                    Chỉ đường
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="Hint">
          Tick khi bạn đã đến một địa điểm. Bạn có thể bỏ tick nếu bấm nhầm.
        </div>
      </div>

      {/* CỘT PHẢI: TỔNG QUAN NGÂN SÁCH (324px) */}
      <div className="Side">
        <div className="BudgetSummary">
          <div className="Label">Ngân sách còn lại</div>
          <div className="Big">{fmt(budgetData.conLai)}</div>
          <div className="BigSub">
            Đã đặt trước {fmt(budgetData.datTruoc)} · Đã chi thực tế {fmt(budgetData.daChi)}
          </div>

          {/* Thanh ngân sách */}
          <div className="BarTrack">
            <div
              className={`BarFill ${budgetData.percentSpent > 90 ? "BarRed" : ""}`}
              style={{ width: `${budgetData.percentSpent}%` }}
            />
          </div>

          <div className="Divider" style={{ marginTop: 16 }} />

          <div
            className="Link"
            onClick={() => nav("b11-ngan-sach")}
            style={{ cursor: "pointer" }}
          >
            Xem chi tiết ngân sách
          </div>
        </div>

        {/* Nút thêm nhanh chi tiêu */}
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="Btn BtnPrimary BtnFull"
            onClick={() => openB10({ ngayTrongChuyen: activeDay })}
          >
            + Thêm chi tiêu
          </button>
        </div>
      </div>

      {/* Popover B9 Chỉ đường */}
      {popoverPlace && (
        <B9ChiDuongPopover
          place={popoverPlace}
          onClose={() => setPopoverPlace(null)}
        />
      )}

      {/* Toast khi tick */}
      {toast && (
        <div className="Toast">
          <span>
            ✓ Đã đến: <strong>{toast.ten}</strong>
          </span>
          <button
            type="button"
            className="ToastBtn"
            onClick={() => {
              openB10({ tenCuaHang: toast.ten, ngayTrongChuyen: activeDay });
              setToast(null);
            }}
            style={{ background: "var(--color-primary)", borderColor: "var(--color-primary)" }}
          >
            Ghi chi tiêu
          </button>
          <button type="button" className="ToastBtn" onClick={handleUndoToast}>
            Hoàn tác
          </button>
        </div>
      )}
    </div>
  );
}

export default B8ChuyenDiScreen;
