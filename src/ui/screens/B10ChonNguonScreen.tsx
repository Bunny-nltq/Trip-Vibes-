"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import type { ExpenseCategory, BillExtraction } from "@/contracts";
import {
  Camera,
  Upload,
  Edit3,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FileText,
  Lock,
  RefreshCw,
  Sparkles,
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
      if (q === "ket_qua_doc") return "Nhà hàng Biển Xanh";
    }
    return "";
  });
  const [ngay, setNgay] = useState<string>("");
  const [ngayTrongChuyen, setNgayTrongChuyen] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "nhap_tay") return 2;
    }
    return 1;
  });
  const [hangMuc, setHangMuc] = useState<ExpenseCategory>("an_uong");
  const [soTienVND, setSoTienVND] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "nhap_tay") return "180000";
      if (q === "ket_qua_doc") return "560000";
    }
    return "";
  });
  const [ghiChu, setGhiChu] = useState<string>("");

  // AI & Bill state
  const [giaTriAIDoc, setGiaTriAIDoc] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q === "ket_qua_doc") return 560000;
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
      if (q === "ket_qua_doc") return ["dong_thieu_thanh_tien"];
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

  // Support URL param for demo & testing states (chỉ trong môi trường development)
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
      setTenCuaHang("Nhà hàng Biển Xanh");
      setSoTienVND("560000");
      setGiaTriAIDoc(560000);
      setNgayTrongChuyen(1);
      setHangMuc("an_uong");
      setWarnings(["dong_thieu_thanh_tien"]);
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
      if (imagePreviewUrl) {
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

  // Handle file validation and upload
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
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
    setIsReading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/extract-bill", {
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
      if (!data.ok || !data.extraction) {
        setSpecialStatus("network_error");
        setIsReading(false);
        return;
      }

      const ext: BillExtraction = data.extraction;

      if (ext.status === "khong_phai_chung_tu") {
        setSpecialStatus("khong_phai_chung_tu");
        setIsReading(false);
        return;
      }

      if (ext.status === "khong_doc_duoc_so_tien") {
        setSpecialStatus("khong_doc_duoc_so_tien");
        if (ext.tenCuaHang) setTenCuaHang(ext.tenCuaHang);
        if (ext.ngay) setNgay(ext.ngay);
        if (ext.hangMucGoiY) setHangMuc(ext.hangMucGoiY);
        setIsReading(false);
        return;
      }

      // Successful extraction
      if (ext.tenCuaHang) setTenCuaHang(ext.tenCuaHang);
      if (ext.ngay) setNgay(ext.ngay);
      if (ext.hangMucGoiY) setHangMuc(ext.hangMucGoiY);
      if (ext.tongTienVND !== null) {
        setGiaTriAIDoc(ext.tongTienVND);
        setSoTienVND(String(ext.tongTienVND));
      }
      setWarnings(ext.canhBao || []);
      setIsReading(false);
    } catch {
      setSpecialStatus("network_error");
      setIsReading(false);
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
    setUploadError(null);
  };

  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const amountNum = parseInt(soTienVND.replace(/\D/g, ""), 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setSubmitError("Vui lòng nhập số tiền hợp lệ lớn hơn 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nguon: activeTab === "bill" ? "anh_bill" : "nhap_tay",
        tenCuaHang: tenCuaHang.trim() || null,
        ngay: ngay || null,
        ngayTrongChuyen: ngayTrongChuyen,
        hangMuc: hangMuc,
        soTienVND: amountNum,
        giaTriAIDoc: activeTab === "bill" ? giaTriAIDoc : null,
        ghiChu: ghiChu.trim() || null,
      };

      const res = await fetch("/api/expenses/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSubmitError(
          data.error || (data.loi ? `Lỗi: ${data.loi.join(", ")}` : "Không thể lưu khoản chi.")
        );
        setIsSubmitting(false);
        return;
      }

      addExpenseToLedger(data.expense);
      setB10Prefill(null);
      nav("b11-ngan-sach");
    } catch {
      setSubmitError("Lỗi kết nối khi lưu khoản chi.");
      setIsSubmitting(false);
    }
  };

  if (!confirmed) {
    return (
      <div className="tv-layout">
        <SideNav />
        <div className="tv-main animate-in">
          <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 520, margin: "40px auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "var(--g400)" }}>
              <Lock size={44} />
            </div>
            <h2 className="page-title" style={{ fontSize: 20 }}>Tính năng chưa mở</h2>
            <p className="page-sub" style={{ marginBottom: 20 }}>
              Bạn cần xác nhận kế hoạch trước khi thêm chi tiêu và theo dõi ngân sách thực tế.
            </p>
            <button className="btn btn-primary" onClick={() => nav("b3-ke-hoach")}>
              Về trang Kế hoạch
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in" style={{ maxWidth: 680 }}>
        <span
          className="text-link"
          style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => nav("b11-ngan-sach")}
        >
          <ArrowLeft size={16} />
          Quay lại Ngân sách
        </span>

        <h1 className="page-title">Thêm chi tiêu</h1>
        <p className="page-sub">Đọc hóa đơn bằng hình ảnh hoặc nhập thủ công vào sổ chi tiêu.</p>

        {/* Tab switchers */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button
            type="button"
            className={`tab-item ${activeTab === "bill" ? "active" : ""}`}
            onClick={() => setActiveTab("bill")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Camera size={16} />
            Ảnh bill
          </button>
          <button
            type="button"
            className={`tab-item ${activeTab === "manual" ? "active" : ""}`}
            onClick={() => setActiveTab("manual")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Edit3 size={16} />
            Nhập tay
          </button>
        </div>

        {/* TAB 1: ẢNH BILL */}
        {activeTab === "bill" && (
          <div>
            {!imagePreviewUrl && (
              <div
                className="drop-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: 40, cursor: "pointer", marginBottom: 20 }}
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
                <div style={{ display: "flex", justifyContent: "center", color: "var(--p500)", marginBottom: 8 }}>
                  <Upload size={40} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Kéo thả hoặc bấm để chọn ảnh bill</div>
                <div className="hint">Hỗ trợ JPG, PNG, WebP (tối đa 5 MB)</div>
                <div className="hint" style={{ color: "var(--p500)", marginTop: 6 }}>
                  Ảnh chỉ xử lý trong bộ nhớ, không lưu đĩa
                </div>
              </div>
            )}

            {uploadError && (
              <div className="banner banner-error" style={{ marginBottom: 20 }}>
                <div className="banner-mark">!</div>
                <div>
                  <div className="banner-title">Lỗi tải ảnh</div>
                  <div className="banner-text">{uploadError}</div>
                </div>
              </div>
            )}

            {/* Reading scanning state */}
            {isReading && (
              <div className="card" style={{ padding: 24, marginBottom: 20, textAlign: "center" }}>
                <div style={{ maxWidth: 220, margin: "0 auto 16px" }} className="scanner-container">
                  {imagePreviewUrl && (
                    <img
                      src={imagePreviewUrl}
                      alt="Hóa đơn"
                      style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: "var(--r-md)", display: "block" }}
                    />
                  )}
                  <div className="scanner-laser" />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--p500)", fontWeight: 600 }}>
                  <RefreshCw size={18} className="spinner" />
                  Đang đọc hóa đơn...
                </div>
                <div className="hint" style={{ marginTop: 6 }}>
                  AI đang nhận diện tên cửa hàng và tổng tiền
                </div>
              </div>
            )}

            {/* Special states */}
            {specialStatus === "khong_phai_chung_tu" && (
              <div className="banner banner-warn" style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <AlertTriangle size={20} style={{ color: "var(--warning)" }} />
                  <span style={{ fontWeight: 600 }}>Ảnh này có vẻ không phải hóa đơn.</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setImagePreviewUrl(null)}>
                    Chọn ảnh khác
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={switchToManual}>
                    Chuyển sang nhập tay
                  </button>
                </div>
              </div>
            )}

            {specialStatus === "khong_doc_duoc_so_tien" && (
              <div className="banner banner-warn" style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <AlertCircle size={20} style={{ color: "var(--warning)" }} />
                  <span style={{ fontWeight: 600 }}>Không đọc được số tiền, hãy nhập tay.</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={switchToManual}>
                    Chuyển sang nhập tay
                  </button>
                </div>
              </div>
            )}

            {specialStatus === "429" && (
              <div className="banner banner-warn" style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <AlertTriangle size={20} style={{ color: "var(--warning)" }} />
                  <span style={{ fontWeight: 600 }}>Hết lượt đọc ảnh hôm nay, hãy nhập tay.</span>
                </div>
                <div>
                  <button type="button" className="btn btn-primary btn-sm" onClick={switchToManual}>
                    Chuyển sang nhập tay
                  </button>
                </div>
              </div>
            )}

            {specialStatus === "network_error" && (
              <div className="banner banner-error" style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <AlertCircle size={20} style={{ color: "var(--error)" }} />
                  <span style={{ fontWeight: 600 }}>Lỗi mạng hoặc không thể đọc ảnh lúc này.</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setImagePreviewUrl(null)}>
                    Thử lại ảnh khác
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={switchToManual}>
                    Chuyển sang nhập tay
                  </button>
                </div>
              </div>
            )}

            {/* Success Extraction Form */}
            {imagePreviewUrl && !isReading && !specialStatus && (
              <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 18, marginBottom: 20, alignItems: "flex-start" }}>
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: "var(--r-md)",
                      overflow: "hidden",
                      border: "1px solid var(--g200)",
                      background: "var(--g100)",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={imagePreviewUrl}
                      alt="Ảnh bill thu nhỏ"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>Kết quả đọc bill</div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setImagePreviewUrl(null);
                          setGiaTriAIDoc(null);
                          setSoTienVND("");
                        }}
                      >
                        Đổi ảnh khác
                      </button>
                    </div>

                    {giaTriAIDoc !== null && (
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className="tag" style={{ background: "var(--p100)", color: "var(--p500)", fontWeight: 600 }}>
                          AI đọc: {giaTriAIDoc.toLocaleString("vi-VN")} đ
                        </span>
                        {daSuaSo && (
                          <span className="tag" style={{ background: "#FEF3C7", color: "#92400E", fontWeight: 600 }}>
                            Đã sửa số
                          </span>
                        )}
                      </div>
                    )}

                    <div className="hint" style={{ color: "var(--g700)", fontWeight: 500, marginTop: 8 }}>
                      Hãy so lại số tiền với bill của bạn.
                    </div>
                  </div>
                </div>

                {/* Warnings in Vietnamese */}
                {warnings.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    {warnings.map((w, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          background: "#FFF8E6",
                          border: "1px solid #FDE68A",
                          borderRadius: "var(--r-md)",
                          fontSize: 13,
                          color: "#92400E",
                          marginBottom: 6,
                        }}
                      >
                        <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                        <span>{CANH_BAO_TEXT_MAP[w] || w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shared Form Fields */}
                <form onSubmit={handleConfirmAndSave}>
                  <div className="field">
                    <label className="field-label">Tên cửa hàng / Nội dung</label>
                    <input
                      className="input"
                      value={tenCuaHang}
                      onChange={(e) => setTenCuaHang(e.target.value)}
                      placeholder="Ví dụ: Quán Cơm Gà Bà Buội"
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="field">
                      <label className="field-label">Số tiền lớn (đ)</label>
                      <input
                        className="input"
                        type="number"
                        value={soTienVND}
                        onChange={(e) => setSoTienVND(e.target.value)}
                        placeholder="0"
                        style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}
                        required
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Thuộc ngày chuyến đi</label>
                      <select
                        className="input"
                        value={ngayTrongChuyen}
                        onChange={(e) => setNgayTrongChuyen(Number(e.target.value))}
                      >
                        {Array.from({ length: soNgay }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            Ngày {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="field">
                      <label className="field-label">Hạng mục</label>
                      <select
                        className="input"
                        value={hangMuc}
                        onChange={(e) => setHangMuc(e.target.value as ExpenseCategory)}
                      >
                        {HANG_MUC_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="field-label">Ngày trên hóa đơn (tùy chọn)</label>
                      <input
                        className="input"
                        type="date"
                        value={ngay}
                        onChange={(e) => setNgay(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Ghi chú (tùy chọn)</label>
                    <input
                      className="input"
                      value={ghiChu}
                      onChange={(e) => setGhiChu(e.target.value)}
                      placeholder="Ghi chú thêm về món ăn, người chia tiền..."
                    />
                  </div>

                  {submitError && (
                    <div className="banner banner-error" style={{ marginBottom: 16 }}>
                      <div className="banner-mark">!</div>
                      <div className="banner-text">{submitError}</div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => nav("b11-ngan-sach")}
                      disabled={isSubmitting}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Đang ghi vào sổ..." : "Xác nhận và ghi"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NHẬP TAY */}
        {activeTab === "manual" && (
          <div className="card" style={{ padding: 24 }}>
            <form onSubmit={handleConfirmAndSave}>
              <div className="field">
                <label className="field-label">Tên cửa hàng / Nội dung</label>
                <input
                  className="input"
                  value={tenCuaHang}
                  onChange={(e) => setTenCuaHang(e.target.value)}
                  placeholder="Ví dụ: Bánh xèo Bà Dưỡng"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field">
                  <label className="field-label">Số tiền lớn (đ)</label>
                  <input
                    className="input"
                    type="number"
                    value={soTienVND}
                    onChange={(e) => setSoTienVND(e.target.value)}
                    placeholder="0"
                    style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label">Thuộc ngày chuyến đi</label>
                  <select
                    className="input"
                    value={ngayTrongChuyen}
                    onChange={(e) => setNgayTrongChuyen(Number(e.target.value))}
                  >
                    {Array.from({ length: soNgay }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Ngày {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field">
                  <label className="field-label">Hạng mục</label>
                  <select
                    className="input"
                    value={hangMuc}
                    onChange={(e) => setHangMuc(e.target.value as ExpenseCategory)}
                  >
                    {HANG_MUC_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Ngày chi (tùy chọn)</label>
                  <input
                    className="input"
                    type="date"
                    value={ngay}
                    onChange={(e) => setNgay(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Ghi chú (tùy chọn)</label>
                <input
                  className="input"
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  placeholder="Ví dụ: Ăn chung 2 người..."
                />
              </div>

              {submitError && (
                <div className="banner banner-error" style={{ marginBottom: 16 }}>
                  <div className="banner-mark">!</div>
                  <div className="banner-text">{submitError}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => nav("b11-ngan-sach")}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang ghi vào sổ..." : "Xác nhận và ghi"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
