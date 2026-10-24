"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { soSanhKeHoachThucTe } from "@/core/soSanhThucTe";
import { gomDiaDiemTheoNgay } from "@/core/tripProgress";
import type { Expense, ExpenseCategory } from "@/contracts";
import { NhatKyTabBar } from "@/ui/components/NhatKyTabBar";
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Receipt,
  Calendar,
  Lock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  BookOpen,
  Sparkles,
} from "lucide-react";

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

const HANG_MUC_LABEL_MAP: Record<ExpenseCategory, string> = {
  an_uong: "Ăn uống",
  vui_choi: "Vui chơi",
  di_chuyen: "Di chuyển",
  cho_o: "Chỗ ở",
  khac: "Khác",
};

export function B11NganSachScreen() {
  const {
    nav,
    confirmed,
    plan,
    ledger,
    addExpenseToLedger,
    deleteExpenseFromLedger,
    updateExpenseInLedger,
    openB10,
    tickedPlaces,
  } = useApp();

  const soNgay = plan?.request.soNgay || 3;

  // Gom địa điểm để tìm ngày lớn nhất có địa điểm đã tick
  const placesByDay = useMemo(() => {
    if (!plan) return {};
    return gomDiaDiemTheoNgay(plan);
  }, [plan]);

  // Hỗ trợ mock state cho chụp ảnh màn hình / demo (chỉ trong môi trường development)
  const effectiveLedger = useMemo(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return ledger;
    const params = new URLSearchParams(window.location.search);
    const mockState = params.get("state");
    if (mockState === "binh_thuong" || mockState === "lech_ngan_sach") {
      const s1: Expense[] = [
        { id: "e1", nguon: "anh_bill", tenCuaHang: "Cơm gà Bà Buội", ngay: "2026-06-01", ngayTrongChuyen: 1, hangMuc: "an_uong", soTienVND: 560000, giaTriAIDoc: 560000, daSuaTay: false, ghiChu: null },
        { id: "e2", nguon: "anh_bill", tenCuaHang: "Trà sữa Góc Phố", ngay: "2026-06-01", ngayTrongChuyen: 1, hangMuc: "an_uong", soTienVND: 108000, giaTriAIDoc: 108000, daSuaTay: false, ghiChu: null },
        { id: "e3", nguon: "anh_bill", tenCuaHang: "Vé thắng cảnh Sơn Thủy", ngay: "2026-06-02", ngayTrongChuyen: 2, hangMuc: "vui_choi", soTienVND: 80000, giaTriAIDoc: 80000, daSuaTay: false, ghiChu: null },
        { id: "e4", nguon: "nhap_tay", tenCuaHang: "Vé phố cổ Hội An", ngay: "2026-06-02", ngayTrongChuyen: 2, hangMuc: "vui_choi", soTienVND: 240000, giaTriAIDoc: null, daSuaTay: false, ghiChu: null },
        { id: "e5", nguon: "anh_bill", tenCuaHang: "Quán Ăn Phố Cổ", ngay: "2026-06-02", ngayTrongChuyen: 2, hangMuc: "an_uong", soTienVND: 308000, giaTriAIDoc: 300000, daSuaTay: true, ghiChu: null },
      ];
      if (mockState === "lech_ngan_sach") {
        s1.push({
          id: "e6",
          nguon: "nhap_tay",
          tenCuaHang: "Show Ký Ức Hội An (vé VIP)",
          ngay: "2026-06-02",
          ngayTrongChuyen: 2,
          hangMuc: "vui_choi",
          soTienVND: 900000,
          giaTriAIDoc: null,
          daSuaTay: false,
          ghiChu: null,
        });
      }
      return { schemaVersion: 6, expenses: s1 };
    }
    return ledger;
  }, [ledger]);

  // Mặc định ngày lớn nhất có khoản chi hoặc có địa điểm đã tick
  const initialDenHetNgay = useMemo(() => {
    const maxExpDay = effectiveLedger.expenses.reduce(
      (m, e) => (e.ngayTrongChuyen ? Math.max(m, e.ngayTrongChuyen) : m),
      0
    );
    const maxTickedDay = Object.entries(placesByDay).reduce(
      (m, [day, places]) =>
        places.some((p) => tickedPlaces[p.id]) ? Math.max(m, Number(day)) : m,
      0
    );
    const computed = Math.max(maxExpDay, maxTickedDay);
    return computed >= 1 ? Math.min(computed, soNgay) : 1;
  }, [effectiveLedger.expenses, placesByDay, tickedPlaces, soNgay]);

  const [denHetNgay, setDenHetNgay] = useState<number>(initialDenHetNgay);

  // Sync state if mock changes initialDenHetNgay
  useEffect(() => {
    setDenHetNgay(initialDenHetNgay);
  }, [initialDenHetNgay]);

  // Modal Xóa
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Modal Sửa
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editStore, setEditStore] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editCategory, setEditCategory] = useState<ExpenseCategory>("an_uong");
  const [editDay, setEditDay] = useState<number>(1);

  // Tính toán ngân sách thực tế từ hàm thuần core
  const comparison = useMemo(() => {
    if (!plan) return null;
    return soSanhKeHoachThucTe(plan, effectiveLedger, denHetNgay);
  }, [plan, effectiveLedger, denHetNgay]);

  const handleStartEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setEditStore(exp.tenCuaHang || "");
    setEditAmount(String(exp.soTienVND));
    setEditCategory(exp.hangMuc);
    setEditDay(exp.ngayTrongChuyen || 1);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const amountNum = parseInt(editAmount.replace(/\D/g, ""), 10);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const daSuaTay =
      editingExpense.nguon === "anh_bill" &&
      editingExpense.giaTriAIDoc !== null &&
      editingExpense.giaTriAIDoc !== amountNum;

    const updated: Expense = {
      ...editingExpense,
      tenCuaHang: editStore.trim() || null,
      soTienVND: amountNum,
      hangMuc: editCategory,
      ngayTrongChuyen: editDay,
      daSuaTay,
    };

    updateExpenseInLedger(updated);
    setEditingExpense(null);
  };

  const handleConfirmDelete = () => {
    if (deletingExpense) {
      deleteExpenseFromLedger(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  const handleNapChiTieuMau = () => {
    const today = new Date().toISOString().slice(0, 10);
    const sampleExpenses: Expense[] = [
      {
        id: `exp_mau_${Date.now()}_1`,
        nguon: "anh_bill",
        tenCuaHang: "Cơm gà & Ẩm thực truyền thống",
        ngay: today,
        ngayTrongChuyen: 1,
        hangMuc: "an_uong",
        soTienVND: 420_000,
        giaTriAIDoc: 420_000,
        daSuaTay: false,
        ghiChu: "Bữa trưa ngày 1 bóc tách từ hóa đơn",
      },
      {
        id: `exp_mau_${Date.now()}_2`,
        nguon: "nhap_tay",
        tenCuaHang: "Vé tham quan danh lam thắng cảnh",
        ngay: today,
        ngayTrongChuyen: 1,
        hangMuc: "vui_choi",
        soTienVND: 160_000,
        giaTriAIDoc: null,
        daSuaTay: false,
        ghiChu: "2 vé vào cổng",
      },
      {
        id: `exp_mau_${Date.now()}_3`,
        nguon: "anh_bill",
        tenCuaHang: "Cà phê & Trà ngắm phố",
        ngay: today,
        ngayTrongChuyen: 2,
        hangMuc: "an_uong",
        soTienVND: 95_000,
        giaTriAIDoc: 95_000,
        daSuaTay: false,
        ghiChu: null,
      },
      {
        id: `exp_mau_${Date.now()}_4`,
        nguon: "anh_bill",
        tenCuaHang: "Hải sản / Bữa tối",
        ngay: today,
        ngayTrongChuyen: 2,
        hangMuc: "an_uong",
        soTienVND: 650_000,
        giaTriAIDoc: 600_000,
        daSuaTay: true,
        ghiChu: "Đã sửa số tiền sau khi đối chiếu hóa đơn",
      },
    ];
    for (const exp of sampleExpenses) {
      addExpenseToLedger(exp);
    }
  };

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

  if (!comparison || !plan) {
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
              Lên kế hoạch ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nganSachTongVND = comparison.datTruocVND + comparison.conLaiVND + comparison.thucTeTongVND;

  return (
    <div className="MainWide" style={{ width: "100%", padding: "0 0 40px" }}>
      {/* Ba tab Nhật ký chuyến đi: Hành trình, Chi tiêu, Ngân sách */}
      <NhatKyTabBar activeTab="ngan-sach" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="H1">Ngân sách thực tế</h1>
          <div className="Sub">Kế hoạch so với chi tiêu bạn đã ghi nhận trong chuyến đi.</div>
        </div>
        <button type="button" className="Btn BtnPrimary" onClick={() => openB10()}>
          <Plus size={16} />
          Thêm chi tiêu
        </button>
      </div>

        {/* 4 Large stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 22 }}>
          <div className="stat">
            <div className="stat-label">Ngân sách</div>
            <div className="stat-num" style={{ color: "var(--navy)" }}>{fmt(nganSachTongVND)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Đã đặt trước</div>
            <div className="stat-num" style={{ color: "var(--p500)" }}>{fmt(comparison.datTruocVND)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Đã chi thực tế</div>
            <div className="stat-num" style={{ color: "var(--warning)" }}>{fmt(comparison.thucTeTongVND)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Còn lại</div>
            <div
              className="stat-num"
              style={{ color: comparison.conLaiVND >= 0 ? "var(--success)" : "var(--error)" }}
            >
              {fmt(comparison.conLaiVND)}
            </div>
          </div>
        </div>

        {/* Forecast Card */}
        {comparison.duBao.trangThai === "du" ? (
          <div
            className="card"
            style={{
              padding: "16px 20px",
              marginBottom: 24,
              background: "var(--color-success-bg)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <CheckCircle size={22} style={{ color: "var(--color-success-text)", flexShrink: 0 }} />
            <div style={{ fontSize: 14, color: "var(--navy)" }}>
              <span style={{ fontWeight: 700 }}>Ngày còn lại:</span> Kế hoạch chi{" "}
              {fmt(comparison.duBao.keHoachNgayConLaiVND)}, ngân sách hiện còn{" "}
              {fmt(comparison.duBao.conLaiSauChiTieuVND)}. &nbsp;
              <span style={{ color: "var(--color-success-text)", fontWeight: 700 }}>
                Ngân sách đủ, dự kiến dư {fmt(comparison.duBao.chenhDuBaoVND)}.
              </span>
            </div>
          </div>
        ) : (
          <div
            className="card banner-warn"
            style={{
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <AlertTriangle size={22} style={{ color: "var(--color-warning-text)", flexShrink: 0 }} />
            <div style={{ fontSize: 14, color: "var(--navy)" }}>
              <span style={{ fontWeight: 700 }}>Ngày còn lại:</span> Kế hoạch chi{" "}
              {fmt(comparison.duBao.keHoachNgayConLaiVND)}, còn lại{" "}
              {fmt(comparison.duBao.conLaiSauChiTieuVND)}. &nbsp;
              <span style={{ color: "var(--color-warning-text)", fontWeight: 700 }}>
                Có thể vượt khoảng {fmt(Math.abs(comparison.duBao.chenhDuBaoVND))}.
              </span>
            </div>
          </div>
        )}

        {/* Day selector & Compare table */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="section-title" style={{ margin: 0 }}>Bảng đối chiếu hạng mục</div>

          {/* Bộ chọn "Đến hết ngày" */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--g500)", fontWeight: 600 }}>Đến hết ngày:</span>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: soNgay }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`chip ${denHetNgay === d ? "on" : ""}`}
                  style={{ padding: "4px 12px", fontSize: 13, height: 32 }}
                  onClick={() => setDenHetNgay(d)}
                >
                  Ngày {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 28, overflow: "hidden" }}>
          <table className="tv-table">
            <thead>
              <tr>
                <th>Hạng mục (đến hết ngày {comparison.denHetNgayHieuLuc})</th>
                <th className="text-right">Kế hoạch</th>
                <th className="text-right">Thực tế</th>
                <th className="text-right">Chênh lệch</th>
                <th className="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {comparison.bang.map((r) => {
                const diff = r.chenhVND;
                const isOver = diff > 0;
                return (
                  <tr key={r.hangMuc}>
                    <td style={{ fontWeight: 500 }}>{r.hangMuc}</td>
                    <td className="text-right">{fmt(r.keHoachVND)}</td>
                    <td className="text-right">{fmt(r.thucTeVND)}</td>
                    <td
                      className="text-right"
                      style={{
                        color: diff === 0 ? "var(--g500)" : isOver ? "var(--error)" : "var(--success)",
                        fontWeight: 600,
                      }}
                    >
                      {diff > 0 ? "+" : ""}{fmt(diff)}
                    </td>
                    <td
                      className="text-right"
                      style={{
                        color: r.chenhPhanTram === 0 ? "var(--g500)" : isOver ? "var(--error)" : "var(--success)",
                        fontWeight: 600,
                      }}
                    >
                      {r.chenhPhanTram > 0 ? "+" : ""}
                      {r.chenhPhanTram.toLocaleString("vi-VN")}%
                    </td>
                  </tr>
                );
              })}

              {/* Hàng tổng cộng */}
              <tr style={{ fontWeight: 700, background: "var(--g50)" }}>
                <td>Cộng</td>
                <td className="text-right">{fmt(comparison.tong.keHoachVND)}</td>
                <td className="text-right">{fmt(comparison.tong.thucTeVND)}</td>
                <td
                  className="text-right"
                  style={{
                    color:
                      comparison.tong.chenhVND === 0
                        ? "var(--g500)"
                        : comparison.tong.chenhVND > 0
                        ? "var(--error)"
                        : "var(--success)",
                  }}
                >
                  {comparison.tong.chenhVND > 0 ? "+" : ""}
                  {fmt(comparison.tong.chenhVND)}
                </td>
                <td
                  className="text-right"
                  style={{
                    color:
                      comparison.tong.chenhPhanTram === 0
                        ? "var(--g500)"
                        : comparison.tong.chenhPhanTram > 0
                        ? "var(--error)"
                        : "var(--success)",
                  }}
                >
                  {comparison.tong.chenhPhanTram > 0 ? "+" : ""}
                  {comparison.tong.chenhPhanTram.toLocaleString("vi-VN")}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Danh sách khoản chi */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>Các khoản chi ({effectiveLedger.expenses.length})</div>
        </div>

        {effectiveLedger.expenses.length === 0 ? (
          /* Trạng thái rỗng thân thiện */
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "var(--g400)" }}>
              <Receipt size={48} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>
              Chưa có khoản chi tiêu nào
            </div>
            <p className="page-sub" style={{ maxWidth: 440, margin: "8px auto 20px" }}>
              Chụp ảnh bill hoặc nhập tay các khoản chi trong chuyến đi để theo dõi và đối chiếu chi phí thực tế.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => openB10()}>
                <Plus size={16} />
                Thêm chi tiêu đầu tiên
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleNapChiTieuMau}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Sparkles size={16} />
                Nạp chi tiêu mẫu để xem đối chiếu
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tv-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Cửa hàng / Nội dung</th>
                  <th>Hạng mục</th>
                  <th className="text-right">Số tiền</th>
                  <th>Nguồn</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {effectiveLedger.expenses.map((e) => (
                  <tr key={e.id}>
                    <td style={{ color: "var(--g500)", whiteSpace: "nowrap" }}>
                      {e.ngayTrongChuyen ? `Ngày ${e.ngayTrongChuyen}` : "Chưa gắn"}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {e.tenCuaHang || "Không tên"}
                      {e.ghiChu && (
                        <div style={{ fontSize: 12, fontWeight: 400, color: "var(--g400)" }}>
                          {e.ghiChu}
                        </div>
                      )}
                    </td>
                    <td>{HANG_MUC_LABEL_MAP[e.hangMuc] || e.hangMuc}</td>
                    <td className="text-right" style={{ fontWeight: 700, color: "var(--navy)" }}>
                      {fmt(e.soTienVND)}
                    </td>
                    <td>
                      <span className={`pill ${e.nguon === "anh_bill" ? "bill" : "manual"}`}>
                        {e.nguon === "anh_bill" ? "Ảnh bill" : "Nhập tay"}
                      </span>
                      {e.daSuaTay && (
                        <span
                          className="pill"
                          style={{
                            marginLeft: 6,
                            background: "var(--color-warning-bg)",
                            color: "var(--color-warning-text)",
                            borderColor: "var(--color-border)",
                            fontWeight: 600,
                          }}
                        >
                          Đã sửa số
                        </span>
                      )}
                    </td>
                    <td className="text-right" style={{ whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleStartEdit(e)}
                        style={{ marginRight: 4 }}
                      >
                        <Edit2 size={13} style={{ marginRight: 4 }} />
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--error)" }}
                        onClick={() => setDeletingExpense(e)}
                      >
                        <Trash2 size={13} style={{ marginRight: 4 }} />
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Modal Xóa với xác nhận */}
      {deletingExpense && (
        <div className="modal-bg" onClick={() => setDeletingExpense(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--navy)" }}>
              Xác nhận xóa khoản chi
            </h3>
            <p style={{ color: "var(--g500)", marginBottom: 20 }}>
              Bạn có chắc chắn muốn xóa khoản chi{" "}
              <b>{deletingExpense.tenCuaHang || "Không tên"}</b> trị giá{" "}
              <b>{fmt(deletingExpense.soTienVND)}</b> không?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeletingExpense(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa khoản chi */}
      {editingExpense && (
        <div className="modal-bg" onClick={() => setEditingExpense(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--navy)" }}>
              Sửa khoản chi
            </h3>
            <form onSubmit={handleSaveEdit}>
              <div className="field">
                <label className="field-label">Tên cửa hàng / Nội dung</label>
                <input
                  className="input"
                  value={editStore}
                  onChange={(e) => setEditStore(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field">
                  <label className="field-label">Số tiền (đ)</label>
                  <input
                    className="input"
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label className="field-label">Thuộc ngày</label>
                  <select
                    className="input"
                    value={editDay}
                    onChange={(e) => setEditDay(Number(e.target.value))}
                  >
                    {Array.from({ length: soNgay }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Ngày {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="field-label">Hạng mục</label>
                <select
                  className="input"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ExpenseCategory)}
                >
                  <option value="an_uong">Ăn uống</option>
                  <option value="vui_choi">Vui chơi</option>
                  <option value="di_chuyen">Di chuyển</option>
                  <option value="cho_o">Chỗ ở</option>
                  <option value="khac">Khác</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingExpense(null)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
