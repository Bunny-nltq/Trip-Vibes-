import { NextResponse } from "next/server";
import { extractBill } from "@/ai/extractBill";
import { checkBill } from "@/core/bill/checkBill";

export async function POST(req: Request) {
  const startMs = Date.now();
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    if (!image) {
      return NextResponse.json({ error: "Thiếu file ảnh" }, { status: 400 });
    }

    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File vượt quá 5MB" }, { status: 413 });
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      return NextResponse.json({ error: "Chỉ hỗ trợ jpeg, png, webp" }, { status: 400 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Check magic bytes
    let isValidType = false;
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) isValidType = true; // jpeg
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) isValidType = true; // png
    if (bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) isValidType = true; // webp
    
    if (!isValidType) {
      return NextResponse.json({ error: "Chỉ hỗ trợ jpeg, png, webp hợp lệ" }, { status: 400 });
    }

    const base64Bytes = Buffer.from(arrayBuffer).toString('base64');
    
    const raw = await extractBill({ bytes: base64Bytes, mimeType: image.type });
    const extraction = checkBill(raw);

    const ms = Date.now() - startMs;
    return NextResponse.json({ ok: true, extraction, ms });
  } catch (err: any) {
    const msg = err.message || String(err);
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({ error: "Đã vượt hạn mức sử dụng Gemini API. Vui lòng thử lại sau." }, { status: 429 });
    }
    return NextResponse.json({ error: "Lỗi AI không đọc được ảnh: " + msg }, { status: 502 });
  }
}
