"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import { Pencil, Trash2, ChevronDown } from "lucide-react";
import { Bill, Profile } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, getDaysRemaining } from "@/lib/utils";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import Grainient from "@/components/ui/Grainient";
import { useLang, dashboardT } from "@/lib/language-context";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface Props {
  profile: Profile | null;
  bills: Bill[];
  userId: string;
}

// ─── Main dashboard ────────────────────────────────────────────────────────
export default function DashboardClient({
  profile,
  bills: initialBills,
  userId,
}: Props) {
  const { lang } = useLang();
  const t = dashboardT[lang];
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [now, setNow] = useState<Date | null>(null);

  // ─── Bills pagination — accumulating "Show more" ──
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleBills = bills.slice(0, visibleCount);
  const hasMore = bills.length > visibleCount;

  function handleDeleteBill(id: string) {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }

  // Clock — client-only to avoid hydration mismatch
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bill_members" },
        async () => {
          const { data } = await supabase
            .from("bills")
            .select("*, bill_members(*)")
            .eq("organizer_id", userId)
            .in("status", ["active", "overdue"])
            .order("created_at", { ascending: false });
          if (data) setBills(data);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ─── Derived values ──
  const allMembers = bills.flatMap((b) => b.bill_members ?? []);
  const paidMembers = allMembers.filter((m) => m.paid);
  const totalCollected = paidMembers.reduce((s, m) => s + m.amount_owed, 0);
  const totalExpected = allMembers.reduce((s, m) => s + m.amount_owed, 0);
  const progressPct =
    totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
  const firstName = profile?.name?.split(" ")[0] ?? "Organizer";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const collectedToday = paidMembers
    .filter((m) => m.paid_at && new Date(m.paid_at) >= startOfToday)
    .reduce((s, m) => s + m.amount_owed, 0);

  // Sculptural split of the hero amount
  const intPart = Math.floor(totalCollected).toLocaleString("en-MY");
  const decPart = Math.round((totalCollected % 1) * 100)
    .toString()
    .padStart(2, "0");

  const dateLabel = now
    ? `${now.getDate()} ${now
        .toLocaleString(lang === "bm" ? "ms-MY" : "en-MY", { month: "short" })
        .toLowerCase()} · ${now
        .toLocaleTimeString(lang === "bm" ? "ms-MY" : "en-MY", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase()}`
    : "";

  return (
    <div
      className="theme-aware"
      style={{
        background: "var(--theme-bg)",
        minHeight: "100dvh",
        paddingBottom: "112px",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          HERO — atmospheric Deep Ocean orbs floating in space.
          monopo signature: "translucent spherical shapes as primary
          background visuals, creating a sense of depth and fluid motion."
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: "60vh" }}
      >
        {/* ── Grainient WebGL background — warm orange atmosphere ── */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <Grainient
            color1="#f97316"
            color2="#351e93"
            color3="#a07d0f"
            timeSpeed={0.25}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1.1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>

        {/* ── Bottom fade — blends hero into theme bg below ── */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "32%",
            background:
              "linear-gradient(to bottom, transparent, var(--theme-bg) 95%)",
            pointerEvents: "none",
            zIndex: 1,
            transition: "background 320ms cubic-bezier(0.23,1,0.32,1)",
          }}
        />

        {/* ══════════ HERO CONTENT — floats on atmosphere ══════════ */}
        <div
          className="relative z-10 px-5 flex flex-col"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 24px)",
            paddingBottom: "32px",
            minHeight: "60vh",
          }}
        >
          {/* Live dot + date */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="flex items-center gap-2"
          >
            <motion.span
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "easeInOut",
              }}
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px rgba(34,197,94,0.7)",
                display: "inline-block",
              }}
            />
            <span
              className="font-dm uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.14em",
                color: "rgba(245,240,232,0.5)",
                textShadow: "0 1px 8px rgba(0,0,0,0.6)",
              }}
            >
              {dateLabel || "·"}
            </span>
          </motion.div>

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.05 }}
            className="mt-7"
          >
            <p
              className="font-dm"
              style={{
                fontSize: "13px",
                color: "rgba(245,240,232,0.55)",
                textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              }}
            >
              {t.greeting}
            </p>
            <h1
              className="font-clash"
              style={{
                fontSize: "44px",
                color: "#F5F0E8",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.02,
                marginTop: "2px",
                textShadow: "0 2px 16px rgba(0,0,0,0.55)",
              }}
            >
              {firstName}
            </h1>
          </motion.div>

          {/* Amount sculpture — pushed toward bottom of hero zone */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 }}
            className="mt-auto pt-16"
          >
            <p
              className="font-dm uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.20em",
                color: "rgba(245,240,232,0.5)",
                marginBottom: "6px",
                textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              }}
            >
              RM
            </p>
            <div
              className="flex items-baseline"
              style={{ lineHeight: 0.95 }}
            >
              <span
                className="font-clash"
                style={{
                  fontSize: "clamp(64px, 20vw, 96px)",
                  fontWeight: 500,
                  color: "#F5F0E8",
                  letterSpacing: "-0.04em",
                  fontFeatureSettings: '"tnum"',
                  textShadow: "0 4px 24px rgba(0,0,0,0.6)",
                }}
              >
                {intPart}
              </span>
              <span
                className="font-clash"
                style={{
                  fontSize: "clamp(64px, 20vw, 96px)",
                  fontWeight: 500,
                  color: "rgba(245,240,232,0.30)",
                  letterSpacing: "-0.04em",
                  fontFeatureSettings: '"tnum"',
                  textShadow: "0 4px 24px rgba(0,0,0,0.4)",
                }}
              >
                .{decPart}
              </span>
            </div>

            <p
              className="font-dm mt-4"
              style={{
                fontSize: "12px",
                color: "rgba(245,240,232,0.55)",
                textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              }}
            >
              {t.of} {formatRM(totalExpected)}
            </p>

            {/* Hairline progress — Deep Ocean fills with paid % */}
            <div
              className="mt-3 overflow-hidden rounded-full"
              style={{
                height: "1.5px",
                background: "rgba(255,255,255,0.10)",
              }}
            >
              <motion.div
                style={{
                  height: "100%",
                  background:
                    "linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 50%, rgb(165,45,37))",
                  transformOrigin: "left",
                  boxShadow: "0 0 12px rgba(255,172,46,0.4)",
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progressPct / 100 }}
                transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.4 }}
              />
            </div>

            <AnimatePresence>
              {collectedToday > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    delay: 0.6,
                    duration: 0.4,
                    ease: EASE_OUT,
                  }}
                  className="font-dm mt-3 flex items-center gap-1.5"
                  style={{ fontSize: "11px", color: "#a0e0ab" }}
                >
                  <span
                    style={{
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: "#a0e0ab",
                      display: "inline-block",
                      boxShadow: "0 0 4px rgba(160,224,171,0.6)",
                    }}
                  />
                  +{formatRM(collectedToday)} {t.collectedToday}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* ── STATS STRIP ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.3 }}
        className="px-5 py-7"
      >
        <div className="grid grid-cols-3">
          <StatCell value={bills.length} label={t.statBilAktif} />
          <StatCell
            value={allMembers.length}
            label={t.statJumlahAhli}
            divider
          />
          <StatCell
            value={paidMembers.length}
            label={t.statDahBayar}
            divider
            accent={paidMembers.length > 0}
          />
        </div>
      </motion.div>

      {/* ── HAIRLINE ───────────────────────────────────────────────────── */}
      <div
        className="mx-5"
        style={{ height: "1px", background: "var(--theme-hairline)" }}
      />

      {/* ── BILLS LIST ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-7">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex items-baseline justify-between mb-5"
        >
          <h2
            className="font-clash theme-aware"
            style={{
              fontSize: "13px",
              color: "var(--theme-text)",
              letterSpacing: "0.01em",
              fontWeight: 600,
            }}
          >
            {t.sectionBilAktif}
          </h2>
          <Link
            href="/bills"
            className="font-dm active:opacity-50 theme-aware"
            style={{
              fontSize: "11px",
              color: "var(--theme-text-muted)",
              letterSpacing: "0.04em",
              transition: "opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            {t.seeAll}
          </Link>
        </motion.div>

        {bills.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <>
            <div>
              {visibleBills.map((bill, i) => (
                <BillListRow
                  key={bill.id}
                  bill={bill}
                  delay={0.45 + i * 0.05}
                  isFirst={i === 0}
                  onDelete={handleDeleteBill}
                  t={t}
                />
              ))}
            </div>

            {/* ── Pagination footer ── */}
            <AnimatePresence>
              {hasMore && (
                <motion.div
                  key="show-more"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="flex flex-col items-center gap-2 pt-7 pb-2"
                >
                  <button
                    onClick={() =>
                      setVisibleCount((c) =>
                        Math.min(c + PAGE_SIZE, bills.length),
                      )
                    }
                    className="group flex items-center gap-1.5 font-dm active:opacity-60"
                    style={{
                      fontSize: "12px",
                      letterSpacing: "0.04em",
                      color: "#F5F0E8",
                      padding: "8px 4px",
                      transition:
                        "opacity 150ms cubic-bezier(0.23,1,0.32,1)",
                    }}
                  >
                    <span>{t.showMore}</span>
                    <motion.span
                      animate={{ y: [0, 2, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "easeInOut",
                      }}
                    >
                      <ChevronDown size={13} strokeWidth={1.8} />
                    </motion.span>
                  </button>
                  <span
                    className="font-dm uppercase"
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.16em",
                      color: "#6d6d6d",
                    }}
                  >
                    {t.showingXofY(visibleBills.length, bills.length)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stat cell ─────────────────────────────────────────────────────────────
function StatCell({
  value,
  label,
  divider = false,
  accent = false,
}: {
  value: number;
  label: string;
  divider?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-start gap-1.5"
      style={{
        borderLeft: divider ? "1px solid rgba(255,255,255,0.06)" : "none",
        paddingLeft: divider ? "20px" : "0",
      }}
    >
      <CountUp
        to={value}
        color={accent ? "#a0e0ab" : "var(--theme-text)"}
      />
      <span
        className="font-dm uppercase theme-aware"
        style={{
          fontSize: "9px",
          letterSpacing: "0.16em",
          color: "var(--theme-text-muted)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Count-up ──────────────────────────────────────────────────────────────
function CountUp({ to, color }: { to: number; color: string }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(count, to, {
      duration: 0.9,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [to, count]);
  return (
    <span
      className="font-clash"
      style={{
        fontSize: "30px",
        fontWeight: 500,
        color,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        fontFeatureSettings: '"tnum"',
      }}
    >
      {display}
    </span>
  );
}

// ─── Empty state — editorial, restrained ──────────────────────────────────
function EmptyState({
  t,
}: {
  t: (typeof dashboardT)[keyof typeof dashboardT];
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: EASE_OUT }}
      className="flex flex-col items-start gap-4 py-10"
    >
      <h3
        className="font-clash"
        style={{
          fontSize: "20px",
          color: "#F5F0E8",
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        {t.emptyTitle}
      </h3>
      <p
        className="font-dm"
        style={{
          fontSize: "13px",
          color: "#6d6d6d",
          lineHeight: 1.55,
          maxWidth: "320px",
        }}
      >
        {t.emptyDesc}
      </p>
      <div className="mt-2">
        <PrimaryButton
          href="/create"
          fullWidth={false}
          innerClassName="py-2.5 px-6 text-[13px]"
        >
          {t.createBill}
        </PrimaryButton>
      </div>
    </motion.div>
  );
}

// ─── Single bill row ──────────────────────────────────────────────────────
function BillListRow({
  bill,
  delay,
  isFirst,
  onDelete,
  t,
}: {
  bill: Bill;
  delay: number;
  isFirst: boolean;
  onDelete: (id: string) => void;
  t: (typeof dashboardT)[keyof typeof dashboardT];
}) {
  const router = useRouter();
  const members = bill.bill_members ?? [];
  const paidCount = members.filter((m) => m.paid).length;
  const totalCount = members.length;
  const daysLeft = getDaysRemaining(bill.due_date);
  const isOverdue = daysLeft < 0;

  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const didLongPress = useRef(false);

  function startPress() {
    didLongPress.current = false;
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      navigator.vibrate?.(40);
      setShowMenu(true);
      setIsPressing(false);
    }, 500);
  }

  function cancelPress() {
    clearTimeout(timerRef.current);
    setIsPressing(false);
  }

  function handleClick() {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    router.push(`/bills/${bill.id}`);
  }

  function closeMenu() {
    setShowMenu(false);
    setConfirmDelete(false);
  }

  async function handleDelete() {
    const supabase = createClient();
    await supabase.from("bills").delete().eq("id", bill.id);
    closeMenu();
    onDelete(bill.id);
  }

  const dueLabel = isOverdue
    ? t.daysAgo(Math.abs(daysLeft))
    : daysLeft === 0
    ? t.today
    : t.daysLeft(daysLeft);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4, ease: EASE_OUT }}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onPointerMove={cancelPress}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        className="relative flex items-center gap-4 py-5 cursor-pointer -mx-2 px-2 rounded-[8px]"
        style={
          {
            borderTop: isFirst ? "none" : "1px solid var(--theme-hairline)",
            transform: isPressing ? "scale(0.985)" : "scale(1)",
            background: isPressing
              ? "radial-gradient(ellipse 80% 100% at 0% 50%, rgba(160,224,171,0.06) 0%, transparent 70%)"
              : "transparent",
            transition:
              "transform 150ms cubic-bezier(0.23,1,0.32,1), background 220ms cubic-bezier(0.23,1,0.32,1)",
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
          } as React.CSSProperties
        }
      >
        {/* Category icon — monochrome, outlined */}
        <div className="shrink-0">
          <CategoryIcon category={bill.category} size={22} />
        </div>

        {/* Title + sub */}
        <div className="flex-1 min-w-0">
          <p
            className="font-clash truncate theme-aware"
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--theme-text)",
              letterSpacing: "-0.005em",
              lineHeight: 1.2,
            }}
          >
            {bill.title}
          </p>
          <p
            className="font-dm mt-1 theme-aware"
            style={{
              fontSize: "11px",
              color: isOverdue ? "rgb(220,90,80)" : "var(--theme-text-muted)",
              letterSpacing: "0.02em",
            }}
          >
            {paidCount}/{totalCount} · {dueLabel}
          </p>
        </div>

        {/* Amount — right-aligned mono numeric */}
        <span
          className="font-clash shrink-0 theme-aware"
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--theme-text)",
            letterSpacing: "-0.01em",
            fontFeatureSettings: '"tnum"',
          }}
        >
          {formatRM(bill.total_amount)}
        </span>
      </motion.div>

      {/* ── Long-press context menu ─────────────────────────────────── */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMenu}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                zIndex: 50,
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 51,
                background: "#0a0a0a",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px 24px 0 0",
                padding:
                  "20px 20px calc(env(safe-area-inset-bottom) + 20px)",
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              <p
                className="font-clash truncate mb-5"
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#F5F0E8",
                  letterSpacing: "-0.005em",
                }}
              >
                {bill.title}
              </p>

              {!confirmDelete ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      closeMenu();
                      router.push(`/bills/${bill.id}`);
                    }}
                    className="flex items-center gap-3 w-full font-dm text-sm active:opacity-60"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      color: "#F5F0E8",
                      transition: "opacity 150ms",
                    }}
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-3 w-full font-dm text-sm active:opacity-60"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.18)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      color: "#ef4444",
                      transition: "opacity 150ms",
                    }}
                  >
                    <Trash2 size={16} />
                    Padam
                  </button>
                  <button
                    onClick={closeMenu}
                    className="w-full font-dm text-sm active:opacity-50 mt-1"
                    style={{
                      color: "#6d6d6d",
                      padding: "12px",
                    }}
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p
                    className="font-dm text-center mb-2"
                    style={{ color: "#6d6d6d", fontSize: "13px" }}
                  >
                    Pasti nak padam bil ini?
                  </p>
                  <button
                    onClick={handleDelete}
                    className="w-full font-dm font-semibold text-sm active:opacity-60"
                    style={{
                      background: "#ef4444",
                      borderRadius: "12px",
                      padding: "14px 0",
                      color: "#ffffff",
                      transition: "opacity 150ms",
                    }}
                  >
                    Ya, padam
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="w-full font-dm text-sm active:opacity-50"
                    style={{ color: "#6d6d6d", padding: "12px" }}
                  >
                    Batal
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
