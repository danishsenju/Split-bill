"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Upload, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { PaymentMethod } from "@/types";

const BANKS = [
  "Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "Hong Leong Bank",
  "AmBank", "Bank Islam", "Bank Rakyat", "BSN", "OCBC Bank",
  "UOB Malaysia", "HSBC Bank", "Standard Chartered", "Touch 'n Go",
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Step 2
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Pendaftaran gagal");

      let qrUrl: string | undefined;
      if (paymentMethod === "qr" && qrFile) {
        const { data: uploadData } = await supabase.storage
          .from("qr-codes")
          .upload(`${authData.user.id}/qr.png`, qrFile, { upsert: true });
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("qr-codes").getPublicUrl(uploadData.path);
          qrUrl = urlData.publicUrl;
        }
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        name,
        email,
        phone,
        payment_method: paymentMethod,
        bank_name: paymentMethod === "bank" ? bankName : null,
        bank_account: paymentMethod === "bank" ? bankAccount : null,
        bank_holder_name: paymentMethod === "bank" ? bankHolder : null,
        qr_url: qrUrl,
      });

      if (profileError) throw new Error("Gagal simpan profil: " + profileError.message);

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Pendaftaran gagal. Cuba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col px-5 pt-12 pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-syne font-extrabold text-3xl text-text-primary">
            Bayar<span className="text-accent">Lah</span>
          </h1>
          <p className="text-text-secondary font-dm text-sm mt-1">Daftar akaun organizer</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-dm font-semibold transition-colors ${
                  step >= s ? "bg-accent text-bg-primary" : "bg-bg-surface text-text-muted border border-white/10"
                }`}
              >
                {s}
              </div>
              {s < 2 && <div className={`h-px w-8 transition-colors ${step > s ? "bg-accent" : "bg-white/10"}`} />}
            </div>
          ))}
          <span className="text-text-muted text-xs font-dm ml-2">
            {step === 1 ? "Maklumat Diri" : "Kaedah Pembayaran"}
          </span>
        </div>

        <form onSubmit={handleRegister}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-text-secondary text-xs font-dm mb-1.5 block">Nama Penuh</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Hafiz Bin Rahman"
                    required
                    className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm placeholder:text-text-muted focus:border-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs font-dm mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hafiz@email.com"
                    required
                    className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm placeholder:text-text-muted focus:border-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs font-dm mb-1.5 block">No. Telefon</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+60123456789"
                    className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm placeholder:text-text-muted focus:border-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs font-dm mb-1.5 block">Kata Laluan</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 aksara"
                      required
                      minLength={6}
                      className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 pr-12 text-text-primary font-dm text-sm placeholder:text-text-muted focus:border-accent/50 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { if (name && email && password.length >= 6) setStep(2); }}
                  disabled={!name || !email || password.length < 6}
                  className="mt-2 w-full bg-accent text-bg-primary font-dm font-semibold py-3.5 rounded-btn text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
                >
                  Seterusnya →
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <p className="text-text-secondary text-sm font-dm">
                  Pilih kaedah penerimaan bayaran kamu.
                </p>

                {/* Toggle */}
                <div className="flex bg-bg-surface border border-white/10 rounded-btn p-1">
                  {(["bank", "qr"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-2 rounded-[10px] text-sm font-dm font-medium transition-colors ${
                        paymentMethod === m
                          ? "bg-accent text-bg-primary"
                          : "text-text-muted"
                      }`}
                    >
                      {m === "bank" ? "Akaun Bank" : "DuitNow QR"}
                    </button>
                  ))}
                </div>

                {paymentMethod === "bank" ? (
                  <>
                    <div className="relative">
                      <label className="text-text-secondary text-xs font-dm mb-1.5 block">Nama Bank</label>
                      <button
                        type="button"
                        onClick={() => setShowBankPicker(!showBankPicker)}
                        className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm flex items-center justify-between"
                      >
                        {bankName}
                        <ChevronDown size={16} className="text-text-muted" />
                      </button>
                      {showBankPicker && (
                        <div className="absolute top-full left-0 right-0 z-20 bg-bg-surface border border-white/10 rounded-input mt-1 max-h-48 overflow-y-auto">
                          {BANKS.map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => { setBankName(b); setShowBankPicker(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm font-dm transition-colors hover:bg-white/5 ${bankName === b ? "text-accent" : "text-text-primary"}`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-text-secondary text-xs font-dm mb-1.5 block">No. Akaun</label>
                      <input
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="51427766"
                        required
                        className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm placeholder:text-text-muted focus:border-accent/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-text-secondary text-xs font-dm mb-1.5 block">Nama Pemegang Akaun</label>
                      <input
                        value={bankHolder}
                        onChange={(e) => setBankHolder(e.target.value)}
                        placeholder="Hafiz Bin Rahman"
                        required
                        className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm placeholder:text-text-muted focus:border-accent/50 transition-colors"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-text-secondary text-xs font-dm mb-1.5 block">Upload QR DuitNow</label>
                    <label className="flex flex-col items-center justify-center gap-3 bg-bg-surface border border-dashed border-white/20 rounded-card py-8 cursor-pointer hover:border-accent/40 transition-colors">
                      <input type="file" accept="image/*" onChange={handleQrChange} className="hidden" />
                      {qrPreview ? (
                        <img src={qrPreview} alt="QR Preview" className="w-40 h-40 object-contain rounded-input" />
                      ) : (
                        <>
                          <Upload size={28} className="text-text-muted" />
                          <span className="text-text-muted text-sm font-dm">Tap untuk upload QR</span>
                        </>
                      )}
                    </label>
                  </div>
                )}

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-danger text-sm font-dm bg-danger/10 px-3 py-2 rounded-input">
                    {error}
                  </motion.p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3.5 rounded-btn border border-white/10 text-text-secondary font-dm text-sm"
                  >
                    ← Balik
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (paymentMethod === "bank" && (!bankAccount || !bankHolder)) || (paymentMethod === "qr" && !qrFile)}
                    className="flex-1 bg-accent text-bg-primary font-dm font-semibold py-3.5 rounded-btn text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Daftar Sekarang
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <p className="text-center text-text-muted text-sm font-dm mt-6">
          Dah ada akaun?{" "}
          <Link href="/auth/login" className="text-accent">
            Log masuk
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
