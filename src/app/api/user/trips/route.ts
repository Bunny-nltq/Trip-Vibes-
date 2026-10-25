import { NextResponse } from "next/server";
import { getUserTrips, saveUserTrip, deleteUserTrip, updateUserTrip } from "@/data/authStore";
import { PlanSchema } from "@/contracts";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = req.headers.get("x-user-id") || url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { ok: false, thanhCong: false, error: "Vui lòng đăng nhập để xem các chuyến đi đã lưu.", thongDiep: "Vui lòng đăng nhập để xem các chuyến đi đã lưu." },
      { status: 401 }
    );
  }

  const trips = getUserTrips(userId);
  return NextResponse.json({ ok: true, thanhCong: true, trips });
}

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Dữ liệu JSON không hợp lệ.", thongDiep: "Dữ liệu JSON không hợp lệ." },
        { status: 400 }
      );
    }

    const tripData = body?.trip || body;

    if (!tripData || !tripData.userId) {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Vui lòng đăng nhập để lưu chuyến đi.", thongDiep: "Vui lòng đăng nhập để lưu chuyến đi." },
        { status: 401 }
      );
    }

    if (!tripData.plan) {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Thiếu dữ liệu kế hoạch chuyến đi.", thongDiep: "Thiếu dữ liệu kế hoạch chuyến đi." },
        { status: 400 }
      );
    }

    const planParse = PlanSchema.safeParse(tripData.plan);
    if (!planParse.success) {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Kế hoạch không đúng định dạng hợp lệ.", thongDiep: "Kế hoạch không đúng định dạng hợp lệ." },
        { status: 400 }
      );
    }

    const ledger = tripData.ledger && Array.isArray(tripData.ledger.expenses) ? tripData.ledger : { schemaVersion: 15, expenses: [] };

    const saved = saveUserTrip({
      userId: tripData.userId,
      title: tripData.title,
      plan: planParse.data,
      ledger,
      tickedPlaces: tripData.tickedPlaces || {},
    });

    return NextResponse.json(
      {
        ok: true,
        thanhCong: true,
        trip: saved,
        message: "Đã lưu nhật ký chuyến đi thành công.",
        thongDiep: "Đã lưu nhật ký chuyến đi thành công.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, thanhCong: false, error: msg, thongDiep: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = req.headers.get("x-user-id") || url.searchParams.get("userId");
    const tripId = url.searchParams.get("id") || url.searchParams.get("tripId");

    if (!userId) {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Vui lòng đăng nhập.", thongDiep: "Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    if (!tripId) {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Thiếu mã chuyến đi cần xóa.", thongDiep: "Thiếu mã chuyến đi cần xóa." },
        { status: 400 }
      );
    }

    const ok = deleteUserTrip(userId, tripId);
    if (!ok) {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Không tìm thấy chuyến đi cần xóa.", thongDiep: "Không tìm thấy chuyến đi cần xóa." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      thanhCong: true,
      message: "Đã xóa nhật ký chuyến đi thành công.",
      thongDiep: "Đã xóa nhật ký chuyến đi thành công.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, thanhCong: false, error: msg, thongDiep: msg },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Dữ liệu JSON không hợp lệ.", thongDiep: "Dữ liệu JSON không hợp lệ." },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const userId = req.headers.get("x-user-id") || body?.userId || url.searchParams.get("userId");
    const tripId = body?.id || body?.tripId || url.searchParams.get("id") || url.searchParams.get("tripId");

    if (!userId) {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Vui lòng đăng nhập.", thongDiep: "Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    if (!tripId) {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Thiếu mã chuyến đi cần cập nhật.", thongDiep: "Thiếu mã chuyến đi cần cập nhật." },
        { status: 400 }
      );
    }

    const updated = updateUserTrip(userId, tripId, {
      title: body.title,
      ledger: body.ledger,
      tickedPlaces: body.tickedPlaces,
      plan: body.plan,
    });

    if (!updated) {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Không tìm thấy chuyến đi cần cập nhật.", thongDiep: "Không tìm thấy chuyến đi cần cập nhật." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      thanhCong: true,
      trip: updated,
      message: "Đã cập nhật chuyến đi thành công.",
      thongDiep: "Đã cập nhật chuyến đi thành công.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, thanhCong: false, error: msg, thongDiep: msg },
      { status: 500 }
    );
  }
}

