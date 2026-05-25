"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface PayCodeDisplayProps {
  code: string;
}

export default function PayCodeDisplay({ code }: PayCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-3"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "10px",
          padding: "12px 16px",
        }}
      >
        <span
          className="font-jetbrains font-medium flex-1 text-frost"
          style={{ fontSize: 22, letterSpacing: "3px" }}
        >
          {code}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 active:scale-[0.93]"
          style={{
            color: copied ? "#22c55e" : "#6d6d6d",
            transition: "color 150ms cubic-bezier(0.23,1,0.32,1), transform 160ms",
          }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          <span className="font-dm text-xs">{copied ? "Disalin!" : "Salin"}</span>
        </button>
      </div>
      <p className="font-dm text-center" style={{ fontSize: "11px", color: "#6d6d6d" }}>
        Masuk dalam rujukan pembayaran
      </p>
    </div>
  );
}
