import { NextResponse } from "next/server";
import { confirmExpense, type ConfirmExpenseInput } from "@/core/confirmExpense";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = crypto.randomUUID();
    const res = confirmExpense(body as ConfirmExpenseInput, id);
    
    if (res.ok) {
      return NextResponse.json({ ok: true, expense: res.expense });
    } else {
      return NextResponse.json({ ok: false, loi: res.loi }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
}
