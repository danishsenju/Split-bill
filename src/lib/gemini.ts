import { ScanResult } from "@/types";

export async function scanReceipt(
  base64Image: string,
  mimeType: string
): Promise<ScanResult> {
  const response = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image, mimeType }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error((body as { error?: string })?.error ?? "Gagal membaca resit");
  }

  return response.json();
}
