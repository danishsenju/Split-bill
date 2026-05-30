"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Upload, ChevronDown, Info } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { PaymentMethod } from "@/types";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import Silk from "@/components/ui/Silk";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const BANKS = [
  "Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "Hong Leong Bank",
  "AmBank", "Bank Islam", "Bank Rakyat", "BSN", "OCBC Bank",
  "UOB Malaysia", "HSBC Bank", "Standard Chartered", "Touch 'n Go",
];

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE_OUT } },
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Pre-fill from pay page URL params
  const [memberToken, setMemberToken] = useState("");
  const [prefillFromBill, setPrefillFromBill] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [bankName, setBankName] = useState(BANKS[0]);
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState("");
  const [showBankPicker, setShowBankPicker] = useState(false);

  useEffect(() => {
    const prefillName = searchParams.get("name");
    const token = searchParams.get("token");
    if (prefillName) {
      setName(decodeURIComponent(prefillName));
      setPrefillFromBill(true);
    }
    if (token) setMemberToken(decodeURIComponent(token));
  }, [searchParams]);

  function validateUsername(u: string) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(u);
  }

  function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrFile(file);
    const reader = new FileReader();
    reader.onload = () => setQrPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function canProceedStep1() {
    return (
      name.trim().length >= 2 &&
      validateUsername(username) &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      password === confirmPassword
    );
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Kata laluan tidak sepadan");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Check username uniqueness
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      if (existing) throw new Error("Username sudah digunakan. Pilih username lain.");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: name.trim(),
            username: username.toLowerCase(),
            phone: phone || null,
            payment_method: paymentMethod,
            bank_name: paymentMethod === "bank" ? bankName : null,
            bank_account: paymentMethod === "bank" ? bankAccount : null,
            bank_holder_name: paymentMethod === "bank" ? bankHolder : null,
          },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Pendaftaran gagal");

      // Email confirmation required — session is null
      if (!authData.session) {
        setRegisteredEmail(email);
        setVerificationSent(true);
        setLoading(false);
        return;
      }

      // Session exists → email confirmation disabled, proceed immediately
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
        name: name.trim(),
        username: username.toLowerCase(),
        email,
        phone: phone || null,
        payment_method: paymentMethod,
        bank_name: paymentMethod === "bank" ? bankName : null,
        bank_account: paymentMethod === "bank" ? bankAccount : null,
        bank_holder_name: paymentMethod === "bank" ? bankHolder : null,
        qr_url: qrUrl,
      });

      if (profileError) throw new Error("Gagal simpan profil: " + profileError.message);

      if (memberToken) {
        await fetch("/api/member/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: memberToken, userId: authData.user.id, name: name.trim() }),
        });
      }

      const inviteId = localStorage.getItem("kolekduit_invite");
      if (inviteId && inviteId !== authData.user.id) {
        await fetch("/api/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviterId: inviteId }),
        });
      }
      localStorage.removeItem("kolekduit_invite");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Pendaftaran gagal. Cuba lagi.");
      setLoading(false);
    }
  }

  if (verificationSent) {
    return (
      <div className="relative min-h-dvh overflow-hidden" style={{ background: "#000" }}>
        <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
          <Silk speed={5} scale={1} color="#270d90" noiseIntensity={1.5} rotation={4.18} />
        </div>
        <div
          aria-hidden
          className="fixed inset-0 z-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 0%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.78) 100%)" }}
        />
        <div className="relative z-10 min-h-dvh flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="w-full max-w-sm text-center"
          >
            <div
              className="text-5xl mb-6"
              style={{ filter: "drop-shadow(0 0 20px rgba(160,224,171,0.5))" }}
            >
              📩
            </div>
            <h2
              className="font-clash mb-3"
              style={{ fontSize: "28px", fontWeight: 500, color: "#F5F0E8", letterSpacing: "-0.03em" }}
            >
              Semak email anda
            </h2>
            <p
              className="font-dm mb-2"
              style={{ fontSize: "14px", color: "rgba(245,240,232,0.6)", lineHeight: 1.6 }}
            >
              Kami hantar link pengesahan ke
            </p>
            <p
              className="font-dm mb-6"
              style={{ fontSize: "15px", color: "#a0e0ab", fontWeight: 600 }}
            >
              {registeredEmail}
            </p>
            <p
              className="font-dm mb-8"
              style={{ fontSize: "13px", color: "rgba(245,240,232,0.45)", lineHeight: 1.6 }}
            >
              Klik link dalam email tersebut untuk aktifkan akaun anda. Semak folder Spam jika tak jumpa.
            </p>
            <Link
              href="/auth/login"
              className="font-dm text-sm"
              style={{ color: "#F5F0E8", textDecoration: "underline", textDecorationColor: "rgba(245,240,232,0.3)", textUnderlineOffset: "3px" }}
            >
              Kembali ke Log Masuk
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-hidden" style={{ background: "#000" }}>
      {/* ── SILK BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <Silk
          speed={5}
          scale={1}
          color="#270d90"
          noiseIntensity={1.5}
          rotation={4.18}
        />
      </div>

      {/* ── Vignette overlay for legibility ── */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 0%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.78) 100%)",
        }}
      />

      <div className="relative z-10 min-h-dvh flex items-center justify-center px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="w-full max-w-sm"
        >
          {/* Logo — editorial */}
          <div className="mb-10">
            <p
              className="font-dm uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.22em",
                color: "rgba(245,240,232,0.55)",
                textShadow: "0 1px 8px rgba(0,0,0,0.6)",
              }}
            >
              kolekduit
            </p>
            <h1
              className="font-clash mt-3"
              style={{
                fontSize: "32px",
                fontWeight: 500,
                color: "#F5F0E8",
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              {prefillFromBill ? "Sertai untuk track hutang anda." : "Mulakan tanpa drama."}
            </h1>
          </div>

        {/* Step progress */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2.5">
            <span
              className="font-dm uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.16em",
                color: "rgba(245,240,232,0.55)",
                textShadow: "0 1px 6px rgba(0,0,0,0.5)",
              }}
            >
              {step === 1 ? "Maklumat Diri" : "Kaedah Pembayaran"}
            </span>
            <span
              className="font-dm uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.16em",
                color: "rgba(245,240,232,0.45)",
                textShadow: "0 1px 6px rgba(0,0,0,0.5)",
              }}
            >
              {step} / 2
            </span>
          </div>
          <div
            className="overflow-hidden rounded-full"
            style={{ height: "1px", background: "rgba(245,240,232,0.15)" }}
          >
            <motion.div
              className="h-full rounded-full"
              animate={{ width: step === 1 ? "50%" : "100%" }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              style={{
                background: "#F5F0E8",
                boxShadow: "0 0 8px rgba(245,240,232,0.5)",
              }}
            />
          </div>
        </div>

        {/* Form container — minimal glass to let Silk bleed through */}
        <div
          className="rounded-[14px] p-6"
          style={{
            background: "rgba(0,0,0,0.32)",
            border: "1px solid rgba(245,240,232,0.08)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
          }}
        >
          <form onSubmit={handleRegister}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                >
                  <motion.div
                    className="flex flex-col gap-4"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.055 } } }}
                  >
                    {/* Name — pre-filled from bill if applicable */}
                    <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>Nama Penuh</label>
                        {prefillFromBill && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(160,224,171,0.8)" }}>
                            <Info size={11} />
                            Dari bil penganjur — boleh tukar
                          </span>
                        )}
                      </div>
                      <RegInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Hafiz Bin Rahman"
                        required
                      />
                    </motion.div>

                    {/* Username */}
                    <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                      <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>
                        Username <span style={{ color: "rgba(255,255,255,0.25)" }}>(untuk carian kenalan)</span>
                      </label>
                      <RegInput
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                        placeholder="hafiz_rahman"
                        required
                      />
                      {username && !validateUsername(username) && (
                        <p className="text-xs px-1" style={{ color: "#ff6b6b" }}>3–20 aksara, huruf/nombor/_ sahaja</p>
                      )}
                    </motion.div>

                    {/* Email */}
                    <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                      <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>Email</label>
                      <RegInput
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="hafiz@email.com"
                        required
                      />
                    </motion.div>

                    {/* Phone */}
                    <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                      <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>No. Telefon <span style={{ color: "rgba(255,255,255,0.25)" }}>(pilihan)</span></label>
                      <RegInput
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+60123456789"
                      />
                    </motion.div>

                    {/* Password */}
                    <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                      <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>Kata Laluan</label>
                      <div className="relative">
                        <RegInput
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 aksara"
                          required
                          minLength={6}
                          extraPaddingRight
                        />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-90" style={{ color: "#fff" }}>
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </motion.div>

                    {/* Confirm Password */}
                    <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                      <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>Sahkan Kata Laluan</label>
                      <div className="relative">
                        <RegInput
                          type={showConfirmPw ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulang kata laluan"
                          required
                          extraPaddingRight
                        />
                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-90" style={{ color: "#fff" }}>
                          {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs px-1" style={{ color: "#ff6b6b" }}>Kata laluan tidak sepadan</p>
                      )}
                    </motion.div>

                    <motion.div variants={itemVariants} className="mt-1">
                      <PrimaryButton
                        type="button"
                        onClick={() => { if (canProceedStep1()) setStep(2); }}
                        disabled={!canProceedStep1()}
                      >
                        Seterusnya →
                      </PrimaryButton>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="flex flex-col gap-4"
                >
                  <p className="text-sm" style={{ color: "var(--color-whisper-gray)" }}>
                    Pilih kaedah penerimaan bayaran kamu.
                  </p>

                  <div className="flex rounded-pill-btn p-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                    {(["bank", "qr"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className="flex-1 py-2 rounded-pill-btn text-sm font-medium active:scale-[0.97]"
                        style={{
                          background: paymentMethod === m ? "var(--gradient-deep-ocean)" : "transparent",
                          color: paymentMethod === m ? "#000000" : "var(--color-whisper-gray)",
                          transition: "background 200ms var(--ease-out), color 200ms",
                        }}
                      >
                        {m === "bank" ? "Akaun Bank" : "DuitNow QR"}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {paymentMethod === "bank" ? (
                      <motion.div key="bank" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: EASE_OUT }} className="flex flex-col gap-4">
                        <div className="relative flex flex-col gap-1.5">
                          <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>Nama Bank</label>
                          <button
                            type="button"
                            onClick={() => setShowBankPicker(!showBankPicker)}
                            className="w-full rounded-[10px] px-4 py-3 text-frost text-sm flex items-center justify-between active:scale-[0.97]"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", transition: "transform 160ms var(--ease-out)" }}
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
                              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}
                            >
                              {BANKS.map((b) => (
                                <button
                                  key={b}
                                  type="button"
                                  onClick={() => { setBankName(b); setShowBankPicker(false); }}
                                  className="w-full text-left px-4 py-2.5 text-sm"
                                  style={{ color: bankName === b ? "#a0e0ab" : "#ffffff", transition: "background 120ms" }}
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
                          <RegInput value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="XXXX XXXX XXXX XXXX" required />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>Nama Pemegang Akaun</label>
                          <RegInput value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} placeholder="Hafiz Bin Rahman" required />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="qr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
                        <label className="text-xs block mb-1.5" style={{ color: "var(--color-whisper-gray)" }}>Upload QR DuitNow</label>
                        <label
                          className="flex flex-col items-center justify-center gap-3 rounded-[10px] py-8 cursor-pointer"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", transition: "border-color 150ms var(--ease-out)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
                        >
                          <input type="file" accept="image/*" onChange={handleQrChange} className="hidden" />
                          {qrPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={qrPreview} alt="QR Preview" className="w-40 h-40 object-contain rounded-[10px]" />
                          ) : (
                            <>
                              <Upload size={26} style={{ color: "var(--color-whisper-gray)" }} />
                              <span className="text-sm" style={{ color: "var(--color-whisper-gray)" }}>Tap untuk upload QR</span>
                            </>
                          )}
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, ease: EASE_OUT }}
                      className="text-sm px-3 py-2 rounded-[10px]"
                      style={{ color: "#FF6B6B", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)" }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-3.5 rounded-pill-btn text-sm font-medium active:scale-[0.97]"
                      style={{ color: "#ffffff", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", transition: "transform 160ms var(--ease-out)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                    >
                      ← Balik
                    </button>
                    <div className="flex-1">
                      <PrimaryButton
                        type="submit"
                        disabled={loading || (paymentMethod === "bank" && (!bankAccount || !bankHolder)) || (paymentMethod === "qr" && !qrFile)}
                      >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Daftar Sekarang
                      </PrimaryButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: "var(--color-whisper-gray)" }}>
          Dah ada akaun?{" "}
          <Link href="/auth/login" className="text-frost underline-offset-2 hover:underline" style={{ transition: "opacity 150ms" }}>
            Log masuk
          </Link>
        </p>
        </motion.div>
      </div>
    </div>
  );
}

function RegInput({
  type = "text", value, onChange, placeholder, required, minLength, extraPaddingRight,
}: {
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  extraPaddingRight?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      className={`w-full font-dm bg-transparent outline-none ${extraPaddingRight ? "pr-10" : ""}`}
      style={{
        fontSize: "15px",
        color: "#F5F0E8",
        padding: "10px 0 10px 0",
        borderBottom: "1px solid rgba(245,240,232,0.18)",
        caretColor: "#F5F0E8",
        letterSpacing: "-0.005em",
        transition: "border-color 200ms cubic-bezier(0.23,1,0.32,1)",
      }}
      onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#F5F0E8"; }}
      onBlur={(e) => { e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.18)"; }}
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
