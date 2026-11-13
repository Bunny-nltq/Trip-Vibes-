"use client";
import { useState, type FormEvent } from "react";
import { expenseDateForTripDay } from "@/core/travelRequest";
import { mapPlanCategoryToExpenseCategory } from "@/core/bill/matchExpenseToPlan";
import type { ExpenseCategory } from "@/contracts";
import { useApp } from "@/ui/context/AppContext";
import { useExpenseConfirm } from "@/ui/hooks/useExpenseConfirm";

const HANG_MUC_OPTIONS: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "an_uong", label: "Ăn uống" },
  { value: "vui_choi", label: "Vui chơi" },
  { value: "di_chuyen", label: "Di chuyển" },
  { value: "cho_o", label: "Chỗ ở" },
  { value: "khac", label: "Khác" },
];

export function B10ChonNguonScreen() {
  const { nav, addExpenseToLedger, b10Prefill, setB10Prefill, activeDay, plan } = useApp();
  const { confirm: runConfirmExpense } = useExpenseConfirm();
  const initialDay = b10Prefill?.ngayTrongChuyen ?? activeDay;
  const departureDate = plan?.request.travelDates?.departureDate;
  const [tenCuaHang, setTenCuaHang] = useState(b10Prefill?.tenCuaHang ?? "");
  const [ngay, setNgay] = useState(() => expenseDateForTripDay(departureDate, initialDay, new Date()));
  const [ngayTrongChuyen, setNgayTrongChuyen] = useState(initialDay);
  const [hangMuc, setHangMuc] = useState<ExpenseCategory>(b10Prefill?.hangMuc ?? "an_uong");
  const [soTienVND, setSoTienVND] = useState(b10Prefill?.soTienVND?.toString() ?? "");
  const [ghiChu, setGhiChu] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleConfirmAndSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!Number.isInteger(ngayTrongChuyen) || ngayTrongChuyen < 1 || ngayTrongChuyen > (plan?.request.soNgay || 1)) { setSubmitError("Ngày chi tiêu phải nằm trong chuyến đi."); return; }
    const amount = /^\d+$/.test(soTienVND.trim()) ? Number(soTienVND.trim()) : NaN;
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setSubmitError("Vui lòng nhập số tiền hợp lệ lớn hơn 0.");
      return;
    }

    if (!tenCuaHang.trim()) {
      setSubmitError("Vui lòng nhập tên cửa hàng hoặc nội dung chi tiêu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const confirmRes = await runConfirmExpense({
        nguon: "nhap_tay",
        tenCuaHang: tenCuaHang.trim() || null,
        ngay: ngay || null,
        ngayTrongChuyen,
        hangMuc,
        soTienVND: amount,
        giaTriAIDoc: null,
        ghiChu: ghiChu.trim() || null,
      });

      if (!confirmRes.ok || !confirmRes.expense) {
        setSubmitError(confirmRes.error || "Chưa ghi được khoản chi. Hãy kiểm tra thông tin và thử lại.");
        setIsSubmitting(false); return;
      }
      addExpenseToLedger(confirmRes.expense);

      setIsSubmitting(false);
      setB10Prefill(null);
      nav("b11-ngan-sach");
    } catch {
      setSubmitError("Lỗi kết nối khi lưu khoản chi.");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setB10Prefill(null);
    nav("b8-chuyen-di");
  };

  const subTitleText = `Chi tiêu ngày ${Number.isNaN(ngayTrongChuyen) ? "chưa chọn" : ngayTrongChuyen}${tenCuaHang ? ` · ${tenCuaHang}` : ""}`;
  const expenseSuggestions = (plan?.items ?? [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.ngay === ngayTrongChuyen &&
      item.experienceType !== "local_transfer" && item.state !== "skipped" &&
      (item.hangMuc !== "Chỗ ở" || item.thanhTien > 0))
    .slice(0, 8);

  return (
    <section className="TripExpenseForm" aria-label="Ghi chi tiêu">
      <form noValidate className="Modal" onSubmit={handleConfirmAndSave} style={{ position: "relative", width: 740, maxWidth: "95vw" }}>
        <h1 className="ModalTitle">Thêm chi tiêu</h1>
        <div className="Sub">{subTitleText}</div>
        {/* Gợi ý chọn nhanh từ lịch trình (nếu có) */}
        {expenseSuggestions.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-sub)", marginBottom: 6 }}>
              Chọn nhanh từ hoạt động trong lịch trình:
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {expenseSuggestions.map(({ item, index }) => (
                <button
                  key={`${item.id ?? item.refId ?? "activity"}-${index}`}
                  type="button"
                  onClick={() => {
                    setTenCuaHang(item.noiDung);
                    setNgayTrongChuyen(item.ngay);
                    setHangMuc(mapPlanCategoryToExpenseCategory(item.hangMuc));
                    setNgay(
                      expenseDateForTripDay(
                        plan?.request.travelDates?.departureDate,
                        item.ngay,
                        new Date()
                      )
                    );
                    if (item.thanhTien > 0 && !soTienVND) {
                      setSoTienVND(String(item.thanhTien));
                    }
                  }}
                  style={{
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: "var(--r-sm)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-primary)",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  {item.gio && `${item.gio} · `}{item.destinationName || item.noiDung}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="Field">
          <div className="FieldLabel">Tên cửa hàng hoặc nội dung</div>
          <input
            type="text"
            className="Input"
            aria-label="Tên cửa hàng hoặc nội dung" value={tenCuaHang}
            onChange={(e) => setTenCuaHang(e.target.value)}
            placeholder="Ví dụ: Cà phê view biển"
          />
        </div>

        <div className="Field">
          <div className="FieldLabel">Ngày</div>
          <input
            type="date"
            className="Input"
            aria-label="Ngày chi tiêu" value={ngay}
            onChange={(e) => setNgay(e.target.value)}
          />
        </div>

        <div className="Field"><label htmlFor="expense-trip-day">Ngày trong chuyến</label><input id="expense-trip-day" className="Input" type="number" min={1} max={plan?.request.soNgay || 1} value={Number.isNaN(ngayTrongChuyen) ? "" : ngayTrongChuyen} onChange={event => {
          const day = event.target.valueAsNumber;
          setNgayTrongChuyen(day);
          if (Number.isInteger(day) && day >= 1 && day <= (plan?.request.soNgay || 1)) {
            setNgay(expenseDateForTripDay(departureDate, day, new Date()));
          }
        }} /></div>
        <div className="Field">
          <div className="FieldLabel">Hạng mục</div>
          <div className="Chips" style={{ margin: 0 }}>
            {HANG_MUC_OPTIONS.map((opt) => (
              <button
                type="button"
                aria-pressed={hangMuc === opt.value}
                key={opt.value}
                className={`Chip ${hangMuc === opt.value ? "ChipOn" : ""}`}
                onClick={() => setHangMuc(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="Field">
          <div className="FieldLabel">Số tiền</div>
          <input
            type="text"
            className="Input InputBig"
            inputMode="numeric" aria-label="Số tiền" value={soTienVND}
            onChange={(e) => setSoTienVND(e.target.value)}
            placeholder="0 đ"
          />
        </div>

        <div className="Field">
          <div className="FieldLabel">Ghi chú (tuỳ chọn)</div>
          <input
            type="text"
            className="Input"
            aria-label="Ghi chú" value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder="Ghi chú thêm về khoản chi..."
          />
        </div>

        {submitError && (
          <div role="alert" className="Banner BannerErr" style={{ marginTop: 12 }}>
            <div className="BannerMark">!</div>
            <div className="BannerText">{submitError}</div>
          </div>
        )}

        <div className="Row" style={{ justifyContent: "flex-end", marginTop: 18, gap: 12 }}>
          <button
            type="button"
            className="Btn"
            style={{ width: 120 }}
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="Btn BtnPrimary"
            style={{ width: 180 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang ghi..." : "Ghi chi tiêu"}
          </button>
        </div>
      </form>
    </section>
  );
}
