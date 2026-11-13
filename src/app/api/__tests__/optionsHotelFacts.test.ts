import { describe, expect, it, vi } from "vitest";
import { HotelPublicDetailsSchema } from "@/contracts";
vi.mock("@/data/live/LiveDataSource", () => ({ LiveDataSource: class {
        getMode() { return "snapshot"; }
        async getKhachSans() { return [{ id: "fixture-hotel", ten: "Fixture hotel", khuVuc: "Trung tâm", soSao: 3, khoangGiaDemVND: { min: 500000, max: 700000 }, giaUocTinhNguoi: null, includesBreakfast: true, hasPool: true, diaChi: "Địa chỉ từ nguồn", toaDo: { lat: 16, lng: 108 }, gioMoCua: null, ngayLay: "2026-10-20", nguon: "OSM", doTinCay: "tham_khao", giaLaUocTinh: true, mapsUrls: undefined }]; }
        async getHotels() { return []; }
    } }));
import { GET } from "../options/route";
describe("Public hotel facts", () => {
    it("preserves recorded amenities, address and retrieval date instead of replacing them with false", async () => {
        const response = await GET(new Request("http://localhost/api/options?loai=khach_san&diemDen=%C4%90%C3%A0%20N%E1%BA%B5ng"));
        expect(response.status).toBe(200);
        const data = await response.json();
        const item = HotelPublicDetailsSchema.parse(data.items[0]);
        expect(item.includesBreakfast).toBe(true);
        expect(item.hasPool).toBe(true);
        expect(item.diaChi).toBe("Địa chỉ từ nguồn");
        expect(item.toaDo).toEqual({ lat: 16, lng: 108 });
        expect(item.ngayLay).toBe("2026-10-20");
    });
});
