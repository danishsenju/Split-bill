"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

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
      className="flex flex-col gap-5"
    >
      <div className="text-center">
        <h2 className="font-syne font-bold text-2xl text-text-primary mb-2">
          Siapa anda?
        </h2>
        <p className="text-text-secondary font-dm text-sm">
          Masukkan nama untuk meneruskan pembayaran
        </p>
      </div>

      <div className="flex flex-col gap-2">
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
          className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm"
        />
        {error && (
          <p className="text-danger text-xs font-dm px-1">{error}</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="flex items-center justify-center gap-2 bg-accent text-bg-primary font-dm font-semibold py-4 rounded-btn text-sm w-full"
      >
        Teruskan
        <ArrowRight size={16} />
      </button>

      <p className="text-text-muted text-xs font-dm text-center">
        Atau{" "}
        <a href="/auth/login" className="text-accent underline">
          log masuk
        </a>{" "}
        jika anda sudah ada akaun
      </p>
    </motion.div>
  );
}
