"use client";
import React, { useState } from "react";
import { useApp, extractSelectionFromPlan } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";
import type { PlanItem, Preference, DiemDen } from "@/contracts";
import { getDiemDenTen } from "@/contracts";
import { nhanNguonDuLieu } from "@/core/nhanNguon";
import {
  Map as MapIcon,
  Sparkles,
  MapPin,
  Navigation,
  Pencil,
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  Info,
  RefreshCw,
} from "lucide-react";

const VIBES: { label: string; key: Preference }[] = [
  { label: "Biển", key: "bien" },
  { label: "Ẩm thực", key: "am_thuc" },
  { label: "Hải sản", key: "hai_san" },
  { label: "Văn hóa", key: "van_hoa_lich_su" },
  { label: "Thiên nhiên", key: "thien_nhien" },
  { label: "Vui chơi", key: "giai_tri_vui_choi" },
  { label: "Thư giãn", key: "thu_gian_spa" },
  { label: "Chụp ảnh", key: "check_in_chup_anh" },
  { label: "Mua sắm", key: "mua_sam" },
];

function formatSource(source: string | null | undefined): string | null {
  if (!source) return null;
  try {
    if (source.startsWith("http://") || source.startsWith("https://")) {
      const u = new URL(source);
      return u.hostname.replace(/^www\./, "");
    }
  } catch {
    // ignore
  }
  if (source.startsWith("osm:")) return "OpenStreetMap";
  return source;
}

function getTagClass(hangMuc: string): string {
  switch (hangMuc) {
    case "Di chuyển":
      return "tag-move";
    case "Chỗ ở":
      return "tag-stay";
    case "Ăn uống":
      return "tag-food";
    case "Vui chơi":
    default:
      return "tag-fun";
  }
}

function getLyDoDuPhongText(lyDo?: string): string {
  switch (lyDo) {
    case "het_luot_ai":
      return "AI đã hết hạn mức lượt gọi";
    case "qua_thoi_gian":
      return "thời gian xử lý của AI vượt quá giới hạn";
    case "loi_mang_ai":
      return "lỗi kết nối mạng tới dịch vụ AI";
    case "ai_khong_sua_duoc_ngan_sach":
      return "AI không cân đối được chi phí trong ngân sách";
    default:
      return "AI không thể hoàn tất kế hoạch";
  }
}

export function B3KeHoachScreen() {
  const {
    nav,
    plan,
    planResult,
    planStatus,
    hardViolations,
    softViolations,
    tripConfig,
    confirmed,
    setPreviewData,
    setEditContext,
    dataSourceUsed,
    ngayDuLieu,
    tuoiGioCache,
    phuongThucLap,
    lyDoDuPhong,
    retryPlan,
  } = useApp();

  const [selectedVibes, setSelectedVibes] = useState<Preference[]>(() =>
    (plan?.request.sothich as Preference[]) ?? []
  );
  const [vibeNote, setVibeNote] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const toggleVibe = (vibe: Preference) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleRegenerateVibes = async () => {
    if (!plan) return;
    if (selectedVibes.length === 0 && !vibeNote.trim()) return;

    setIsRegenerating(true);
    setRegenError(null);

    try {
      const currentSelection = extractSelectionFromPlan(plan);
      const res = await fetch("/api/plan/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            ...plan.request,
            sothich: selectedVibes,
            ghiChu: vibeNote.trim()
              ? [...(plan.request.ghiChu || []).filter((g) => g !== vibeNote.trim()), vibeNote.trim()]
              : (plan.request.ghiChu || []),
          },
          selection: currentSelection,
        }),
      });

      if (res.status === 429) {
        setRegenError(
          "Hết lượt gợi ý bằng AI lúc này. Bạn có thể đổi hoạt động thủ công bằng nút \"Đổi\" ở từng mục."
        );
        setIsRegenerating(false);
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        if (data?.error?.includes("429") || data?.message?.includes("429")) {
          setRegenError(
            "Hết lượt gợi ý bằng AI lúc này. Bạn có thể đổi hoạt động thủ công bằng nút \"Đổi\" ở từng mục."
          );
        } else {
          setRegenError(
            data?.message || data?.error || "Không thể gợi ý lại lúc này. Bạn có thể đổi hoạt động thủ công bằng nút \"Đổi\"."
          );
        }
        setIsRegenerating(false);
        return;
      }

      // data: { planSau, diff, hard, soft, diemKhopTruoc, diemKhopSau, soLanGoiAI }
      setPreviewData({
        planSau: data.planSau,
        selection: extractSelectionFromPlan(data.planSau),
        diff: data.diff,
        hard: data.hard || [],
        soft: data.soft || [],
        diemKhopTruoc: data.diemKhopTruoc,
        diemKhopSau: data.diemKhopSau,
      });

      setIsRegenerating(false);
      nav("b6-xem-truoc");
    } catch (err: any) {
      setRegenError(
        "Có lỗi kết nối khi gợi ý lại. Bạn có thể đổi hoạt động thủ công bằng nút \"Đổi\"."
      );
      setIsRegenerating(false);
    }
  };

  const handleEditItem = (item: PlanItem) => {
    if (item.hangMuc === "Di chuyển") {
      const isDi = item.ngay === 1;
      setEditContext({
        type: isDi ? "phuong_tien_di" : "phuong_tien_ve",
        huong: isDi ? "di" : "ve",
        currentId: item.refId ?? undefined,
      });
      nav("b4-phuong-tien");
    } else if (item.hangMuc === "Chỗ ở") {
      setEditContext({
        type: "khach_san",
        currentId: item.refId ?? undefined,
      });
      nav("b5-khach-san");
    } else if (item.hangMuc === "Vui chơi") {
      setEditContext({
        type: "hoat_dong",
        dayIndex: item.ngay - 1,
        currentId: item.refId ?? undefined,
      });
      nav("b5-khach-san");
    }
  };

  // Nếu chưa có plan (ví dụ mở trực tiếp màn hình B3)
  if (!plan) {
    return (
      <div className="tv-layout">
        <SideNav />
        <div className="tv-main animate-in" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "var(--p500)" }}>
            <MapIcon size={48} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", marginBottom: 8 }}>
            Chưa có kế hoạch nào được lập
          </h2>
          <p style={{ color: "var(--g500)", marginBottom: 24, fontSize: 14 }}>
            Vui lòng chọn thông tin chuyến đi để AI đề xuất lịch trình phù hợp nhất cho bạn.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => nav("b1-chon-nhanh")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Sparkles size={16} />
            Lập kế hoạch ngay
          </button>
        </div>
        <div className="tv-side">
          <BudgetBox />
        </div>
      </div>
    );
  }

  // Gom nhóm các items theo ngày
  const soNgay = plan.request.soNgay || 3;
  const daysMap = new Map<number, PlanItem[]>();
  for (let d = 1; d <= soNgay; d++) {
    daysMap.set(d, []);
  }
  for (const item of plan.items) {
    const arr = daysMap.get(item.ngay);
    if (arr) arr.push(item);
    else daysMap.set(item.ngay, [item]);
  }

  // Danh sách cảnh báo lưu ý
  const warningList: string[] = [];
  if (plan.tongKet.trangThaiNganSach === "vuot") {
    const vuot = plan.tongKet.tongVND - (plan.request.ngansachTongVND || 0);
    warningList.push(`Vượt ngân sách ${vuot.toLocaleString("vi-VN")} đ.`);
  } else if (plan.tongKet.phanTramDaDung >= 90) {
    warningList.push(
      `Đã dùng ${plan.tongKet.phanTramDaDung.toFixed(1)}% ngân sách, còn lại ${plan.tongKet.conLaiVND.toLocaleString("vi-VN")} đ.`
    );
  }
  plan.request.canhBao.forEach((cb) => {
    if (cb === "diem_den_mac_dinh") warningList.push("Chưa rõ điểm đến.");
    else if (cb === "ngoai_pham_vi_so_ngay") warningList.push("Số ngày nằm ngoài phạm vi 2 đến 5 ngày.");
    else warningList.push(cb);
  });
  softViolations.forEach((sv) => {
    warningList.push(sv.chiTiet);
  });

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in" style={{ overflowY: "auto" }}>
        {plan.request.diemDen &&
          typeof plan.request.diemDen === "object" &&
          plan.request.diemDen.maQuocGia !== "VN" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "var(--r-md)",
                color: "#1e40af",
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              <Info size={15} style={{ flexShrink: 0 }} />
              <span>
                Dữ liệu ngoài Việt Nam có thể ít hơn và chỉ là ước tính. Trip Vibes không tư vấn visa.
              </span>
            </div>
          )}

        {/* Banner xanh khi lập bằng quy tắc tự động */}
        {(phuongThucLap === "quy_tac" ||
          planResult?.phuongThucLap === "quy_tac" ||
          (plan as any)?.phuongThucLap === "quy_tac") && (
          <div className="banner banner-success" style={{ marginBottom: 16 }}>
            <div
              className="banner-mark"
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Check size={14} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="banner-title" style={{ color: "#166534" }}>
                Kế hoạch được lập bằng quy tắc tự động
              </div>
              <div className="banner-text" style={{ color: "#14532d" }}>
                Kế hoạch này được lập bằng quy tắc tự động (phương án rẻ nhất phù hợp yêu cầu) vì{" "}
                {getLyDoDuPhongText(
                  lyDoDuPhong ?? planResult?.lyDoDuPhong ?? (plan as any)?.lyDoDuPhong
                )}
                . Bạn vẫn có thể đổi từng mục.
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => retryPlan()}
                  className="btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: "var(--r-sm)",
                    background: "#ffffff",
                    border: "1px solid #86efac",
                    color: "#166534",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={13} />
                  Thử lại bằng AI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner lỗi nếu có vi phạm cứng */}
        {planStatus === "co_vi_pham" && hardViolations.length > 0 && (
          <div className="banner banner-error" style={{ marginBottom: 16 }}>
            <div className="banner-mark">!</div>
            <div>
              <div className="banner-title">Kế hoạch đang có vi phạm ràng buộc</div>
              {hardViolations.map((h, idx) => (
                <div key={idx} className="banner-text">
                  • {h.chiTiet}
                </div>
              ))}
              <div className="banner-text" style={{ marginTop: 4, fontStyle: "italic" }}>
                Hãy bấm nút &quot;Đổi&quot; ở khách sạn hoặc phương tiện để giảm chi phí hoặc điều chỉnh lịch trình.
              </div>
            </div>
          </div>
        )}

        {/* Warning banner thông thường */}
        {warningList.length > 0 && (
          <div className="banner banner-warn" style={{ marginBottom: 16 }}>
            <div className="banner-mark">!</div>
            <div>
              <div className="banner-title">Lưu ý</div>
              {warningList.map((w, idx) => (
                <div key={idx} className="banner-text">
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <h1 className="section-title" style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "var(--navy)" }}>
            Kế hoạch du lịch {getDiemDenTen(plan.request.diemDen)}
          </h1>
          <div
            style={{
              fontSize: 12,
              color: "var(--g500)",
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>
              {nhanNguonDuLieu({
                dataSourceUsed: planResult?.dataSourceUsed ?? plan?.dataSourceUsed ?? dataSourceUsed,
                ngay: planResult?.snapshotDate ?? planResult?.ngayDuLieu ?? ngayDuLieu ?? (plan as any)?.ngayDuLieu,
                tuoiGio: planResult?.tuoiGioCache ?? tuoiGioCache ?? (plan as any)?.tuoiGioCache,
              })}
            </span>
          </div>
        </div>

        {/* Hiển thị các ngày từ kết quả backend thực tế */}
        {Array.from(daysMap.entries()).map(([dayNum, items]) => {
          const dayTotal = items.reduce((sum, it) => sum + it.thanhTien, 0);

          return (
            <div key={dayNum} className="daycard">
              <div className="daycard-head">
                <div className="daycard-name">Ngày {dayNum}</div>
                <div className="daycard-total">
                  {dayTotal > 0 ? `${dayTotal.toLocaleString("vi-VN")} đ` : "0 đ"}
                </div>
              </div>

              {items.map((item, i) => {
                const isThamKhao = item.doTinCay === "tham_khao";
                const isEstimated =
                  item.giaLaUocTinh ||
                  (item.doTinCay && item.doTinCay !== "xac_minh");

                const sourceShort = formatSource(item.nguon);

                const cleanName = item.noiDung
                  .replace(/^(Di chuyển chiều đi:|Di chuyển chiều về:|Lưu trú:|Trưa:|Tối:|Cà phê:)\s*/i, "")
                  .split("(")[0]
                  .trim();

                const currentDestName = getDiemDenTen(plan.request.diemDen);
                const queryTarget = currentDestName ? `${cleanName}, ${currentDestName}` : cleanName;
                const xemUrl =
                  item.mapsUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryTarget)}`;
                const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(queryTarget)}`;

                const canEdit =
                  item.hangMuc === "Di chuyển" ||
                  item.hangMuc === "Chỗ ở" ||
                  item.hangMuc === "Vui chơi";

                return (
                  <div key={i} className="item" style={{ flexDirection: "column", alignItems: "stretch" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
                      <div className="item-time">{item.gio || "—"}</div>
                      <span className={`tag ${getTagClass(item.hangMuc)}`}>
                        {item.hangMuc}
                      </span>

                      <div className="item-info" style={{ flex: 1, paddingRight: 12 }}>
                        <div className="item-title">{item.noiDung}</div>

                        <div className="item-sub" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                          {item.soLuong > 1 && (
                            <span>
                              {item.soLuong} vé/phần × {item.donGia.toLocaleString("vi-VN")} đ
                            </span>
                          )}

                          {isThamKhao ? (
                            <span
                              className="tag"
                              style={{
                                background: "var(--g100)",
                                color: "var(--g700)",
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "2px 8px",
                              }}
                            >
                              Tham khảo
                            </span>
                          ) : isEstimated ? (
                            <span
                              className="tag"
                              style={{
                                background: "var(--p100)",
                                color: "var(--p500)",
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "2px 8px",
                              }}
                            >
                              Giá ước tính
                            </span>
                          ) : null}

                          {sourceShort && (
                            <span style={{ fontSize: 12, color: "var(--g500)" }}>
                              Nguồn: {sourceShort}
                            </span>
                          )}
                        </div>

                        {/* Nút bản đồ Maps & Nút Đổi */}
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <a
                            href={xemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{
                              fontSize: 11,
                              padding: "3px 10px",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <MapPin size={12} />
                            Xem Maps <ExternalLink size={10} />
                          </a>
                          <a
                            href={dirUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{
                              fontSize: 11,
                              padding: "3px 10px",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Navigation size={12} />
                            Chỉ đường <ExternalLink size={10} />
                          </a>

                          {canEdit && (
                            <button
                              onClick={() => handleEditItem(item)}
                              className="btn btn-outline btn-sm"
                              style={{
                                fontSize: 11,
                                padding: "3px 10px",
                                borderColor: "var(--p400)",
                                color: "var(--p500)",
                                fontWeight: 600,
                                background: "var(--p100)",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Pencil size={12} />
                              Đổi
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="item-amount" style={{ textAlign: "right", minWidth: 120 }}>
                        {item.thanhTien === 0 ? (
                          <span style={{ color: "var(--success)" }}>Miễn phí</span>
                        ) : item.giaGoc && item.giaGoc.tienTe !== "VND" ? (
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)" }}>
                              khoảng {item.giaGoc.soTien.toLocaleString("vi-VN")} {item.giaGoc.tienTe}, tương đương {item.thanhTien.toLocaleString("vi-VN")} đ
                            </div>
                            <div style={{ fontSize: 11, color: "var(--g500)", marginTop: 2 }}>
                              Tỷ giá: 1 {item.giaGoc.tienTe} = {item.giaGoc.tyGia.toLocaleString("vi-VN")} đ ({item.giaGoc.ngayTyGia})
                            </div>
                          </div>
                        ) : (
                          `${item.thanhTien.toLocaleString("vi-VN")} đ`
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Khung Muốn kế hoạch hợp gu hơn - bị ẩn khi kế hoạch đã chốt */}
        {!confirmed && (
          <div className="personal-panel" style={{ marginTop: 24 }}>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={16} />
              Muốn kế hoạch hợp gu hơn?
            </div>
            <div className="panel-sub">
              Chọn điều bạn thích, AI sẽ gợi ý lại các hoạt động phù hợp nhất.
            </div>
            <div className="chips">
              {VIBES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className={`chip ${selectedVibes.includes(v.key) ? "on" : ""}`}
                  onClick={() => toggleVibe(v.key)}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <textarea
              className="textarea"
              style={{ marginTop: 12 }}
              placeholder="Hoặc nhắn thêm yêu cầu, ví dụ: không muốn đi bộ nhiều, thích cà phê ngắm cảnh..."
              value={vibeNote}
              onChange={(e) => setVibeNote(e.target.value)}
            />
            {regenError && (
              <div
                className="banner banner-warn"
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  padding: "8px 12px",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, color: "var(--warning)" }} />
                <span>{regenError}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRegenerateVibes}
                disabled={isRegenerating || (selectedVibes.length === 0 && !vibeNote.trim())}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: (selectedVibes.length === 0 && !vibeNote.trim()) || isRegenerating ? 0.6 : 1,
                  cursor:
                    (selectedVibes.length === 0 && !vibeNote.trim()) || isRegenerating
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isRegenerating ? (
                  <>
                    <Loader2 size={14} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                    Đang tìm...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Gợi ý lại
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Action bar dưới cùng */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
          <button
            className="btn btn-outline"
            onClick={() => nav("b1-chon-nhanh")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={16} />
            Chọn lại nhu cầu
          </button>
          <button
            className="btn btn-primary"
            onClick={() => nav("b7-xac-nhan")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Check size={16} />
            Xác nhận kế hoạch
          </button>
        </div>
      </div>

      <div className="tv-side">
        <BudgetBox plan={plan} />
      </div>
    </div>
  );
}
