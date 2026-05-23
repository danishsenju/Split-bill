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
      <div className="flex items-center gap-3 bg-bg-card rounded-input px-4 py-3 border border-white/10">
        <span
          className="font-jetbrains font-medium flex-1"
          style={{
            fontSize: 22,
            letterSpacing: "3px",
            color: "#D4AF37",
          }}
        >
          {code}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors"
        >
          {copied ? (
            <Check size={16} className="text-success" />
          ) : (
            <Copy size={16} />
          )}
          <span className="text-xs font-dm">{copied ? "Disalin!" : "Salin"}</span>
        </button>
      </div>
      <p className="text-xs text-text-muted font-dm text-center">
        Masuk dalam rujukan pembayaran
      </p>
    </div>
  );
}
