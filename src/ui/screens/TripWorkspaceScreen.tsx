"use client";
import React, { useEffect, useRef, useState } from "react";
import { useApp } from "@/ui/context/AppContext";
import { WorkspaceFrame } from "@/ui/components/WorkspaceFrame";
import styles from "@/ui/components/Workspace.module.css";
import { PlanItemSchema, getDiemDenTen, type PlanItem, type Plan, type PlaceSuggestion, type SavedTrip } from "@/contracts";
import { createManualTrip, recalculatePlan, ledgerTotal, planDiffSummary, unspentBudget } from "@/core/tripWorkspace";
import {planItemMaps} from "@/core/maps";
import { findTripTimeSlot, tripPeriods, type TripPeriod } from "@/core/tripTimeSlot";
import { parseMapsReference } from "@/core/mapsReference";
import { useCompanion } from "@/ui/hooks/useCompanion";
import { MAX_STORED_TRIP_DAYS } from "@/core/assumptions";
const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`;
const statuses: Record<NonNullable<SavedTrip["status"]>, string> = { planned: "Chuẩn bị", in_progress: "Đang diễn ra", completed: "Đã hoàn thành", cancelled: "Đã hủy" };
const blankItem = (day: number): PlanItem => ({ id: crypto.randomUUID(), ngay: day, gio: "09:00", hangMuc: "Vui chơi", noiDung: "", soLuong: 1, donGia: 0, thanhTien: 0, refId: null, nguon: "Người dùng nhập", doTinCay: "nguoi_dung_nhap", giaLaUocTinh: true, priceKnown: false, durationMinutes: 60, state: "pending" });
export function TripWorkspaceScreen() {
    const { plan, newTrip, applyPlan, ledger, nav, activeDay, setActiveDay, saveCurrentTripToAccount, activeSavedTrip, isSampleDataActive, canUndo, canRedo, undoPlan, redoPlan, user } = useApp();
    const [editing, setEditing] = useState<PlanItem | null>(null), [editIndex, setEditIndex] = useState<number | null>(null), [pending, setPending] = useState<Plan | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [pendingAction, setPendingAction] = useState("");
    useEffect(() => {
        if (pending) {
            previewRef.current?.focus({ preventScroll: true });
            previewRef.current?.scrollIntoView({ block: "center" });
        }
    }, [pending]);
    const [message, setMessage] = useState(""), [maps, setMaps] = useState(""), [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<NonNullable<SavedTrip["status"]>>(activeSavedTrip?.status || "planned"), [journal, setJournal] = useState(activeSavedTrip?.journal || ""), [startDate, setStartDate] = useState(activeSavedTrip?.startDate || "");
    const [title, setTitle] = useState(activeSavedTrip?.title || (plan ? getDiemDenTen(plan.request.diemDen) : "")), [days, setDays] = useState(plan?.request.soNgay || 1), [budget, setBudget] = useState(plan?.request.ngansachTongVND || 0);
    const [manualPeople, setManualPeople] = useState("");
    const companion = useCompanion();
    const [minutes, setMinutes] = useState(120);
    const [kind, setKind] = useState<"cafe" | "activity" | "restaurant">("cafe"), [period, setPeriod] = useState<TripPeriod>("morning");
    if (!plan)
        return <WorkspaceFrame><div className={styles.card}><h1>Bắt đầu một hành trình mới</h1><p>Bạn chưa tạo lịch trình. Chọn gợi ý theo nhu cầu hoặc tự thêm những điểm dừng yêu thích.</p><button className={styles.primary} onClick={() => nav("b1-chon-nhanh")}>Tìm hành trình phù hợp</button></div><form className={styles.card} onSubmit={event => { event.preventDefault(); try {
            applyPlan(createManualTrip(title, days, budget, Number(manualPeople)));
            setMessage("");
        }
        catch {
            setMessage("Kiểm tra tên, số ngày, số người và ngân sách trước khi tạo.");
        } }}><h2>Hoặc tự xây lịch trình</h2><div className={styles.grid}><label>Điểm đến / tên chuyến<input required value={title} onChange={event => setTitle(event.target.value)} placeholder="Bạn muốn khám phá đâu?"/></label><label>Số ngày<input type="number" min={1} max={MAX_STORED_TRIP_DAYS} required value={days} onChange={event => setDays(Number(event.target.value))}/></label><label>Số người<input type="number" min={1} max={20} required value={manualPeople} onChange={event => setManualPeople(event.target.value)}/></label><label>Ngân sách VND<input type="number" min={1} step={1} required value={budget || ""} onChange={event => setBudget(Number(event.target.value))}/></label></div><button className={styles.primary}>Tạo lịch trình trống</button><p role="status">{message}</p></form></WorkspaceFrame>;
    const readonly = activeSavedTrip?.status === "completed";
    const preview = (items: PlanItem[], action = "") => {
        try {
            setPending(recalculatePlan(plan, items));
            setPendingAction(action);
            setMessage("");
        }
        catch {
            setMessage("Dữ liệu lịch trình không hợp lệ. Hãy kiểm tra ngày, giờ và giá.");
        }
    };
    const edit = (index: number) => { setEditIndex(index); setEditing({ ...plan.items[index] }); setMaps(""); setPending(null); };
    const patch = (value: Partial<PlanItem>) => setEditing(current => current ? { ...current, ...value } : current);
    const mark = (index: number, value: PlanItem["state"]) => preview(plan.items.map((item, i) => i === index ? { ...item, state: value } : item));
    const previewSuggestion = (suggestion: PlaceSuggestion) => {
        const gio = findTripTimeSlot(plan.items, activeDay, period, suggestion.duration);
        if (!gio) {
            setMessage(`Ngày ${activeDay} không còn khoảng trống đủ ${suggestion.duration} phút vào buổi ${tripPeriods[period].label.toLowerCase()}.`);
            return;
        }
        const item = { ...blankItem(activeDay), gio, destinationName: suggestion.name, soLuong: plan.request.soNguoi || 1, noiDung: suggestion.name,diaChi:suggestion.address,mapsUrl:suggestion.mapsUrl, refId: suggestion.id, latitude: suggestion.latitude, longitude: suggestion.longitude, donGia: suggestion.price || 0, priceKnown: suggestion.price !== null, durationMinutes: suggestion.duration, nguon: `${suggestion.source} · ${suggestion.fetchedAt}`, hangMuc: suggestion.kind === "activity" ? "Vui chơi" as const : "Ăn uống" as const };
        preview([...plan.items, item].sort((a, b) => a.ngay - b.ngay || (a.gio ?? "99:99").localeCompare(b.gio ?? "99:99")));
    };
    const pendingDiff = pending ? planDiffSummary(plan, pending) : null;
    return <WorkspaceFrame>
 <div><h1>Hành trình của bạn</h1><p>Chỉnh lịch trình, lưu nhật ký và gợi ý phần tiếp theo. Giá dự kiến và thực chi được quản lý riêng.</p></div>
 <div className={styles.toolbar}><button onClick={newTrip}>Tạo chuyến mới</button><button disabled={!canUndo || readonly} onClick={undoPlan}>Hoàn tác</button><button disabled={!canRedo || readonly} onClick={redoPlan}>Làm lại</button></div>
 {isSampleDataActive && <div className={styles.notice}>Đang xem bản mẫu. Dùng biểu mẫu dưới để tạo lịch trình riêng hoặc lập kế hoạch tự động.</div>}

 <div className={styles.stats}><div className={styles.card}><small>Chi phí đã biết trong kế hoạch</small><strong>{money(plan.tongKet.tongVND)}</strong></div><div className={styles.card}><small>Đã ghi thực chi</small><strong>{money(ledgerTotal(ledger))}</strong></div><div className={styles.card}><small>Thời lượng</small><strong>{plan.request.soNgay} ngày</strong></div><div className={styles.card}><small>Nhật ký</small><strong>{statuses[activeSavedTrip?.status || "planned"]}</strong></div></div>
 {plan.items.some(item => item.priceKnown === false || (!item.priceKnown && item.donGia === 0)) && <div className={styles.notice}>Một số điểm chưa có giá. Tổng trên chỉ gồm giá đã nhập; không bảo đảm đủ ngân sách cho phần chưa biết.</div>}
 <div className={styles.card}><div className={styles.row}><label>Ngày đang xem<input aria-label="Ngày đang xem" type="number" min={1} max={plan.request.soNgay || 1} value={activeDay} onChange={e => {
            const n = Number(e.target.value);
            if (Number.isInteger(n) && n >= 1 && n <= (plan.request.soNgay || 1))
                setActiveDay(n);
        }}/></label><button disabled={readonly} onClick={() => { setEditIndex(null); setEditing(blankItem(activeDay)); setMaps(""); setPending(null); }}>Thêm địa điểm</button></div>
 <ol className={styles.list}>{plan.items.map((item, index) => ({ item, index })).filter(({ item }) => item.ngay === activeDay).map(({ item, index }) => <li key={item.id || `${index}-${item.refId}`} className={styles.card}>
 <div><h2>{item.gio || "Chưa có giờ"} · {item.noiDung}</h2><p>{item.leg ? `${item.leg} · ` : ""}{item.hangMuc} · {item.priceKnown === false ? "Chưa có giá" : money(item.thanhTien)} · {item.state === "visited" ? "Đã ghé" : item.state === "closed" ? "Báo đóng cửa" : item.state === "skipped" ? "Bỏ qua" : "Chưa thực hiện"}{item.locked ? " · Đã khóa" : ""}</p><small>Nguồn: {item.nguon || "Chưa có nguồn"}</small></div>
 <div className={styles.toolbar}><button disabled={readonly || item.locked || item.state === "visited"} onClick={() => edit(index)}>Sửa</button><button disabled={readonly || item.locked || item.state === "visited"} onClick={() => {
                if (window.confirm("Bỏ điểm này khỏi kế hoạch? Chi tiêu đã ghi vẫn được giữ."))
                    preview(plan.items.filter((_, i) => i !== index));
            }}>Xóa điểm</button>
 <button disabled={readonly} onClick={() => mark(index, item.state === "visited" ? "pending" : "visited")}>{item.state === "visited" ? "Đánh dấu chưa ghé" : "Đã ghé"}</button><button disabled={readonly || item.state === "visited" || item.locked} onClick={() => mark(index, "closed")}>Báo đóng cửa</button><button disabled={readonly || item.state === "visited" || item.locked} onClick={() => mark(index, "skipped")}>Bỏ qua</button><button disabled={readonly} onClick={() => preview(
     plan.items.map((p, i) => i === index ? { ...p, locked: !p.locked } : p),
     `${item.locked ? "Bỏ khóa" : "Khóa"} ${item.destinationName || item.noiDung}`
 )}>{item.locked ? "Bỏ khóa" : "Khóa điểm"}</button>
 <button disabled={readonly || index === 0 || item.locked || item.state === "visited" || plan.items[index - 1]?.locked || plan.items[index - 1]?.state === "visited" || plan.items[index - 1]?.ngay !== activeDay} onClick={() => { const next = [...plan.items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; preview(next); }}>Lên</button>
 <button disabled={readonly || index === plan.items.length - 1 || item.locked || item.state === "visited" || plan.items[index + 1]?.locked || plan.items[index + 1]?.state === "visited" || plan.items[index + 1]?.ngay !== activeDay} onClick={() => { const next = [...plan.items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; preview(next); }}>Xuống</button>
 {item.mapsUrl && <a href={planItemMaps(item,getDiemDenTen(plan.request.diemDen)).xem} target="_blank" rel="noreferrer">Mở Google Maps</a>}
</div></li>)}</ol></div>
 {editing && <form className={styles.card} onSubmit={e => {
                e.preventDefault();
                const parsed = PlanItemSchema.safeParse(editing);
                if (!parsed.success || editing.ngay > (plan.request.soNgay || 1) || !editing.noiDung.trim() || (editing.gio && !/^([01]\d|2[0-3]):[0-5]\d$/.test(editing.gio))) {
                    setMessage("Tên, ngày, giờ hoặc giá không hợp lệ.");
                    return;
                }
                preview(editIndex === null ? [...plan.items, parsed.data] : plan.items.map((p, i) => i === editIndex ? parsed.data : p));
            }}>
 <h2>{editIndex === null ? "Thêm địa điểm" : "Sửa địa điểm"}</h2><div className={styles.row}><label>Liên kết Google Maps (tùy chọn)<input type="url" value={maps} onChange={e => setMaps(e.target.value)}/></label><button type="button" onClick={() => {
                try {
                    const parsed = parseMapsReference(maps);
                    patch({ noiDung: parsed.name || editing.noiDung, mapsUrl: parsed.url, latitude: parsed.latitude ?? undefined, longitude: parsed.longitude ?? undefined });
                    setMessage("Hãy kiểm tra tên địa điểm trước khi thêm. Với liên kết rút gọn, bạn có thể nhập tên nếu ứng dụng chưa đọc được.");
                }
                catch (error) {
                    setMessage(error instanceof Error ? error.message : "Liên kết không hợp lệ.");
                }
            }}>Đọc thông tin liên kết</button></div>
 <div className={styles.grid}><label>Tên địa điểm<input required value={editing.noiDung} onChange={e => patch({ noiDung: e.target.value })}/></label><label>Chặng / thành phố<input value={editing.leg || ""} onChange={e => patch({ leg: e.target.value })}/></label><label>Ngày thứ<input type="number" required min={1} max={plan.request.soNgay || 1} value={editing.ngay} onChange={e => patch({ ngay: Number(e.target.value) })}/></label><label>Giờ bắt đầu<input type="time" value={editing.gio || ""} onChange={e => patch({ gio: e.target.value || null })}/></label><label>Thời lượng phút<input type="number" min={1} max={1440} value={editing.durationMinutes || 60} onChange={e => patch({ durationMinutes: Number(e.target.value) })}/></label><label>Hạng mục<select value={editing.hangMuc} onChange={e => patch({ hangMuc: e.target.value as PlanItem["hangMuc"] })}>{["Vui chơi", "Ăn uống", "Di chuyển", "Chỗ ở"].map(c => <option key={c}>{c}</option>)}</select></label><label>Đơn giá dự kiến VND<input type="number" min={0} step={1} value={editing.donGia} onChange={e => patch({ donGia: Number(e.target.value), priceKnown: true })}/></label><label>Số lượng<input type="number" min={1} step={1} value={editing.soLuong} onChange={e => patch({ soLuong: Number(e.target.value) })}/></label></div>
 <label className={styles.row}><input type="checkbox" checked={editing.priceKnown !== false} onChange={e => patch({ priceKnown: e.target.checked })}/> Đã có giá dự kiến (bỏ chọn nếu chưa biết)</label><p>Đây là dự toán do bạn xác nhận. Khoản đã thanh toán cần được ghi riêng vào sổ chi tiêu.</p><div className={styles.toolbar}><button className={styles.primary}>Xem trước thay đổi</button><button type="button" onClick={() => { setEditing(null); setPending(null); }}>Hủy sửa</button></div></form>}
 {pending && pendingDiff && <div className={styles.card} role="region" aria-label="Xem trước thay đổi" ref={previewRef} tabIndex={-1}><h2>Xem trước thay đổi</h2>{pendingAction && <p><strong>{pendingAction}</strong></p>}<p>Trước: {money(plan.tongKet.tongVND)} · Sau: {money(pending.tongKet.tongVND)} · Chênh lệch: {money(pendingDiff.cost)}</p><ul>{pendingDiff.added.map((name, i) => <li key={`add-${i}`}>Thêm: {name} {(() => { const stop = pending.items.find(item => item.noiDung === name && !plan.items.some(old => old.id && old.id === item.id)); return stop ? `· Ngày ${stop.ngay}, ${stop.gio ?? "chưa xếp giờ"}` : ""; })()}</li>)}{pendingDiff.removed.map((name, i) => <li key={`remove-${i}`}>Bỏ: {name}</li>)}{pendingDiff.changed.map((name, i) => <li key={`change-${i}`}>Cập nhật: {name}</li>)}</ul><p>{pending.items.length} mục. Thay đổi thứ tự/địa điểm chưa bao gồm tính lại thời gian tuyến đường thực tế. Kiểm tra giờ bắt đầu trước khi áp dụng.</p>{pending.canhBao.filter(f => f.startsWith("workspace_")).map(f => <p key={f}>{f === "workspace_missing_prices" ? "Có địa điểm chưa có giá" : f === "workspace_time_overlap" ? "Có hoạt động chồng giờ" : f === "workspace_closed_place" ? "Có điểm được báo đóng cửa" : "Tổng dự toán vượt ngân sách"}</p>)}<div className={styles.toolbar}><button className={styles.primary} disabled={readonly} onClick={() => { applyPlan(pending); setPending(null); setEditing(null); setMessage("Đã cập nhật trên thiết bị. Bấm Lưu nhật ký để lưu vào tài khoản."); }}>Áp dụng thay đổi</button><button onClick={() => setPending(null)}>Hủy thay đổi</button></div></div>}
 <div className={styles.card}><h2>Cà phê, ăn uống & vui chơi gần đây</h2><p>Chọn ngày và buổi. Hệ thống tìm khoảng trống dựa trên các mục đã có.</p><div className={styles.grid}><label>Loại địa điểm<select value={kind} onChange={e => setKind(e.target.value as typeof kind)}><option value="cafe">Cà phê</option><option value="restaurant">Ăn uống</option><option value="activity">Vui chơi</option></select></label><label>Ngày đi<select value={activeDay} onChange={e => setActiveDay(Number(e.target.value))}>{Array.from({length:plan.request.soNgay ?? 1},(_,i)=><option key={i+1} value={i+1}>Ngày {i+1}</option>)}</select></label><label>Buổi<select value={period} onChange={e => setPeriod(e.target.value as TripPeriod)}>{Object.entries(tripPeriods).map(([key, value])=><option key={key} value={key}>{value.label}</option>)}</select></label><label>Thời gian có thể dành (phút)<input type="number" min={1} value={minutes} onChange={e => setMinutes(Number(e.target.value))}/></label><button disabled={companion.loading || minutes < 1} onClick={() => {
            if (!findTripTimeSlot(plan.items, activeDay, period, Math.min(30, minutes))) {
                setMessage("Buổi này không còn đủ thời gian trống. Hãy chọn buổi hoặc ngày khác.");
                return;
            }
            setMessage("");
            const anchor = plan.items.find(item => item.ngay === activeDay && item.gio && item.latitude != null && item.longitude != null &&
                Number(item.gio.slice(0, 2)) * 60 + Number(item.gio.slice(3)) >= tripPeriods[period].from &&
                Number(item.gio.slice(0, 2)) * 60 + Number(item.gio.slice(3)) < tripPeriods[period].to);
            void companion.search({ people: plan.request.soNguoi || 1, budget: unspentBudget(plan, ledger), minutes, destination: getDiemDenTen(plan.request.diemDen), kind, latitude: anchor?.latitude, longitude: anchor?.longitude, exclude: plan.items.filter(i => i.refId).map(i => i.refId), interests: user?.profile?.interests || [] });
        }}>{companion.loading ? "Đang tìm…" : "Tìm gợi ý phù hợp"}</button></div><p role="status">{companion.message}</p><div className={styles.grid}>{companion.suggestions.map(suggestion => <div className={styles.card} key={suggestion.id}><h2>{suggestion.name}</h2><p>{suggestion.price === null ? "Chưa có giá" : `${money(suggestion.price)} / người (ước tính)`} · khoảng {suggestion.duration} phút</p><p>{suggestion.reason}</p><small>Nguồn: {suggestion.source} · {suggestion.fetchedAt}</small><p>{suggestion.openingHours ? `Giờ theo nguồn: ${suggestion.openingHours}` : "Chưa có giờ mở cửa"}</p><button disabled={readonly} onClick={() => previewSuggestion(suggestion)}>Xem giờ trống và chi phí</button></div>)}</div></div>
 <form className={styles.card} onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
                const result = await saveCurrentTripToAccount(title, { status, journal, startDate: startDate || null });
                setMessage(result.ok ? "Đã lưu nhật ký vào tài khoản." : result.message || "Không thể lưu.");
            }
            finally {
                setSaving(false);
            }
        }}><h2>Lưu tiến độ & nhật ký</h2><div className={styles.grid}><label>Tên chuyến<input required value={title} onChange={e => setTitle(e.target.value)}/></label><label>Trạng thái<select value={status} onChange={e => setStatus(e.target.value as typeof status)}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Ngày bắt đầu<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/></label></div><label>Ghi chú nhật ký<textarea maxLength={10000} value={journal} onChange={e => setJournal(e.target.value)}/></label>{readonly && <p>Chuyến đã hoàn thành được giữ ở chế độ xem. Chọn trạng thái “Đang diễn ra” rồi lưu để mở lại chỉnh sửa.</p>}<button className={styles.primary} disabled={saving}>{saving ? "Đang lưu…" : user ? "Lưu nhật ký" : "Đăng nhập để lưu nhật ký"}</button></form>
 {message && <div className={styles.notice} role="status">{message}</div>}
 </WorkspaceFrame>;
}
