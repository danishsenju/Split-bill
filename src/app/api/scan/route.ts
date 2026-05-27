import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const PROMPT =
  'Extract ALL line items from this receipt. Return ONLY valid JSON, no markdown: {"storeName": string, "items": [{"id": string, "name": string, "price": number, "qty": number}], "subtotal": number, "tax": number, "serviceCharge": number, "total": number}. Price = unit price × qty. Assume MYR.';

const MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = (await req.json()) as {
      image: string;
      mimeType: string;
    };

    if (!image || !mimeType) {
      return NextResponse.json({ error: "Imej diperlukan" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key tidak dikonfigurasi" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let textContent = "";

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          { inlineData: { mimeType, data: image } },
          PROMPT,
        ]);
        textContent = result.response.text().trim();
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        const is429 = msg.includes("429") || msg.toLowerCase().includes("quota");
        const is404 = msg.includes("404") || msg.toLowerCase().includes("not found");
        if ((is429 || is404) && modelName !== MODELS[MODELS.length - 1]) {
          console.warn(`${modelName} failed, trying next model...`);
          continue;
        }
        throw e;
      }
    }

    const cleaned = textContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as {
      storeName: string;
      items: Array<{ id?: string; name: string; price: number; qty: number }>;
      subtotal: number;
      tax: number;
      serviceCharge: number;
      total: number;
    };

    const items = (parsed.items ?? []).map((item, idx) => ({
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
    console.error("Scan route error:", message);
    const is429 = message.includes("429") || message.toLowerCase().includes("quota");
    return NextResponse.json(
      { error: is429 ? "Quota AI habis. Cuba lagi dalam 30 saat." : message },
      { status: 500 }
    );
  }
}
