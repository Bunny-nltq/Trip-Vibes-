import { NextResponse } from "next/server";
import { loginUser } from "@/data/authStore";

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

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: "Thiếu dữ liệu yêu cầu.", thongDiep: "Thiếu dữ liệu yêu cầu." },
        { status: 400 }
      );
    }

    const email = body.email || "";
    const password = body.password || body.matKhau || "";

    const result = loginUser(email, password);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, thanhCong: false, error: result.error, thongDiep: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      thanhCong: true,
      user: result.user,
      message: "Đăng nhập thành công.",
      thongDiep: "Đăng nhập thành công.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, thanhCong: false, error: msg, thongDiep: msg },
      { status: 500 }
    );
  }
}
