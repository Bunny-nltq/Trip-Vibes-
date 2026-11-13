"use client";
import React, { useState, useMemo } from "react";
import { useApp } from "@/ui/context/AppContext";
import { gomDiaDiemTheoNgay, tinhTienDo, type ProgressPlace, } from "@/core/tripProgress";
import { tripBudgetProgress } from "@/core/soSanhThucTe";
import { B9ChiDuongPopover } from "@/ui/components/B9ChiDuongPopover";
import { Bus, Check, BookOpen, Navigation, Receipt } from "lucide-react";
import { getDestinationImage, getActivityImage,getHotelImage,getRestaurantImage } from "@/ui/lib/imageMap";
const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";
export function B8ChuyenDiScreen() {
    const { nav, confirmed, plan, tripConfig, ledger, activeDay, setActiveDay, tickedPlaces, setPlacesTicked, toggleTickPlace, untickPlace, openB10, isSampleDataActive,user,saveCurrentTripToAccount,activeSavedTrip, } = useApp();
    const [finishing,setFinishing]=useState(false),[finishError,setFinishError]=useState("");
    const finishTrip=async()=>{if(finishing)return;if(!user){nav("login");return;}setFinishing(true);const result=await saveCurrentTripToAccount(undefined,{status:"completed"});if(result.ok)nav("saved-trips");else setFinishError(result.message||"Chưa lưu được nhật ký.");setFinishing(false);};
    // Toast khi tick địa điểm
    const [toast, setToast] = useState<{
        id: string;
        ten: string;
        ngay: number;
    } | null>(null);
    // Popover B9
    const [popoverPlace, setPopoverPlace] = useState<ProgressPlace | null>(null);
    // Gom địa điểm thực tế từ plan
    const placesByDay = useMemo(() => {
        if (!plan)
            return {};
        return gomDiaDiemTheoNgay(plan);
    }, [plan]);
    const soNgay = plan?.request.soNgay || 3;
    const dayNumbers = useMemo(() => {
        return Array.from({ length: soNgay }, (_, i) => i + 1);
    }, [soNgay]);
    const [showAllDays, setShowAllDays] = useState(false);
    const currentDayPlaces = showAllDays ? dayNumbers.flatMap(day => placesByDay[day] || []) : placesByDay[activeDay] || [];
    // Tiến độ tổng = tổng số địa điểm của mọi ngày
    const progress = useMemo(() => {
        return tinhTienDo(placesByDay, tickedPlaces);
    }, [placesByDay, tickedPlaces]);
    // Ngân sách tính chuẩn theo soSanhKeHoachThucTe (ngân sách - đặt trước - chi tiêu thực tế)
    const budgetData=useMemo(()=>tripBudgetProgress(plan,ledger,activeDay,tripConfig.budget||0),[plan,ledger,activeDay,tripConfig.budget]);
    // Nếu chưa xác nhận kế hoạch:
    if (!confirmed) {
        const hasExistingPlan = plan && plan.items && plan.items.length > 0;
        const destName = plan?.request.diemDen
            ? (typeof plan.request.diemDen === "string" ? plan.request.diemDen : plan.request.diemDen.ten)
            : null;
        return (<div className="Row2" style={{ padding: "0 0 40px" }}>
        <div className="MainWide">
          <div className="DayCard" style={{
                padding: "48px 32px",
                textAlign: "center",
                maxWidth: 580,
                margin: "60px auto",
            }}>
            <div style={{
                width: 56,
                height: 56,
                borderRadius: "var(--r-full)",
                background: "var(--color-primary-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "var(--color-primary-main)",
            }}>
              <BookOpen size={28}/>
            </div>

            {hasExistingPlan ? (<>
                <h1 className="H1" style={{ fontSize: 24, marginBottom: 8, color: "var(--color-text)" }}>
                  Kế hoạch {destName ? `chuyến đi ${destName}` : "chưa được chốt"}
                </h1>
                <div className="Sub" style={{ marginBottom: 24, color: "var(--color-text-sub)", lineHeight: 1.6 }}>
                  Bạn đang có kế hoạch {destName || "du lịch"} ({soNgay} ngày) gồm {plan?.items.length} hạng mục lịch trình. Chốt chuyến đi để bắt đầu theo dõi thời gian thực, đánh dấu điểm đến và ghi chép chi tiêu.
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button type="button" className="Btn BtnPrimary" onClick={() => nav("b7-xac-nhan")} style={{ minWidth: 180 }}>
                    Xem & Chốt chuyến đi
                  </button>
                  <button type="button" className="Btn BtnGhost" onClick={() => nav("b3-ke-hoach")}>
                    Xem lại lịch trình
                  </button>
                </div>
              </>) : (<>
                <h1 className="H1" style={{ fontSize: 24, marginBottom: 8, color: "var(--color-text)" }}>
                  Chưa có chuyến nào
                </h1>
                <div className="Sub" style={{ marginBottom: 24, color: "var(--color-text-sub)", lineHeight: 1.6 }}>
                  Bạn chưa có chuyến đi nào được tạo. Hãy bắt đầu lập kế hoạch ngay để theo dõi hành trình và chi tiêu.
                </div>
                <button type="button" className="Btn BtnPrimary" style={{ margin: "0 auto" }} onClick={() => nav("b1-chon-nhanh")}>
                  Lập kế hoạch
                </button>
              </>)}
          </div>
        </div>
      </div>);
    }
    // Nếu kế hoạch rỗng hoặc chưa có dữ liệu
    if (!plan || plan.items.length === 0) {
        return (<div className="Row2" style={{ padding: "0 0 40px" }}>
        <div className="MainWide">
          <div className="DayCard" style={{
                padding: "48px 32px",
                textAlign: "center",
                maxWidth: 560,
                margin: "60px auto",
            }}>
            <h1 className="H1" style={{ fontSize: 22, marginBottom: 8 }}>
              Chưa có dữ liệu kế hoạch
            </h1>
            <div className="Sub" style={{ marginBottom: 24 }}>
              Kế hoạch chuyến đi của bạn hiện đang rỗng. Hãy quay lại tạo kế hoạch.
            </div>
            <button type="button" className="Btn BtnPrimary" style={{ margin: "0 auto" }} onClick={() => nav("b1-chon-nhanh")}>
              Lập kế hoạch
            </button>
          </div>
        </div>
      </div>);
    }
    const handleToggle = (place: ProgressPlace) => {
        const isNowTicked = toggleTickPlace(place.id);
        if (isNowTicked) {
            setToast({ id: place.id, ten: place.ten, ngay: place.ngay });
        }
        else {
            if (toast?.id === place.id) {
                setToast(null);
            }
        }
    };
    const handleUndoToast = () => {
        if (toast) {
            untickPlace(toast.id);
            setToast(null);
        }
    };
    const currentDayDone = currentDayPlaces.filter((p) => tickedPlaces[p.id]).length;
    return (<div className="Row2" style={{ padding: "0 0 40px" }}>
      {/* CỘT CHÍNH (780px) */}
      <div className="Main">
        {/* Ba tab Nhật ký chuyến đi: Hành trình, Chi tiêu, Ngân sách */}


        {/* Banner điểm đến thật */}
        {(() => {
            const destName = plan?.request.diemDen
                ? typeof plan.request.diemDen === "string"
                    ? plan.request.diemDen
                    : plan.request.diemDen.ten
                : "Đà Nẵng";
            const destImg = getDestinationImage(destName);
            return (<div style={{
                    position: "relative",
                    borderRadius: "var(--r-xl)",
                    overflow: "hidden",
                    height: 140,
                    marginTop: 16,
                    marginBottom: 16,
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                }}>
              <img src={destImg.urlThumb || destImg.url} alt={destImg.alt || destName} loading="lazy" style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}/>
              <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(15, 23, 42, 0.78) 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "14px 18px",
                    color: "var(--color-primary-text)",
                }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{destName}</div>
                {null}
              </div>
            </div>);
        })()}

        <h1 className="H1">Chuyến đi</h1>
        <div className="Sub">
          {progress.tong > 0
            ? `${progress.daDen} trong ${progress.tong} hạng mục đã hoàn thành`
            : "Chưa có hạng mục trong kế hoạch"}
        </div>

        {isSampleDataActive && (<div style={{
                background: "var(--color-warning-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-warning-text)",
                padding: "10px 16px",
                borderRadius: 14,
                fontSize: 13,
                marginBottom: 16,
                fontWeight: 500,
            }}>
            Lưu ý: Kế hoạch đang sử dụng dữ liệu mẫu để thử nghiệm.
          </div>)}

        {/* TABS NGÀY - có cùng kiểu ở mọi trạng thái */}
        <div className="Tabs">
          <button type="button" className={`Tab ${showAllDays ? "TabOn" : ""}`} onClick={() => setShowAllDays(true)}>Tất cả ngày</button>
          {dayNumbers.map((d) => (<button type="button" key={d} className={`Tab ${!showAllDays && activeDay === d ? "TabOn" : ""}`} onClick={() => { setShowAllDays(false); setActiveDay(d); }}>
              Ngày {d}
            </button>))}
        </div>

        {/* CARD LỊCH TRÌNH NGÀY HIỆN TẠI */}
        <div className="DayCard">
          <div className="DayHead">
            <div className="DayName">{showAllDays ? "Tất cả ngày" : `Ngày ${activeDay}`}</div>
            <div className="DayTotal">
              {currentDayPlaces.length > 0 && (
                <label className="TripBulk">
                  <input type="checkbox" checked={currentDayDone === currentDayPlaces.length}
                    disabled={activeSavedTrip?.status === "completed"}
                    onChange={event => setPlacesTicked(currentDayPlaces.map(place => place.id), event.target.checked)} />
                  {showAllDays ? "Chọn tất cả mục" : `Chọn tất cả mục ngày ${activeDay}`}
                </label>
              )}
              {currentDayDone}/{currentDayPlaces.length} hạng mục đã hoàn thành
            </div>
          </div>

          {currentDayPlaces.length === 0 && (<div style={{ padding: "32px 20px", textAlign: "center", color: "var(--color-text-sub)" }}>
              Chưa có lịch trình hoạt động nào cho Ngày {activeDay}.
            </div>)}

          {currentDayPlaces.map((place, idx) => {
            const isDone = Boolean(tickedPlaces[place.id]);
            const isLast = idx === currentDayPlaces.length - 1;
            const hasRealAddress = Boolean(place.diaChi) &&
                place.diaChi!.trim().toLowerCase() !== place.ten.trim().toLowerCase();
            const placeImg=place.hangMuc==="Chỗ ở"?getHotelImage(undefined,place.ten):place.hangMuc==="Ăn uống"?getRestaurantImage(place.ten):getActivityImage(place.hangMuc,place.ten);
            return (<div key={place.id} className={`Item ${isLast ? "NoLine" : ""}`}>
                {/* Checkbox Box */}
                <button type="button" role="checkbox" aria-checked={isDone} aria-label={`Hoàn thành ${place.ten}, ngày ${place.ngay}`} disabled={activeSavedTrip?.status==="completed"} className={`Box ${isDone?"BoxOn":""}`} onClick={()=>handleToggle(place)}>{isDone?<Check size={16}/>:null}</button>

                {/* Ảnh địa điểm thật */}
                {place.hangMuc==="Di chuyển"?<Bus size={24}/>:                <img src={placeImg.urlThumb || placeImg.url} alt={`Ảnh minh họa ${place.hangMuc.toLowerCase()}`} loading="lazy" style={{
                    width: 38,
                    height: 38,
                    borderRadius: "var(--r-md)",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "1px solid var(--color-border)",
                }}/>}

                {showAllDays && <span>Ngày {place.ngay}</span>}
                {/* Giờ */}
                <div className="Time">{place.gio || "—"}</div>

                {/* Thông tin */}
                <div className="Info" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div className="InfoTitle" style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>
                    {place.ten}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "var(--r-sm)",
                        background: "var(--color-surface-sub)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-sub)",
                      }}
                    >
                      {place.hangMuc}
                    </span>
                    {hasRealAddress && (
                      <span className="InfoSub" style={{ fontSize: 12 }}>
                        {place.diaChi}
                      </span>
                    )}
                  </div>
                </div>

                {/* Chi phí & thời gian tới điểm kế */}
                <div className="Amount" style={{ width: 140, flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)" }}>
                    {place.priceKnown ? fmt(place.thanhTien) : "Chưa có giá"}
                  </div>
                  {place.thoiGianDiChuyenPhut && (
                    <span className="AmountSub" style={{ fontSize: 11, color: "var(--color-text-sub)" }}>
                      {place.thoiGianDiChuyenPhut} phút tới điểm kế
                    </span>
                  )}
                </div>

                {/* Các nút thao tác: Chỉ đường & Ghi chi tiêu */}
                <div className="Action" style={{ display: "flex", gap: 6, flexShrink: 0, width: "auto" }}>
                  <button
                    type="button"
                    className="Btn BtnSmall"
                    onClick={() => setPopoverPlace(place)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-primary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Navigation size={12} />
                    <span>Chỉ đường</span>
                  </button>
                  <button
                    type="button"
                    className="Btn BtnSmall"
                    onClick={() =>
                      openB10({
                        tenCuaHang: place.ten,
                        ngayTrongChuyen: place.ngay,
                        soTienVND: place.thanhTien > 0 ? place.thanhTien : undefined,
                        hangMuc:
                          place.hangMuc === "Chỗ ở"
                            ? "cho_o"
                            : place.hangMuc === "Di chuyển"
                            ? "di_chuyen"
                            : place.hangMuc === "Ăn uống"
                            ? "an_uong"
                            : "vui_choi",
                      })
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--color-primary-tint)",
                      background: "var(--color-primary-tint)",
                      color: "var(--color-primary)",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Receipt size={12} />
                    <span>Ghi chi tiêu</span>
                  </button>
                </div>
              </div>);
        })}
        </div>

        <div className="Hint">
          Đánh dấu hạng mục đã hoàn thành. Thao tác này không tự ghi nhận thanh toán.
        </div>
      </div>

      {/* CỘT PHẢI: TỔNG QUAN NGÂN SÁCH (324px) */}
      <div className="Side TripExpenseSide">
        <div className="BudgetSummary">
          <div className="Label">Ngân sách còn lại</div>
          <div className="Big">{fmt(budgetData.conLai)}</div>
          <div className="BigSub">
            Tổng thực chi {fmt(budgetData.daChi)} · Trong đó vé & chỗ ở {fmt(budgetData.datTruoc)}
          </div>

          {/* Thanh ngân sách */}
          <div className="BarTrack">
            <div className={`BarFill ${budgetData.percentSpent > 90 ? "BarRed" : ""}`} style={{ width: `${budgetData.percentSpent}%` }}/>
          </div>

          <div className="Divider" style={{ marginTop: 16 }}/>

          <div className="Link" onClick={() => nav("b11-ngan-sach")} style={{ cursor: "pointer" }}>
            Xem chi tiết ngân sách
          </div>
        </div>

        <div><button type="button" className="Btn BtnPrimary" disabled={finishing||activeSavedTrip?.status==="completed"} onClick={()=>void finishTrip()}>{finishing?"Đang lưu…":user?"Hoàn thành chuyến đi":"Đăng nhập để lưu nhật ký"}</button>{finishError&&<p role="alert">{finishError}</p>}</div>
        {/* Nút thêm nhanh chi tiêu */}
        <div style={{ marginTop: 16 }}>
          <button type="button" className="Btn BtnPrimary BtnFull" onClick={() => openB10({ ngayTrongChuyen: activeDay })}>
            + Thêm chi tiêu
          </button>
        </div>
      </div>

      {/* Popover B9 Chỉ đường */}
      {popoverPlace && (<B9ChiDuongPopover place={popoverPlace} onClose={() => setPopoverPlace(null)}/>)}

      {/* Toast khi tick */}
      {toast && (<div className="Toast">
          <span>
            ✓ Đã đến: <strong>{toast.ten}</strong>
          </span>
          <button type="button" className="ToastBtn" onClick={() => {
                openB10({ tenCuaHang: toast.ten, ngayTrongChuyen: toast.ngay });
                setToast(null);
            }} style={{ background: "var(--color-primary)", borderColor: "var(--color-primary)" }}>
            Ghi chi tiêu
          </button>
          <button type="button" className="ToastBtn" onClick={handleUndoToast}>
            Hoàn tác
          </button>
        </div>)}
    </div>);
}
export default B8ChuyenDiScreen;
