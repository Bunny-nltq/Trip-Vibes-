import { describe, it, expect } from "vitest";
import {
  computeSnapshotChecksum,
  auditSnapshotData,
  isValidNguon,
} from "./snapshotAudit";

describe("snapshotAudit - Chống dữ liệu dựng sẵn", () => {
  const sampleValidData = {
    taoBoi: "script data:snapshot",
    ngayTao: "2026-10-20T08:00:00.000Z",
    diemDen: "Đà Nẵng",
    khachSans: [
      {
        id: "osm:node:1001",
        ten: "Khách sạn Biển Xanh",
        nguon: "osm:node:1001",
      },
    ],
    quanAns: [
      {
        id: "osm:node:2001",
        ten: "Quán Mì Quảng A",
        nguon: "osm:node:2001",
      },
    ],
    cafes: [
      {
        id: "osm:way:3001",
        ten: "Cà phê Góc Phố",
        nguon: "osm:way:3001",
      },
    ],
    hoatDongs: [
      {
        id: "osm:node:4001",
        ten: "Ngũ Hành Sơn",
        nguon: "osm:node:4001",
      },
    ],
    transports: [
      {
        id: "tr_01",
        provider: "VietJet Air",
        nguon: "https://www.vietjetair.com",
        doTinCay: "xac_minh",
        nguonGia: ["https://www.vietjetair.com"],
      },
    ],
  };

  it("snapshot có đầu file hợp lệ thì audit đạt (HỢP LỆ)", () => {
    const dataWithChecksum = {
      ...sampleValidData,
      checksum: computeSnapshotChecksum(sampleValidData),
    };

    const res = auditSnapshotData(dataWithChecksum, "test_snapshot.json");
    expect(res.status).toBe("HỢP LỆ");
    expect(res.errors).toEqual([]);
    expect(res.counts.khachSan).toBe(1);
    expect(res.counts.quanAn).toBe(1);
    expect(res.counts.cafe).toBe(1);
    expect(res.counts.hoatDong).toBe(1);
    expect(res.counts.transport).toBe(1);
  });

  it("sửa 1 ký tự nội dung thì checksum sai và audit thất bại (THẤT BẠI)", () => {
    const validChecksum = computeSnapshotChecksum(sampleValidData);
    const tamperedData = {
      ...sampleValidData,
      checksum: validChecksum,
      khachSans: [
        {
          id: "osm:node:1001",
          ten: "Khách sạn Biển Xanh (Đã sửa 1 ký tự!)",
          nguon: "osm:node:1001",
        },
      ],
    };

    const res = auditSnapshotData(tamperedData, "tampered_snapshot.json");
    expect(res.status).toBe("THẤT BẠI");
    expect(res.errors.some((e) => e.includes("Checksum sai"))).toBe(true);
  });

  it("mục có nguon = 'AI' hoặc rỗng thì thất bại (THẤT BẠI)", () => {
    // 1. nguon = 'AI'
    const aiData = {
      ...sampleValidData,
      hoatDongs: [
        {
          id: "hd_ai_1",
          ten: "Điểm tham quan ảo",
          nguon: "AI",
        },
      ],
    };
    const aiDataWithChecksum = {
      ...aiData,
      checksum: computeSnapshotChecksum(aiData),
    };

    const resAI = auditSnapshotData(aiDataWithChecksum, "ai_snapshot.json");
    expect(resAI.status).toBe("THẤT BẠI");
    expect(resAI.errors.some((e) => e.includes("nguồn không hợp lệ"))).toBe(true);

    // 2. nguon rỗng ("" hoặc null)
    const emptySourceData = {
      ...sampleValidData,
      quanAns: [
        {
          id: "qa_empty_1",
          ten: "Quán ăn không nguồn",
          nguon: "",
        },
      ],
    };
    const emptySourceWithChecksum = {
      ...emptySourceData,
      checksum: computeSnapshotChecksum(emptySourceData),
    };

    const resEmpty = auditSnapshotData(
      emptySourceWithChecksum,
      "empty_source_snapshot.json"
    );
    expect(resEmpty.status).toBe("THẤT BẠI");
    expect(resEmpty.errors.some((e) => e.includes("nguồn không hợp lệ"))).toBe(true);
  });

  it("snapshot cũ thiếu đầu file được liệt kê là CHƯA XÁC THỰC, không xóa, nhưng báo", () => {
    // Không có taoBoi, tên file là snapshot_2026-10-19.json
    const oldSnapshotData = {
      createdAt: "2026-10-19T00:00:00.000Z",
      khachSans: [
        {
          id: "osm:node:1001",
          ten: "Khách sạn cũ",
          nguon: "osm:node:1001",
        },
      ],
      quanAns: [],
      cafes: [],
      hoatDongs: [],
      transports: [],
    };

    const res = auditSnapshotData(oldSnapshotData, "snapshot_2026-10-19.json");
    expect(res.status).toBe("CHƯA XÁC THỰC");
    expect(res.errors).toEqual([]);
  });

  it("quy tắc nguồn trung thực: uoc_luong, null, web url với uoc_tinh, osm node", () => {
    // (a) "uoc_luong:khoang_cach:605km" hợp lệ
    expect(isValidNguon("uoc_luong:khoang_cach:605km")).toBe(true);
    // (b) nguon null thất bại
    expect(isValidNguon(null)).toBe(false);
    // (c) "https://www.vietnamairlines.com" kèm doTinCay "uoc_tinh" và nguonGia rỗng thất bại
    expect(
      isValidNguon("https://www.vietnamairlines.com", {
        doTinCay: "uoc_tinh",
        nguonGia: [],
      })
    ).toBe(false);
    // (d) "osm:node:123" hợp lệ
    expect(isValidNguon("osm:node:123")).toBe(true);
  });

  it("snapshot chứa phương tiện ước lượng est_* thì audit báo CŨ", () => {
    const dataWithEst = {
      ...sampleValidData,
      transports: [
        {
          id: "est_di_xe_khach_0",
          provider: "Ước tính theo quãng đường 609 km",
          nguon: "uoc_luong:khoang_cach:609km",
          doTinCay: "uoc_tinh",
          giaLaUocTinh: true,
          nguonGia: [],
        },
      ],
    };
    const withChecksum = {
      ...dataWithEst,
      checksum: computeSnapshotChecksum(dataWithEst),
    };

    const res = auditSnapshotData(withChecksum, "snapshot_da_nang_2026-10-20.json");
    expect(res.status).toBe("CŨ");
    expect(res.errors).toEqual([]);
  });

  it("isValidNguon chỉ chấp nhận osm:node/way/relation hoặc URL web thật", () => {
    expect(isValidNguon("osm:node:123456")).toBe(true);
    expect(isValidNguon("osm:way:987654")).toBe(true);
    expect(isValidNguon("osm:relation:5555")).toBe(true);
    expect(isValidNguon("https://vietnamairlines.com", { doTinCay: "xac_minh", nguonGia: ["https://vietnamairlines.com"] })).toBe(true);
    expect(isValidNguon("http://example.com/route")).toBe(true);

    expect(isValidNguon("AI")).toBe(false);
    expect(isValidNguon("ai")).toBe(false);
    expect(isValidNguon("")).toBe(false);
    expect(isValidNguon("   ")).toBe(false);
    expect(isValidNguon(null as any)).toBe(false);
    expect(isValidNguon(undefined as any)).toBe(false);
    expect(isValidNguon("tu_nhap_tay")).toBe(false);
  });
});
