"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useApp, extractSelectionFromPlan } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";
import { getDiemDenTen } from "@/contracts";
import {
  useOptions,
  type HotelOptionItem,
  type ActivityOptionItem,
} from "@/ui/hooks/useOptions";
import { usePlanPreview } from "@/ui/hooks/usePlanPreview";
import {
  Hotel,
  Sparkles,
  Waves,
  Coffee,
  Star,
  Ticket,
  Landmark,
  Footprints,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
  Clock,
} from "lucide-react";

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

export function B5KhachSanScreen() {
  const { nav, plan, editContext, setPreviewData } = useApp();

  const isHotelMode = editContext?.type !== "hoat_dong";
  const [mode, setMode] = useState<"khach_san" | "hoat_dong">(
    isHotelMode ? "khach_san" : "hoat_dong"
  );

  const [selectedId, setSelectedId] = useState<string>(editContext?.currentId || "");

  // Filters for Hotels
  const [filterPool, setFilterPool] = useState<boolean>(false);
  const [filterBreakfast, setFilterBreakfast] = useState<boolean>(false);
  const [filterStars, setFilterStars] = useState<number | "all">("all");

  // Filters for Activities
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterFreeOnly, setFilterFreeOnly] = useState<boolean>(false);

  const soNguoi = plan?.request.soNguoi || 2;
  const soNgay = plan?.request.soNgay || 3;
  const soDem = Math.max(1, soNgay - 1);
  const soPhong = Math.ceil(soNguoi / 2);

  // Fetch hotels
  const {
    items: hotels,
    loading: loadingHotels,
    error: errorHotels,
  } = useOptions<HotelOptionItem>({
    loai: "khach_san",
    enabled: mode === "khach_san",
    soNguoi,
  });

  // Fetch activities
  const {
    items: activities,
    loading: loadingActivities,
    error: errorActivities,
  } = useOptions<ActivityOptionItem>({
    loai: "hoat_dong",
    enabled: mode === "hoat_dong",
    soNguoi,
  });

  const { preview, loading: loadingPreview, error: errorPreview } = usePlanPreview();

  useEffect(() => {
    if (editContext?.currentId) {
      setSelectedId(editContext.currentId);
    }
  }, [editContext]);

  // Current hotel cost for reference comparison
  const currentHotelItem = plan?.items.find((i) => i.hangMuc === "Chỗ ở");
  const currentHotelTotal = currentHotelItem ? currentHotelItem.thanhTien : 0;

  // Filtered hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      if (filterPool && !h.hasPool) return false;
      if (filterBreakfast && !h.includesBreakfast) return false;
      if (filterStars !== "all" && h.soSao !== filterStars) return false;
      return true;
    });
  }, [hotels, filterPool, filterBreakfast, filterStars]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (filterFreeOnly && a.giaVeNguoi > 0) return false;
      if (filterTag !== "all" && !a.nhan.includes(filterTag)) return false;
      return true;
    });
  }, [activities, filterFreeOnly, filterTag]);

  const handlePreview = async () => {
    if (!plan || !selectedId) return;

    const selection = extractSelectionFromPlan(plan);

    if (mode === "khach_san") {
      const res = await preview({
        request: plan.request,
        selection,
        thayDoi: {
          loai: "khach_san",
          idMoi: selectedId,
        },
      });

      if (res) {
        setPreviewData({
          planSau: res.planSau,
          selection: res.selection,
          diff: res.diff,
          hard: res.hard,
          soft: res.soft,
          thayDoi: {
            loai: "khach_san",
            idMoi: selectedId,
          },
        });
        nav("b6-xem-truoc");
      }
    } else {
      // Activity
      const dayIndex = editContext?.dayIndex ?? 0;
      const viTri = dayIndex * 10;

      const res = await preview({
        request: plan.request,
        selection,
        thayDoi: {
          loai: "hoat_dong",
          viTri,
          idMoi: selectedId,
        },
      });

      if (res) {
        setPreviewData({
          planSau: res.planSau,
          selection: res.selection,
          diff: res.diff,
          hard: res.hard,
          soft: res.soft,
          thayDoi: {
            loai: "hoat_dong",
            viTri,
            idMoi: selectedId,
          },
        });
        nav("b6-xem-truoc");
      }
    }
  };

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in" style={{ overflowY: "auto" }}>
        <span
          className="text-link"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 14 }}
          onClick={() => nav("b3-ke-hoach")}
        >
          <ArrowLeft size={16} />
          Quay lại kế hoạch
        </span>

        <h1 className="page-title">
          {mode === "khach_san" ? "Đổi khách sạn" : "Đổi hoạt động tham quan"}
        </h1>
        <p className="page-sub">
          {mode === "khach_san"
            ? `${soDem} đêm, ${soPhong} phòng cho ${soNguoi} người tại ${getDiemDenTen(plan?.request.diemDen) || "điểm đến"}.`
            : `Các địa điểm và hoạt động giải trí tại ${getDiemDenTen(plan?.request.diemDen) || "điểm đến"}.`}
        </p>

        {/* Tab chuyển đổi linh hoạt */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          <div
            className={`tab-item ${mode === "khach_san" ? "active" : ""}`}
            onClick={() => {
              setMode("khach_san");
              setSelectedId("");
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Hotel size={16} />
            Khách sạn & Chỗ ở
          </div>
          <div
            className={`tab-item ${mode === "hoat_dong" ? "active" : ""}`}
            onClick={() => {
              setMode("hoat_dong");
              setSelectedId("");
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Sparkles size={16} />
            Hoạt động vui chơi
          </div>
        </div>

        {/* Chế độ Khách sạn */}
        {mode === "khach_san" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className={`chip ${filterPool ? "on" : ""}`}
                  onClick={() => setFilterPool(!filterPool)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Waves size={13} />
                  Có hồ bơi
                </button>
                <button
                  className={`chip ${filterBreakfast ? "on" : ""}`}
                  onClick={() => setFilterBreakfast(!filterBreakfast)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Coffee size={13} />
                  Buffet sáng đã gồm
                </button>
                <button
                  className={`chip ${filterStars === 3 ? "on" : ""}`}
                  onClick={() => setFilterStars(filterStars === 3 ? "all" : 3)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Star size={12} fill="currentColor" /> 3 sao
                </button>
                <button
                  className={`chip ${filterStars === 4 ? "on" : ""}`}
                  onClick={() => setFilterStars(filterStars === 4 ? "all" : 4)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Star size={12} fill="currentColor" /> 4 sao
                </button>
                <button
                  className={`chip ${filterStars === 5 ? "on" : ""}`}
                  onClick={() => setFilterStars(filterStars === 5 ? "all" : 5)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Star size={12} fill="currentColor" /> 5 sao
                </button>
              </div>
              <div style={{ fontSize: 13, color: "var(--g500)" }}>
                Hiển thị {filteredHotels.length} / {hotels.length} khách sạn
              </div>
            </div>

            {loadingHotels && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--g500)", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                <Clock size={16} className="animate-spin" />
                Đang tải danh sách khách sạn...
              </div>
            )}

            {errorHotels && (
              <div className="banner banner-error" style={{ marginBottom: 16 }}>
                <div className="banner-mark">!</div>
                <div>{errorHotels}</div>
              </div>
            )}

            {!loadingHotels &&
              filteredHotels.map((h) => {
                const isSelected = selectedId === h.id;
                const totalStay = h.giaMotDem * soPhong * soDem;
                const diff = currentHotelTotal > 0 ? totalStay - currentHotelTotal : 0;

                const isThamKhao = h.doTinCay === "tham_khao";
                const isEstimated =
                  h.giaLaUocTinh || (h.doTinCay && h.doTinCay !== "xac_minh");

                return (
                  <div
                    key={h.id}
                    className={`card ${isSelected ? "card-selected" : "card-hover"}`}
                    style={{
                      padding: 20,
                      marginBottom: 14,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      border: isSelected ? "2px solid var(--p500)" : "1px solid var(--g300)",
                    }}
                    onClick={() => setSelectedId(h.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>{h.ten}</div>
                          {isThamKhao ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                background: "var(--g100)",
                                color: "var(--g700)",
                                borderRadius: "var(--r-full)",
                              }}
                            >
                              Tham khảo
                            </span>
                          ) : isEstimated ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                background: "var(--p100)",
                                color: "var(--p500)",
                                borderRadius: "var(--r-full)",
                              }}
                            >
                              Giá ước tính
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--g500)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          {h.soSao ? (
                            <span style={{ display: "inline-flex", gap: 2, color: "var(--warning)" }}>
                              {Array.from({ length: h.soSao }).map((_, idx) => (
                                <Star key={idx} size={13} fill="currentColor" />
                              ))}
                            </span>
                          ) : (
                            <span>Khách sạn</span>
                          )}
                          <span>· Khu vực {h.khuVuc || getDiemDenTen(plan?.request.diemDen) || "Trung tâm"}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--g700)", display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                          <span>Buffet: <b>{h.includesBreakfast ? "Đã gồm" : "Tự túc"}</b></span>
                          <span>Hồ bơi: <b>{h.hasPool ? "Có" : "Không"}</b></span>
                          {h.doTinCay && <span>Độ tin cậy: <b>{h.doTinCay}</b></span>}
                        </div>

                        {h.praised && h.praised.length > 0 && (
                          <div className="said" style={{ marginTop: 12 }}>
                            <div className="said-title">Đánh giá nổi bật:</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span>👍</span> {h.praised.join(", ")}
                            </div>
                            {h.watchOut && h.watchOut.length > 0 && (
                              <div style={{ color: "var(--warning)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                <AlertTriangle size={12} /> {h.watchOut.join(", ")}
                              </div>
                            )}
                            {h.tip && (
                              <div style={{ color: "var(--p500)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                <Lightbulb size={12} /> Mẹo: {h.tip}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right", minWidth: 160, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: isSelected ? "var(--p500)" : "var(--navy)" }}>
                          {fmt(h.giaMotDem)} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--g500)" }}>/đêm/phòng</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--g500)", marginTop: 2 }}>
                          {soDem} đêm ({soPhong} phòng): <b>{fmt(totalStay)}</b>
                        </div>
                        {diff !== 0 && (
                          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: diff > 0 ? "var(--error)" : "var(--success)" }}>
                            {diff > 0 ? `+${fmt(diff)}` : `−${fmt(Math.abs(diff))}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div
                        style={{
                          marginTop: 14,
                          paddingTop: 12,
                          borderTop: "1px dashed var(--p300)",
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview();
                          }}
                          disabled={loadingPreview}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                        >
                          {loadingPreview ? "Đang tính toán..." : "Xem trước thay đổi"}
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </>
        )}

        {/* Chế độ Hoạt động */}
        {mode === "hoat_dong" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className={`chip ${filterFreeOnly ? "on" : ""}`}
                  onClick={() => setFilterFreeOnly(!filterFreeOnly)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Ticket size={13} />
                  Miễn phí vé
                </button>
                <button
                  className={`chip ${filterTag === "all" ? "on" : ""}`}
                  onClick={() => setFilterTag("all")}
                >
                  Tất cả sở thích
                </button>
                <button
                  className={`chip ${filterTag === "bien" ? "on" : ""}`}
                  onClick={() => setFilterTag("bien")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Waves size={13} />
                  Biển
                </button>
                <button
                  className={`chip ${filterTag === "van_hoa_lich_su" ? "on" : ""}`}
                  onClick={() => setFilterTag("van_hoa_lich_su")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Landmark size={13} />
                  Văn hóa
                </button>
                <button
                  className={`chip ${filterTag === "giai_tri_vui_choi" ? "on" : ""}`}
                  onClick={() => setFilterTag("giai_tri_vui_choi")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Sparkles size={13} />
                  Vui chơi
                </button>
              </div>
              <div style={{ fontSize: 13, color: "var(--g500)" }}>
                Hiển thị {filteredActivities.length} / {activities.length} hoạt động
              </div>
            </div>

            {loadingActivities && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--g500)", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                <Clock size={16} className="animate-spin" />
                Đang tải danh sách hoạt động...
              </div>
            )}

            {errorActivities && (
              <div className="banner banner-error" style={{ marginBottom: 16 }}>
                <div className="banner-mark">!</div>
                <div>{errorActivities}</div>
              </div>
            )}

            {!loadingActivities &&
              filteredActivities.map((a) => {
                const isSelected = selectedId === a.id;
                const isThamKhao = a.doTinCay === "tham_khao";
                const isEstimated =
                  a.giaLaUocTinh || (a.doTinCay && a.doTinCay !== "xac_minh");

                return (
                  <div
                    key={a.id}
                    className={`card ${isSelected ? "card-selected" : "card-hover"}`}
                    style={{
                      padding: 18,
                      marginBottom: 12,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      border: isSelected ? "2px solid var(--p500)" : "1px solid var(--g300)",
                    }}
                    onClick={() => setSelectedId(a.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>
                            {a.ten}
                          </span>
                          {isThamKhao ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                background: "var(--g100)",
                                color: "var(--g700)",
                                borderRadius: "var(--r-full)",
                              }}
                            >
                              Tham khảo
                            </span>
                          ) : isEstimated ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                background: "var(--p100)",
                                color: "var(--p500)",
                                borderRadius: "var(--r-full)",
                              }}
                            >
                              Giá ước tính
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--g500)", marginBottom: 6 }}>
                          Khu vực: <b>{a.khuVuc}</b> · Thời lượng: <b>{a.thoiLuongPhut} phút</b>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {a.nhan.map((nh) => (
                            <span
                              key={nh}
                              style={{
                                padding: "2px 8px",
                                background: "var(--g100)",
                                color: "var(--g700)",
                                borderRadius: "var(--r-full)",
                                fontSize: 11,
                                fontWeight: 500,
                              }}
                            >
                              #{nh}
                            </span>
                          ))}
                          {a.diBoNhieu && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--warning)",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Footprints size={12} /> Cần đi bộ nhiều
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: isSelected ? "var(--p500)" : "var(--navy)" }}>
                          {a.giaVeNguoi === 0 ? (
                            <span style={{ color: "var(--success)" }}>Miễn phí</span>
                          ) : (
                            fmt(a.tongTienNhom)
                          )}
                        </div>
                        {a.giaVeNguoi > 0 && (
                          <div style={{ fontSize: 12, color: "var(--g500)" }}>
                            {soNguoi} vé × {fmt(a.giaVeNguoi)}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div
                        style={{
                          marginTop: 14,
                          paddingTop: 12,
                          borderTop: "1px dashed var(--p300)",
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview();
                          }}
                          disabled={loadingPreview}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                        >
                          {loadingPreview ? "Đang tính toán..." : "Xem trước thay đổi"}
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </>
        )}

        {errorPreview && (
          <div className="banner banner-error" style={{ marginTop: 16 }}>
            <div className="banner-mark">!</div>
            <div>{errorPreview}</div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button className="btn btn-outline" onClick={() => nav("b3-ke-hoach")}>
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePreview}
            disabled={!selectedId || loadingPreview}
            style={{
              opacity: !selectedId || loadingPreview ? 0.6 : 1,
              cursor: !selectedId || loadingPreview ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {loadingPreview ? "Đang tính toán..." : "Xem trước thay đổi"}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="tv-side">
        <BudgetBox plan={plan} />
      </div>
    </div>
  );
}
