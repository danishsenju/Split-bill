"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Email atau kata laluan salah. Cuba lagi.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-midnight relative overflow-hidden flex items-center justify-center px-5 py-12">
      {/* Atmospheric orbs — depth without shadows */}
      <div
        className="absolute top-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full pointer-events-none orb-animate"
        style={{ background: "rgb(160, 224, 171)", opacity: 0.16, filter: "blur(130px)" }}
      />
      <div
        className="absolute bottom-[-20%] right-[-8%] w-[500px] h-[500px] rounded-full pointer-events-none orb-animate-slow"
        style={{ background: "rgb(255, 140, 40)", opacity: 0.13, filter: "blur(130px)" }}
      />
      <div
        className="absolute top-[45%] right-[15%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "rgb(165, 45, 37)", opacity: 0.09, filter: "blur(100px)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.05 }}
        >
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span
              style={{
                background: "var(--gradient-deep-ocean)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              kolekduit
            </span>
          </h1>
          <p className="text-sm" style={{ color: "var(--color-whisper-gray)" }}>
            Settle hutang, tanpa drama.
          </p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.1 }}
          className="rounded-[10px] p-7"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(24px)",
          }}
        >
          <h2 className="text-frost text-lg font-semibold mb-6">Log Masuk</h2>

          <motion.form
            onSubmit={handleLogin}
            className="flex flex-col gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
          >
            <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>Email</label>
              <InputField
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: "var(--color-whisper-gray)" }}>Kata Laluan</label>
              <div className="relative">
                <InputField
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  extraPaddingRight
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-90"
                  style={{ color: "#fff", transition: "opacity 150ms var(--ease-out)" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="text-sm px-3 py-2 rounded-[10px]"
                style={{
                  color: "#FF6B6B",
                  background: "rgba(255,107,107,0.1)",
                  border: "1px solid rgba(255,107,107,0.2)",
                }}
              >
                {error}
              </motion.p>
            )}

            <motion.div variants={itemVariants} className="mt-1">
              <PrimaryButton type="submit" disabled={loading}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                Log Masuk
              </PrimaryButton>
            </motion.div>
          </motion.form>
        </motion.div>

        <p className="text-center text-sm mt-5" style={{ color: "var(--color-whisper-gray)" }}>
          Belum ada akaun?{" "}
          <Link
            href="/auth/register"
            className="text-frost underline-offset-2 hover:underline"
            style={{ transition: "opacity 150ms" }}
          >
            Daftar di sini
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function InputField({
  type,
  value,
  onChange,
  placeholder,
  required,
  extraPaddingRight,
}: {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  extraPaddingRight?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full rounded-[10px] px-4 py-3 text-frost text-sm ${extraPaddingRight ? "pr-12" : ""}`}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        outline: "none",
        color: "#ffffff",
        caretColor: "var(--gradient-deep-ocean, #a0e0ab)",
        transition: "border-color 150ms var(--ease-out)",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
    />
  );
}
