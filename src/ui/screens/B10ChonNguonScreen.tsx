"use client";
import {expenseDateForTripDay} from "@/core/travelRequest";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useApp } from "@/ui/context/AppContext";
import { useTrangThaiAI } from "@/ui/hooks/useTrangThaiAI";
import { useExtractBill } from "@/ui/hooks/useExtractBill";
import { useExpenseConfirm } from "@/ui/hooks/useExpenseConfirm";
import type { ExpenseCategory, BillExtraction } from "@/contracts";

import { RefreshCw, Sparkles, Calendar, Tag } from "lucide-react";
import {
  matchExpenseToPlan,
  mapPlanCategoryToExpenseCategory,
  type MatchedPlanItem,
} from "@/core/bill/matchExpenseToPlan";

const CANH_BAO_TEXT_MAP: Record<string, string> = {
  tong_khong_khop_cac_dong: "Tổng tiền không khớp với cộng các dòng chi tiết",
  so_tien_qua_nho: "Số tiền có vẻ nhỏ bất thường",
  so_tien_qua_lon: "Số tiền có vẻ lớn bất thường",
  do_tin_cay_thap: "Độ tin cậy đọc ảnh thấp, hãy đối chiếu kỹ",
  khong_du_dong_de_doi_chieu: "Không đủ dòng chi tiết để đối chiếu",
  dong_thieu_thanh_tien: "Một số dòng chi tiết thiếu thành tiền",
  ngay_khong_hop_le: "Ngày trên hóa đơn không hợp lệ",
};

const HANG_MUC_OPTIONS: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "an_uong", label: "Ăn uống" },
  { value: "vui_choi", label: "Vui chơi" },
  { value: "di_chuyen", label: "Di chuyển" },
  { value: "cho_o", label: "Chỗ ở" },
  { value: "khac", label: "Khác" },
];

export function B10ChonNguonScreen() {
  const {
    nav,
    addExpenseToLedger,
    b10Prefill,
    setB10Prefill,
    activeDay,
    plan,
    tickedPlaces,
    toggleTickPlace,
  } = useApp();
  const { aiBat } = useTrangThaiAI();
  const { extract: runExtractBill } = useExtractBill();
  const { confirm: runConfirmExpense } = useExpenseConfirm();

  const [activeTabChon, setActiveTab] = useState<"bill" | "manual">(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "nhap_tay") return "manual";
    }
    return "manual"; // Safe default, switched to bill if aiBat
  });

  // Form state
  const [tenCuaHang, setTenCuaHang] = useState<string>("");
  const [ngay, setNgay] = useState<string>(() => {
    return expenseDateForTripDay(plan?.request.travelDates?.departureDate,activeDay||1,new Date());
  });
  const [ngayTrongChuyen, setNgayTrongChuyen] = useState<number>(activeDay||1);
  const [hangMuc, setHangMuc] = useState<ExpenseCategory>("an_uong");
  const [soTienVND, setSoTienVND] = useState<string>("");
  const [ghiChu, setGhiChu] = useState<string>("");

  // Multimodal Match state
  const [matchedItem, setMatchedItem] = useState<MatchedPlanItem | null>(null);
  const [candidateMatches, setCandidateMatches] = useState<MatchedPlanItem[]>([]);
  const [autoTickMatchedItem, setAutoTickMatchedItem] = useState<boolean>(true);

  // AI & Bill state
  const [giaTriAIDoc, setGiaTriAIDoc] = useState<number|null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string|null>(null);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [specialStatus, setSpecialStatus] = useState<"khong_phai_chung_tu"|"khong_doc_duoc_so_tien"|"429"|"network_error"|null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Khi AI tắt luôn dùng nhập tay (suy ra từ aiBat & activeTabChon, không cần useEffect)
  const activeTab = aiBat ? activeTabChon : "manual";

  // Apply prefill when opened from B8 toast or B11
  useEffect(() => {
    if (b10Prefill) {
      if(b10Prefill.soTienVND!==undefined)setSoTienVND(String(b10Prefill.soTienVND));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ với hệ thống bên ngoài React (URL, sessionStorage, mạng) chỉ làm được sau khi dựng
      if (b10Prefill.tenCuaHang) setTenCuaHang(b10Prefill.tenCuaHang);
      if (b10Prefill.ngayTrongChuyen){setNgayTrongChuyen(b10Prefill.ngayTrongChuyen);setNgay(expenseDateForTripDay(plan?.request.travelDates?.departureDate,b10Prefill.ngayTrongChuyen,new Date()));}
      if (b10Prefill.hangMuc) setHangMuc(b10Prefill.hangMuc);
    }
  }, [b10Prefill,plan?.request.travelDates?.departureDate]);

  const daSuaSo = useMemo(() => {
    if (activeTab !== "bill" || giaTriAIDoc === null) return false;
    const currentNum = parseInt(soTienVND.replace(/\D/g, ""), 10);
    return !isNaN(currentNum) && currentNum !== giaTriAIDoc;
  }, [activeTab, giaTriAIDoc, soTienVND]);

  // Handle file validation and upload (strictly in-memory)
  const handleFile = async (file: File) => {
    setUploadError(null);
    setSpecialStatus(null);
    setSubmitError(null);

    // Validate size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    // Validate format
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WebP.");
      return;
    }

    // In-memory object URL preview
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
    setIsReading(true);

    try {
      const result = await runExtractBill(file);
      setIsReading(false);

      if (!result.ok) {
        if (result.is429) {
          setSpecialStatus("429");
        } else {
          setSpecialStatus("network_error");
        }
        return;
      }

      const extraction: BillExtraction | undefined = result.extraction;

      if (!extraction || !extraction.laChungTu || extraction.status === "khong_phai_chung_tu") {
        setSpecialStatus("khong_phai_chung_tu");
        return;
      }

      if (extraction.tongTienVND === null || extraction.tongTienVND === undefined) {
        setSpecialStatus("khong_doc_duoc_so_tien");
        return;
      }

      // Success
      setGiaTriAIDoc(extraction.tongTienVND);
      setSoTienVND(String(extraction.tongTienVND));
      if (extraction.tenCuaHang) {
        setTenCuaHang(extraction.tenCuaHang);
      }
      if (extraction.ngay) {
        setNgay(extraction.ngay);
      }
      if (extraction.hangMucGoiY) {
        setHangMuc(extraction.hangMucGoiY);
      }
      if (extraction.canhBao && Array.isArray(extraction.canhBao)) {
        setWarnings(extraction.canhBao);
      }

      // Khả năng kết nối đa phương thức: Gắn tự động hóa đơn vào đúng ngày/hạng mục hành trình
      const matchResult = matchExpenseToPlan(
        plan,
        {
          tenCuaHang: extraction.tenCuaHang,
          ngay: extraction.ngay,
          hangMucGoiY: extraction.hangMucGoiY,
          tongTienVND: extraction.tongTienVND,
          dongChiTiet: extraction.dongChiTiet,
        },
        tickedPlaces
      );

      if (matchResult.bestMatch) {
        setMatchedItem(matchResult.bestMatch);
        setCandidateMatches(matchResult.candidates);
        if (matchResult.suggestedDay) {
          setNgayTrongChuyen(matchResult.suggestedDay);
          if (!extraction.ngay) {
            setNgay(
              expenseDateForTripDay(
                plan?.request.travelDates?.departureDate,
                matchResult.suggestedDay,
                new Date()
              )
            );
          }
        }
        if (matchResult.suggestedCategory) {
          setHangMuc(matchResult.suggestedCategory);
        }
      } else {
        setMatchedItem(null);
        setCandidateMatches([]);
      }
    } catch {
      setIsReading(false);
      setSpecialStatus("network_error");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const switchToManual = () => {
    setActiveTab("manual");
    setSpecialStatus(null);
  };

  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!Number.isInteger(ngayTrongChuyen) || ngayTrongChuyen < 1 || ngayTrongChuyen > (plan?.request.soNgay || 1)) { setSubmitError("Ngày chi tiêu phải nằm trong chuyến đi."); return; }
    const amount = parseInt(soTienVND.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount <= 0) {
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
        nguon: activeTab === "bill" ? "anh_bill" : "nhap_tay",
        tenCuaHang: tenCuaHang.trim() || null,
        ngay: ngay || null,
        ngayTrongChuyen,
        hangMuc,
        soTienVND: amount,
        giaTriAIDoc: activeTab === "bill" ? giaTriAIDoc : null,
        ghiChu: ghiChu.trim() || null,
      });

      if (confirmRes.ok && confirmRes.expense) {
        addExpenseToLedger(confirmRes.expense);
        if (autoTickMatchedItem && matchedItem?.item?.id) {
          if (!tickedPlaces[matchedItem.item.id]) {
            toggleTickPlace(matchedItem.item.id);
          }
        }
      } else {
        setSubmitError(confirmRes.error || "Chưa ghi được khoản chi. Hãy kiểm tra thông tin và thử lại.");
        setIsSubmitting(false); return;
      }

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

  const subTitleText = `Chi tiêu ngày ${ngayTrongChuyen}${tenCuaHang ? ` · ${tenCuaHang}` : ""}`;

  return (
    <div style={{ position: "relative", minHeight: "100%", width: "100%" }}>
      <section className="TripExpenseForm" aria-label="Ghi chi tiêu">
        {/* MODAL B10a: Chọn ảnh bill */}
        {activeTab === "bill" && !imagePreviewUrl && (
          <div className="Modal" style={{ position: "relative", width: 740, maxWidth: "95vw" }}>
            <div className="ModalTitle">Thêm chi tiêu</div>
            <div className="Sub">{subTitleText}</div>

            {/* Tabs */}
            <div className="Tabs">
              <div className="Tab TabOn">Ảnh bill</div>
              <div className="Tab" onClick={() => setActiveTab("manual")}>
                Nhập tay
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className="Drop"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className="InfoTitle">Kéo ảnh bill vào đây</div>
              <div className="InfoSub" style={{ margin: "4px 0 14px" }}>
                jpg, png, webp · tối đa 5 MB
              </div>
              <div className="Btn">Chọn ảnh</div>
            </div>

            <div className="Hint" style={{ marginTop: 12 }}>
              Ảnh chỉ xử lý trong bộ nhớ, không được lưu.
            </div>

            {uploadError && (
              <div className="Banner BannerErr" style={{ marginTop: 14 }}>
                <div className="BannerMark">!</div>
                <div className="BannerText">{uploadError}</div>
              </div>
            )}

            <div className="Row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" className="Btn" style={{ width: 120 }} onClick={handleCancel}>
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* MODAL B10 Đang quét hóa đơn */}
        {activeTab === "bill" && isReading && (
          <div className="Modal" style={{ position: "relative", width: 740, maxWidth: "95vw", textAlign: "center" }}>
            <div className="ModalTitle">Thêm chi tiêu</div>
            <div className="Sub">{subTitleText}</div>
            <div style={{ padding: "40px 20px" }}>
              <RefreshCw size={36} className="spinner" style={{ color: "var(--color-primary)", margin: "0 auto 16px" }} />
              <div className="InfoTitle" style={{ fontSize: 16 }}>Đang đọc thông tin từ ảnh bill...</div>
              <div className="Hint" style={{ marginTop: 8 }}>
                AI đang nhận diện tên cửa hàng, ngày và số tiền chi tiêu
              </div>
            </div>
          </div>
        )}

        {/* MODAL B10 Trạng thái đặc biệt khi đọc ảnh */}
        {activeTab === "bill" && !isReading && specialStatus && (
          <div className="Modal" style={{ position: "relative", width: 740, maxWidth: "95vw" }}>
            <div className="ModalTitle">Thêm chi tiêu</div>
            <div className="Sub">{subTitleText}</div>

            <div className="Banner BannerWarn" style={{ marginTop: 16 }}>
              <div className="BannerMark">!</div>
              <div>
                <div className="BannerTitle">
                  {specialStatus === "khong_phai_chung_tu"
                    ? "Ảnh không phải hóa đơn hợp lệ"
                    : specialStatus === "khong_doc_duoc_so_tien"
                    ? "Không nhận diện được số tiền rõ ràng"
                    : specialStatus === "429"
                    ? "Tạm thời hết lượt đọc tự động"
                    : "Lỗi kết nối khi đọc ảnh"}
                </div>
                <div className="BannerText">
                  {specialStatus === "khong_phai_chung_tu"
                    ? "Hệ thống phát hiện ảnh tải lên không phải hóa đơn chi tiêu. Bạn có thể chọn ảnh khác hoặc nhập tay."
                    : "Vui lòng nhập số tiền và nội dung bằng tay để tiếp tục ghi vào sổ chi tiêu."}
                </div>
              </div>
            </div>

            <div className="Row" style={{ justifyContent: "flex-end", marginTop: 24, gap: 12 }}>
              <button
                type="button"
                className="Btn"
                onClick={() => {
                  setImagePreviewUrl(null);
                  setSpecialStatus(null);
                }}
              >
                Chọn ảnh khác
              </button>
              <button
                type="button"
                className="Btn BtnPrimary"
                onClick={switchToManual}
              >
                Chuyển sang nhập tay
              </button>
            </div>
          </div>
        )}

        {/* MODAL B10b: Xác nhận kết quả đọc (2 CỘT: ẢNH + FORM) */}
        {activeTab === "bill" && imagePreviewUrl && !isReading && !specialStatus && (
          <div className="Modal" style={{ position: "relative", width: 860, maxWidth: "95vw" }}>
            <div className="ModalTitle">Thêm chi tiêu</div>
            <div className="Sub">{subTitleText}</div>

            {/* Tabs */}
            <div className="Tabs">
              <div className="Tab TabOn">Ảnh bill</div>
              <div className="Tab" onClick={() => setActiveTab("manual")}>
                Nhập tay
              </div>
            </div>

            {/* Hai cột */}
            <div className="RowTop">
              {/* Cột trái: Ảnh bill */}
              <div
                className="PhotoBig"
                style={{
                  height: 300,
                  width: 240,
                  flexShrink: 0,
                  position: "relative",
                  background: "var(--color-surface-sub)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước dạng blob: URL cục bộ, không tối ưu hóa được */}
                <img
                  src={imagePreviewUrl}
                  alt="Ảnh bill"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: 14,
                  }}
                />
              </div>

              {/* Cột phải: Form */}
              <div className="Grow">
                {matchedItem && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--r-md)",
                      background: "var(--color-primary-tint)",
                      border: "1px solid var(--color-border)",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--color-primary)",
                        }}
                      >
                        <Sparkles size={16} />
                        <span>Tự động khớp với lịch trình AI</span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background:
                            matchedItem.score >= 70
                              ? "var(--color-success-bg)"
                              : "var(--color-warning-bg)",
                          color:
                            matchedItem.score >= 70
                              ? "var(--color-success-text)"
                              : "var(--color-warning-text)",
                        }}
                      >
                        {matchedItem.score}% tương đồng
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--color-text)",
                        marginBottom: 4,
                      }}
                    >
                      {matchedItem.item.noiDung}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        fontSize: 12,
                        color: "var(--color-text-sub)",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={13} />
                        Ngày {matchedItem.item.ngay} ({matchedItem.item.gio})
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Tag size={13} />
                        Dự toán: {matchedItem.item.thanhTien.toLocaleString("vi-VN")} đ
                      </span>
                    </div>

                    {matchedItem.matchReasons.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                        {matchedItem.matchReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: "var(--r-sm)",
                              background: "var(--color-surface)",
                              border: "1px solid var(--color-border)",
                              color: "var(--color-text)",
                            }}
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--color-text)",
                        cursor: "pointer",
                        userSelect: "none",
                        paddingTop: 8,
                        borderTop: "1px dashed var(--color-border)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={autoTickMatchedItem}
                        onChange={(e) => setAutoTickMatchedItem(e.target.checked)}
                        style={{
                          width: 15,
                          height: 15,
                          accentColor: "var(--color-primary)",
                          cursor: "pointer",
                        }}
                      />
                      <span>Đánh dấu hoàn thành hoạt động này trong Chuyến đi (B8)</span>
                    </label>

                    {candidateMatches.length > 1 && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: "var(--color-text-sub)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>Hoặc liên kết mục khác:</span>
                        <select
                          value={matchedItem.item.id}
                          onChange={(e) => {
                            const chosen = candidateMatches.find((c) => c.item.id === e.target.value);
                            if (chosen) {
                              setMatchedItem(chosen);
                              setNgayTrongChuyen(chosen.item.ngay);
                              setHangMuc(mapPlanCategoryToExpenseCategory(chosen.item.hangMuc));
                              setNgay(
                                expenseDateForTripDay(
                                  plan?.request.travelDates?.departureDate,
                                  chosen.item.ngay,
                                  new Date()
                                )
                              );
                            }
                          }}
                          style={{
                            fontSize: 12,
                            padding: "2px 8px",
                            borderRadius: "var(--r-sm)",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-surface)",
                            color: "var(--color-text)",
                            cursor: "pointer",
                          }}
                        >
                          {candidateMatches.map((c) => (
                            <option key={c.item.id} value={c.item.id}>
                              Ngày {c.item.ngay}: {c.item.noiDung} ({c.score}%)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="Field">
                  <div className="FieldLabel">Tên cửa hàng hoặc nội dung</div>
                  <input
                    type="text"
                    className="Input"
                    aria-label="Tên cửa hàng hoặc nội dung" value={tenCuaHang}
                    onChange={(e) => setTenCuaHang(e.target.value)}
                    placeholder="Quán Ăn Phố Cổ"
                  />
                </div>

                <div className="Field">
                  <div className="FieldLabel">Ngày</div>
                  <input
                    type="text"
                    className="Input"
                    aria-label="Ngày hóa đơn" value={ngay}
                    onChange={(e) => setNgay(e.target.value)}
                  />
                </div>

                <div className="Field">
                  <label htmlFor="expense-bill-trip-day">Ngày trong chuyến</label>
                  <input
                    id="expense-bill-trip-day"
                    className="Input"
                    type="number"
                    min={1}
                    max={plan?.request.soNgay || 1}
                    value={ngayTrongChuyen}
                    onChange={(e) => setNgayTrongChuyen(Number(e.target.value))}
                  />
                </div>

                <div className="Field">
                  <div className="FieldLabel">Hạng mục</div>
                  <div className="Chips" style={{ margin: 0 }}>
                    {HANG_MUC_OPTIONS.map((opt) => (
                      <div
                        key={opt.value}
                        className={`Chip ${hangMuc === opt.value ? "ChipOn" : ""}`}
                        onClick={() => setHangMuc(opt.value)}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="Field">
                  <div className="FieldLabel">Số tiền</div>
                  <input
                    type="text"
                    className="Input InputBig"
                    aria-label="Số tiền" value={soTienVND}
                    onChange={(e) => setSoTienVND(e.target.value)}
                  />
                  <div className="Hint">
                    {giaTriAIDoc
                      ? `AI đọc: ${giaTriAIDoc.toLocaleString("vi-VN")} đ. ${
                          warnings.length > 0
                            ? warnings.map((w) => CANH_BAO_TEXT_MAP[w] || w).join("; ")
                            : "Tổng khớp các dòng."
                        }`
                      : "Hãy nhập số tiền trên hóa đơn."}
                  </div>
                </div>

                <div className="Field">
                  <div className="FieldLabel">Ghi chú (tuỳ chọn)</div>
                  <input
                    type="text"
                    className="Input"
                    aria-label="Ghi chú" value={ghiChu}
                    onChange={(e) => setGhiChu(e.target.value)}
                    placeholder="Ghi chú thêm về hóa đơn này..."
                  />
                </div>

                <div className="Hint">
                  Hãy so lại số tiền với bill của bạn. Bạn có thể sửa trước khi ghi.
                </div>
              </div>
            </div>

            {submitError && (
              <div className="Banner BannerErr" style={{ marginTop: 12 }}>
                <div className="BannerMark">!</div>
                <div className="BannerText">{submitError}</div>
              </div>
            )}

            {/* Footer Buttons */}
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
                type="button"
                className="Btn BtnPrimary"
                style={{ width: 180 }}
                onClick={handleConfirmAndSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang ghi..." : "Xác nhận và ghi"}
              </button>
            </div>
          </div>
        )}

        {/* MODAL B10c: Nhập tay */}
        {activeTab === "manual" && (
          <div className="Modal" style={{ position: "relative", width: 740, maxWidth: "95vw" }}>
            <div className="ModalTitle">Thêm chi tiêu</div>
            <div className="Sub">{subTitleText}</div>

            {/* Tabs - Chỉ hiển thị khi AI bật */}
            {aiBat && (
              <div className="Tabs">
                <div className="Tab" onClick={() => setActiveTab("bill")}>
                  Ảnh bill
                </div>
                <div className="Tab TabOn">Nhập tay</div>
              </div>
            )}

            {/* Gợi ý chọn nhanh từ lịch trình (nếu có) */}
            {plan?.items && plan.items.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-sub)", marginBottom: 6 }}>
                  Chọn nhanh từ hoạt động trong lịch trình:
                </div>
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                  {plan.items.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
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
                      N{item.ngay}: {item.destinationName || item.noiDung.slice(0, 20)}
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
                type="text"
                className="Input"
                aria-label="Ngày hóa đơn" value={ngay}
                onChange={(e) => setNgay(e.target.value)}
              />
            </div>

            <div className="Field"><label htmlFor="expense-trip-day">Ngày trong chuyến</label><input id="expense-trip-day" className="Input" type="number" min={1} max={plan?.request.soNgay || 1} value={ngayTrongChuyen} onChange={e=>setNgayTrongChuyen(Number(e.target.value))} /></div>
            <div className="Field">
              <div className="FieldLabel">Hạng mục</div>
              <div className="Chips" style={{ margin: 0 }}>
                {HANG_MUC_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={`Chip ${hangMuc === opt.value ? "ChipOn" : ""}`}
                    onClick={() => setHangMuc(opt.value)}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="Field">
              <div className="FieldLabel">Số tiền</div>
              <input
                type="text"
                className="Input InputBig"
                aria-label="Số tiền" value={soTienVND}
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
              <div className="Banner BannerErr" style={{ marginTop: 12 }}>
                <div className="BannerMark">!</div>
                <div className="BannerText">{submitError}</div>
              </div>
            )}

            {/* Footer Buttons */}
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
                type="button"
                className="Btn BtnPrimary"
                style={{ width: 180 }}
                onClick={handleConfirmAndSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang ghi..." : "Ghi chi tiêu"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default B10ChonNguonScreen;
