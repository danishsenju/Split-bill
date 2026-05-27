import type { ScanResult } from "@/types";

const SKIP_RE = /total|subtotal|tax|gst|sst|service|charge|amount|discount|jumlah|cukai|balance|change|cash|bayaran|tunai|rounding|saving|spec|disc|master|visa|approcode|appro|payment|item\s+\d|qty\s/i;
const TAX_RE = /tax|gst|sst|cukai/i;
const SVC_RE = /service|charge/i;
const PRICE_RE = /(\d+\.\d{2})/g;
const STORE_NAME_RE = /^[A-Z][A-Z\s&'.-]+$/;

interface MergedLine {
  name: string | null; // readable name from the line above (two-line items)
  priceLine: string;   // the line that contains the price
}

// Malaysian receipts use two lines for weight-based items:
//   CUCUMBER - JAPANESE (KYURI) (MYS) K10    ← name (no price)
//   21J061100433 KG   0.446x9.70   4.33      ← barcode+price (starts with digit)
// Merge them so we keep the readable name but extract the price from line 2.
function mergeItemLines(rawLines: string[]): MergedLine[] {
  const result: MergedLine[] = [];
  let i = 0;
  while (i < rawLines.length) {
    const curr = rawLines[i];
    const next = rawLines[i + 1] ?? "";
    const currHasPrice = PRICE_RE.test(curr);
    const nextHasPrice = PRICE_RE.test(next);
    if (!currHasPrice && nextHasPrice && /^\d/.test(next)) {
      result.push({ name: curr, priceLine: next });
      i += 2;
    } else {
      result.push({ name: null, priceLine: curr });
      i++;
    }
  }
  return result;
}

export function parseReceiptText(text: string): ScanResult {
  const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const merged = mergeItemLines(rawLines);
  const items: ScanResult["items"] = [];
  let tax = 0;
  let serviceCharge = 0;
  let storeName = "";

  for (const { name: mergedName, priceLine } of merged) {
    const prices = Array.from(priceLine.matchAll(PRICE_RE)).map((m) => parseFloat(m[1]));

    if (!prices.length) {
      if (!storeName && STORE_NAME_RE.test(priceLine)) storeName = priceLine;
      continue;
    }

    const price = prices[prices.length - 1]; // rightmost number is the item total
    if (price <= 0) continue; // skip zero-cost lines (Spec.Disc 0.00, Saving 0.00)

    if (SKIP_RE.test(priceLine)) {
      if (TAX_RE.test(priceLine)) tax = price;
      if (SVC_RE.test(priceLine)) serviceCharge = price;
      continue;
    }

    const extracted = priceLine.replace(PRICE_RE, "").replace(/\s+/g, " ").trim();
    const name = mergedName ?? (extracted || "Item");

    items.push({ id: String(items.length + 1), name, price, qty: 1 });
  }

  const subtotal = parseFloat(items.reduce((s, i) => s + i.price, 0).toFixed(2));
  const total = parseFloat((subtotal + tax + serviceCharge).toFixed(2));

  return { storeName, items, subtotal, tax, serviceCharge, total };
}
