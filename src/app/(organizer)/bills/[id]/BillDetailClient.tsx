"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Bell, Flag, Check, Copy } from "lucide-react";
import { Bill, Flag as FlagType } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, formatDaysRemaining, getDaysRemaining, getInitial, formatTime, categoryTone } from "@/lib/utils";
import { buildWAUrl, buildWAMessage } from "@/lib/whatsapp";
import Link from "next/link";
import { useLang, billDetailT } from "@/lib/language-context";
import { useMotionValue, animate } from "framer-motion";
import { NoiseBackground } from "@/components/ui/NoiseBackground";

// Emil: strong ease-out — starts fast, gives instant feedback on enter
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface Profile {
  name: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder_name?: string;
  qr_url?: string;
  payment_method: string;
  phone?: string;
}

export default function BillDetailClient({
  bill: initialBill,
  flags,
}: {
  bill: Bill;
  flags: FlagType[];
  profile: Profile | null;
}) {
  const router = useRouter();
  const { lang } = useLang();
  const t = billDetailT[lang];
  const [bill, setBill] = useState(initialBill);
  const [marking, setMarking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const members = bill.bill_members ?? [];
  const paidCount = members.filter((m) => m.paid).length;
  const totalCount = members.length;
  const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
  const amountCollected = members.filter((m) => m.paid).reduce((s, m) => s + m.amount_owed, 0);
  const isOverdue = getDaysRemaining(bill.due_date) < 0;

  const unpaidMembers = members.filter((m) => !m.paid);
  const paidMembers = members.filter((m) => m.paid);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bill-${bill.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "bill_members",
        filter: `bill_id=eq.${bill.id}`,
      }, async () => {
        const { data } = await supabase
          .from("bills")
          .select("*, bill_members(*), bill_items(*)")
          .eq("id", bill.id)
          .single();
        if (data) setBill(data);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bill.id]);

  async function togglePaid(memberId: string, currentPaid: boolean) {
    setMarking(memberId);
    // Haptic feedback — celebrates the moment on supported devices
    if (!currentPaid) navigator.vibrate?.([12, 30, 18]);
    else navigator.vibrate?.(15);
    const supabase = createClient();
    await supabase.from("bill_members").update({
      paid: !currentPaid,
      paid_at: !currentPaid ? new Date().toISOString() : null,
      confirmed_by: !currentPaid ? "organizer" : null,
    }).eq("id", memberId);
    setMarking(null);
  }

  function sendReminder(member: (typeof members)[0]) {
    if (!member.phone) return;
    const msg = buildWAMessage("firm", {
      nama: member.name,
      amount: member.amount_owed.toFixed(2),
      tajuk: bill.title,
      due_date: formatDaysRemaining(bill.due_date),
      code: bill.pay_code,
      link: `${appUrl}/pay/${bill.pay_code}?t=${member.personal_token}`,
    });
    window.open(buildWAUrl(member.phone, msg), "_blank");
  }

  function copyPayCode() {
    navigator.clipboard.writeText(bill.pay_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cat = categoryTone(bill.category);

  return (
    <div
      className="min-h-dvh theme-aware"
      style={{ background: "var(--theme-bg)" }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          HERO — category-themed atmospheric backdrop
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Category-themed atmospheric orbs */}
        <motion.div
          aria-hidden
          animate={{ x: ["0%", "8%", "0%"], y: ["0%", "-6%", "0%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute pointer-events-none"
          style={{
            top: "-30%",
            left: "-20%",
            width: "75%",
            paddingBottom: "75%",
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${cat.rgb},0.28) 0%, transparent 65%)`,
            filter: "blur(48px)",
          }}
        />
        <motion.div
          aria-hidden
          animate={{ x: ["0%", "-6%", "0%"], y: ["0%", "5%", "0%"] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute pointer-events-none"
          style={{
            top: "20%",
            right: "-20%",
            width: "70%",
            paddingBottom: "70%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,240,232,0.10) 0%, transparent 60%)",
            filter: "blur(56px)",
          }}
        />

        {/* Sticky header */}
        <div
          className="sticky top-0 z-20 flex items-center gap-3 px-4 pb-3 md:top-[60px]"
          style={{
            background: "var(--theme-bg-overlay)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            paddingTop: "calc(env(safe-area-inset-top) + 16px)",
            borderBottom: "1px solid var(--theme-border)",
          }}
        >
          <motion.button
            onClick={() => router.back()}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="p-1"
            style={{ color: "rgba(245,240,232,0.7)" }}
          >
            <ArrowLeft size={22} />
          </motion.button>
          <h1
            className="flex-1 truncate font-clash"
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "#F5F0E8",
              letterSpacing: "-0.005em",
            }}
          >
            {bill.title}
          </h1>
          <motion.button
            onClick={() => navigator.share?.({ url: `${appUrl}/bills/${bill.id}` })}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="p-1"
            style={{ color: "rgba(245,240,232,0.7)" }}
          >
            <Share2 size={19} />
          </motion.button>
        </div>

        {/* Hero body */}
        <div className="relative px-5 pt-5 pb-9">
          {/* Editorial: category kicker + title + due chip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="flex items-center justify-between mb-5"
          >
            <div className="flex items-center gap-2">
              <span
                className="font-dm uppercase"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.22em",
                  color: cat.hex,
                  textShadow: `0 0 12px ${cat.hex}33`,
                }}
              >
                {bill.category.replace(/^\S+\s*/, "")}
              </span>
            </div>
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3, ease: EASE_OUT }}
              className="font-dm font-medium px-3 py-1 rounded-full"
              style={{
                fontSize: "11px",
                background: isOverdue ? "rgba(255,107,107,0.10)" : "rgba(255,172,46,0.10)",
                color: isOverdue ? "#FF6B6B" : "#FFAC2E",
                border: `1px solid ${isOverdue ? "rgba(255,107,107,0.28)" : "rgba(255,172,46,0.22)"}`,
                letterSpacing: "0.02em",
              }}
            >
              {formatDaysRemaining(bill.due_date)}
            </motion.span>
          </motion.div>

          {/* ── HERO: Sculptural Collected + Animated Donut ── */}
          <div className="flex items-center gap-5 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: EASE_OUT }}
              className="flex-1 min-w-0"
            >
              <p
                className="font-dm uppercase mb-1.5"
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.22em",
                  color: "rgba(245,240,232,0.45)",
                }}
              >
                {t.statCollected}
              </p>
              <CountUpAmount amount={amountCollected} catHex={cat.hex} />
              <p
                className="font-dm mt-2"
                style={{
                  fontSize: "11px",
                  color: "rgba(245,240,232,0.45)",
                  letterSpacing: "0.02em",
                }}
              >
                {lang === "bm" ? "drpd" : "of"} {formatRM(bill.total_amount)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 24 }}
            >
              <ProgressDonut percent={progress} accent={cat.hex} />
            </motion.div>
          </div>

          {/* Remaining stat with hairline */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: EASE_OUT }}
            className="flex items-center justify-between py-3"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              className="font-dm uppercase"
              style={{
                fontSize: "9px",
                letterSpacing: "0.18em",
                color: "rgba(245,240,232,0.45)",
              }}
            >
              {t.statRemaining}
            </span>
            <span
              className="font-clash tabular-nums"
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: isOverdue ? "#FF6B6B" : "#F5F0E8",
                letterSpacing: "-0.01em",
              }}
            >
              {formatRM(bill.total_amount - amountCollected)}
            </span>
          </motion.div>

          <p
            className="font-dm mt-3 text-center"
            style={{
              fontSize: "10px",
              color: "rgba(245,240,232,0.35)",
              letterSpacing: "0.04em",
            }}
          >
            {t.paidProgress(paidCount, totalCount)}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pb-24 flex flex-col gap-3">

        {/* Pay code card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.08, ease: EASE_OUT }}
        >
          <NoiseBackground
            gradientColors={["rgb(96,165,250)", "rgb(147,197,253)", "rgb(59,130,246)"]}
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <div className="flex-1">
              <p className="font-dm text-[11px] theme-text-muted mb-1">Pay Code</p>
              <p
                className="font-jetbrains font-medium text-lg tracking-[3px]"
                style={{
                  background: "linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 55%, rgb(220,90,80))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {bill.pay_code}
              </p>
            </div>
            <button
              onClick={copyPayCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-dm text-xs"
              style={{
                background: copied ? "rgba(160,224,171,0.1)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${copied ? "rgba(160,224,171,0.28)" : "rgba(255,255,255,0.12)"}`,
                color: copied ? "rgb(160,224,171)" : "rgba(255,255,255,0.45)",
                transition: "background 200ms cubic-bezier(0.23,1,0.32,1), border-color 200ms cubic-bezier(0.23,1,0.32,1), color 200ms cubic-bezier(0.23,1,0.32,1), transform 160ms cubic-bezier(0.23,1,0.32,1)",
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Copy size={12} />
              {copied ? t.copiedBtn : t.copyBtn}
            </button>
          </NoiseBackground>
        </motion.div>

        {/* Flag alert */}
        <AnimatePresence>
          {flags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <Link href={`/bills/${bill.id}/flags`}>
                <div
                  className="flex items-center gap-3 px-4 py-3.5 rounded-[10px]"
                  style={{
                    background: "rgba(255,172,46,0.05)",
                    border: "1px solid rgba(255,172,46,0.22)",
                    transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 160ms cubic-bezier(0.23,1,0.32,1)",
                  }}
                  onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                  onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <Flag size={17} style={{ color: "rgb(255,172,46)" }} className="shrink-0" />
                  </motion.div>
                  <div>
                    <p className="font-dm text-sm font-semibold" style={{ color: "rgb(255,172,46)" }}>
                      {t.flagAlert(flags.length)}
                    </p>
                    <p className="font-dm text-xs theme-text-muted">{t.flagSub}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blast reminder button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.12, ease: EASE_OUT }}
          onClick={() => members.filter((m) => !m.paid && m.phone).forEach(sendReminder)}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-dm text-sm theme-text-secondary"
          style={{
            background: "var(--theme-surface-tint)",
            border: "1px solid rgba(255,255,255,0.09)",
            transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 160ms cubic-bezier(0.23,1,0.32,1)",
          }}
          onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Bell size={15} />
          {t.remindAll}
        </motion.button>

        {/* ── Unpaid members ── */}
        {unpaidMembers.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            <p className="font-dm text-[10px] font-semibold uppercase tracking-[0.12em] theme-text-faint px-0.5">
              {t.unpaidSection(unpaidMembers.length)}
            </p>
            {unpaidMembers.map((member, i) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  background:
                    marking === member.id
                      ? "rgba(160,224,171,0.10)"
                      : "rgba(255,255,255,0.03)",
                  borderColor:
                    marking === member.id
                      ? "rgba(160,224,171,0.30)"
                      : "rgba(255,255,255,0.07)",
                }}
                transition={{
                  delay: 0.16 + i * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 28,
                  background: { duration: 0.4, ease: EASE_OUT },
                  borderColor: { duration: 0.4, ease: EASE_OUT },
                }}
                className="relative flex items-center gap-3 px-4 py-3.5 rounded-[12px]"
                style={{ border: "1px solid var(--theme-border)" }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-clash font-bold text-sm shrink-0"
                  style={{
                    background: "var(--theme-surface-tint-2)",
                    border: "1px solid var(--theme-border)",
                    color: "var(--theme-text-secondary)",
                  }}
                >
                  {getInitial(member.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-dm font-medium text-sm theme-text truncate">{member.name}</p>
                  <p className="font-dm text-xs theme-text-muted">{member.phone ?? t.noPhone}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-clash font-semibold text-sm theme-text">
                    {formatRM(member.amount_owed)}
                  </span>
                  <div className="flex gap-1.5">
                    {member.phone && (
                      <button
                        onClick={() => sendReminder(member)}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: "rgba(255,172,46,0.08)",
                          border: "1px solid rgba(255,172,46,0.18)",
                          transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
                        }}
                        onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.88)")}
                        onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <Bell size={13} style={{ color: "rgb(255,172,46)" }} />
                      </button>
                    )}
                    <button
                      onClick={() => togglePaid(member.id, false)}
                      disabled={marking === member.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(160,224,171,0.08)",
                        border: "1px solid rgba(160,224,171,0.18)",
                        transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
                      }}
                      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.88)")}
                      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <Check size={13} style={{ color: "rgb(160,224,171)" }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Paid members — horizontal scroll ── */}
        {paidMembers.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            <p className="font-dm text-[10px] font-semibold uppercase tracking-[0.12em] theme-text-faint px-0.5">
              {t.paidSection(paidMembers.length)}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {paidMembers.map((member, i) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: marking === member.id ? 0.45 : 1, scale: 1 }}
                  /* Emil: stagger 35ms */
                  transition={{ duration: 0.18, delay: i * 0.035, ease: EASE_OUT }}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-clash font-bold text-sm relative"
                    style={{
                      background: "rgba(160,224,171,0.07)",
                      border: "1px solid rgba(160,224,171,0.22)",
                      color: "rgb(160,224,171)",
                    }}
                  >
                    {getInitial(member.name)}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "rgb(160,224,171)" }}
                    >
                      <Check size={9} color="#000" strokeWidth={3} />
                    </span>
                  </div>
                  <p className="font-dm text-[10px] theme-text-muted truncate w-full text-center">
                    {member.name.split(" ")[0]}
                  </p>
                  {member.paid_at && (
                    <p className="font-dm text-[9px] theme-text-faint text-center leading-tight">
                      {formatTime(member.paid_at)}
                    </p>
                  )}
                  <button
                    onClick={() => togglePaid(member.id, true)}
                    disabled={marking === member.id}
                    className="font-dm text-[9px] theme-text-faint mt-0.5"
                    style={{ transition: "opacity 150ms cubic-bezier(0.23,1,0.32,1)" }}
                    onPointerDown={(e) => (e.currentTarget.style.opacity = "0.5")}
                    onPointerUp={(e) => (e.currentTarget.style.opacity = "1")}
                    onPointerLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {t.cancelPaid}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sculptural Collected amount with count-up ──────────────────────────────
function CountUpAmount({
  amount,
  catHex,
}: {
  amount: number;
  catHex: string;
}) {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionVal, amount, {
      duration: 1.0,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return controls.stop;
  }, [amount, motionVal]);

  const intPart = Math.floor(display).toLocaleString("en-MY");
  const decPart = Math.round((display % 1) * 100).toString().padStart(2, "0");

  return (
    <div className="flex items-baseline" style={{ lineHeight: 0.95 }}>
      <span
        className="font-dm uppercase tabular-nums mr-1.5 self-start mt-1.5"
        style={{
          fontSize: "10px",
          letterSpacing: "0.18em",
          color: "rgba(245,240,232,0.45)",
        }}
      >
        RM
      </span>
      <span
        className="font-clash tabular-nums"
        style={{
          fontSize: "clamp(40px, 12vw, 56px)",
          fontWeight: 500,
          color: "#F5F0E8",
          letterSpacing: "-0.035em",
          textShadow: `0 4px 24px ${catHex}40`,
        }}
      >
        {intPart}
      </span>
      <span
        className="font-clash tabular-nums"
        style={{
          fontSize: "clamp(40px, 12vw, 56px)",
          fontWeight: 500,
          color: "rgba(245,240,232,0.30)",
          letterSpacing: "-0.035em",
        }}
      >
        .{decPart}
      </span>
    </div>
  );
}

// ─── Animated circular progress donut ──────────────────────────────────────
function ProgressDonut({
  percent,
  accent,
}: {
  percent: number;
  accent: string;
}) {
  const size = 76;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePct = Math.max(0, Math.min(100, percent));
  const motionPct = useMotionValue(0);
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    const controls = animate(motionPct, safePct, {
      duration: 1.1,
      ease: [0.23, 1, 0.32, 1],
      delay: 0.3,
      onUpdate: (v) => setAnimPct(v),
    });
    return controls.stop;
  }, [safePct, motionPct]);

  const dashOffset = circumference - (animPct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {/* Fill — gradient stroke */}
        <defs>
          <linearGradient id="donut-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A0E0AB" />
            <stop offset="50%" stopColor="#FFAC2E" />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#donut-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            filter: `drop-shadow(0 0 6px ${accent}55)`,
          }}
        />
      </svg>
      {/* Center percent */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-clash tabular-nums"
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "#F5F0E8",
            letterSpacing: "-0.02em",
          }}
        >
          {Math.round(animPct)}%
        </span>
      </div>
    </div>
  );
}
