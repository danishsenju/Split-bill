"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const GRADIENT = "linear-gradient(90deg, rgb(160, 224, 171), rgb(255, 172, 46) 50%, rgb(165, 45, 37))";
const PILL = "75.024px";

interface Props {
  onComplete: (name: string) => void;
}

export default function GuestNameInput({ onComplete }: Props) {
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("guest_name") ?? "";
    }
    return "";
  });
  const [error, setError] = useState("");

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-plus-jakarta), system-ui", fontWeight: 800, fontSize: "26px", color: "#fff", marginBottom: "8px", lineHeight: 1.2 }}>
          Siapa anda?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", lineHeight: 1.5 }}>
          Masukkan nama untuk meneruskan pembayaran
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Nama penuh anda"
          autoFocus
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.06)",
            border: error ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            padding: "14px 18px",
            color: "#fff",
            fontSize: "15px",
            outline: "none",
          }}
        />
        {error && (
          <p style={{ color: "#ef4444", fontSize: "12px", paddingLeft: "4px" }}>{error}</p>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          background: GRADIENT,
          color: "#000",
          fontWeight: 700,
          fontSize: "15px",
          padding: "17px 28px",
          borderRadius: PILL,
          border: "none",
          cursor: "pointer",
          width: "100%",
        }}
      >
        Teruskan
        <ArrowRight size={16} />
      </motion.button>

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center" }}>
        Atau{" "}
        <a href="/auth/login" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>
          log masuk
        </a>{" "}
        jika anda sudah ada akaun
      </p>
    </motion.div>
  );
}
