"use client";
import React from "react";
import { useApp, DEFAULT_SAMPLE_PLAN, extractSelectionFromPlan } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";
import {
  Search,
  ArrowLeft,
  Check,
  Calendar,
  AlertTriangle,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { moTaCanhBao } from "@/ui/messages/canhBao";
import { getHotelImage, getActivityImage } from "@/ui/lib/imageMap";

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

export function B6XemTruocScreen() {
  const { nav, plan, previewData, applyPreview, cancelPreview } = useApp();

  const effectivePreview =
    previewData ||
    (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("screen") === "b6-xem-truoc"
      ? {
          planSau: {
            ...DEFAULT_SAMPLE_PLAN,
            request: {
              ...DEFAULT_SAMPLE_PLAN.request,
              sothich: ["bien", "thien_nhien", "check_in_chup_anh"] as any,
            },
          },
          selection: extractSelectionFromPlan(DEFAULT_SAMPLE_PLAN),
          diff: {
            tongVND: { truoc: 9540000, sau: 8860000, chenh: -680000 },
            conLaiVND: { truoc: 460000, sau: 1140000, chenh: 680000 },
            thoiGianDiChuyenPhut: { truoc: 170, sau: 160, chenh: -10 },
            doiMuc: [
              {
                loai: "hoat_dong" as const,
                truoc: "Tham quan Bà Nà Hills (mẫu)",
                sau: "Bãi biển Non Nước & Check-in Chụp ảnh",
              },
            ],
            ngayAnhHuong: [
              { ngay: 2, lyDo: "đổi hoạt động phù hợp sở thích biển & chụp ảnh" },
              { ngay: 3, lyDo: "đổi hoạt động sang thư giãn ngắm cảnh" },
            ],
            theoHangMuc: [
              { ten: "Di chuyển", truoc: 3920000, sau: 3920000, chenh: 0 },
              { ten: "Chỗ ở", truoc: 2200000, sau: 2200000, chenh: 0 },
              { ten: "Ăn uống", truoc: 1800000, sau: 1800000, chenh: 0 },
              { ten: "Vui chơi", truoc: 1620000, sau: 940000, chenh: -680000 },
            ],
            canhBaoMoi: [],
            canhBaoDaSua: [],
            canhBaoGiaiQuyet: [],
          },
          hard: [],
          soft: [],
          diemKhopTruoc: 0.75,
          diemKhopSau: 1.5,
        }
      : null);

  if (!effectivePreview) {
    return (
      <div className="tv-layout">
        <SideNav />
        <div className="tv-main animate-in" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "var(--g400)" }}>
            <Search size={48} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", marginBottom: 8 }}>
            Chưa có thông tin xem trước thay đổi
          </h2>
          <p style={{ color: "var(--g500)", marginBottom: 24, fontSize: 14 }}>
            Vui lòng chọn một phương tiện, khách sạn hoặc hoạt động từ kế hoạch để xem so sánh trước và sau.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => nav("b3-ke-hoach")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={16} />
            Quay lại kế hoạch
          </button>
        </div>
        <div className="tv-side">
          <BudgetBox plan={plan} />
        </div>
      </div>
    );
  }

  const { diff, planSau, hard, soft, diemKhopTruoc, diemKhopSau } = effectivePreview;

  const isCostIncrease = diff.tongVND.chenh > 0;
  const isCostDecrease = diff.tongVND.chenh < 0;

  // Kiểm tra có bất kỳ mục nào có giá ước tính hoặc độ tin cậy khác "xac_minh"
  const hasEstimated =
    planSau.items.some((i) => i.giaLaUocTinh || (i.doTinCay && i.doTinCay !== "xac_minh")) ||
    (plan && plan.items.some((i) => i.giaLaUocTinh || (i.doTinCay && i.doTinCay !== "xac_minh")));

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in" style={{ overflowY: "auto" }}>
        <span
          className="text-link"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 14 }}
          onClick={cancelPreview}
        >
          <ArrowLeft size={16} />
          Quay lại
        </span>
        <h1 className="page-title">Xem trước thay đổi</h1>
        <p className="page-sub">
          So sánh chi tiết kế hoạch hiện tại và sau khi thay đổi. Dữ liệu do hệ thống tự động tính toán.
        </p>

        {/* Dòng độ khớp sở thích khi có điểm khớp và sở thích không rỗng */}
        {diemKhopTruoc !== undefined &&
          diemKhopSau !== undefined &&
          planSau.request.sothich &&
          planSau.request.sothich.length > 0 && (
            <div
              style={{
                fontSize: 13,
                color: "var(--p600)",
                fontWeight: 600,
                marginBottom: 16,
                padding: "8px 14px",
                background: "var(--p50)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--p200)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Check size={14} />
              Độ khớp sở thích: trước {diemKhopTruoc.toFixed(2).replace(".", ",")}, sau{" "}
              {diemKhopSau.toFixed(2).replace(".", ",")}
            </div>
          )}

        {/* So sánh mục thay đổi (DoiMuc) */}
        {diff.doiMuc.length > 0 && (
          <div className="b6-compare-grid" style={{ display: "grid", gap: 16, marginBottom: 24 }}>
            {/* Trước */}
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--g500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 10,
                }}
              >
                Trước khi đổi
              </div>
              <div className="card" style={{ padding: 20, opacity: 0.75, height: "100%" }}>
                {diff.doiMuc.map((m, idx) => {
                  const img = m.loai === "khach_san" ? getHotelImage(null, m.truoc) : getActivityImage(m.loai, m.truoc);
                  return (
                    <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <img
                        src={img.urlThumb || img.url}
                        alt={m.truoc}
                        loading="lazy"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "var(--r-md)",
                          objectFit: "cover",
                          flexShrink: 0,
                          border: "1px solid var(--color-border)",
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "var(--navy)" }}>
                          {m.truoc}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, color: "var(--g500)" }}>Lựa chọn ban đầu</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "1px 6px",
                              background: "var(--g100)",
                              color: "var(--g700)",
                              borderRadius: "var(--r-full)",
                            }}
                          >
                            Tham khảo
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sau */}
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--p500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 10,
                }}
              >
                Sau khi đổi
              </div>
              <div className="card" style={{ padding: 20, border: "2px solid var(--p500)", height: "100%" }}>
                {diff.doiMuc.map((m, idx) => {
                  const img = m.loai === "khach_san" ? getHotelImage(null, m.sau) : getActivityImage(m.loai, m.sau);
                  return (
                    <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <img
                        src={img.urlThumb || img.url}
                        alt={m.sau}
                        loading="lazy"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "var(--r-md)",
                          objectFit: "cover",
                          flexShrink: 0,
                          border: "1px solid var(--color-border)",
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "var(--navy)" }}>
                          {m.sau}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, color: "var(--p500)", fontWeight: 600 }}>Lựa chọn mới</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "1px 6px",
                              background: "var(--p100)",
                              color: "var(--p500)",
                              borderRadius: "var(--r-full)",
                            }}
                          >
                            Giá ước tính
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isCostDecrease && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "4px 10px",
                      background: "var(--color-success-bg)",
                      borderRadius: "var(--r-full)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--color-success-text)",
                    }}
                  >
                    <TrendingDown size={14} />
                    Tiết kiệm {fmt(Math.abs(diff.tongVND.chenh))}
                  </div>
                )}
                {isCostIncrease && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "4px 10px",
                      background: "var(--color-error-bg)",
                      borderRadius: "var(--r-full)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--color-error-text)",
                    }}
                  >
                    <TrendingUp size={14} />
                    Tăng thêm {fmt(diff.tongVND.chenh)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Thẻ chênh lệch ngân sách & thời gian di chuyển */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16, color: "var(--navy)" }}>
            Tác động đến ngân sách & lịch trình
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {/* Tổng chi phí */}
            <div style={{ padding: 14, background: "var(--g50)", borderRadius: "var(--r-lg)" }}>
              <div style={{ fontSize: 12, color: "var(--g500)", marginBottom: 6, fontWeight: 600 }}>
                Tổng chi phí dự tính
              </div>
              <div style={{ fontSize: 13, color: "var(--g400)", textDecoration: "line-through", marginBottom: 2 }}>
                {fmt(diff.tongVND.truoc)}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: isCostIncrease ? "var(--error)" : isCostDecrease ? "var(--success)" : "var(--navy)",
                }}
              >
                {fmt(diff.tongVND.sau)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: isCostIncrease ? "var(--error)" : "var(--success)" }}>
                {isCostIncrease
                  ? `+${fmt(diff.tongVND.chenh)}`
                  : isCostDecrease
                  ? `−${fmt(Math.abs(diff.tongVND.chenh))}`
                  : "Không đổi"}
              </div>
            </div>

            {/* Ngân sách còn lại */}
            <div style={{ padding: 14, background: "var(--g50)", borderRadius: "var(--r-lg)" }}>
              <div style={{ fontSize: 12, color: "var(--g500)", marginBottom: 6, fontWeight: 600 }}>
                Ngân sách còn lại
              </div>
              <div style={{ fontSize: 13, color: "var(--g400)", textDecoration: "line-through", marginBottom: 2 }}>
                {fmt(diff.conLaiVND.truoc)}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: diff.conLaiVND.sau >= 0 ? "var(--success)" : "var(--error)",
                }}
              >
                {fmt(diff.conLaiVND.sau)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: diff.conLaiVND.chenh >= 0 ? "var(--success)" : "var(--error)" }}>
                {diff.conLaiVND.chenh >= 0
                  ? `+${fmt(diff.conLaiVND.chenh)} dư thêm`
                  : `−${fmt(Math.abs(diff.conLaiVND.chenh))} giảm`}
              </div>
            </div>

            {/* Thời gian di chuyển */}
            {diff.thoiGianDiChuyenPhut && (
              <div style={{ padding: 14, background: "var(--g50)", borderRadius: "var(--r-lg)" }}>
                <div style={{ fontSize: 12, color: "var(--g500)", marginBottom: 6, fontWeight: 600 }}>
                  Thời gian di chuyển
                </div>
                <div style={{ fontSize: 13, color: "var(--g400)", textDecoration: "line-through", marginBottom: 2 }}>
                  {diff.thoiGianDiChuyenPhut.truoc} phút
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color:
                      diff.thoiGianDiChuyenPhut.chenh < 0
                        ? "var(--success)"
                        : diff.thoiGianDiChuyenPhut.chenh > 0
                        ? "var(--warning)"
                        : "var(--navy)",
                  }}
                >
                  {diff.thoiGianDiChuyenPhut.sau} phút
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: "var(--g500)" }}>
                  {diff.thoiGianDiChuyenPhut.chenh < 0
                    ? `Nhanh hơn ${Math.abs(diff.thoiGianDiChuyenPhut.chenh)} phút`
                    : diff.thoiGianDiChuyenPhut.chenh > 0
                    ? `Lâu hơn ${diff.thoiGianDiChuyenPhut.chenh} phút`
                    : "Không đổi"}
                </div>
              </div>
            )}
          </div>

          {/* Chi tiết theo từng hạng mục */}
          {diff.theoHangMuc.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--g700)", marginBottom: 8 }}>
                Chi tiết theo hạng mục:
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--g200)", textAlign: "left", color: "var(--g500)" }}>
                      <th style={{ padding: "6px 8px" }}>Hạng mục</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Trước</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Sau</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.theoHangMuc.map((row) => (
                      <tr key={row.ten} style={{ borderBottom: "1px solid var(--g100)" }}>
                        <td style={{ padding: "8px", fontWeight: 600 }}>{row.ten}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: "var(--g500)" }}>{fmt(row.truoc)}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>{fmt(row.sau)}</td>
                        <td
                          style={{
                            padding: "8px",
                            textAlign: "right",
                            fontWeight: 700,
                            color: row.chenh > 0 ? "var(--error)" : row.chenh < 0 ? "var(--success)" : "var(--g400)",
                          }}
                        >
                          {row.chenh > 0 ? `+${fmt(row.chenh)}` : row.chenh < 0 ? `−${fmt(Math.abs(row.chenh))}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dòng ghi chú bắt buộc khi có mục ước tính */}
              {hasEstimated && (
                <div style={{ fontSize: 12, color: "var(--g500)", fontStyle: "italic", marginTop: 8 }}>
                  * Chênh lệch dựa trên giá ước tính
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ngày bị ảnh hưởng */}
        {diff.ngayAnhHuong.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15, color: "var(--navy)", display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={16} />
              Các ngày bị ảnh hưởng trong lịch trình
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {diff.ngayAnhHuong.map((na, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "8px 12px",
                    background: "var(--g50)",
                    borderRadius: "var(--r-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      background: "var(--p100)",
                      color: "var(--p500)",
                      padding: "2px 8px",
                      borderRadius: "var(--r-sm)",
                      fontWeight: 700,
                    }}
                  >
                    Ngày {na.ngay}
                  </span>
                  <span style={{ color: "var(--g700)" }}>{na.lyDo}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cảnh báo mới */}
        {diff.canhBaoMoi && diff.canhBaoMoi.length > 0 && (
          <div className="banner banner-warn" style={{ marginBottom: 16 }}>
            <div className="banner-mark">
              <AlertTriangle size={14} />
            </div>
            <div>
              <div className="banner-title">Cảnh báo mới:</div>
              {diff.canhBaoMoi.map((cb, idx) => (
                <div key={idx} className="banner-text">
                  • {moTaCanhBao(cb)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cảnh báo đã hết */}
        {diff.canhBaoDaSua && diff.canhBaoDaSua.length > 0 && (
          <div className="banner banner-success" style={{ marginBottom: 16 }}>
            <div className="banner-mark">
              <Check size={14} />
            </div>
            <div>
              <div className="banner-title">Cảnh báo đã hết:</div>
              {diff.canhBaoDaSua.map((cb, idx) => (
                <div key={idx} className="banner-text">
                  • {moTaCanhBao(cb)}
                </div>
              ))}
            </div>
          </div>
        )}

        {hard.length > 0 && (
          <div className="banner banner-error" style={{ marginBottom: 16 }}>
            <div className="banner-mark">!</div>
            <div>
              <div className="banner-title">Vi phạm ràng buộc chưa được khắc phục:</div>
              {hard.map((h, idx) => (
                <div key={idx} className="banner-text">
                  • {h.chiTiet}
                </div>
              ))}
            </div>
          </div>
        )}

        {soft.length > 0 && (
          <div className="banner banner-warn" style={{ marginBottom: 16 }}>
            <div className="banner-mark">
              <Info size={14} />
            </div>
            <div>
              <div className="banner-title">Góp ý tối ưu lịch trình:</div>
              {soft.map((s, idx) => (
                <div key={idx} className="banner-text">
                  • {s.chiTiet}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button className="btn btn-outline" onClick={cancelPreview}>
            Hủy thay đổi
          </button>
          <button
            className="btn btn-primary"
            onClick={applyPreview}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Check size={16} />
            Áp dụng thay đổi
          </button>
        </div>
      </div>

      <div className="tv-side">
        <BudgetBox plan={planSau} />
      </div>
    </div>
  );
}
