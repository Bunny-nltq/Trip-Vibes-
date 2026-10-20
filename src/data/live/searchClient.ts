/**
 * src/data/live/searchClient.ts
 *
 * Client Tavily Search API (miễn phí, không cần thẻ tín dụng cho gói free).
 * - Đọc key từ TAVILY_API_KEY.
 * - Đếm lượt mỗi ngày; vượt DATA_MAX_SEARCH_PER_DAY thì dừng và trả fallback.
 * - Không bao giờ log API key.
 */

import fs from "node:fs";
import path from "node:path";

const TAVILY_API_URL = "https://api.tavily.com/search";
function getMaxPerDay(): number {
  return parseInt(process.env.DATA_MAX_SEARCH_PER_DAY ?? "30", 10);
}
const COUNTER_FILE = path.join(process.cwd(), ".cache", "data", "tavily_counter.json");

interface CounterData {
  date: string;  // YYYY-MM-DD
  count: number;
}

function loadCounter(): CounterData {
  const today = new Date().toISOString().slice(0, 10);
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(COUNTER_FILE, "utf-8")) as CounterData;
      if (data.date === today) return data;
    }
  } catch {
    // ignore
  }
  return { date: today, count: 0 };
}

function saveCounter(counter: CounterData): void {
  try {
    fs.mkdirSync(path.dirname(COUNTER_FILE), { recursive: true });
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(counter), "utf-8");
  } catch {
    // ignore
  }
}

export function getTavilyUsageToday(): number {
  return loadCounter().count;
}

export function isTavilyLimitReached(): boolean {
  return loadCounter().count >= getMaxPerDay();
}

export interface TavilyResult {
  url: string;
  title: string;
  content: string;
  score?: number;
}

export type SearchResponse =
  | {
      ok: true;
      results: TavilyResult[];
      query: string;
    }
  | {
      ok: false;
      reason: "no_key" | "limit_reached" | "api_error";
      message: string;
    };

export async function tavilySearch(
  query: string,
  maxResults = 5
): Promise<SearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return { ok: false, reason: "no_key", message: "TAVILY_API_KEY chưa được cấu hình." };
  }

  const counter = loadCounter();
  const maxPerDay = getMaxPerDay();
  if (counter.count >= maxPerDay) {
    return {
      ok: false,
      reason: "limit_reached",
      message: `Đã vượt giới hạn ${maxPerDay} lượt Tavily/ngày.`,
    };
  }

  // Tăng đếm trước khi gọi để tránh race
  counter.count += 1;
  saveCounter(counter);

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: maxResults,
        search_depth: "basic",
        include_answer: false,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "api_error",
        message: `Tavily API lỗi: ${response.status}`,
      };
    }

    const data = (await response.json()) as { results?: TavilyResult[] };
    return {
      ok: true,
      results: data.results ?? [],
      query,
    };
  } catch (err) {
    return {
      ok: false,
      reason: "api_error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
