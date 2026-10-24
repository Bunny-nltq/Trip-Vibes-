import { NextResponse } from "next/server";
import { LiveDataSource } from "@/data/live/LiveDataSource";
import { calculateTransportFlags } from "@/core/flags";
import { geocodeDestination } from "@/data/live/geocodeClient";
import type { DiemDen } from "@/contracts";

import { getSnapshotDiemDen } from "@/data/prepareDestination";

import { memoryCache, CACHE_TTL_MS } from "./cache";

/**
 * GET /api/options?loai=phuong_tien&huong=di|ve | khach_san | hoat_dong | quan_an | cafe
 * Tham số tuỳ chọn: diemDi, diemDen, soNgay, soNguoi
 *
 * Trả danh sách ứng viên từ LiveDataSource (theo DATA_MODE hiện tại).
 * Có cache in-memory: gọi lần 2 liên tiếp không chạm vào nguồn ngoài.
 * KHÔNG gọi Gemini.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const loai = url.searchParams.get("loai");
  const huong = url.searchParams.get("huong"); // "di" | "ve"
  const soNguoiStr = url.searchParams.get("soNguoi");
  const soNguoi = soNguoiStr ? parseInt(soNguoiStr, 10) : 2;
  const soNgayStr = url.searchParams.get("soNgay");
  const soNgay = soNgayStr ? parseInt(soNgayStr, 10) : 3;
  const diemDenParam = url.searchParams.get("diemDen");
  const diemDiParam = url.searchParams.get("diemDi");

  if (!loai) {
    return NextResponse.json(
      { ok: false, error: "Cần tham số 'loai' (phuong_tien | khach_san | hoat_dong | quan_an | cafe)." },
      { status: 400 }
    );
  }

  const cacheKey = `${loai}_${huong || ""}_${soNguoi}_${soNgay}_${diemDenParam || ""}_${diemDiParam || ""}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    let diemDen: DiemDen | undefined;
    if (diemDenParam) {
      const snap = getSnapshotDiemDen(diemDenParam);
      if (snap) {
        diemDen = snap;
      } else {
        try {
          const parsed = JSON.parse(diemDenParam);
          if (parsed && typeof parsed === "object" && parsed.ten) {
            diemDen = parsed;
          }
        } catch {
          // Không phải JSON
        }
        if (!diemDen) {
          const geo = await geocodeDestination(diemDenParam);
          if (geo.status === "thanh_cong") {
            diemDen = geo.diemDen;
          }
        }
      }
    }

    let diemDi: DiemDen | undefined;
    if (diemDiParam) {
      const snap = getSnapshotDiemDen(diemDiParam);
      if (snap) {
        diemDi = snap;
      } else {
        try {
          const parsed = JSON.parse(diemDiParam);
          if (parsed && typeof parsed === "object" && parsed.ten) {
            diemDi = parsed;
          }
        } catch {
          // Không phải JSON
        }
        if (!diemDi) {
          const geo = await geocodeDestination(diemDiParam);
          if (geo.status === "thanh_cong") {
            diemDi = geo.diemDen;
          }
        }
      }
    }

    const ds = new LiveDataSource(undefined, undefined, diemDen, diemDi, soNgay);

    if (loai === "phuong_tien") {
      if (!huong || !["di", "ve"].includes(huong)) {
        return NextResponse.json(
          { ok: false, error: "Cần tham số 'huong' = 'di' hoặc 've' khi loai=phuong_tien." },
          { status: 400 }
        );
      }
      const all = await ds.getTransports();
      const filtered = all.filter((t) => t.huong === huong);
      const items = filtered.map((t) => {
        const flags = calculateTransportFlags(t.departureTime, t.durationMinutes);
        return {
          ...t,
          tongTienNhom: t.pricePerPerson * soNguoi,
          flags,
        };
      });
      const responseData = { ok: true, loai, huong, mode: ds.getMode(), items };
      memoryCache.set(cacheKey, { timestamp: Date.now(), data: responseData });
      return NextResponse.json(responseData);
    }

    if (loai === "khach_san") {
      const [khachSans, hotels] = await Promise.all([
        ds.getKhachSans(),
        ds.getHotels(),
      ]);
      const seen = new Set(khachSans.map((k) => k.id));
      const combined = [
        ...khachSans.map((k) => ({
          id: k.id,
          ten: k.ten,
          khuVuc: k.khuVuc,
          soSao: k.soSao,
          giaMotDem: k.khoangGiaDemVND
            ? Math.round((k.khoangGiaDemVND.min + k.khoangGiaDemVND.max) / 2)
            : k.giaUocTinhNguoi ?? 700_000,
          includesBreakfast: false,
          hasPool: false,
          nguon: k.nguon,
          doTinCay: k.doTinCay,
          giaLaUocTinh: k.giaLaUocTinh,
          mapsUrls: k.mapsUrls,
          praised: [] as string[],
          watchOut: [] as string[],
          tip: undefined as string | undefined,
        })),
        ...hotels
          .filter((h) => !seen.has(h.id))
          .map((h) => ({
            id: h.id,
            ten: h.name,
            khuVuc: h.area,
            soSao: h.stars,
            giaMotDem: h.pricePerNight,
            includesBreakfast: h.includesBreakfast,
            hasPool: h.hasPool,
            nguon: h.source ?? null,
            doTinCay: "tham_khao" as const,
            giaLaUocTinh: false,
            mapsUrls: undefined,
            praised: h.praised,
            watchOut: h.watchOut,
            tip: h.tip,
          })),
      ];
      const responseData = { ok: true, loai, mode: ds.getMode(), items: combined };
      memoryCache.set(cacheKey, { timestamp: Date.now(), data: responseData });
      return NextResponse.json(responseData);
    }

    if (loai === "hoat_dong") {
      const [activities, hoatDongs] = await Promise.all([
        ds.getActivities(),
        ds.getHoatDongs(),
      ]);
      const seen = new Set(hoatDongs.map((h) => h.id));
      const combined = [
        ...hoatDongs.map((h) => ({
          id: h.id,
          ten: h.ten,
          khuVuc: h.khuVuc,
          giaVeNguoi: h.giaVeNguoi,
          tongTienNhom: h.giaVeNguoi * soNguoi,
          thoiLuongPhut: h.thoiLuongPhut,
          nhan: h.nhan,
          dongNguoi: h.dongNguoi,
          diBoNhieu: h.diBoNhieu,
          nguon: h.nguon,
          doTinCay: h.doTinCay,
          giaLaUocTinh: h.giaLaUocTinh,
          mapsUrls: h.mapsUrls,
        })),
        ...activities
          .filter((a) => !seen.has(a.id))
          .map((a) => ({
            id: a.id,
            ten: a.ten,
            khuVuc: a.khuVuc,
            giaVeNguoi: a.giaVeNguoi,
            tongTienNhom: a.giaVeNguoi * soNguoi,
            thoiLuongPhut: a.thoiLuongPhut,
            nhan: a.nhan,
            dongNguoi: a.dongNguoi,
            diBoNhieu: a.diBoNhieu,
            nguon: null,
            doTinCay: "tham_khao" as const,
            giaLaUocTinh: false,
            mapsUrls: undefined,
          })),
      ];
      const responseData = { ok: true, loai, mode: ds.getMode(), items: combined };
      memoryCache.set(cacheKey, { timestamp: Date.now(), data: responseData });
      return NextResponse.json(responseData);
    }

    if (loai === "quan_an") {
      const quanAns = await ds.getQuanAns();
      const responseData = { ok: true, loai, mode: ds.getMode(), items: quanAns };
      memoryCache.set(cacheKey, { timestamp: Date.now(), data: responseData });
      return NextResponse.json(responseData);
    }

    if (loai === "cafe") {
      const cafes = await ds.getCafes();
      const responseData = { ok: true, loai, mode: ds.getMode(), items: cafes };
      memoryCache.set(cacheKey, { timestamp: Date.now(), data: responseData });
      return NextResponse.json(responseData);
    }

    return NextResponse.json(
      { ok: false, error: `Loại '${loai}' không được hỗ trợ.` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
