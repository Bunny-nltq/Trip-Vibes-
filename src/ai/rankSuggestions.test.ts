import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaceSuggestion } from "@/contracts";
const generateText = vi.hoisted(() => vi.fn());
vi.mock("./provider", () => ({ GeminiProvider: class {
        generateText = generateText;
    } }));
import { chooseSuggestions } from "./rankSuggestions";
const base: PlaceSuggestion = { id: "a", name: "Cafe", kind: "cafe", latitude: 16, longitude: 108, price: 50000, duration: 45, source: "OSM", fetchedAt: "2026-10-20", openingHours: null, distanceKm: 1, reason: "Giá ước tính" };
const candidates = [base, { ...base, id: "b", name: "Museum", kind: "activity" as const }];
beforeEach(() => { generateText.mockReset(); vi.stubEnv("LIVE_AI_ENABLED", "true"); vi.stubEnv("GEMINI_API_KEY", "test-only-placeholder"); });
afterEach(() => vi.unstubAllEnvs());
describe("Constrained AI ranking", () => {
    it("does not call AI when disabled", async () => { vi.stubEnv("LIVE_AI_ENABLED", "false"); expect((await chooseSuggestions(candidates, [])).method).toBe("rules"); expect(generateText).not.toHaveBeenCalled(); });
    it("accepts only reordered existing records, preserving source, prices and hours", async () => { generateText.mockResolvedValue('{"ids":["b","a"]}'); const result = await chooseSuggestions(candidates, ["cà phê"]); expect(result.method).toBe("ai"); expect(result.suggestions[0]).toBe(candidates[1]); expect(result.suggestions[1]).toBe(candidates[0]); });
    it.each(['{"ids":["fabricated","a"]}', '{"ids":["a","a"]}', '{"ids":["a"]}', 'not json'])("rejects invalid model selections: %s", async (text) => { generateText.mockResolvedValue(text); expect(await chooseSuggestions(candidates, [])).toEqual({ suggestions: candidates, method: "rules" }); });
    it("falls back without changing candidates when the provider fails", async () => { generateText.mockRejectedValue(new Error("quota")); expect((await chooseSuggestions(candidates, [])).suggestions).toEqual(candidates); });
});
