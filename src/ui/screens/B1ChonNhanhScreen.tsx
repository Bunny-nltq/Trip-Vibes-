"use client";
import { useRef, useState, type FormEvent } from "react";
import { Sparkles, ArrowRight, CalendarDays, AlertCircle } from "lucide-react";
import { VietnameseDateInput } from "@/ui/components/VietnameseDateInput";
import { useTravelConversation } from "@/ui/hooks/useTravelConversation";
import { useApp } from "@/ui/context/AppContext";
import {
  POPULAR_DESTINATIONS,
  POPULAR_ORIGINS,
  toDiemDen,
  getDiemDenTen,
  type DiemDen,
  type TripRequest,
} from "@/contracts";
import { travelDuration } from "@/core/travelRequest";
import { returnDateOrderError } from "@/ui/messages/loi";
import styles from "@/ui/components/Journey.module.css";

export const POPULAR_DEST_PRESETS = POPULAR_DESTINATIONS.filter(
  (p) => p.maQuocGia === "VN"
).map((p) => ({ ten: p.ten }));

const points = [...POPULAR_DESTINATIONS, ...POPULAR_ORIGINS].filter(
  (p) => p.maQuocGia === "VN"
);

function point(value: string): DiemDen | string {
  const known = points.find(
    (p) => p.ten.toLowerCase() === value.trim().toLowerCase()
  );
  return known ? toDiemDen(known) : value.trim();
}

export function B1ChonNhanhScreen() {
  const {
    tripConfig,
    setTripConfig,
    nav,
    planStatus,
    planError,
    hardViolations,
    toiThieuVND,
  } = useApp();
  const conversation = useTravelConversation();

  const [origin, setOrigin] = useState(getDiemDenTen(tripConfig.diemDi));
  const [destination, setDestination] = useState(getDiemDenTen(tripConfig.diemDen));
  const [start, setStart] = useState(tripConfig.travelDates?.departureDate || "");
  const [end, setEnd] = useState(tripConfig.travelDates?.returnDate || "");
  const [people, setPeople] = useState(tripConfig.people || 1);
  const [budget, setBudget] = useState(tripConfig.budget || 0);
  const [note, setNote] = useState(tripConfig.note || "");
  const [transport, setTransport] = useState<NonNullable<TripRequest["transportMode"]>>(
    tripConfig.transportMode || "auto"
  );
  const [local, setLocal] = useState<NonNullable<TripRequest["localTransportMode"]>>(
    tripConfig.localTransportMode || "taxi"
  );
  const [error, setError] = useState("");

  const duration = travelDuration(start, end);
  const invalidDateOrder = Boolean(start && end && end < start);
  const planIssueMessage = (() => {
    if (planStatus === "khong_the_dat_ngan_sach") {
      return toiThieuVND > 0
        ? `Chưa tìm được lịch trình trong ngân sách đã nhập. Phương án tìm được cần khoảng ${toiThieuVND.toLocaleString("vi-VN")} đ.`
        : "Chưa tìm được lịch trình trong ngân sách đã nhập. Bạn có thể chọn phương tiện khác hoặc rút ngắn chuyến đi.";
    }
    if (planStatus === "can_lam_ro") {
      return hardViolations.length > 0
        ? hardViolations.map((v) => v.chiTiet).join(". ")
        : planError || "Cần làm rõ thêm thông tin điểm đến hoặc thời gian chuyến đi.";
    }
    if (planStatus === "khong_co_phuong_an") {
      return hardViolations.length > 0
        ? hardViolations.map((v) => v.chiTiet).join(". ")
        : planError || "Không tìm thấy phương án di chuyển hoặc chỗ ở phù hợp. Hãy thử đổi ngày hoặc phương tiện khác.";
    }
    if (planStatus === "error" && planError) {
      return planError;
    }
    return null;
  })();

  const errorRef = useRef<HTMLDivElement>(null);

  function reject(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const wishes = [
      ...new Set([
        ...conversation.messages.filter((m) => m.role === "user").map((m) => m.text),
        note,
      ].filter(Boolean)),
    ].join(". ");

    if (wishes.length > 500) {
      reject("Vui lòng rút gọn mong muốn trong 500 ký tự.");
      return;
    }
    if (!origin.trim()) {
      reject("Vui lòng nhập nơi xuất phát.");
      return;
    }
    if (!destination.trim()) {
      reject("Vui lòng nhập điểm đến.");
      return;
    }
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      reject("Hãy chọn điểm xuất phát và điểm đến khác nhau.");
      return;
    }
    if (!start || !end || !duration) {
      reject(invalidDateOrder ? returnDateOrderError : "Vui lòng chọn ngày đi và ngày về hợp lệ.");
      return;
    }
    if (!Number.isInteger(people) || people < 1 || people > 10) {
      reject("Số khách phải từ 1 đến 10 người.");
      return;
    }
    if (!Number.isSafeInteger(budget) || budget <= 0) {
      reject("Vui lòng nhập tổng ngân sách dự kiến hợp lệ (lớn hơn 0 VND).");
      return;
    }

    setError("");
    setTripConfig({
      diemDi: point(origin),
      diemDen: point(destination),
      travelDates: { departureDate: start, returnDate: end },
      soNgay: duration.days,
      people,
      budget,
      nganSachSoTien: budget,
      nganSachTheo: "tong",
      transportMode: transport,
      localTransportMode: local,
      note: wishes,
      avoids: [],
    });
    nav("b2-dang-chay");
  }

  return (
    <div className={styles.form}>
      <section className={styles.hero}>
        <span>
          <Sparkles size={18} /> Hành trình theo cách của bạn
        </span>
        <h1>Việt Nam có rất nhiều điều để khám phá.</h1>
        <p>
          Chọn ngày, phương tiện và kể điều bạn mong muốn. Cùng xây một hành trình vừa vặn với bạn.
        </p>
      </section>

      <form onSubmit={submit} noValidate>
        {(error || planIssueMessage) && (
          <div
            role="alert"
            className={styles.error}
            ref={errorRef}
            tabIndex={-1}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1, lineHeight: "1.5" }}>
                <strong>
                  {error ? "Thông tin chưa hợp lệ:" : "Lưu ý từ hệ thống lập kế hoạch:"}
                </strong>{" "}
                {error || planIssueMessage}
              </div>
            </div>
            {!error && planStatus === "khong_the_dat_ngan_sach" && toiThieuVND > budget && (
              <button type="button" className="Btn BtnSmall" onClick={() => setBudget(toiThieuVND)}>
                Điền mức tối thiểu ({toiThieuVND.toLocaleString("vi-VN")} đ)
              </button>
            )}
          </div>
        )}

        <section className={styles.panel}>
          <h2>Đi đâu và khi nào?</h2>
          <div className={styles.grid}>
            <label className={styles.field}>
              Nơi xuất phát
              <input
                required
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  if (error) setError("");
                }}
                list="vn-places"
                placeholder="Ví dụ: Hà Nội"
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {["TP.HCM", "Hà Nội", "Đà Nẵng"].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setOrigin(city);
                      if (error) setError("");
                    }}
                    style={{
                      fontSize: 12,
                      padding: "3px 10px",
                      borderRadius: "var(--r-full)",
                      border: "1px solid",
                      borderColor: origin.toLowerCase() === city.toLowerCase() ? "var(--color-primary)" : "var(--color-border)",
                      background: origin.toLowerCase() === city.toLowerCase() ? "var(--color-primary-tint)" : "var(--color-surface)",
                      color: origin.toLowerCase() === city.toLowerCase() ? "var(--color-primary)" : "var(--color-text-sub)",
                      fontWeight: origin.toLowerCase() === city.toLowerCase() ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </label>
            <label className={styles.field}>
              Điểm đến
              <input
                required
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  if (error) setError("");
                }}
                list="vn-places"
                placeholder="Một nơi tại Việt Nam"
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {["Đà Nẵng", "Hà Nội", "Đà Lạt", "Hội An", "Huế", "Nha Trang"].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setDestination(city);
                      if (error) setError("");
                    }}
                    style={{
                      fontSize: 12,
                      padding: "3px 10px",
                      borderRadius: "var(--r-full)",
                      border: "1px solid",
                      borderColor: destination.toLowerCase() === city.toLowerCase() ? "var(--color-primary)" : "var(--color-border)",
                      background: destination.toLowerCase() === city.toLowerCase() ? "var(--color-primary-tint)" : "var(--color-surface)",
                      color: destination.toLowerCase() === city.toLowerCase() ? "var(--color-primary)" : "var(--color-text-sub)",
                      fontWeight: destination.toLowerCase() === city.toLowerCase() ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </label>
            <datalist id="vn-places">
              {[...new Map(points.map((p) => [p.ten, p])).values()].map((p) => (
                <option key={p.ten} value={p.ten} />
              ))}
            </datalist>
            <label className={styles.field}>
              Ngày đi
              <VietnameseDateInput
                aria-label="Ngày đi"
                required
                value={start}
                onValueChange={(value) => {
                  setStart(value);
                  if (error) setError("");
                }}
              />
            </label>
            <label className={styles.field}>
              Ngày về
              <VietnameseDateInput
                aria-label="Ngày về"
                aria-invalid={invalidDateOrder || undefined}
                aria-describedby={invalidDateOrder ? "planner-return-date-error" : undefined}
                required
                min={start || undefined}
                value={end}
                onValueChange={(value) => {
                  setEnd(value);
                  if (error) setError("");
                }}
              />
              {invalidDateOrder && (
                <small id="planner-return-date-error" role="alert">{returnDateOrderError}</small>
              )}
            </label>
            <label className={styles.field}>
              Số khách
              <input
                type="number"
                min={1}
                max={10}
                required
                value={people}
                onChange={(e) => {
                  setPeople(e.target.valueAsNumber);
                  if (error) setError("");
                }}
              />
            </label>
            <div className={styles.field}>
              <span>Thời gian khám phá</span>
              <p>
                <CalendarDays size={18} />{" "}
                {duration ? `${duration.days} ngày · ${duration.nights} đêm` : "Chọn ngày đi và ngày về"}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Ngân sách và di chuyển</h2>
          <div className={styles.grid}>
            <label className={styles.field}>
              Tổng ngân sách (VND)
              <input
                aria-label="Ngân sách dự kiến VND"
                type="number"
                min={1}
                step={1}
                required
                value={budget || ""}
                onChange={(e) => {
                  setBudget(e.target.valueAsNumber || 0);
                  if (error) setError("");
                }}
                placeholder="Ngân sách cho cả chuyến"
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {[
                  { label: "3 triệu", val: 3000000 },
                  { label: "5 triệu", val: 5000000 },
                  { label: "8 triệu", val: 8000000 },
                  { label: "10 triệu", val: 10000000 },
                  { label: "15 triệu", val: 15000000 },
                  { label: "20 triệu", val: 20000000 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setBudget(item.val);
                      if (error) setError("");
                    }}
                    style={{
                      fontSize: 12,
                      padding: "3px 10px",
                      borderRadius: "var(--r-full)",
                      border: "1px solid",
                      borderColor: budget === item.val ? "var(--color-primary)" : "var(--color-border)",
                      background: budget === item.val ? "var(--color-primary-tint)" : "var(--color-surface)",
                      color: budget === item.val ? "var(--color-primary)" : "var(--color-text-sub)",
                      fontWeight: budget === item.val ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <small>Hệ thống tìm lịch trình trong mức này. Phần còn dư sau khi tính chi phí sẽ là quỹ dự phòng.</small>
            </label>
            <label className={styles.field}>
              Phương tiện đi xa
              <select
                aria-label="Phương tiện đi xa"
                value={transport}
                onChange={(e) => setTransport(e.target.value as typeof transport)}
              >
                <option value="auto">Đề xuất phù hợp tuyến</option>
                <option value="PLANE">Máy bay</option>
                <option value="TRAIN">Tàu hỏa</option>
                <option value="BUS">Xe khách</option>
              </select>
            </label>
            <label className={styles.field}>
              Di chuyển tại điểm đến
              <select
                aria-label="Di chuyển tại điểm đến"
                value={local}
                onChange={(e) => setLocal(e.target.value as typeof local)}
              >
                <option value="taxi">Taxi / xe công nghệ</option>
                <option value="motorbike">Xe máy</option>
                <option value="car">Ô tô</option>
                <option value="transit">Phương tiện công cộng</option>
                <option value="walking">Đi bộ</option>
              </select>
            </label>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.chat}`}>
          <h2>
            <Sparkles size={20} /> Bạn mong chờ điều gì ở chuyến đi?
          </h2>
          <label className={styles.field}>
            <span>Kể cho trợ lý hành trình</span>
            <textarea
              aria-label="Kể cho trợ lý hành trình"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tôi thích bảo tàng, muốn ghé một quán cà phê đẹp và đi chơi nhẹ nhàng, không dậy quá sớm…"
            />
            <small>Nhu cầu này được gửi cùng yêu cầu lập kế hoạch. Bạn có thể chỉnh lại trước khi tạo.</small>
          </label>
          <button
            type="button"
            className={styles.primary}
            disabled={conversation.busy || !note.trim()}
            onClick={async () => {
              const sent = await conversation.send(note);
              if (sent !== false) setNote("");
            }}
          >
            {conversation.busy ? "Trợ lý đang đọc…" : "Gửi mong muốn"}
          </button>
          <button
            type="button"
            onClick={() => conversation.reset()}
            disabled={conversation.busy}
          >
            Làm lại mong muốn
          </button>
          <div role="log" aria-live="polite">
            {conversation.messages.map((message, index) => (
              <p key={index}>
                <strong>{message.role === "user" ? "Bạn" : "Trợ lý"}:</strong> {message.text}
              </p>
            ))}
          </div>
        </section>

        <div className={styles.actions}>
          <p className={styles.muted}>Bạn được xem và chỉnh kế hoạch trước khi lưu.</p>
          <button className={styles.primary} type="submit">
            Tạo hành trình của tôi
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default B1ChonNhanhScreen;
