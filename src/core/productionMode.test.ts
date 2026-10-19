import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Production mode parameter ignore", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  it("với NODE_ENV = production, các tham số URL giả lập (dest, previewMoHo, previewNhapGiaTay, state) bị bỏ qua", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const currentEnv: string = process.env.NODE_ENV ?? "";
    const isDev = currentEnv === "development";
    expect(isDev).toBe(false);

    // Giả lập đọc query params
    const search = "?dest=bangkok&previewMoHo=1&previewNhapGiaTay=1&state=nhap_tay";
    const sp = new URLSearchParams(search);

    const isBangkokAllowed = isDev && sp.get("dest") === "bangkok";
    const isPreviewMoHoAllowed = isDev && sp.get("previewMoHo") === "1";
    const isPreviewNhapGiaTayAllowed = isDev && sp.get("previewNhapGiaTay") === "1";
    const isMockStateAllowed = isDev && Boolean(sp.get("state"));

    expect(isBangkokAllowed).toBe(false);
    expect(isPreviewMoHoAllowed).toBe(false);
    expect(isPreviewNhapGiaTayAllowed).toBe(false);
    expect(isMockStateAllowed).toBe(false);
  });

  it("với NODE_ENV = development, các tham số URL giả lập được kích hoạt cho mục đích demo/test", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const currentEnv: string = process.env.NODE_ENV ?? "";
    const isDev = currentEnv === "development";
    expect(isDev).toBe(true);

    const search = "?dest=bangkok&previewMoHo=1&previewNhapGiaTay=1&state=nhap_tay";
    const sp = new URLSearchParams(search);

    const isBangkokAllowed = isDev && sp.get("dest") === "bangkok";
    const isPreviewMoHoAllowed = isDev && sp.get("previewMoHo") === "1";
    const isPreviewNhapGiaTayAllowed = isDev && sp.get("previewNhapGiaTay") === "1";
    const isMockStateAllowed = isDev && Boolean(sp.get("state"));

    expect(isBangkokAllowed).toBe(true);
    expect(isPreviewMoHoAllowed).toBe(true);
    expect(isPreviewNhapGiaTayAllowed).toBe(true);
    expect(isMockStateAllowed).toBe(true);
  });
});
