import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const PROMPT =
  'Extract ALL line items from this receipt. Return ONLY valid JSON, no markdown: {"storeName": string, "items": [{"id": string, "name": string, "price": number, "qty": number}], "subtotal": number, "tax": number, "serviceCharge": number, "total": number}. Price = unit price. Assume MYR.';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { image: string; mimeType: string };
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json({ error: "Imej dan jenis MIME diperlukan" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Konfigurasi API tidak sah" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      { inlineData: { mimeType, data: image } },
      PROMPT,
    ]);

    const textContent = result.response.text().trim();

    if (!textContent) {
      return NextResponse.json(
        { error: "Gemini tidak dapat membaca teks dalam gambar." },
        { status: 500 }
      );
    }

    const cleaned = textContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as {
      storeName: string;
      items: Array<{ id: string; name: string; price: number; qty: number }>;
      subtotal: number;
      tax: number;
      serviceCharge: number;
      total: number;
    };

    const items = parsed.items.map((item, idx) => ({
      ...item,
      id: item.id ?? `item_${idx + 1}`,
    }));

    return NextResponse.json({
      storeName: parsed.storeName ?? "",
      items,
      subtotal: parsed.subtotal ?? 0,
      tax: parsed.tax ?? 0,
      serviceCharge: parsed.serviceCharge ?? 0,
      total: parsed.total ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membaca resit";
    console.error("Scan route error:", message, err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
