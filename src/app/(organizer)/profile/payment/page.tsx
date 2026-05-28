"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Upload, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { PaymentMethod } from "@/types";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const BANKS = [
  "Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "Hong Leong Bank",
  "AmBank", "Bank Islam", "Bank Rakyat", "BSN", "OCBC Bank",
  "UOB Malaysia", "HSBC Bank", "Standard Chartered", "Touch 'n Go",
];

function FieldInput({
  value,
  onChange,
  placeholder,
  required,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-[10px] px-4 py-3 text-sm"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        outline: "none",
        color: "#ffffff",
        transition: "border-color 150ms",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
    />
  );
}

export default function AddPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [bankName, setBankName] = useState(BANKS[0]);
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState("");
  const [showBankPicker, setShowBankPicker] = useState(false);

  function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrFile(file);
    const reader = new FileReader();
    reader.onload = () => setQrPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi tamat. Sila log masuk semula.");

      let qrUrl: string | undefined;
      if (paymentMethod === "qr" && qrFile) {
        const { data: uploadData } = await supabase.storage
          .from("qr-codes")
          .upload(`${user.id}/qr.png`, qrFile, { upsert: true });
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("qr-codes").getPublicUrl(uploadData.path);
          qrUrl = urlData.publicUrl;
        }
      }

      const update =
        paymentMethod === "bank"
          ? {
              payment_method: "bank" as PaymentMethod,
              bank_name: bankName,
              bank_account: bankAccount,
              bank_holder_name: bankHolder,
              qr_url: null,
            }
          : {
              payment_method: "qr" as PaymentMethod,
              qr_url: qrUrl,
              bank_name: null,
              bank_account: null,
              bank_holder_name: null,
            };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(update)
        .eq("id", user.id);

      if (updateError) throw new Error("Gagal simpan: " + updateError.message);

      setSuccess(true);
      setTimeout(() => router.push("/profile"), 1200);
    } catch (err) {
      setError((err as Error).message || "Gagal simpan. Cuba lagi.");
      setLoading(false);
    }
  }

  const canSubmit =
    !loading &&
    (paymentMethod === "bank" ? bankAccount.trim() && bankHolder.trim() : !!qrFile);

  return (
    <div
      className="min-h-dvh flex flex-col px-5 py-10"
      style={{ background: "#000000", maxWidth: 480, margin: "0 auto" }}
    >
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 mb-8 active:scale-[0.97]"
        style={{ color: "var(--color-whisper-gray)", fontSize: 14, transition: "transform 160ms" }}
      >
        <ArrowLeft size={16} />
        Balik
      </button>

      <h1
        className="font-syne font-bold mb-1"
        style={{ fontSize: 22, color: "#F5F0E8" }}
      >
        Kaedah Pembayaran
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-whisper-gray)" }}>
        Pilih cara kamu terima bayaran daripada ahli.
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Toggle */}
        <div
          className="flex rounded-[99px] p-1"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        >
          {(["bank", "qr"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPaymentMethod(m)}
              className="flex-1 py-2 rounded-[99px] text-sm font-medium active:scale-[0.97]"
              style={{
                background: paymentMethod === m ? "var(--gradient-deep-ocean)" : "transparent",
                color: paymentMethod === m ? "#000000" : "var(--color-whisper-gray)",
                transition: "background 200ms, color 200ms, transform 160ms",
              }}
            >
              {m === "bank" ? "Akaun Bank" : "DuitNow QR"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <AnimatePresence mode="wait">
          {paymentMethod === "bank" ? (
            <motion.div
              key="bank"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="flex flex-col gap-4"
            >
              {/* Bank picker */}
              <div className="relative flex flex-col gap-1.5">
                <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>Nama Bank</label>
                <button
                  type="button"
                  onClick={() => setShowBankPicker(!showBankPicker)}
                  className="w-full rounded-[10px] px-4 py-3 text-sm flex items-center justify-between active:scale-[0.97]"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#ffffff",
                    transition: "transform 160ms",
                  }}
                >
                  <span>{bankName}</span>
                  <ChevronDown size={15} style={{ color: "var(--color-whisper-gray)" }} />
                </button>
                {showBankPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.15, ease: EASE_OUT }}
                    className="absolute top-full left-0 right-0 z-20 rounded-[10px] mt-1 max-h-48 overflow-y-auto scrollbar-hide"
                    style={{
                      background: "#111",
                      border: "1px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
                    }}
                  >
                    {BANKS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => { setBankName(b); setShowBankPicker(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm"
                        style={{ color: bankName === b ? "#a0e0ab" : "#ffffff" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        {b}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>No. Akaun</label>
                <FieldInput
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="XXXX XXXX XXXX XXXX"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>Nama Pemegang Akaun</label>
                <FieldInput
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  placeholder="Hafiz Bin Rahman"
                  required
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="qr"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <label className="text-xs block mb-1.5" style={{ color: "var(--color-whisper-gray)" }}>
                Upload QR DuitNow
              </label>
              <label
                className="flex flex-col items-center justify-center gap-3 rounded-[10px] py-8 cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px dashed rgba(255,255,255,0.15)",
                  transition: "border-color 150ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
              >
                <input type="file" accept="image/*" onChange={handleQrChange} className="hidden" />
                {qrPreview ? (
                  <img src={qrPreview} alt="QR Preview" className="w-40 h-40 object-contain rounded-[10px]" />
                ) : (
                  <>
                    <Upload size={26} style={{ color: "var(--color-whisper-gray)" }} />
                    <span className="text-sm" style={{ color: "var(--color-whisper-gray)" }}>
                      Tap untuk upload QR
                    </span>
                  </>
                )}
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p
            className="text-sm px-3 py-2 rounded-[10px]"
            style={{
              color: "#FF6B6B",
              background: "rgba(255,107,107,0.1)",
              border: "1px solid rgba(255,107,107,0.2)",
            }}
          >
            {error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={!canSubmit}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {success ? "Tersimpan ✓" : "Simpan"}
        </PrimaryButton>
      </form>
    </div>
  );
}
