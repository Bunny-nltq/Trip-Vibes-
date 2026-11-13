import { describe, expect, it } from "vitest";
import { POST } from "../nearby/route";
import { GET } from "../templates/[slug]/route";
const request = (body: unknown) => new Request("http://localhost/api/nearby", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
describe("V2 nearby API", () => {
    it("rejects invalid coordinates and group sizes before querying data", async () => { for (const body of [{ latitude: 999 }, { people: 0 }])
        expect((await POST(request({ destination: "Đà Nẵng", kind: "cafe", ...body }))).status).toBe(400); });
    it("returns traceable snapshot suggestions without claiming live opening status", async () => { const response = await POST(request({ destination: "Đà Nẵng", kind: "cafe", people: 2, minutes: 90, budget: 500000 })); expect(response.status).toBe(200); const result = await response.json(); expect(result.method).toBe("rules"); expect(result.suggestions.length).toBeGreaterThan(0); for (const item of result.suggestions) {
        expect(item.source).toBeTruthy();
        expect(item.fetchedAt).toBeTruthy();
        if (item.price !== null)
            expect(item.price * 2).toBeLessThanOrEqual(500000);
    } expect(result.note).toContain("không phải trạng thái mở cửa trực tiếp"); });
    it("does not invent places when no local snapshot exists", async () => { const response = await POST(request({ destination: "No snapshot city", kind: "cafe" })); expect(response.status).toBe(200); expect((await response.json()).suggestions).toEqual([]); });
});
describe("Server template boundary", () => {
    it.each(["da-nang", "ha-noi", "da-lat"])("serves validated template %s", async (slug) => { const response = await GET(new Request(`http://localhost/api/templates/${slug}`), { params: Promise.resolve({ slug }) }); expect(response.status).toBe(200); expect((await response.json()).plan.items.length).toBeGreaterThan(0); });
    it.each(["bangkok","seoul"])("rejects new foreign template %s in domestic scope",async(slug)=>{expect((await GET(new Request(`http://localhost/api/templates/${slug}`),{params:Promise.resolve({slug})})).status).toBe(404);});
    it("rejects arbitrary file paths", async () => { expect((await GET(new Request("http://localhost/api/templates/invalid"), { params: Promise.resolve({ slug: "../../.env.local" }) })).status).toBe(404); });
});
