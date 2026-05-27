import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const PROMPT =
  'Extract ALL line items from this receipt. Return ONLY valid JSON, no markdown: {"storeName": string, "items": [{"id": string, "name": string, "price": number, "qty": number}], "subtotal": number, "tax": number, "serviceCharge": number, "total": number}. Price = unit price × qty. Assume MYR.';

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
];

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

    const ai = new GoogleGenAI({ apiKey });
    let textContent = "";

    for (const modelName of MODELS) {
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: image } },
                { text: PROMPT },
              ],
            },
          ],
        });
        textContent = result.text ?? "";
        break;
      } catch (e) {
        console.error(`${modelName} error full:`, e);
        const msg = e instanceof Error ? e.message : "";
        const is429 = msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("resource_exhausted");
        const isFatal = msg.includes("403") || msg.toLowerCase().includes("permission_denied");
        if (!isFatal && modelName !== MODELS[MODELS.length - 1]) {
          if (is429) await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw e;
      }
    }

    if (!textContent) throw new Error("Model tidak mengembalikan teks");

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
    const message = err instanceof Error ? err.message : String(err);
    console.error("Scan route error full:", err);
    const is429 = message.includes("429") || message.toLowerCase().includes("resource_exhausted");
    const is403 = message.includes("403") || message.toLowerCase().includes("permission_denied");
    let userMessage: string;
    if (is429) userMessage = "Quota AI habis. Cuba lagi dalam 30 saat.";
    else if (is403) userMessage = "API key tidak sah. Semak GEMINI_API_KEY dalam Vercel.";
    else userMessage = "Gagal membaca resit. Cuba lagi atau masuk manual.";
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
