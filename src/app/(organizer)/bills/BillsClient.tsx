"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, ChevronDown } from "lucide-react";
import { Bill } from "@/types";
import { formatRM, getDaysRemaining } from "@/lib/utils";
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
    <div style={{ background: "#000000", minHeight: "100dvh", paddingBottom: "112px" }}>

      {/* ── HEADER + SEARCH ─────────────────────────────────────────────── */}
      <div className="px-5 pt-7 pb-5">
        {/* Page title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="font-clash font-bold text-frost mb-5"
          style={{ fontSize: "28px" }}
        >
          {t.pageTitle}
        </motion.h1>

        {/* Outstanding card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative overflow-hidden rounded-[10px] p-4 mb-4"
          style={{
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Subtle orb glow */}
          <div
            className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)",
              filter: "blur(20px)",
              transform: "translate(20%, -20%)",
            }}
          />
          <div className="relative z-10">
            <p
              className="font-dm text-whisper uppercase mb-1"
              style={{ fontSize: "10px", letterSpacing: "0.1em" }}
            >
              {t.outstanding}
            </p>
            <p
              className="font-clash font-bold leading-none"
              style={{ fontSize: "32px", color: uncollected > 0 ? "#ef4444" : "#22c55e" }}
            >
              {formatRM(uncollected)}
            </p>
          </div>
        </motion.div>

        {/* Search input */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative"
        >
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#6d6d6d" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full font-dm text-sm placeholder:text-whisper scrollbar-hide"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "75.024px",
              padding: "10px 16px 10px 36px",
              color: "#ffffff",
              outline: "none",
              transition: "border-color 150ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
            }
          />
        </motion.div>
      </div>

      {/* ── FILTER PILLS ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1 mb-5"
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="whitespace-nowrap font-dm text-xs active:scale-[0.95]"
            style={{
              padding: "6px 16px",
              borderRadius: "75.024px",
              border: filter === f.key
                ? "1px solid rgba(255,255,255,0.3)"
                : "1px solid transparent",
              color: filter === f.key ? "#ffffff" : "#6d6d6d",
              background: "transparent",
              transition:
                "color 150ms cubic-bezier(0.23, 1, 0.32, 1), border-color 150ms cubic-bezier(0.23, 1, 0.32, 1), transform 120ms",
            }}
          >
            {f.label}
          </button>
        ))}
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
                <SectionLabel emoji="⚠" label={t.groupOverdue} count={overdueGroup.length} color="#ef4444" />
                <div className="flex flex-col gap-3">
                  {overdueGroup.map((bill, i) => (
                    <motion.div
                      key={bill.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
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
                <SectionLabel emoji="●" label={t.groupActive} count={activeGroup.length} />
                <div className="flex flex-col gap-3">
                  {activeGroup.map((bill, i) => (
                    <motion.div
                      key={bill.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
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

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <Link
        href="/create"
        className="fixed bottom-24 right-4 z-40 md:hidden flex items-center justify-center active:scale-[0.93]"
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "75.024px",
          background: "var(--gradient-deep-ocean)",
          transition: "transform 160ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <Plus size={22} color="#000000" strokeWidth={2.5} />
      </Link>
    </div>
  );
}

// ─── Section label helper ──────────────────────────────────────────────────
function SectionLabel({
  emoji,
  label,
  count,
  color = "#6d6d6d",
}: {
  emoji: string;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ fontSize: "12px", color }}>{emoji}</span>
      <span
        className="font-dm uppercase"
        style={{ fontSize: "11px", letterSpacing: "0.08em", color }}
      >
        {label}
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
        {count}
      </span>
      <div
        className="flex-1"
        style={{ height: "1px", background: "rgba(255,255,255,0.06)" }}
      />
    </div>
  );
}
