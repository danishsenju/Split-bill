"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col px-5 pt-16 pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Logo */}
        <div className="mb-10">
          <h1 className="font-syne font-extrabold text-3xl text-text-primary">
            Bayar<span className="text-accent">Lah</span>
          </h1>
          <p className="text-text-secondary font-dm text-sm mt-1">
            Settle hutang, tanpa drama.
          </p>
        </div>

        <h2 className="font-syne font-bold text-xl text-text-primary mb-6">Log Masuk</h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-text-secondary text-xs font-dm mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
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
                placeholder="••••••••"
                required
                className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 pr-12 text-text-primary font-dm text-sm placeholder:text-text-muted focus:border-accent/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-danger text-sm font-dm bg-danger/10 px-3 py-2 rounded-input"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-accent text-bg-primary font-dm font-semibold py-3.5 rounded-btn text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Log Masuk
          </button>
        </form>

        <p className="text-center text-text-muted text-sm font-dm mt-6">
          Belum ada akaun?{" "}
          <Link href="/auth/register" className="text-accent">
            Daftar di sini
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
