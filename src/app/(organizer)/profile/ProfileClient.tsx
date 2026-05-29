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
  Users,
  Sparkles,
} from "lucide-react";
import { Profile } from "@/types";
import { createClient } from "@/lib/supabase";
import { getInitial, maskAccount } from "@/lib/utils";
import Grainient from "@/components/ui/Grainient";
import AnimatedAmount from "@/components/ui/AnimatedAmount";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLang, profileT } from "@/lib/language-context";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

interface Props {
  profile: Profile | null;
  billCount: number;
  totalCollected: number;
}

// ─── Tinted icon chip — iOS-settings flavour, but richer ───────────────────
function IconChip({
  icon,
  gradient,
}: {
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "10px",
        background: gradient,
        color: "#ffffff",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.35)",
      }}
    >
      {icon}
    </div>
  );
}

// ─── Shared row component for settings ─────────────────────────────────────
function SettingRow({
  icon,
  gradient,
  label,
  sublabel,
  right,
  border = true,
}: {
  icon: React.ReactNode;
  gradient: string;
  label: string;
  sublabel: string;
  right: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3"
      style={{
        borderBottom: border ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <IconChip icon={icon} gradient={gradient} />
      <div className="flex-1 min-w-0">
        <p
          className="font-dm"
          style={{ fontSize: "14px", color: "#F5F0E8", lineHeight: 1.25 }}
        >
          {label}
        </p>
        <p
          className="font-dm"
          style={{
            fontSize: "12px",
            color: "rgba(245,240,232,0.45)",
            lineHeight: 1.3,
          }}
        >
          {sublabel}
        </p>
      </div>
      {right}
    </div>
  );
}

export default function ProfileClient({
  profile,
  billCount,
  totalCollected,
}: Props) {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const t = profileT[lang];
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
    <div
      style={{
        background: "#000000",
        minHeight: "100dvh",
        paddingBottom: "112px",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          HERO — gradient grain at top. Warm violet→rose→amber atmosphere,
          avatar floats inside a slowly-rotating gradient halo.
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ minHeight: "44vh" }}>
        {/* ── Grainient WebGL background ── */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <Grainient
            color1="#8B5CF6"
            color2="#F43F5E"
            color3="#F59E0B"
            timeSpeed={0.22}
            colorBalance={-0.05}
            warpStrength={1}
            warpFrequency={4.5}
            warpSpeed={1.8}
            warpAmplitude={55}
            blendAngle={25}
            blendSoftness={0.12}
            rotationAmount={420}
            noiseScale={2}
            grainAmount={0.12}
            grainScale={1.8}
            grainAnimated={false}
            contrast={1.45}
            gamma={1}
            saturation={1.15}
            zoom={0.85}
          />
        </div>

        {/* ── Top vignette so the safe-area status text stays legible ── */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: "40%",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)",
          }}
        />

        {/* ── Bottom fade — blends grain into the black canvas below ── */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "50%",
            background:
              "linear-gradient(to bottom, transparent, #000000 92%)",
            zIndex: 1,
          }}
        />

        {/* ══════════ HERO CONTENT ══════════ */}
        <div
          className="relative z-10 flex flex-col items-center px-5"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 36px)",
            paddingBottom: "72px",
          }}
        >
          {/* Status pill */}
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="font-dm uppercase"
            style={{
              fontSize: "10px",
              letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.7)",
              textShadow: "0 1px 8px rgba(0,0,0,0.5)",
            }}
          >
            {t.sectionSettings === "Tetapan" ? "Profil" : "Profile"}
          </motion.span>

          {/* Avatar with rotating gradient halo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.05 }}
            className="relative mt-5"
            style={{ width: "92px", height: "92px" }}
          >
            {/* Soft breathing glow behind */}
            <div
              aria-hidden
              className="breathe-glow"
              style={{
                position: "absolute",
                inset: "-14px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(244,63,94,0.55), rgba(139,92,246,0.25) 55%, transparent 72%)",
                filter: "blur(8px)",
              }}
            />
            {/* Rotating conic ring */}
            <motion.div
              aria-hidden
              animate={{ rotate: 360 }}
              transition={{ duration: 14, ease: "linear", repeat: Infinity }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  "conic-gradient(from 0deg, #8B5CF6, #F43F5E, #F59E0B, #8B5CF6)",
              }}
            />
            {/* Inner dark disc + initial */}
            <div
              className="absolute flex items-center justify-center font-clash font-bold"
              style={{
                inset: "3px",
                borderRadius: "50%",
                background:
                  "radial-gradient(120% 120% at 30% 20%, #1a1a1a, #050505)",
                fontSize: "34px",
                color: "#ffffff",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.12)",
              }}
            >
              {initial}
            </div>
          </motion.div>

          {/* Name */}
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.12 }}
            className="font-clash font-bold leading-none mt-5 text-center"
            style={{
              fontSize: "28px",
              color: "#ffffff",
              letterSpacing: "-0.02em",
              textShadow: "0 2px 18px rgba(0,0,0,0.5)",
            }}
          >
            {name}
          </motion.h2>

          {/* Email */}
          {email && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.18 }}
              className="font-dm mt-1.5 text-center"
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.6)",
                textShadow: "0 1px 8px rgba(0,0,0,0.4)",
              }}
            >
              {email}
            </motion.p>
          )}

          {/* Organizer badge */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.24 }}
            className="flex items-center gap-1.5 mt-3.5"
            style={{
              padding: "5px 12px",
              borderRadius: "99px",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <Sparkles size={12} style={{ color: "#F59E0B" }} />
            <span
              className="font-dm font-medium"
              style={{ fontSize: "11px", color: "#ffffff" }}
            >
              {lang === "bm" ? "Penganjur" : "Organizer"}
            </span>
          </motion.div>
        </div>
      </div>

      {/* ══════════ OVERLAPPING STATS CARD — bridges hero & content ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.3 }}
        className="relative z-20 px-5"
        style={{ marginTop: "-48px" }}
      >
        <div
          className="grid grid-cols-2 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(24,24,27,0.92), rgba(10,10,12,0.92))",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "18px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow:
              "0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Bills made */}
          <div className="flex flex-col items-center gap-1.5 py-5">
            <p
              className="font-clash font-bold leading-none"
              style={{
                fontSize: "30px",
                color: "#ffffff",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {billCount}
            </p>
            <p
              className="font-dm uppercase"
              style={{
                fontSize: "9.5px",
                letterSpacing: "0.14em",
                color: "rgba(245,240,232,0.45)",
              }}
            >
              {t.statBillsMade}
            </p>
          </div>

          {/* Vertical hairline */}
          <div
            className="flex flex-col items-center gap-1.5 py-5"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}
          >
            <AnimatedAmount
              value={totalCollected}
              size={26}
              duration={1100}
              style={{ lineHeight: 1 }}
            />
            <p
              className="font-dm uppercase"
              style={{
                fontSize: "9.5px",
                letterSpacing: "0.14em",
                color: "rgba(245,240,232,0.45)",
              }}
            >
              {t.statCollected}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="px-5 pt-7 flex flex-col gap-7">
        {/* ── PAYMENT METHOD ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.38 }}
        >
          <SectionLabel label={t.sectionPayment}>
            <Link
              href="/profile/payment"
              className="font-dm active:opacity-50"
              style={{
                fontSize: "12px",
                color: "rgba(245,240,232,0.6)",
                transition: "opacity 150ms",
              }}
            >
              {t.changeBtn}
            </Link>
          </SectionLabel>

          <div
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {profile?.payment_method === "qr" && profile?.qr_url ? (
              /* QR Code */
              <div className="flex flex-col items-center gap-4 p-6">
                <div className="rounded-[12px] p-3" style={{ background: "#ffffff" }}>
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
              /* Bank account — premium card treatment */
              <div className="p-4">
                <div
                  className="relative overflow-hidden p-4 flex flex-col gap-4"
                  style={{
                    borderRadius: "14px",
                    background:
                      "linear-gradient(135deg, #1f2937 0%, #0f172a 60%, #1e1b4b 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {/* sheen accent */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: "-40%",
                      right: "-20%",
                      width: "60%",
                      height: "160%",
                      background:
                        "radial-gradient(circle, rgba(245,158,11,0.18), transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard size={15} style={{ color: "#F59E0B" }} />
                      <span
                        className="font-dm font-semibold"
                        style={{ fontSize: "14px", color: "#ffffff" }}
                      >
                        {profile.bank_name}
                      </span>
                    </div>
                    <span
                      className="font-dm"
                      style={{
                        fontSize: "11px",
                        color: "#22c55e",
                        background: "rgba(34,197,94,0.10)",
                        border: "1px solid rgba(34,197,94,0.25)",
                        borderRadius: "99px",
                        padding: "2px 9px",
                      }}
                    >
                      {t.active}
                    </span>
                  </div>
                  <div className="relative">
                    <p
                      className="font-jetbrains"
                      style={{
                        fontSize: "19px",
                        letterSpacing: "3px",
                        color: "#ffffff",
                      }}
                    >
                      {profile.bank_account ? maskAccount(profile.bank_account) : "—"}
                    </p>
                    {profile.bank_holder_name && (
                      <p
                        className="font-dm uppercase mt-1.5"
                        style={{
                          fontSize: "10px",
                          letterSpacing: "0.08em",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        {profile.bank_holder_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <CreditCard size={20} style={{ color: "#6d6d6d" }} />
                </div>
                <p
                  className="font-dm"
                  style={{ fontSize: "14px", color: "rgba(245,240,232,0.55)" }}
                >
                  {t.noPayment}
                </p>
                <div className="w-fit">
                  <PrimaryButton
                    href="/profile/payment"
                    fullWidth={false}
                    innerClassName="py-2 px-5 text-sm"
                  >
                    {t.addNow}
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── SETTINGS ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.44 }}
        >
          <SectionLabel label={t.sectionSettings} />

          <div
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {/* Reminder days */}
            <SettingRow
              icon={<Bell size={16} />}
              gradient="linear-gradient(135deg, #F59E0B, #F97316)"
              label={t.reminderLabel}
              sublabel={t.reminderSub}
              right={
                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    transition={SPRING}
                    onClick={() => setReminderDays((d) => Math.max(1, d - 1))}
                    className="w-7 h-7 rounded-full flex items-center justify-center font-dm"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(245,240,232,0.7)",
                      fontSize: "16px",
                      lineHeight: 1,
                    }}
                  >
                    −
                  </motion.button>
                  <span
                    className="font-clash font-bold"
                    style={{
                      fontSize: "14px",
                      minWidth: "28px",
                      textAlign: "center",
                      color: "#ffffff",
                    }}
                  >
                    {reminderDays}
                    {t.reminderUnit}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    transition={SPRING}
                    onClick={() => setReminderDays((d) => Math.min(14, d + 1))}
                    className="w-7 h-7 rounded-full flex items-center justify-center font-dm"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(245,240,232,0.7)",
                      fontSize: "16px",
                      lineHeight: 1,
                    }}
                  >
                    +
                  </motion.button>
                </div>
              }
            />

            {/* Language */}
            <SettingRow
              icon={<Globe size={16} />}
              gradient="linear-gradient(135deg, #6366F1, #8B5CF6)"
              label={t.langLabel}
              sublabel={lang === "bm" ? "Bahasa Malaysia" : "English"}
              right={
                <div
                  className="flex items-center gap-1 shrink-0 relative"
                  style={{
                    padding: "3px",
                    borderRadius: "99px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {(["bm", "en"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className="relative font-dm font-medium"
                      style={{
                        fontSize: "11px",
                        padding: "4px 11px",
                        borderRadius: "99px",
                        color: lang === l ? "#000000" : "rgba(245,240,232,0.55)",
                        transition: "color 220ms cubic-bezier(0.23,1,0.32,1)",
                        zIndex: 1,
                      }}
                    >
                      {lang === l && (
                        <motion.span
                          layoutId="lang-pill"
                          className="absolute inset-0"
                          style={{ background: "#ffffff", borderRadius: "99px", zIndex: -1 }}
                          transition={SPRING}
                        />
                      )}
                      {l === "bm" ? "BM" : "EN"}
                    </button>
                  ))}
                </div>
              }
            />

            {/* WA notifications toggle */}
            <SettingRow
              icon={<MessageSquare size={16} />}
              gradient="linear-gradient(135deg, #22C55E, #16A34A)"
              label={t.waLabel}
              sublabel={t.waSub}
              right={
                <button
                  onClick={() => setWaNotif((v) => !v)}
                  className="shrink-0"
                  style={{
                    width: "46px",
                    height: "26px",
                    borderRadius: "99px",
                    padding: "2px",
                    background: waNotif
                      ? "linear-gradient(135deg, #22C55E, #16A34A)"
                      : "rgba(255,255,255,0.10)",
                    border: waNotif ? "none" : "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    justifyContent: waNotif ? "flex-end" : "flex-start",
                    transition: "background 250ms cubic-bezier(0.23,1,0.32,1)",
                  }}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
                    }}
                  />
                </button>
              }
            />

            {/* Kenalan */}
            <Link href="/profile/friends" style={{ display: "block" }} className="active:bg-white/[0.03]">
              <SettingRow
                icon={<Users size={16} />}
                gradient="linear-gradient(135deg, #F43F5E, #EC4899)"
                label="Kenalan"
                sublabel="Urus senarai kenalan anda"
                right={
                  <ChevronRight size={16} style={{ color: "rgba(245,240,232,0.4)" }} />
                }
              />
            </Link>

            {/* Privacy */}
            <SettingRow
              icon={<Shield size={16} />}
              gradient="linear-gradient(135deg, #64748B, #475569)"
              label={t.privacyLabel}
              sublabel={t.privacySub}
              right={
                <ChevronRight size={16} style={{ color: "rgba(245,240,232,0.4)" }} />
              }
              border={false}
            />
          </div>
        </motion.div>

        {/* ── LOGOUT ────────────────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.5 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-2 font-dm font-medium text-sm w-full disabled:opacity-50"
          style={{
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "99px",
            padding: "14px 0",
            color: "#ef4444",
            background: "rgba(239,68,68,0.04)",
          }}
        >
          <LogOut size={15} />
          {loggingOut ? t.loggingOut : t.logout}
        </motion.button>

        {/* Footer */}
        <p
          className="text-center font-dm pb-2"
          style={{ fontSize: "11px", color: "rgba(245,240,232,0.22)" }}
        >
          kolekduit v1.0 · Settle hutang, tanpa drama.
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
    <div className="flex items-center justify-between mb-3 px-1">
      <span
        className="font-dm uppercase"
        style={{
          fontSize: "10px",
          letterSpacing: "0.14em",
          color: "rgba(245,240,232,0.4)",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
