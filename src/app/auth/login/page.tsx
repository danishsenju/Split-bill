"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

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

  const features = [
    "Split bil mudah dengan rakan",
    "Realtime tracking bayaran",
    "Link peribadi setiap ahli",
  ];

  return (
    <div
      className="min-h-dvh bg-bg-primary md:flex"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, rgba(232,184,75,0.06) 0%, transparent 70%), var(--color-bg-primary)",
      }}
    >
      {/* Desktop left panel */}
      <div className="hidden md:flex flex-col justify-center px-16 py-12 bg-bg-surface md:w-[420px] lg:w-[480px] shrink-0">
        <h1 className="font-clash font-bold text-5xl text-text-primary tracking-tight mb-2">
          Bayar<span className="text-accent">Lah</span>
        </h1>
        <p className="text-text-secondary font-dm text-base mb-10">
          Settle hutang, tanpa drama.
        </p>
        <div className="flex flex-col gap-4">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <CheckCircle size={18} className="text-success shrink-0" />
              <span className="text-text-secondary font-dm text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right / mobile form panel */}
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile-only logo */}
          <div className="mb-10 text-center md:hidden">
            <h1 className="font-clash font-bold text-4xl text-text-primary tracking-tight">
              Bayar<span className="text-accent">Lah</span>
            </h1>
            <p className="text-text-secondary font-dm text-sm mt-2">
              Settle hutang, tanpa drama.
            </p>
          </div>

          <div className="accent-border rounded-card p-6">
            <h2 className="font-clash font-bold text-xl text-text-primary mb-6">Log Masuk</h2>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-text-secondary text-xs font-dm mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full bg-bg-surface border border-[rgba(232,184,75,0.15)] rounded-input px-4 py-3 text-text-primary font-dm text-sm placeholder:text-text-muted focus:border-accent/50 transition-colors"
                  style={{ transition: "border-color 150ms var(--ease-out)" }}
                />
              </div>

              <div>
                <label className="text-text-secondary text-xs font-dm mb-1.5 block">Kata Laluan</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-bg-surface border border-[rgba(232,184,75,0.15)] rounded-input px-4 py-3 pr-12 text-text-primary font-dm text-sm placeholder:text-text-muted focus:border-accent/50 transition-colors"
                    style={{ transition: "border-color 150ms var(--ease-out)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-danger text-sm font-dm bg-danger/10 px-3 py-2 rounded-input border border-danger/20"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-accent text-bg-primary font-dm font-semibold py-3.5 rounded-btn text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97]"
                style={{ transition: "transform 160ms var(--ease-out), opacity 200ms" }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Log Masuk
              </button>
            </form>
          </div>

          <p className="text-center text-text-muted text-sm font-dm mt-5">
            Belum ada akaun?{" "}
            <Link href="/auth/register" className="text-accent hover:underline transition-colors">
              Daftar di sini
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
