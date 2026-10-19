"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";
import type { PlanItem } from "@/contracts";
import {
  Map as MapIcon,
  Sparkles,
  MapPin,
  Navigation,
  Pencil,
  ArrowLeft,
  Check,
  ExternalLink,
} from "lucide-react";

const VIBES = [
  "Biển",
  "Ẩm thực",
  "Hải sản",
  "Văn hóa",
  "Thiên nhiên",
  "Vui chơi",
  "Thư giãn",
  "Chụp ảnh",
  "Mua sắm",
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

export function B3KeHoachScreen() {
  const {
    nav,
    plan,
    planStatus,
    hardViolations,
    softViolations,
    tripConfig,
    executePlan,
    setEditContext,
  } = useApp();

  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [vibeNote, setVibeNote] = useState<string>("");

  const toggleVibe = (vibe: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleRegenerateVibes = () => {
    const combinedNote = [tripConfig.note, vibeNote.trim()]
      .filter(Boolean)
      .join("; ");

    nav("b2-dang-chay");
    executePlan({
      ...tripConfig,
      preferences: selectedVibes,
      note: combinedNote,
    });
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
    if (cb === "diem_den_mac_dinh") warningList.push("Điểm đến mặc định: Đà Nẵng.");
    else if (cb === "ngoai_pham_vi_diem_den") warningList.push("Hệ thống hiện tối ưu cho điểm đến Đà Nẵng.");
    else warningList.push(cb);
  });
  softViolations.forEach((sv) => {
    warningList.push(sv.chiTiet);
  });

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in" style={{ overflowY: "auto" }}>
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

        <div className="section-title">Kế hoạch theo ngày</div>

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

                const xemUrl =
                  item.mapsUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${cleanName}, Đà Nẵng`
                  )}`;
                const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  `${cleanName}, Đà Nẵng`
                )}`;

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

                      <div className="item-amount" style={{ textAlign: "right", minWidth: 100 }}>
                        {item.thanhTien === 0 ? (
                          <span style={{ color: "var(--success)" }}>Miễn phí</span>
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

        {/* Khung Muốn kế hoạch hợp gu hơn */}
        <div className="personal-panel">
          <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={16} />
            Muốn kế hoạch hợp gu hơn?
          </div>
          <div className="panel-sub">
            Chọn điều bạn thích, AI sẽ gợi ý lại các hoạt động và ẩm thực phù hợp nhất.
          </div>
          <div className="chips">
            {VIBES.map((v) => (
              <button
                key={v}
                className={`chip ${selectedVibes.includes(v) ? "on" : ""}`}
                onClick={() => toggleVibe(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <textarea
            className="textarea"
            style={{ marginTop: 12 }}
            placeholder="Hoặc nhắn thêm yêu cầu, ví dụ: muốn đi quán cà phê view biển, đi cùng gia đình có trẻ nhỏ..."
            value={vibeNote}
            onChange={(e) => setVibeNote(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRegenerateVibes}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Sparkles size={14} />
              Gợi ý lại kế hoạch
            </button>
          </div>
        </div>

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
