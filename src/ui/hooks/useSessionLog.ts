"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { tinhChiSoTest, type SessionEvent } from "@/core/chiSoTest";

export const STORAGE_KEY = "tv_session_events";
export const START_TIME_KEY = "tv_session_start_time";

export interface SessionLogOptions {
  isTestMode?: boolean;
  search?: string;
  storage?: Storage | null;
}

/**
 * Hàm thuần tạo nội dung CSV có đầy đủ các cột của tinhChiSoTest:
 * thoiGianTaoKeHoachMs, soLanDoi, soLanHoanTac, thoiGianToiChotMs, vuotKhiChot, soExpense, soExpenseDaSuaSo
 */
export function taoNoiDungCSV(events: SessionEvent[]): string {
  const metrics = tinhChiSoTest(events);
  const rows = [
    [
      "thoiGianTaoKeHoachMs",
      "soLanDoi",
      "soLanHoanTac",
      "thoiGianToiChotMs",
      "vuotKhiChot",
      "soExpense",
      "soExpenseDaSuaSo",
    ],
    [
      String(metrics.thoiGianTaoKeHoachMs),
      String(metrics.soLanDoi),
      String(metrics.soLanHoanTac),
      String(metrics.thoiGianToiChotMs),
      String(metrics.vuotKhiChot),
      String(metrics.soExpense),
      String(metrics.soExpenseDaSuaSo),
    ],
    [],
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

  return rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
}

/**
 * Lớp điều khiển ghi nhận sự kiện (SessionLogger) hỗ trợ chạy cả trong hook và kiểm thử độc lập
 */
export class SessionLogger {
  isTestMode: boolean;
  events: SessionEvent[];
  storage: Storage | null;
  startTime: number;

  constructor(options?: SessionLogOptions) {
    if (options?.isTestMode !== undefined) {
      this.isTestMode = options.isTestMode;
    } else if (options?.search !== undefined) {
      const sp = new URLSearchParams(options.search);
      this.isTestMode = sp.get("test") === "1";
    } else if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      this.isTestMode = sp.get("test") === "1";
    } else {
      this.isTestMode = false;
    }

    this.storage =
      options?.storage !== undefined
        ? options.storage
        : typeof window !== "undefined"
        ? window.sessionStorage
        : null;

    this.events = [];
    this.startTime = Date.now();

    if (this.isTestMode && this.storage) {
      const savedStart = this.storage.getItem(START_TIME_KEY);
      if (savedStart) {
        this.startTime = parseInt(savedStart, 10);
      } else {
        this.storage.setItem(START_TIME_KEY, String(this.startTime));
      }

      const savedEvents = this.storage.getItem(STORAGE_KEY);
      if (savedEvents) {
        try {
          const parsed = JSON.parse(savedEvents);
          if (Array.isArray(parsed)) {
            this.events = parsed;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  addEvent(event: Omit<SessionEvent, "t"> & { t?: number }): void {
    // QUY TẮC CỐT LÕI: Không có ?test=1 thì KHÔNG ghi sự kiện nào!
    if (!this.isTestMode) {
      return;
    }

    const now = Date.now();
    const relativeTime =
      event.t !== undefined ? event.t : Math.max(0, now - this.startTime);
    const fullEvent: SessionEvent = {
      ...event,
      t: relativeTime,
    };

    this.events.push(fullEvent);

    if (this.storage) {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.events));
      } catch (err) {
        console.warn("Lỗi ghi sessionStorage:", err);
      }
    }
  }

  logStart(): void {
    this.addEvent({ type: "start" });
  }

  logPlanOk(): void {
    this.addEvent({ type: "plan_ok" });
  }

  logChangeApplied(loai?: string): void {
    this.addEvent({ type: "change_applied", loai });
  }

  logUndo(): void {
    this.addEvent({ type: "undo" });
  }

  logRegenerate(): void {
    this.addEvent({ type: "regenerate" });
  }

  logConfirm(soCanhBaoConLai?: number, trangThaiNganSach?: string): void {
    this.addEvent({ type: "confirm", soCanhBaoConLai, trangThaiNganSach });
  }

  logExpenseAdded(nguon?: "anh_bill" | "nhap_tay" | string, daSuaTay?: boolean): void {
    this.addEvent({ type: "expense_added", nguon, daSuaTay });
  }

  toCSV(): string {
    return taoNoiDungCSV(this.events);
  }

  toJSON(): string {
    const metrics = tinhChiSoTest(this.events);
    return JSON.stringify(
      {
        metrics,
        events: this.events,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }
}

/**
 * Hook useSessionLog dùng trong UI React
 */
export function useSessionLog(options?: SessionLogOptions) {
  // Xác định cờ test mode ngay từ đầu
  const initialTestMode = (() => {
    if (options?.isTestMode !== undefined) return options.isTestMode;
    if (options?.search !== undefined) {
      const sp = new URLSearchParams(options.search);
      return sp.get("test") === "1";
    }
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("test") === "1";
    }
    return false;
  })();

  const [isTestMode, setIsTestMode] = useState<boolean>(initialTestMode);
  const isTestModeRef = useRef<boolean>(initialTestMode);
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const startTimeRef = useRef<number>(0);

  const customStorage = options?.storage;
  const getStorage = useCallback((): Storage | null => {
    if (customStorage !== undefined) return customStorage;
    if (typeof window !== "undefined") return window.sessionStorage;
    return null;
  }, [customStorage]);

  // Khởi tạo kiểm tra cờ ?test=1
  useEffect(() => {
    try {
      let isTest = initialTestMode;
      if (options?.isTestMode !== undefined) {
        isTest = options.isTestMode;
      } else if (typeof window !== "undefined") {
        const sp = new URLSearchParams(options?.search ?? window.location.search);
        isTest = sp.get("test") === "1";
      }

      setIsTestMode(isTest);
      isTestModeRef.current = isTest;

      if (isTest) {
        const storage = getStorage();
        if (storage) {
          // Khôi phục start time hoặc thiết lập mới
          const savedStartTime = storage.getItem(START_TIME_KEY);
          if (savedStartTime) {
            startTimeRef.current = parseInt(savedStartTime, 10);
          } else {
            const now = Date.now();
            startTimeRef.current = now;
            storage.setItem(START_TIME_KEY, String(now));
          }

          // Khôi phục events
          const savedEvents = storage.getItem(STORAGE_KEY);
          if (savedEvents) {
            try {
              const parsed = JSON.parse(savedEvents);
              if (Array.isArray(parsed)) {
                setEvents(parsed);
              }
            } catch {
              // ignore
            }
          }

          // Khôi phục trạng thái đồng ý
          const consent = storage.getItem("tv_test_consent");
          if (consent === "true") {
            setHasConsented(true);
          }
        }
      }
    } catch (e) {
      console.warn("Lỗi khởi tạo session log:", e);
    }
  }, [initialTestMode, getStorage, options?.isTestMode, options?.search]);

  const addEvent = useCallback(
    (event: Omit<SessionEvent, "t"> & { t?: number }) => {
      // QUY TẮC CỐT LÕI: Không có ?test=1 thì KHÔNG ghi sự kiện nào!
      if (!isTestModeRef.current) {
        return;
      }

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
          const storage = getStorage();
          if (storage) {
            try {
              storage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch (err) {
              console.warn("Lỗi ghi sessionStorage:", err);
            }
          }
          return next;
        });
      } catch (e) {
        console.warn("Lỗi ghi event:", e);
      }
    },
    [getStorage]
  );

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
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem("tv_test_consent", "true");
      } catch {}
    }
    // Ghi nhận start khi đồng ý bắt đầu
    logStart();
  }, [getStorage, logStart]);

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
      const csvContent = taoNoiDungCSV(events);
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
