"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import { Search, Plus, ChevronDown, X } from "lucide-react";
import { Bill } from "@/types";
import { getDaysRemaining } from "@/lib/utils";
import BillCard from "@/components/ui/BillCard";
import { useLang, billsT } from "@/lib/language-context";

type Filter = "all" | "active" | "overdue" | "completed";

export default function BillsClient({ bills }: { bills: Bill[] }) {
  const { lang } = useLang();
  const t = billsT[lang];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showCompleted, setShowCompleted] = useState(false);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "active", label: t.filterActive },
    { key: "overdue", label: t.filterOverdue },
    { key: "completed", label: t.filterCompleted },
  ];

  const uncollected = bills
    .filter((b) => b.status !== "completed")
    .flatMap((b) => b.bill_members ?? [])
    .filter((m) => !m.paid)
    .reduce((s, m) => s + m.amount_owed, 0);

  const filtered = bills.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.pay_code.toLowerCase().includes(search.toLowerCase());

    const billFilter: Record<Filter, boolean> = {
      all: true,
      active: b.status === "active",
      overdue: b.status === "overdue" || getDaysRemaining(b.due_date) < 0,
      completed: b.status === "completed",
    };

    return matchSearch && billFilter[filter];
  });

  const overdueGroup = filtered.filter(
    (b) =>
      b.status === "overdue" ||
      (b.status === "active" && getDaysRemaining(b.due_date) < 0)
  );
  const activeGroup = filtered.filter(
    (b) => b.status === "active" && getDaysRemaining(b.due_date) >= 0
  );
  const completedGroup = filtered.filter((b) => b.status === "completed");

  const isEmpty = filtered.length === 0;

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
          ATMOSPHERIC HERO — sculptural Outstanding amount
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden px-5 pb-7"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 28px)" }}
      >
        {/* Atmospheric warm/danger orb — tone shifts when uncollected > 0 */}
        <motion.div
          aria-hidden
          animate={{ x: ["0%", "8%", "0%"], y: ["0%", "-5%", "0%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute pointer-events-none"
          style={{
            top: "-50%",
            right: "-25%",
            width: "85%",
            paddingBottom: "85%",
            borderRadius: "50%",
            background:
              uncollected > 0
                ? "radial-gradient(circle, rgba(255,107,107,0.18) 0%, transparent 65%)"
                : "radial-gradient(circle, rgba(160,224,171,0.18) 0%, transparent 65%)",
            filter: "blur(48px)",
            transition: "background 800ms cubic-bezier(0.23,1,0.32,1)",
          }}
        />
        <motion.div
          aria-hidden
          animate={{ x: ["0%", "-6%", "0%"], y: ["0%", "4%", "0%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute pointer-events-none"
          style={{
            top: "30%",
            left: "-25%",
            width: "70%",
            paddingBottom: "70%",
            borderRadius: "50%",
            background:
              uncollected > 0
                ? "radial-gradient(circle, rgba(165,45,37,0.14) 0%, transparent 60%)"
                : "radial-gradient(circle, rgba(255,172,46,0.12) 0%, transparent 60%)",
            filter: "blur(56px)",
            transition: "background 800ms cubic-bezier(0.23,1,0.32,1)",
          }}
        />

        <div className="relative z-10">
          {/* Editorial kicker */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <p
              className="font-dm uppercase mb-3"
              style={{
                fontSize: "10px",
                letterSpacing: "0.22em",
                color: "rgba(245,240,232,0.55)",
                textShadow: "0 1px 8px rgba(0,0,0,0.6)",
              }}
            >
              {t.outstanding}
            </p>
          </motion.div>

          {/* Sculptural amount — animated count-up */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <SculpturalAmount
              amount={uncollected}
              isAlert={uncollected > 0}
            />
            <p
              className="font-dm mt-4"
              style={{
                fontSize: "12px",
                color: "rgba(245,240,232,0.55)",
                letterSpacing: "0.02em",
                textShadow: "0 1px 6px rgba(0,0,0,0.5)",
              }}
            >
              {bills.filter((b) => b.status !== "completed").length} bil aktif
            </p>
          </motion.div>

          {/* Search input — editorial pill */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative mt-7"
          >
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "rgba(245,240,232,0.4)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full font-dm text-sm scrollbar-hide"
              style={{
                background: "rgba(245,240,232,0.04)",
                border: "1px solid rgba(245,240,232,0.10)",
                borderRadius: "99px",
                padding: "11px 40px 11px 38px",
                color: "#F5F0E8",
                outline: "none",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                transition: "border-color 220ms cubic-bezier(0.23,1,0.32,1), background 220ms",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(245,240,232,0.35)";
                e.currentTarget.style.background = "rgba(245,240,232,0.06)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(245,240,232,0.10)";
                e.currentTarget.style.background = "rgba(245,240,232,0.04)";
              }}
            />
            <AnimatePresence>
              {search.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 active:scale-90"
                  style={{
                    background: "rgba(245,240,232,0.08)",
                    border: "none",
                    borderRadius: "99px",
                    width: 22,
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(245,240,232,0.6)",
                    transition: "transform 160ms",
                  }}
                  aria-label="Clear search"
                >
                  <X size={12} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* ── FILTER PILLS — morphing layoutId ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="flex gap-1 px-5 overflow-x-auto scrollbar-hide pb-1 mb-6"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <motion.button
              key={f.key}
              onClick={() => setFilter(f.key)}
              whileTap={{ scale: 0.94 }}
              className="relative whitespace-nowrap font-dm shrink-0"
              style={{
                padding: "8px 18px",
                fontSize: "12px",
                color: active ? "#000000" : "rgba(245,240,232,0.55)",
                background: "transparent",
                border: "none",
                outline: "none",
                cursor: "pointer",
                transition: "color 280ms cubic-bezier(0.23,1,0.32,1)",
                letterSpacing: "0.02em",
              }}
            >
              {/* Morphing pill background — slides between filters */}
              {active && (
                <motion.span
                  layoutId="bills-filter-pill"
                  className="absolute inset-0"
                  style={{
                    background: "#F5F0E8",
                    borderRadius: "99px",
                    boxShadow: "0 4px 16px rgba(245,240,232,0.18)",
                    zIndex: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 32,
                  }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── BILL GROUPS ──────────────────────────────────────────────────── */}
      <div className="px-5">
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center text-center py-16 gap-3"
          >
            <span className="text-4xl">🧾</span>
            <p className="font-dm text-whisper text-sm">
              {search ? t.emptySearch : t.emptyAll}
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-7">

            {/* Overdue group */}
            {overdueGroup.length > 0 && (
              <div>
                <SectionLabel
                  index="01"
                  label={t.groupOverdue}
                  count={overdueGroup.length}
                  color="#FF6B6B"
                  dotColor="#FF6B6B"
                />
                <div className="flex flex-col gap-3">
                  {overdueGroup.map((bill, i) => (
                    <motion.div
                      key={bill.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: i * 0.06,
                        type: "spring",
                        stiffness: 280,
                        damping: 30,
                      }}
                    >
                      <BillCard bill={bill} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Active group */}
            {activeGroup.length > 0 && (
              <div>
                <SectionLabel
                  index={overdueGroup.length > 0 ? "02" : "01"}
                  label={t.groupActive}
                  count={activeGroup.length}
                  color="#F5F0E8"
                  dotColor="#A0E0AB"
                />
                <div className="flex flex-col gap-3">
                  {activeGroup.map((bill, i) => (
                    <motion.div
                      key={bill.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: i * 0.06,
                        type: "spring",
                        stiffness: 280,
                        damping: 30,
                      }}
                    >
                      <BillCard bill={bill} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed group — collapsible */}
            {completedGroup.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCompleted((v) => !v)}
                  className="flex items-center gap-2 mb-3 active:opacity-60 w-full"
                  style={{ transition: "opacity 150ms" }}
                >
                  <span
                    className="font-dm uppercase"
                    style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#6d6d6d" }}
                  >
                    ✓ {t.groupCompleted}
                  </span>
                  <span
                    className="font-dm"
                    style={{
                      fontSize: "11px",
                      color: "#6d6d6d",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "99px",
                      padding: "1px 7px",
                    }}
                  >
                    {completedGroup.length}
                  </span>
                  <motion.span
                    animate={{ rotate: showCompleted ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-auto"
                  >
                    <ChevronDown size={14} style={{ color: "#6d6d6d" }} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {showCompleted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="flex flex-col gap-3 overflow-hidden"
                    >
                      {completedGroup.map((bill, i) => (
                        <motion.div
                          key={bill.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
                        >
                          <BillCard bill={bill} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FAB — editorial, atmospheric ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 280, damping: 22 }}
        whileTap={{ scale: 0.93 }}
        whileHover={{ y: -2 }}
        className="fixed bottom-24 right-4 z-40 md:hidden"
      >
        <Link
          href="/create"
          className="relative flex items-center justify-center"
          style={{
            width: "54px",
            height: "54px",
            borderRadius: "99px",
            background: "#F5F0E8",
            color: "#000000",
            boxShadow:
              "0 4px 20px rgba(245,240,232,0.18), 0 0 0 1px rgba(245,240,232,0.08)",
            transition: "box-shadow 220ms cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          {/* Atmospheric ring pulse */}
          <motion.span
            aria-hidden
            animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "99px",
              border: "1px solid rgba(245,240,232,0.5)",
            }}
          />
          <Plus size={22} strokeWidth={2} />
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Editorial section label — kicker + title + count ────────────────────
function SectionLabel({
  index,
  label,
  count,
  color = "rgba(245,240,232,0.55)",
  dotColor,
}: {
  index: string;
  label: string;
  count: number;
  color?: string;
  dotColor?: string;
}) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span
        className="font-dm tabular-nums"
        style={{
          fontSize: "10px",
          letterSpacing: "0.18em",
          color: "rgba(245,240,232,0.35)",
        }}
      >
        {index}
      </span>
      <div className="flex items-center gap-2">
        {dotColor && (
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: dotColor,
              boxShadow: `0 0 6px ${dotColor}80`,
              display: "inline-block",
            }}
          />
        )}
        <span
          className="font-clash"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color,
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </span>
      </div>
      <span
        className="font-dm tabular-nums"
        style={{
          fontSize: "10px",
          color: "rgba(245,240,232,0.35)",
        }}
      >
        ({count})
      </span>
      <div
        className="flex-1"
        style={{
          height: "1px",
          background:
            "linear-gradient(to right, rgba(245,240,232,0.10), transparent)",
        }}
      />
    </div>
  );
}

// ─── Sculptural amount with animated count-up ──────────────────────────────
function SculpturalAmount({
  amount,
  isAlert,
}: {
  amount: number;
  isAlert: boolean;
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
    <div>
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
      <div className="flex items-baseline" style={{ lineHeight: 0.95 }}>
        <span
          className="font-clash tabular-nums"
          style={{
            fontSize: "clamp(54px, 18vw, 80px)",
            fontWeight: 500,
            color: isAlert ? "#FF6B6B" : "#A0E0AB",
            letterSpacing: "-0.04em",
            textShadow: isAlert
              ? "0 4px 28px rgba(255,107,107,0.35)"
              : "0 4px 28px rgba(160,224,171,0.30)",
          }}
        >
          {intPart}
        </span>
        <span
          className="font-clash tabular-nums"
          style={{
            fontSize: "clamp(54px, 18vw, 80px)",
            fontWeight: 500,
            color: isAlert
              ? "rgba(255,107,107,0.32)"
              : "rgba(160,224,171,0.32)",
            letterSpacing: "-0.04em",
          }}
        >
          .{decPart}
        </span>
      </div>
    </div>
  );
}
