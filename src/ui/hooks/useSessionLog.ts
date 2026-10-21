"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { tinhChiSoTest, type SessionEvent } from "@/core/chiSoTest";

const STORAGE_KEY = "tv_session_events";
const START_TIME_KEY = "tv_session_start_time";

export function useSessionLog() {
  const [isTestMode, setIsTestMode] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const startTimeRef = useRef<number>(0);

  // Khởi tạo kiểm tra cờ ?test=1
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get("test") === "1") {
          setIsTestMode(true);

          // Khôi phục start time hoặc thiết lập mới
          const savedStartTime = sessionStorage.getItem(START_TIME_KEY);
          if (savedStartTime) {
            startTimeRef.current = parseInt(savedStartTime, 10);
          } else {
            const now = Date.now();
            startTimeRef.current = now;
            sessionStorage.setItem(START_TIME_KEY, String(now));
          }

          // Khôi phục events
          const savedEvents = sessionStorage.getItem(STORAGE_KEY);
          if (savedEvents) {
            try {
              const parsed = JSON.parse(savedEvents);
              if (Array.isArray(parsed)) {
                setEvents(parsed);
              }
            } catch {
              // bỏ qua lỗi parse
            }
          }

          // Khôi phục trạng thái đồng ý
          const consent = sessionStorage.getItem("tv_test_consent");
          if (consent === "true") {
            setHasConsented(true);
          }
        }
      }
    } catch (e) {
      console.warn("Lỗi khởi tạo session log:", e);
    }
  }, []);

  const addEvent = useCallback((event: Omit<SessionEvent, "t"> & { t?: number }) => {
    try {
      const now = Date.now();
      const relativeTime =
        event.t !== undefined ? event.t : Math.max(0, now - (startTimeRef.current || now));
      const fullEvent: SessionEvent = {
        ...event,
        t: relativeTime,
      };

      setEvents((prev) => {
        const next = [...prev, fullEvent];
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (err) {
          console.warn("Lỗi ghi sessionStorage:", err);
        }
        return next;
      });
    } catch (e) {
      console.warn("Lỗi ghi event:", e);
    }
  }, []);

  const logStart = useCallback(() => {
    addEvent({ type: "start" });
  }, [addEvent]);

  const logPlanOk = useCallback(() => {
    addEvent({ type: "plan_ok" });
  }, [addEvent]);

  const logChangeApplied = useCallback(
    (loai?: string) => {
      addEvent({ type: "change_applied", loai });
    },
    [addEvent]
  );

  const logUndo = useCallback(() => {
    addEvent({ type: "undo" });
  }, [addEvent]);

  const logRegenerate = useCallback(() => {
    addEvent({ type: "regenerate" });
  }, [addEvent]);

  const logConfirm = useCallback(
    (soCanhBaoConLai?: number, trangThaiNganSach?: string) => {
      addEvent({ type: "confirm", soCanhBaoConLai, trangThaiNganSach });
    },
    [addEvent]
  );

  const logExpenseAdded = useCallback(
    (nguon?: "anh_bill" | "nhap_tay" | string, daSuaTay?: boolean) => {
      addEvent({ type: "expense_added", nguon, daSuaTay });
    },
    [addEvent]
  );

  const acceptConsent = useCallback(() => {
    setHasConsented(true);
    try {
      sessionStorage.setItem("tv_test_consent", "true");
    } catch {}
    // Ghi nhận start khi đồng ý bắt đầu
    logStart();
  }, [logStart]);

  const exportJson = useCallback(() => {
    try {
      const metrics = tinhChiSoTest(events);
      const data = {
        metrics,
        events,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trip-vibes-test-results-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Lỗi xuất JSON:", e);
    }
  }, [events]);

  const exportCsv = useCallback(() => {
    try {
      const metrics = tinhChiSoTest(events);
      const rows = [
        ["Chi_so", "Gia_tri"],
        ["thoiGianTaoKeHoachMs", String(metrics.thoiGianTaoKeHoachMs)],
        ["soLanDoi", String(metrics.soLanDoi)],
        ["soLanHoanTac", String(metrics.soLanHoanTac)],
        ["thoiGianToiChotMs", String(metrics.thoiGianToiChotMs)],
        ["vuotKhiChot", String(metrics.vuotKhiChot)],
        ["soExpense", String(metrics.soExpense)],
        ["soExpenseDaSuaSo", String(metrics.soExpenseDaSuaSo)],
        ["", ""],
        ["Event_Index", "Type", "RelativeMs", "Loai", "TrangThaiNganSach", "Nguon", "DaSuaTay"],
      ];

      events.forEach((ev, idx) => {
        rows.push([
          String(idx + 1),
          ev.type,
          String(ev.t),
          ev.loai || "",
          ev.trangThaiNganSach || "",
          ev.nguon || "",
          ev.daSuaTay !== undefined ? String(ev.daSuaTay) : "",
        ]);
      });

      const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trip-vibes-test-results-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Lỗi xuất CSV:", e);
    }
  }, [events]);

  return {
    isTestMode,
    hasConsented,
    acceptConsent,
    events,
    logStart,
    logPlanOk,
    logChangeApplied,
    logUndo,
    logRegenerate,
    logConfirm,
    logExpenseAdded,
    exportJson,
    exportCsv,
  };
}
