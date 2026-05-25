"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Bell,
  Globe,
  MessageSquare,
  Shield,
  LogOut,
  ChevronRight,
  CreditCard,
  QrCode,
} from "lucide-react";
import { Profile } from "@/types";
import { createClient } from "@/lib/supabase";
import { getInitial, maskAccount, formatRM } from "@/lib/utils";
import Aurora from "@/components/ui/Aurora";

interface Props {
  profile: Profile | null;
  billCount: number;
  totalCollected: number;
}

// ─── Shared row component for settings ────────────────────────────────────
function SettingRow({
  icon,
  label,
  sublabel,
  right,
  border = true,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  right: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-4"
      style={{
        borderBottom: border ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}
    >
      <div style={{ color: "#6d6d6d", flexShrink: 0 }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-dm text-frost" style={{ fontSize: "14px" }}>
          {label}
        </p>
        <p className="font-dm text-whisper" style={{ fontSize: "12px" }}>
          {sublabel}
        </p>
      </div>
      {right}
    </div>
  );
}

export default function ProfileClient({ profile, billCount, totalCollected }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);
  const [waNotif, setWaNotif] = useState(true);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const name = profile?.name ?? "Pengguna";
  const email = profile?.email ?? "";
  const initial = getInitial(name);

  return (
    <div style={{ background: "#000000", minHeight: "100dvh", paddingBottom: "112px" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative overflow-hidden flex flex-col items-center pt-10 pb-8 px-5"
        style={{ background: "#000000" }}
      >
        {/* Aurora WebGL background */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.9 }}>
          <Aurora
            colorStops={["#F97316", "#EF4444", "#7C3AED"]}
            blend={0.79}
            amplitude={1.0}
            speed={0.5}
          />
        </div>

        {/* Avatar */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center font-clash font-bold"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: "32px",
              color: "#ffffff",
            }}
          >
            {initial}
          </div>

          <div className="flex flex-col items-center gap-1">
            <h2
              className="font-clash font-bold text-frost leading-none"
              style={{ fontSize: "26px" }}
            >
              {name}
            </h2>
            {email && (
              <p className="font-dm text-whisper" style={{ fontSize: "13px" }}>
                {email}
              </p>
            )}
          </div>
        </div>

        {/* Stats — 2-col grid */}
        <div
          className="relative z-10 grid grid-cols-2 gap-px w-full mt-6 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
          }}
        >
          <div className="flex flex-col items-center gap-1 py-4" style={{ background: "#111111" }}>
            <p
              className="font-clash font-bold text-frost leading-none"
              style={{ fontSize: "24px" }}
            >
              {billCount}
            </p>
            <p className="font-dm text-whisper" style={{ fontSize: "11px" }}>
              Bil Dibuat
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 py-4" style={{ background: "#111111" }}>
            <p
              className="font-clash font-bold leading-none"
              style={{
                fontSize: "24px",
                background: "var(--gradient-deep-ocean)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {formatRM(totalCollected)}
            </p>
            <p className="font-dm text-whisper" style={{ fontSize: "11px" }}>
              Terkumpul
            </p>
          </div>
        </div>
      </motion.div>

      {/* Separator */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

      <div className="px-5 pt-6 flex flex-col gap-6">

        {/* ── PAYMENT METHOD ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
        >
          <SectionLabel label="Kaedah Pembayaran">
            <Link
              href="/auth/register"
              className="font-dm text-whisper active:opacity-50"
              style={{ fontSize: "12px", transition: "opacity 150ms" }}
            >
              Tukar →
            </Link>
          </SectionLabel>

          <div
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {profile?.payment_method === "qr" && profile?.qr_url ? (
              /* QR Code */
              <div className="flex flex-col items-center gap-4 p-6">
                <div
                  className="rounded-[10px] p-3"
                  style={{ background: "#ffffff" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.qr_url}
                    alt="DuitNow QR"
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <div className="flex items-center gap-2" style={{ color: "#22c55e" }}>
                  <QrCode size={15} />
                  <span className="font-dm text-sm">DuitNow QR</span>
                </div>
              </div>
            ) : profile?.bank_name ? (
              /* Bank account */
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} style={{ color: "#6d6d6d" }} />
                    <span className="font-dm font-semibold text-frost" style={{ fontSize: "14px" }}>
                      {profile.bank_name}
                    </span>
                  </div>
                  <span
                    className="font-dm"
                    style={{
                      fontSize: "11px",
                      color: "#22c55e",
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: "75.024px",
                      padding: "2px 8px",
                    }}
                  >
                    Aktif
                  </span>
                </div>
                <div
                  className="rounded-[10px] px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p
                    className="font-jetbrains text-frost"
                    style={{ fontSize: "18px", letterSpacing: "3px" }}
                  >
                    {profile.bank_account ? maskAccount(profile.bank_account) : "—"}
                  </p>
                  {profile.bank_holder_name && (
                    <p className="font-dm text-whisper mt-1" style={{ fontSize: "12px" }}>
                      {profile.bank_holder_name}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <CreditCard size={20} style={{ color: "#6d6d6d" }} />
                </div>
                <p className="font-dm text-whisper text-sm">Tiada kaedah pembayaran</p>
                <Link
                  href="/auth/register"
                  className="font-dm font-semibold text-sm active:scale-[0.97]"
                  style={{
                    background: "var(--gradient-deep-ocean)",
                    borderRadius: "75.024px",
                    padding: "8px 20px",
                    color: "#000000",
                    transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
                  }}
                >
                  Tambah sekarang
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── SETTINGS ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
        >
          <SectionLabel label="Tetapan" />

          <div
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {/* Reminder days */}
            <SettingRow
              icon={<Bell size={16} />}
              label="Peringatan"
              sublabel="Hantar sebelum tarikh akhir"
              right={
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setReminderDays((d) => Math.max(1, d - 1))}
                    className="w-7 h-7 rounded-full flex items-center justify-center font-dm active:scale-[0.88]"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#6d6d6d",
                      fontSize: "16px",
                      lineHeight: 1,
                      transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
                    }}
                  >
                    −
                  </button>
                  <span
                    className="font-clash font-bold text-frost"
                    style={{ fontSize: "14px", minWidth: "28px", textAlign: "center" }}
                  >
                    {reminderDays}h
                  </span>
                  <button
                    onClick={() => setReminderDays((d) => Math.min(14, d + 1))}
                    className="w-7 h-7 rounded-full flex items-center justify-center font-dm active:scale-[0.88]"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#6d6d6d",
                      fontSize: "16px",
                      lineHeight: 1,
                      transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
                    }}
                  >
                    +
                  </button>
                </div>
              }
            />

            {/* Language */}
            <SettingRow
              icon={<Globe size={16} />}
              label="Bahasa"
              sublabel="Bahasa Malaysia"
              right={<ChevronRight size={15} style={{ color: "#6d6d6d" }} />}
            />

            {/* WA notifications toggle */}
            <SettingRow
              icon={<MessageSquare size={16} />}
              label="Notifikasi WhatsApp"
              sublabel="Hantar peringatan auto"
              right={
                <button
                  onClick={() => setWaNotif((v) => !v)}
                  className="shrink-0"
                  style={{
                    width: "44px",
                    height: "24px",
                    borderRadius: "99px",
                    background: waNotif ? "#ffffff" : "rgba(255,255,255,0.08)",
                    border: waNotif ? "none" : "1px solid rgba(255,255,255,0.12)",
                    position: "relative",
                    transition: "background 250ms cubic-bezier(0.23,1,0.32,1)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: waNotif ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: waNotif ? "#000000" : "#6d6d6d",
                      transition: "left 250ms cubic-bezier(0.23,1,0.32,1)",
                    }}
                  />
                </button>
              }
            />

            {/* Privacy */}
            <SettingRow
              icon={<Shield size={16} />}
              label="Privasi & Keselamatan"
              sublabel="Data dan akaun"
              right={<ChevronRight size={15} style={{ color: "#6d6d6d" }} />}
              border={false}
            />
          </div>
        </motion.div>

        {/* ── LOGOUT ────────────────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, ease: [0.23, 1, 0.32, 1] }}
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-2 font-dm font-medium text-sm w-full active:scale-[0.97] disabled:opacity-50"
          style={{
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "75.024px",
            padding: "14px 0",
            color: "#ef4444",
            background: "transparent",
            transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 200ms",
          }}
        >
          <LogOut size={15} />
          {loggingOut ? "Sedang keluar..." : "Log Keluar"}
        </motion.button>

        {/* Footer */}
        <p className="text-center font-dm pb-2" style={{ fontSize: "11px", color: "#3a3a3a" }}>
          BayarLah v1.0 · Settle hutang, tanpa drama.
        </p>
      </div>
    </div>
  );
}

// ─── Section label with optional right slot ────────────────────────────────
function SectionLabel({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span
        className="font-dm uppercase"
        style={{ fontSize: "10px", letterSpacing: "0.10em", color: "#6d6d6d" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
