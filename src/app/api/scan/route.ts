import { NextRequest, NextResponse } from "next/server";
import Tesseract from "tesseract.js";

export const maxDuration = 60;

interface ScanResult {
  storeName: string;
  items: Array<{ id: string; name: string; price: number; qty: number }>;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
}

const SKIP_RE = /total|subtotal|tax|gst|sst|service|charge|amount|discount|jumlah|cukai|balance|change|cash|bayaran|tunai/i;
const TAX_RE = /tax|gst|sst|cukai/i;
const SERVICE_RE = /service|charge/i;
const PRICE_RE = /(\d+\.\d{2})/g;

function parseReceiptText(text: string): ScanResult {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: ScanResult["items"] = [];
  let tax = 0;
  let serviceCharge = 0;
  let storeName = "";

  for (const line of lines) {
    const prices = Array.from(line.matchAll(PRICE_RE)).map((m) => parseFloat(m[1]));
    if (!prices.length) {
      // First non-price line is likely the store name
      if (!storeName) storeName = line;
      continue;
    }

    const price = prices[prices.length - 1]; // rightmost number is the price

    if (SKIP_RE.test(line)) {
      if (TAX_RE.test(line)) tax = price;
      if (SERVICE_RE.test(line)) serviceCharge = price;
      continue;
    }

    const name =
      line
        .replace(PRICE_RE, "")
        .replace(/\s+/g, " ")
        .trim() || "Item";

    items.push({ id: String(items.length + 1), name, price, qty: 1 });
  }

  const subtotal = parseFloat(
    items.reduce((s, i) => s + i.price, 0).toFixed(2)
  );
  const total = parseFloat((subtotal + tax + serviceCharge).toFixed(2));

  return { storeName, items, subtotal, tax, serviceCharge, total };
}

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

    const imageBuffer = Buffer.from(image, "base64");

    const worker = await Tesseract.createWorker("eng");
    const {
      data: { text },
    } = await worker.recognize(imageBuffer);
    await worker.terminate();

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Teks tidak dapat dibaca dalam gambar. Cuba gambar yang lebih jelas." },
        { status: 422 }
      );
    }

    const result = parseReceiptText(text);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membaca resit";
    console.error("Scan route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
