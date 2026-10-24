import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET as getHealth } from "./health/route";
import { GET as getDataStatus } from "./data/status/route";

describe("Bằng chứng không rò rỉ khóa API và User-Agent", () => {
  const DUMMY_GEMINI_KEY = "KEY_THU_DUY_NHAT_12345";
  const DUMMY_TAVILY_KEY = "TAVILY_THU_67890";
  const DUMMY_USER_AGENT = "UA_THU/1.0 (a@b.c)";

  const origGemini = process.env.GEMINI_API_KEY;
  const origTavily = process.env.TAVILY_API_KEY;
  const origUA = process.env.NOMINATIM_USER_AGENT;
  const origDataMode = process.env.DATA_MODE;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = DUMMY_GEMINI_KEY;
    process.env.TAVILY_API_KEY = DUMMY_TAVILY_KEY;
    process.env.NOMINATIM_USER_AGENT = DUMMY_USER_AGENT;
    process.env.DATA_MODE = "snapshot";
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = origGemini;
    process.env.TAVILY_API_KEY = origTavily;
    process.env.NOMINATIM_USER_AGENT = origUA;
    process.env.DATA_MODE = origDataMode;
  });

  it("GET /api/health: phản hồi JSON không chứa GEMINI_API_KEY, TAVILY_API_KEY, NOMINATIM_USER_AGENT", async () => {
    const res = await getHealth();
    const data = await res.json();
    const jsonStr = JSON.stringify(data);

    expect(jsonStr).not.toContain(DUMMY_GEMINI_KEY);
    expect(jsonStr).not.toContain(DUMMY_TAVILY_KEY);
    expect(jsonStr).not.toContain(DUMMY_USER_AGENT);
  });

  it("GET /api/data/status: phản hồi JSON không chứa GEMINI_API_KEY, TAVILY_API_KEY, NOMINATIM_USER_AGENT", async () => {
    const res = await getDataStatus();
    const data = await res.json();
    const jsonStr = JSON.stringify(data);

    expect(jsonStr).not.toContain(DUMMY_GEMINI_KEY);
    expect(jsonStr).not.toContain(DUMMY_TAVILY_KEY);
    expect(jsonStr).not.toContain(DUMMY_USER_AGENT);
  });
});
