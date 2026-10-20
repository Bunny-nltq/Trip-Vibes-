"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useApp } from "@/ui/context/AppContext";
import type { ExpenseCategory, BillExtraction } from "@/contracts";
import { B8ChuyenDiScreen } from "./B8ChuyenDiScreen";
import {
  Upload,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Lock,
} from "lucide-react";

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
  const { nav, confirmed, plan, ledger, addExpenseToLedger, b10Prefill, setB10Prefill } = useApp();

  const [activeTab, setActiveTab] = useState<"bill" | "manual">(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "nhap_tay") return "manual";
    }
    return "bill";
  });
  const soNgay = plan?.request.soNgay || 3;

  // Form state
  const [tenCuaHang, setTenCuaHang] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "nhap_tay") return "Bánh xèo Bà Dưỡng";
      if (q === "ket_qua_doc") return "Quán Ăn Phố Cổ (mẫu)";
    }
    return "";
  });
  const [ngay, setNgay] = useState<string>(() => {
    return new Date().toLocaleDateString("vi-VN");
  });
  const [ngayTrongChuyen, setNgayTrongChuyen] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "nhap_tay") return 2;
    }
    return 2;
  });
  const [hangMuc, setHangMuc] = useState<ExpenseCategory>("an_uong");
  const [soTienVND, setSoTienVND] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "nhap_tay") return "180000";
      if (q === "ket_qua_doc") return "308000";
    }
    return "";
  });
  const [ghiChu, setGhiChu] = useState<string>("");

  // AI & Bill state
  const [giaTriAIDoc, setGiaTriAIDoc] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "ket_qua_doc") return 308000;
    }
    return null;
  });
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "ket_qua_doc") return "/eval/bills/b01_nhahang_haisan.jpg";
      if (q === "khong_doc_duoc") return "/eval/bills/b05_thuc_don_khong_phai_hoa_don.jpg";
      if (q === "het_luot") return "/eval/bills/b02_cafe.jpg";
    }
    return null;
  });
  const [isReading, setIsReading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [specialStatus, setSpecialStatus] = useState<
    "khong_phai_chung_tu" | "khong_doc_duoc_so_tien" | "429" | "network_error" | null
  >(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "khong_doc_duoc") return "khong_doc_duoc_so_tien";
      if (q === "het_luot") return "429";
    }
    return null;
  });
  const [warnings, setWarnings] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "ket_qua_doc") return [];
    }
    return [];
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Apply prefill when opened from B8 toast or B11
  useEffect(() => {
    if (b10Prefill) {
      if (b10Prefill.tenCuaHang) setTenCuaHang(b10Prefill.tenCuaHang);
      if (b10Prefill.ngayTrongChuyen) setNgayTrongChuyen(b10Prefill.ngayTrongChuyen);
      if (b10Prefill.hangMuc) setHangMuc(b10Prefill.hangMuc);
    }
  }, [b10Prefill]);

  // Support URL param for demo & testing states
  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
    const params = new URLSearchParams(window.location.search);
    const mockState = params.get("state");
    if (mockState === "nhap_tay") {
      setActiveTab("manual");
      setTenCuaHang("Bánh xèo Bà Dưỡng");
      setSoTienVND("180000");
      setNgayTrongChuyen(2);
      setHangMuc("an_uong");
    } else if (mockState === "ket_qua_doc") {
      setActiveTab("bill");
      setImagePreviewUrl("/eval/bills/b01_nhahang_haisan.jpg");
      setTenCuaHang("Quán Ăn Phố Cổ (mẫu)");
      setSoTienVND("308000");
      setGiaTriAIDoc(308000);
      setNgayTrongChuyen(2);
      setHangMuc("an_uong");
      setWarnings([]);
    } else if (mockState === "khong_doc_duoc") {
      setActiveTab("bill");
      setImagePreviewUrl("/eval/bills/b05_thuc_don_khong_phai_hoa_don.jpg");
      setSpecialStatus("khong_doc_duoc_so_tien");
    } else if (mockState === "het_luot") {
      setActiveTab("bill");
      setImagePreviewUrl("/eval/bills/b02_cafe.jpg");
      setSpecialStatus("429");
    }
  }, []);

  // Clean up object URL on unmount or change
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Check if user manually modified AI amount
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
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/bill", {
        method: "POST",
        body: formData,
      });

      if (res.status === 429) {
        setSpecialStatus("429");
        setIsReading(false);
        return;
      }

      if (!res.ok) {
        setSpecialStatus("network_error");
        setIsReading(false);
        return;
      }

      const data = await res.json();
      setIsReading(false);

      if (!data.ok) {
        if (data.status === "khong_phai_chung_tu") {
          setSpecialStatus("khong_phai_chung_tu");
        } else if (data.status === "khong_doc_duoc_so_tien") {
          setSpecialStatus("khong_doc_duoc_so_tien");
        } else {
          setSpecialStatus("network_error");
        }
        return;
      }

      const extraction: BillExtraction = data.extraction;

      if (!extraction.laChungTu || extraction.status === "khong_phai_chung_tu") {
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

  const handleConfirmAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

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
      addExpenseToLedger({
        id: `exp-${Date.now()}`,
        ngayTrongChuyen,
        ngay,
        tenCuaHang: tenCuaHang.trim(),
        hangMuc,
        soTienVND: amount,
        nguon: activeTab === "bill" ? "anh_bill" : "nhap_tay",
        giaTriAIDoc: activeTab === "bill" ? giaTriAIDoc : null,
        daSuaTay: activeTab === "bill" ? daSuaSo : false,
        ghiChu: ghiChu.trim() || null,
      });

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

  const subTitleText = `Cho: ${tenCuaHang || "Ngũ Hành Sơn"} · Ngày ${ngayTrongChuyen}`;

  return (
    <div style={{ position: "relative", minHeight: "100%", width: "100%" }}>
      {/* NỀN DIM: Giao diện chuyến đi bên dưới */}
      <div className="Dim" aria-hidden="true">
        <B8ChuyenDiScreen />
      </div>

      {/* OVERLAY MODAL */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(31, 42, 68, 0.45)",
          backdropFilter: "blur(3px)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCancel();
        }}
        role="dialog"
        aria-modal="true"
      >
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
              <RefreshCw size={36} className="spinner" style={{ color: "#2B55D6", margin: "0 auto 16px" }} />
              <div className="InfoTitle" style={{ fontSize: 16 }}>Đang đọc thông tin từ ảnh bill...</div>
              <div className="Hint" style={{ marginTop: 8 }}>
                AI đang nhận diện tên cửa hàng, ngày và số tiền thanh toán
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
                    ? "Hệ thống phát hiện ảnh tải lên không phải hóa đơn thanh toán. Bạn có thể chọn ảnh khác hoặc nhập tay."
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
                  background: "#F2F7FD",
                  border: "1px solid #D5E0F3",
                }}
              >
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
                <div className="Field">
                  <div className="FieldLabel">Tên cửa hàng hoặc nội dung</div>
                  <input
                    type="text"
                    className="Input"
                    value={tenCuaHang}
                    onChange={(e) => setTenCuaHang(e.target.value)}
                    placeholder="Quán Ăn Phố Cổ"
                  />
                </div>

                <div className="Field">
                  <div className="FieldLabel">Ngày</div>
                  <input
                    type="text"
                    className="Input"
                    value={ngay}
                    onChange={(e) => setNgay(e.target.value)}
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
                    value={soTienVND}
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

            {/* Tabs */}
            <div className="Tabs">
              <div className="Tab" onClick={() => setActiveTab("bill")}>
                Ảnh bill
              </div>
              <div className="Tab TabOn">Nhập tay</div>
            </div>

            <div className="Field">
              <div className="FieldLabel">Tên cửa hàng hoặc nội dung</div>
              <input
                type="text"
                className="Input"
                value={tenCuaHang}
                onChange={(e) => setTenCuaHang(e.target.value)}
                placeholder="Ví dụ: Cà phê view biển"
              />
            </div>

            <div className="Field">
              <div className="FieldLabel">Ngày</div>
              <input
                type="text"
                className="Input"
                value={ngay}
                onChange={(e) => setNgay(e.target.value)}
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
                value={soTienVND}
                onChange={(e) => setSoTienVND(e.target.value)}
                placeholder="0 đ"
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
      </div>
    </div>
  );
}

export default B10ChonNguonScreen;
