import type { ScanResult } from "@/types";

const SKIP_RE = /total|subtotal|tax|gst|sst|service|charge|amount|discount|jumlah|cukai|balance|change|cash|bayaran|tunai/i;
const TAX_RE = /tax|gst|sst|cukai/i;
const SVC_RE = /service|charge/i;
const PRICE_RE = /(\d+\.\d{2})/g;

export function parseReceiptText(text: string): ScanResult {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: ScanResult["items"] = [];
  let tax = 0;
  let serviceCharge = 0;
  let storeName = "";

  for (const line of lines) {
    const prices = Array.from(line.matchAll(PRICE_RE)).map((m) => parseFloat(m[1]));
    if (!prices.length) {
      if (!storeName) storeName = line;
      continue;
    }

    const price = prices[prices.length - 1]; // rightmost number is the price

    if (SKIP_RE.test(line)) {
      if (TAX_RE.test(line)) tax = price;
      if (SVC_RE.test(line)) serviceCharge = price;
      continue;
    }

    const name =
      line
        .replace(PRICE_RE, "")
        .replace(/\s+/g, " ")
        .trim() || "Item";

    items.push({ id: String(items.length + 1), name, price, qty: 1 });
  }

  const subtotal = parseFloat(items.reduce((s, i) => s + i.price, 0).toFixed(2));
  const total = parseFloat((subtotal + tax + serviceCharge).toFixed(2));

  return { storeName, items, subtotal, tax, serviceCharge, total };
}
