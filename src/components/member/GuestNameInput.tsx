"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

interface Props {
  onComplete: (name: string) => void;
}

const GRADIENT = "linear-gradient(135deg, rgb(160, 224, 171), rgb(255, 172, 46) 55%, rgb(165, 45, 37))";
const EASE = [0.23, 1, 0.32, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function GuestNameInput({ onComplete }: Props) {
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("guest_name") ?? "";
    }
    return "";
  });
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  const initial = name.trim().charAt(0).toUpperCase();

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Sila masukkan nama anda");
      return;
    }
    if (trimmed.length < 2) {
      setError("Nama terlalu pendek");
      return;
    }
    sessionStorage.setItem("guest_name", trimmed);
    onComplete(trimmed);
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}
    >
      {/* Live gradient avatar — springs in, shows the typed initial */}
      <motion.div variants={item} style={{ position: "relative" }}>
        {/* breathing glow halo */}
        <div
          className="breathe-glow"
          style={{
            position: "absolute",
            inset: "-22px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,172,46,0.35) 0%, transparent 68%)",
            filter: "blur(14px)",
            zIndex: 0,
          }}
        />
        <motion.div
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          style={{
            position: "relative",
            zIndex: 1,
            width: "84px",
            height: "84px",
            borderRadius: "50%",
            background: GRADIENT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 30px rgba(255,172,46,0.25), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <AnimatePresence mode="popLayout">
            {initial ? (
              <motion.span
                key={initial}
                initial={{ scale: 0.4, opacity: 0, y: 6 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.4, opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                style={{
                  fontFamily: "var(--font-plus-jakarta), system-ui",
                  fontWeight: 800,
                  fontSize: "38px",
                  color: "#0a0a0a",
                }}
              >
                {initial}
              </motion.span>
            ) : (
              <motion.span
                key="wave"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, 14, -8, 14, 0] }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ rotate: { duration: 1.4, repeat: Infinity, repeatDelay: 1.2 } }}
                style={{ fontSize: "36px" }}
              >
                👋
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Heading */}
      <motion.div variants={item} style={{ textAlign: "center" }}>
        <h2
          style={{
            fontFamily: "var(--font-plus-jakarta), system-ui",
            fontWeight: 800,
            fontSize: "28px",
            color: "#fff",
            marginBottom: "8px",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          {name.trim() ? (
            <>
              Hai, <span className="gradient-text">{name.trim().split(" ")[0]}</span> 👋
            </>
          ) : (
            "Siapa anda?"
          )}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: 1.5 }}>
          Masukkan nama untuk teruskan pembayaran
        </p>
      </motion.div>

      {/* Input with animated focus ring */}
      <motion.div variants={item} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
        <motion.div
          animate={{
            boxShadow: error
              ? "0 0 0 1px rgba(239,68,68,0.55), 0 0 18px rgba(239,68,68,0.18)"
              : focused
                ? "0 0 0 1px rgba(255,172,46,0.55), 0 0 26px rgba(255,172,46,0.18)"
                : "0 0 0 1px rgba(255,255,255,0.10), 0 0 0px rgba(255,172,46,0)",
          }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{ borderRadius: "14px", background: "rgba(255,255,255,0.05)" }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="Nama penuh anda"
            autoFocus
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderRadius: "14px",
              padding: "16px 18px",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 500,
              outline: "none",
            }}
          />
        </motion.div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              style={{ color: "#ff6b6b", fontSize: "12px", paddingLeft: "4px" }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CTA */}
      <motion.div variants={item} style={{ width: "100%" }}>
        <PrimaryButton onClick={handleSubmit}>
          Teruskan
          <ArrowRight size={16} />
        </PrimaryButton>
      </motion.div>

      <motion.p variants={item} style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", textAlign: "center" }}>
        Atau{" "}
        <a href="/auth/login" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
          log masuk
        </a>{" "}
        jika anda sudah ada akaun
      </motion.p>
    </motion.div>
  );
}
