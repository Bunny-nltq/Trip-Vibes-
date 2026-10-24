import { NextResponse } from "next/server";
import { confirmExpense, type ConfirmExpenseInput } from "@/core/confirmExpense";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Dữ liệu JSON không hợp lệ." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Thiếu dữ liệu yêu cầu." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const id = typeof payload.id === "string" && payload.id ? payload.id : crypto.randomUUID();

    const input: ConfirmExpenseInput = {
      nguon: payload.nguon === "anh_bill" ? "anh_bill" : "nhap_tay",
      tenCuaHang: typeof payload.tenCuaHang === "string" ? payload.tenCuaHang : null,
      ngay: typeof payload.ngay === "string" ? payload.ngay : null,
      ngayTrongChuyen: typeof payload.ngayTrongChuyen === "number" ? payload.ngayTrongChuyen : null,
      hangMuc: typeof payload.hangMuc === "string" ? payload.hangMuc : "",
      soTienVND: typeof payload.soTienVND === "number" ? payload.soTienVND : 0,
      giaTriAIDoc: typeof payload.giaTriAIDoc === "number" ? payload.giaTriAIDoc : null,
      ghiChu: typeof payload.ghiChu === "string" ? payload.ghiChu : null,
    };

    const res = confirmExpense(input, id);

    if (res.ok) {
      return NextResponse.json({ ok: true, expense: res.expense });
    } else {
      return NextResponse.json({ ok: false, loi: res.loi }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Dữ liệu không hợp lệ";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
