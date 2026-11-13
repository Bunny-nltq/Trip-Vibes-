import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { PlanSchema, TemplateSlugSchema, schemaVersion } from "@/contracts";
export async function GET(_request: Request, { params }: {
    params: Promise<{
        slug: string;
    }>;
}) {
    const slug = TemplateSlugSchema.safeParse((await params).slug);
    if (!slug.success || ["bangkok","seoul"].includes(slug.data))
        return NextResponse.json({ ok: false, error: "Không có lịch trình mẫu này." }, { status: 404 });
    try {
        const raw = JSON.parse(await readFile(join(process.cwd(), "src", "data", "mau", `${slug.data}-3ngay.json`), "utf8"));
        return NextResponse.json({ ok: true, plan: PlanSchema.parse({ ...raw.plan, schemaVersion, request: { sothich: [], tranh: [], ghiChu: [], thieu: [], cauHoiLamRo: [], canhBao: [], ...raw.plan.request, schemaVersion } }) });
    }
    catch {
        return NextResponse.json({ ok: false, error: "Chưa thể tải lịch trình mẫu." }, { status: 503 });
    }
}
