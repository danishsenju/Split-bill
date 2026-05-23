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
import { getInitial, maskAccount } from "@/lib/utils";

interface Props {
  profile: Profile | null;
}

export default function ProfileClient({ profile }: Props) {
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
  const phone = profile?.phone ?? "";

  return (
    <div className="min-h-dvh bg-bg-primary pb-28">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="font-syne font-bold text-2xl text-text-primary">Profil</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* User info card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card rounded-card p-5 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <span className="font-syne font-bold text-2xl text-accent">
              {getInitial(name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-syne font-bold text-text-primary text-lg truncate">{name}</h2>
            {email && (
              <p className="text-text-secondary font-dm text-sm truncate">{email}</p>
            )}
            {phone && (
              <p className="text-text-muted font-dm text-xs mt-0.5">{phone}</p>
            )}
          </div>
        </motion.div>

        {/* Payment method card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="surface-card rounded-card p-5 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-text-secondary text-sm font-dm font-medium">Kaedah Pembayaran</p>
            <Link
              href="/auth/register"
              className="text-accent text-xs font-dm"
            >
              Tukar Akaun
            </Link>
          </div>

          {profile?.payment_method === "qr" && profile?.qr_url ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white rounded-card p-3 w-40 h-40 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.qr_url}
                  alt="DuitNow QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center gap-2 text-success">
                <QrCode size={16} />
                <span className="text-sm font-dm">DuitNow QR</span>
              </div>
            </div>
          ) : profile?.bank_name ? (
            <div className="bg-bg-primary rounded-input px-4 py-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-accent" />
                <span className="font-dm font-semibold text-text-primary text-sm">
                  {profile.bank_name}
                </span>
              </div>
              <p className="font-jetbrains text-accent text-lg tracking-widest">
                {profile.bank_account ? maskAccount(profile.bank_account) : "—"}
              </p>
              {profile.bank_holder_name && (
                <p className="text-text-muted text-xs font-dm">{profile.bank_holder_name}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <CreditCard size={28} className="text-text-muted" />
              <p className="text-text-muted text-sm font-dm">Tiada kaedah pembayaran</p>
              <Link
                href="/auth/register"
                className="text-accent text-sm font-dm underline"
              >
                Tambah sekarang
              </Link>
            </div>
          )}
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="surface-card rounded-card overflow-hidden"
        >
          {/* Reminder days */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/6">
            <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
              <Bell size={15} className="text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-text-primary font-dm text-sm">Peringatan</p>
              <p className="text-text-muted text-xs font-dm">Sebelum tarikh akhir</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReminderDays((d) => Math.max(1, d - 1))}
                className="w-7 h-7 rounded-full bg-bg-primary flex items-center justify-center text-text-secondary font-dm"
              >
                −
              </button>
              <span className="text-accent font-dm text-sm font-semibold w-8 text-center">
                {reminderDays}h
              </span>
              <button
                onClick={() => setReminderDays((d) => Math.min(14, d + 1))}
                className="w-7 h-7 rounded-full bg-bg-primary flex items-center justify-center text-text-secondary font-dm"
              >
                +
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/6">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Globe size={15} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-text-primary font-dm text-sm">Bahasa</p>
              <p className="text-text-muted text-xs font-dm">Bahasa Malaysia</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </div>

          {/* WA notifications */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/6">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <MessageSquare size={15} className="text-success" />
            </div>
            <div className="flex-1">
              <p className="text-text-primary font-dm text-sm">Notifikasi WhatsApp</p>
              <p className="text-text-muted text-xs font-dm">Hantar peringatan auto</p>
            </div>
            <button
              onClick={() => setWaNotif((v) => !v)}
              className={`w-12 h-6 rounded-pill transition-colors relative ${
                waNotif ? "bg-success" : "bg-bg-primary border border-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  waNotif ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-8 h-8 rounded-full bg-bg-primary flex items-center justify-center shrink-0">
              <Shield size={15} className="text-text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-text-primary font-dm text-sm">Privasi & Keselamatan</p>
              <p className="text-text-muted text-xs font-dm">Data dan akaun</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </div>
        </motion.div>

        {/* Log out */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-2 bg-danger/10 border border-danger/30 text-danger font-dm font-semibold py-4 rounded-btn text-sm disabled:opacity-60"
        >
          <LogOut size={16} />
          {loggingOut ? "Sedang keluar..." : "Log Keluar"}
        </motion.button>

        <p className="text-center text-text-muted text-xs font-dm pb-2">
          BayarLah v1.0 · Settle hutang, tanpa drama.
        </p>
      </div>
    </div>
  );
}
