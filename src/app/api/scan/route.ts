import { NextRequest, NextResponse } from "next/server";

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiContent {
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content: GeminiContent;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string };
}

const PROMPT =
  'Extract ALL line items from this receipt. Return ONLY valid JSON in this exact format: {"storeName": string, "items": [{"id": string, "name": string, "price": number, "qty": number}], "subtotal": number, "tax": number, "serviceCharge": number, "total": number}. Price = unit price. Assume MYR if currency unclear. No markdown, no explanation.';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { image: string; mimeType: string };
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Imej dan jenis MIME diperlukan" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Konfigurasi API tidak sah" },
        { status: 500 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: image,
              },
            },
            {
              text: PROMPT,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    };

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "Gagal membaca resit" },
        { status: 500 }
      );
    }

    const geminiData = (await geminiRes.json()) as GeminiResponse;

    if (geminiData.error) {
      console.error("Gemini error:", geminiData.error.message);
      return NextResponse.json(
        { error: "Gagal membaca resit" },
        { status: 500 }
      );
    }

    const textContent =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!textContent) {
      return NextResponse.json(
        { error: "Gagal membaca resit" },
        { status: 500 }
      );
    }

    // Strip any accidental markdown code fences
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

    // Ensure all items have an id
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
    console.error("Scan route error:", err);
    return NextResponse.json(
      { error: "Gagal membaca resit" },
      { status: 500 }
    );
  }
}
