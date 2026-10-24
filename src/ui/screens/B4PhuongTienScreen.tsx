"use client";
import React, { useState, useMemo } from "react";
import { useApp, extractSelectionFromPlan } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";
import { useOptions, type TransportOption } from "@/ui/hooks/useOptions";
import { usePlanPreview } from "@/ui/hooks/usePlanPreview";
import { Plane, Train, Bus, ArrowLeft, ArrowRight, Moon, Clock } from "lucide-react";
import { getDiemDenTen } from "@/contracts";

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

export function B4PhuongTienScreen() {
  const { nav, plan, editContext, setPreviewData } = useApp();

  const initialTab: "di" | "ve" =
    editContext?.huong === "ve" || editContext?.type === "phuong_tien_ve" ? "ve" : "di";

  const [tab, setTab] = useState<"di" | "ve">(initialTab);
  const [selectedIdState, setSelectedIdState] = useState<string>(editContext?.currentId || "");
  const setSelectedId = setSelectedIdState;
  const [filterType, setFilterType] = useState<string>("all");
  const [filterTime, setFilterTime] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"price" | "time" | "duration">("price");

  const soNguoi = plan?.request.soNguoi || 2;

  const { items: transports, loading: loadingOptions, error: errorOptions } =
    useOptions<TransportOption>({
      loai: "phuong_tien",
      huong: tab,
      soNguoi,
      diemDen: plan?.request.diemDen,
      diemDi: plan?.request.diemDi,
      soNgay: plan?.request.soNgay ?? undefined,
    });

  const { preview, loading: loadingPreview, error: errorPreview } = usePlanPreview();

  const [editContextTruoc, setEditContextTruoc] = useState(editContext);
  if (editContext !== editContextTruoc) {
    setEditContextTruoc(editContext);
    if (editContext?.currentId) setSelectedIdState(editContext.currentId);
  }
  // Chưa chọn thì mặc định là phương tiện đầu tiên
  const selectedId = selectedIdState || transports[0]?.id || "";

  // Bộ lọc & sắp xếp
  const filtered = useMemo(() => {
    let list = [...transports];

    if (filterType !== "all") {
      list = list.filter((t) => t.type === filterType);
    }

    if (filterTime === "morning") {
      list = list.filter((t) => {
        const hour = parseInt(t.departureTime.split(":")[0], 10);
        return hour < 12;
      });
    } else if (filterTime === "afternoon") {
      list = list.filter((t) => {
        const hour = parseInt(t.departureTime.split(":")[0], 10);
        return hour >= 12;
      });
    }

    list.sort((a, b) => {
      if (sortBy === "price") {
        return a.tongTienNhom - b.tongTienNhom;
      }
      if (sortBy === "duration") {
        return a.durationMinutes - b.durationMinutes;
      }
      return a.departureTime.localeCompare(b.departureTime);
    });

    return list;
  }, [transports, filterType, filterTime, sortBy]);

  const handlePreview = async () => {
    if (!plan || !selectedId) return;

    const selection = extractSelectionFromPlan(plan);
    const thayDoiType = tab === "di" ? ("phuong_tien_di" as const) : ("phuong_tien_ve" as const);

    const res = await preview({
      request: plan.request,
      selection,
      thayDoi: {
        loai: thayDoiType,
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
          loai: thayDoiType,
          idMoi: selectedId,
        },
      });
      nav("b6-xem-truoc");
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
        <h1 className="page-title">Chọn phương tiện di chuyển</h1>
        <p className="page-sub">
          Xem và so sánh các phương án di chuyển thực tế. Tính toán tức thì theo dữ liệu sẵn có.
        </p>

        {/* Tabs Chiều đi / Chiều về */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          <div
            className={`tab-item ${tab === "di" ? "active" : ""}`}
            onClick={() => {
              setTab("di");
              setSelectedId("");
            }}
          >
            Chiều đi ({(plan?.request.diemDi ? (typeof plan.request.diemDi === "string" ? plan.request.diemDi : plan.request.diemDi.ten) : "Điểm đi")} → {getDiemDenTen(plan?.request.diemDen) || "Điểm đến"})
          </div>
          <div
            className={`tab-item ${tab === "ve" ? "active" : ""}`}
            onClick={() => {
              setTab("ve");
              setSelectedId("");
            }}
          >
            Chiều về ({getDiemDenTen(plan?.request.diemDen) || "Điểm đến"} → {(plan?.request.diemDi ? (typeof plan.request.diemDi === "string" ? plan.request.diemDi : plan.request.diemDi.ten) : "Điểm đi")})
          </div>
        </div>

        {/* Thanh lọc & sắp xếp */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--g500)" }}>Loại:</span>
            <button
              className={`chip ${filterType === "all" ? "on" : ""}`}
              onClick={() => setFilterType("all")}
            >
              Tất cả
            </button>
            <button
              className={`chip ${filterType === "flight" || filterType === "PLANE" ? "on" : ""}`}
              onClick={() => setFilterType(filterType === "PLANE" ? "all" : "PLANE")}
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Plane size={13} />
              Máy bay
            </button>
            <button
              className={`chip ${filterType === "train" || filterType === "TRAIN" ? "on" : ""}`}
              onClick={() => setFilterType(filterType === "TRAIN" ? "all" : "TRAIN")}
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Train size={13} />
              Tàu hỏa
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--g500)" }}>Giờ:</span>
            <button
              className={`chip ${filterTime === "all" ? "on" : ""}`}
              onClick={() => setFilterTime("all")}
            >
              Tất cả
            </button>
            <button
              className={`chip ${filterTime === "morning" ? "on" : ""}`}
              onClick={() => setFilterTime("morning")}
            >
              Buổi sáng
            </button>
            <button
              className={`chip ${filterTime === "afternoon" ? "on" : ""}`}
              onClick={() => setFilterTime("afternoon")}
            >
              Chiều/Tối
            </button>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--g500)" }}>Xếp theo:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "price" | "time" | "duration")}
              style={{
                padding: "4px 8px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--g300)",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--navy)",
                background: "var(--surface)",
              }}
            >
              <option value="price">Giá thấp nhất</option>
              <option value="duration">Thời gian nhanh nhất</option>
              <option value="time">Giờ khởi hành sớm nhất</option>
            </select>
          </div>
        </div>

        {errorOptions && (
          <div className="banner banner-error" style={{ marginBottom: 16 }}>
            <div className="banner-mark">!</div>
            <div>{errorOptions}</div>
          </div>
        )}

        {errorPreview && (
          <div className="banner banner-error" style={{ marginBottom: 16 }}>
            <div className="banner-mark">!</div>
            <div>{errorPreview}</div>
          </div>
        )}

        {loadingOptions && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--g500)", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            <Clock size={16} className="animate-spin" />
            Đang tải danh sách phương tiện...
          </div>
        )}

        {/* Danh sách phương tiện thực tế */}
        {!loadingOptions &&
          filtered.map((f) => {
            const isSelected = selectedId === f.id;
            const isCurrent = editContext?.currentId === f.id;
            const isPlane = f.type === "flight" || f.type === "PLANE";
            const isTrain = f.type === "train" || f.type === "TRAIN";

            const isThamKhao = f.doTinCay === "tham_khao";
            const isEstimated =
              f.giaLaUocTinh ||
              f.flags.includes("GIA_UOC_TINH") ||
              (f.doTinCay && f.doTinCay !== "xac_minh");

            return (
              <div
                key={f.id}
                className={`card ${isSelected ? "card-selected" : "card-hover"}`}
                style={{
                  padding: 18,
                  marginBottom: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border: isSelected ? "2px solid var(--p500)" : "1px solid var(--g300)",
                }}
                onClick={() => setSelectedId(f.id)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)" }}>{f.departureTime}</div>
                      <div style={{ fontSize: 12, color: "var(--g500)" }}>{f.origin}</div>
                    </div>
                    <div style={{ textAlign: "center", color: "var(--g400)", fontSize: 13, minWidth: 90 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        {isPlane ? <Plane size={14} /> : isTrain ? <Train size={14} /> : <Bus size={14} />}
                        <span>──────</span>
                      </div>
                      <div style={{ fontSize: 12 }}>{f.durationMinutes} phút</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)" }}>{f.arrivalTime}</div>
                      <div style={{ fontSize: 12, color: "var(--g500)" }}>{f.destination}</div>
                    </div>
                    <div style={{ marginLeft: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
                        {f.nguon?.startsWith("uoc_luong:khoang_cach:")
                          ? `Ước tính theo quãng đường ${f.nguon.replace("uoc_luong:khoang_cach:", "").replace("km", "")} km`
                          : f.carrier} {f.code && <span style={{ color: "var(--g500)", fontWeight: 500 }}>· {f.code}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--g500)" }}>
                        {fmt(f.pricePerPerson)} / người
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: isSelected ? "var(--p500)" : "var(--navy)" }}>
                      {fmt(f.tongTienNhom)}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--g500)" }}>{soNguoi} người</div>

                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6, flexWrap: "wrap" }}>
                      {isCurrent && (
                        <span
                          style={{
                            padding: "2px 8px",
                            background: "var(--g100)",
                            color: "var(--g700)",
                            borderRadius: "var(--r-full)",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Đang chọn
                        </span>
                      )}
                      {f.flags.includes("XE_DEM") && (
                        <span
                          style={{
                            padding: "2px 8px",
                            background: "var(--color-warning-bg)",
                            color: "var(--color-warning-text)",
                            borderRadius: "var(--r-full)",
                            fontSize: 11,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Moon size={11} />
                          Chuyến đêm
                        </span>
                      )}
                      {isThamKhao ? (
                        <span
                          style={{
                            padding: "2px 8px",
                            background: "var(--g100)",
                            color: "var(--g700)",
                            borderRadius: "var(--r-full)",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Tham khảo
                        </span>
                      ) : isEstimated ? (
                        <span
                          style={{
                            padding: "2px 8px",
                            background: "var(--p100)",
                            color: "var(--p500)",
                            borderRadius: "var(--r-full)",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Giá ước tính
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 10,
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

        {!loadingOptions && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--g500)" }}>
            Không có phương tiện nào khớp với bộ lọc hiện tại.
          </div>
        )}

        {/* Nút hành động */}
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
