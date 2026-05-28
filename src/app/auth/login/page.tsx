"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import Silk from "@/components/ui/Silk";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email atau kata laluan salah. Cuba lagi.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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

      {/* ── DEEPEN: vignette overlay so text floats above silk ── */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 0%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.78) 100%)",
        }}
      />

      {/* ── CONTENT ── */}
      <div className="relative z-10 min-h-dvh flex flex-col px-6">
        {/* Top region — logo */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 56px)" }}
        >
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
              fontSize: "44px",
              fontWeight: 500,
              color: "#F5F0E8",
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              textShadow: "0 2px 24px rgba(0,0,0,0.5)",
            }}
          >
            Selamat
            <br />
            kembali.
          </h1>
          <p
            className="font-dm mt-4"
            style={{
              fontSize: "13px",
              color: "rgba(245,240,232,0.55)",
              lineHeight: 1.55,
              textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              maxWidth: "280px",
            }}
          >
            Settle hutang, tanpa drama.
          </p>
        </motion.div>

        {/* Middle region — form (pushed to bottom of screen) */}
        <motion.form
          onSubmit={handleLogin}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
          }}
          className="mt-auto pb-12 pt-16 flex flex-col gap-7"
        >
          {/* Email field */}
          <EditorialField
            label="Email"
            inputProps={{
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              placeholder: "nama@email.com",
              required: true,
              autoComplete: "email",
            }}
          />

          {/* Password field */}
          <EditorialField
            label="Kata laluan"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="active:opacity-50"
                style={{
                  color: "rgba(245,240,232,0.55)",
                  transition: "opacity 160ms cubic-bezier(0.23,1,0.32,1)",
                }}
                aria-label={showPw ? "Sembunyi kata laluan" : "Tunjuk kata laluan"}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            inputProps={{
              type: showPw ? "text" : "password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              placeholder: "••••••••",
              required: true,
              autoComplete: "current-password",
            }}
          />

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="font-dm"
              style={{
                fontSize: "12px",
                color: "rgb(255,107,107)",
                letterSpacing: "0.02em",
                textShadow: "0 1px 6px rgba(0,0,0,0.5)",
              }}
            >
              {error}
            </motion.p>
          )}

          {/* CTA */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
            }}
            className="mt-2"
          >
            <PrimaryButton type="submit" disabled={loading}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              Log Masuk
            </PrimaryButton>
          </motion.div>

          {/* Register link */}
          <motion.p
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT } },
            }}
            className="font-dm text-center mt-1"
            style={{
              fontSize: "12px",
              color: "rgba(245,240,232,0.45)",
              letterSpacing: "0.02em",
              textShadow: "0 1px 6px rgba(0,0,0,0.5)",
            }}
          >
            Belum ada akaun?{" "}
            <Link
              href="/auth/register"
              className="active:opacity-60"
              style={{
                color: "#F5F0E8",
                textDecoration: "underline",
                textDecorationColor: "rgba(245,240,232,0.3)",
                textUnderlineOffset: "3px",
                transition: "opacity 160ms cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              Daftar
            </Link>
          </motion.p>
        </motion.form>
      </div>
    </div>
  );
}

// ─── Editorial input field — bottom border only, label above ──────────────
function EditorialField({
  label,
  inputProps,
  rightSlot,
}: {
  label: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
      }}
      className="relative"
    >
      <label
        className="font-dm uppercase block"
        style={{
          fontSize: "10px",
          letterSpacing: "0.16em",
          color: focused
            ? "#F5F0E8"
            : "rgba(245,240,232,0.55)",
          marginBottom: "8px",
          textShadow: "0 1px 6px rgba(0,0,0,0.5)",
          transition: "color 200ms cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {label}
      </label>
      <div className="flex items-end gap-2">
        <input
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          className="flex-1 font-dm bg-transparent outline-none"
          style={{
            fontSize: "16px",
            color: "#F5F0E8",
            padding: "0 0 8px 0",
            letterSpacing: "-0.005em",
            caretColor: "#F5F0E8",
            textShadow: "0 1px 8px rgba(0,0,0,0.4)",
            ...inputProps.style,
          }}
        />
        {rightSlot && <div className="pb-2">{rightSlot}</div>}
      </div>
      {/* Animated underline */}
      <div
        style={{
          height: "1px",
          background: "rgba(245,240,232,0.18)",
          position: "relative",
        }}
      >
        <motion.div
          animate={{ scaleX: focused ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          style={{
            position: "absolute",
            inset: 0,
            background: "#F5F0E8",
            transformOrigin: "left",
            boxShadow: "0 0 8px rgba(245,240,232,0.4)",
          }}
        />
      </div>
    </motion.div>
  );
}
