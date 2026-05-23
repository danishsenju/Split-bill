"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, RefreshCw, FileText } from "lucide-react";
import { ScanResult } from "@/types";
import { scanReceipt } from "@/lib/gemini";

interface Props {
  onScanComplete: (result: ScanResult) => void;
  onManualEntry: () => void;
}

type ScanState = "idle" | "loading" | "error";

export default function ReceiptScanner({ onScanComplete, onManualEntry }: Props) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setErrorMsg("");
    setScanState("loading");
    setPreview(null);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // strip the data url prefix: "data:image/jpeg;base64,..."
          const b64 = result.split(",")[1];
          if (b64) resolve(b64);
          else reject(new Error("Gagal baca fail"));
        };
        reader.onerror = () => reject(new Error("Gagal baca fail"));
        reader.readAsDataURL(file);
      });

      // show preview
      setPreview(`data:${file.type};base64,${base64}`);

      const result = await scanReceipt(base64, file.type || "image/jpeg");
      setScanState("idle");
      onScanComplete(result);
    } catch (err) {
      setScanState("error");
      setErrorMsg((err as Error).message || "Gagal membaca resit");
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  function triggerCamera() {
    fileInputRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Idle state */}
      {scanState === "idle" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          {preview ? (
            <div className="w-full aspect-[4/3] rounded-card overflow-hidden bg-bg-primary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Resit" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full aspect-[4/3] rounded-card border-2 border-dashed border-white/20 bg-bg-surface flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                <Camera size={26} className="text-accent" />
              </div>
              <p className="text-text-secondary font-dm text-sm text-center px-4">
                Ambil gambar atau pilih resit dari galeri
              </p>
            </div>
          )}

          <button
            onClick={triggerCamera}
            className="flex items-center justify-center gap-2 bg-accent text-bg-primary font-dm font-semibold py-4 rounded-btn text-sm w-full"
          >
            <Camera size={16} />
            Imbas Resit
          </button>

          <button
            onClick={onManualEntry}
            className="flex items-center justify-center gap-2 border border-white/10 text-text-secondary font-dm text-sm py-3 rounded-btn w-full"
          >
            <FileText size={16} />
            Masuk Manual
          </button>
        </motion.div>
      )}

      {/* Loading state */}
      {scanState === "loading" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="surface-card rounded-card p-8 flex flex-col items-center gap-4"
        >
          {preview && (
            <div className="w-full aspect-[4/3] rounded-card overflow-hidden bg-bg-primary mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Resit" className="w-full h-full object-cover opacity-50" />
            </div>
          )}
          <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="font-dm text-text-secondary text-sm text-center">
            AI sedang baca resit...
          </p>
          <p className="text-text-muted text-xs font-dm text-center">
            Ini mungkin mengambil masa beberapa saat
          </p>
        </motion.div>
      )}

      {/* Error state */}
      {scanState === "error" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="surface-card rounded-card p-6 flex flex-col items-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="font-dm text-text-secondary text-sm text-center">
            {errorMsg || "Gagal baca resit. Cuba lagi atau masuk manual."}
          </p>

          <div className="flex gap-2 w-full">
            <button
              onClick={triggerCamera}
              className="flex-1 flex items-center justify-center gap-2 bg-accent text-bg-primary font-dm font-semibold py-3 rounded-btn text-sm"
            >
              <RefreshCw size={15} />
              Cuba Lagi
            </button>
            <button
              onClick={onManualEntry}
              className="flex-1 flex items-center justify-center gap-2 border border-white/10 text-text-secondary font-dm text-sm py-3 rounded-btn"
            >
              <FileText size={15} />
              Masuk Manual
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
