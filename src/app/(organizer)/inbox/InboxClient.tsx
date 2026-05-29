"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ActivityLog, ActivityType } from "@/types";
import { formatTime } from "@/lib/utils";
import Grainient from "@/components/ui/Grainient";
import { useLang, inboxT } from "@/lib/language-context";

type FilterType = "all" | "flags" | "payments" | "reminders";

const SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

// Per-type accent: gradient chip + glyph + soft glow color (colorful, layered)
function accent(type: ActivityType): {
  grad: string;
  glyph: string;
  glow: string;
} {
  switch (type) {
    case "payment_confirmed":
    case "payment_manual":
    case "bill_completed":
      return {
        grad: "linear-gradient(135deg, #34d399, #059669)",
        glyph: "✓",
        glow: "52,211,153",
      };
    case "flag_resolved":
      return {
        grad: "linear-gradient(135deg, #38bdf8, #6366f1)",
        glyph: "✓",
        glow: "56,189,248",
      };
    case "flag_created":
      return {
        grad: "linear-gradient(135deg, #fb7185, #e11d48)",
        glyph: "⚑",
        glow: "251,113,133",
      };
    case "reminder_sent":
      return {
        grad: "linear-gradient(135deg, #fbbf24, #f59e0b)",
        glyph: "◎",
        glow: "251,191,36",
      };
    case "bill_created":
      return {
        grad: "linear-gradient(135deg, #c084fc, #7c3aed)",
        glyph: "+",
        glow: "192,132,252",
      };
    default:
      return {
        grad: "linear-gradient(135deg, #94a3b8, #475569)",
        glyph: "·",
        glow: "148,163,184",
      };
  }
}

function matchesFilter(type: ActivityType, filter: FilterType): boolean {
  if (filter === "all") return true;
  if (filter === "flags")
    return type === "flag_created" || type === "flag_resolved";
  if (filter === "payments")
    return type === "payment_confirmed" || type === "payment_manual";
  if (filter === "reminders") return type === "reminder_sent";
  return true;
}

function groupByDate(
  list: ActivityLog[],
  labels: { today: string; yesterday: string; older: string }
): { label: string; items: ActivityLog[] }[] {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayItems: ActivityLog[] = [];
  const yesterdayItems: ActivityLog[] = [];
  const olderItems: ActivityLog[] = [];

  list.forEach((a) => {
    const d = new Date(a.created_at);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) todayItems.push(a);
    else if (d.getTime() === yesterday.getTime()) yesterdayItems.push(a);
    else olderItems.push(a);
  });

  const groups: { label: string; items: ActivityLog[] }[] = [];
  if (todayItems.length > 0)
    groups.push({ label: labels.today, items: todayItems });
  if (yesterdayItems.length > 0)
    groups.push({ label: labels.yesterday, items: yesterdayItems });
  if (olderItems.length > 0)
    groups.push({ label: labels.older, items: olderItems });
  return groups;
}

interface Props {
  activities: ActivityLog[];
}

export default function InboxClient({ activities }: Props) {
  const { lang } = useLang();
  const t = inboxT[lang];
  const [filter, setFilter] = useState<FilterType>("all");

  const FILTERS: { key: FilterType; label: string; grad: string }[] = [
    { key: "all", label: t.filterAll, grad: "linear-gradient(135deg, #c084fc, #7c3aed)" },
    { key: "flags", label: t.filterFlags, grad: "linear-gradient(135deg, #fb7185, #e11d48)" },
    { key: "payments", label: t.filterPayment, grad: "linear-gradient(135deg, #34d399, #059669)" },
    { key: "reminders", label: t.filterReminder, grad: "linear-gradient(135deg, #fbbf24, #f59e0b)" },
  ];

  const filtered = activities.filter((a) =>
    matchesFilter(a.activity_type, filter)
  );
  const groups = groupByDate(filtered, {
    today: t.groupToday,
    yesterday: t.groupYesterday,
    older: t.groupOlder,
  });

  const countPayments = activities.filter(
    (a) =>
      a.activity_type === "payment_confirmed" ||
      a.activity_type === "payment_manual"
  ).length;
  const countFlags = activities.filter(
    (a) => a.activity_type === "flag_created"
  ).length;
  const countReminders = activities.filter(
    (a) => a.activity_type === "reminder_sent"
  ).length;

  return (
    <div
      className="theme-aware"
      style={{
        background: "var(--theme-bg)",
        minHeight: "100dvh",
        paddingBottom: "112px",
      }}
    >
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Grainient background — vivid multi-color */}
        <div className="absolute inset-0 z-0">
          <Grainient
            color1="#7c1fb3"
            color2="#1a396d"
            color3="#b3216b"
            timeSpeed={0.6}
            colorBalance={0.0}
            warpStrength={1.0}
            warpFrequency={5.0}
            warpSpeed={2.0}
            warpAmplitude={50.0}
            blendAngle={0.0}
            blendSoftness={0.05}
            rotationAmount={500.0}
            noiseScale={2.0}
            grainAmount={0.1}
            grainScale={2.0}
            grainAnimated={false}
            contrast={1.5}
            gamma={1.0}
            saturation={1.15}
            centerX={0.0}
            centerY={0.0}
            zoom={0.9}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.30), rgba(0,0,0,0.55))",
            }}
          />
        </div>

        <div
          className="relative z-10 px-5 pb-5"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 28px)" }}
        >
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
          >
            <h1
              className="font-clash font-bold leading-none"
              style={{
                fontSize: "34px",
                color: "#ffffff",
                letterSpacing: "-0.02em",
                textShadow: "0 2px 18px rgba(0,0,0,0.5)",
              }}
            >
              {t.pageTitle}
            </h1>
            <p
              className="font-dm mt-2"
              style={{
                fontSize: "12.5px",
                color: "rgba(255,255,255,0.75)",
                textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              }}
            >
              {t.subtitle}
            </p>
          </motion.div>

          {/* Stat chips */}
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            {[
              {
                value: countPayments,
                label: t.statPayments,
                grad: "linear-gradient(135deg, #34d399, #059669)",
              },
              {
                value: countFlags,
                label: t.statFlags,
                grad: "linear-gradient(135deg, #fb7185, #e11d48)",
              },
              {
                value: countReminders,
                label: t.statReminders,
                grad: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.06, ...SPRING }}
                className="relative overflow-hidden"
                style={{
                  borderRadius: "16px",
                  padding: "11px 12px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0"
                  style={{ height: "3px", background: s.grad }}
                />
                <p
                  className="font-clash font-bold leading-none"
                  style={{ fontSize: "22px", color: "#fff" }}
                >
                  {s.value}
                </p>
                <p
                  className="font-dm uppercase mt-1.5"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.10em",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </header>

      {/* ── FILTER PILLS ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 md:top-[60px]">
        <div
          className="px-5 py-3"
          style={{
            background: "var(--theme-bg-overlay)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FILTERS.map(({ key, label, grad }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className="relative whitespace-nowrap font-dm shrink-0 active:scale-[0.94]"
                  style={{
                    padding: "7px 16px",
                    borderRadius: "99px",
                    fontSize: "12px",
                    fontWeight: active ? 600 : 400,
                    color: active ? "#fff" : "var(--theme-text-muted)",
                    background: active ? grad : "rgba(255,255,255,0.05)",
                    border: active
                      ? "1px solid transparent"
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: active ? "0 6px 18px rgba(124,58,237,0.30)" : "none",
                    transition:
                      "transform 120ms cubic-bezier(0.23,1,0.32,1), color 150ms",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FEED ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
                  border: "1px solid rgba(124,58,237,0.20)",
                  fontSize: "36px",
                }}
              >
                📭
              </div>
              <div>
                <p
                  className="font-clash font-bold text-frost"
                  style={{ fontSize: "18px" }}
                >
                  {t.emptyTitle}
                </p>
                <p
                  className="font-dm text-whisper text-sm mt-1"
                  style={{ maxWidth: "220px", lineHeight: 1.5 }}
                >
                  {t.emptyDesc}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-7">
              {groups.map((group) => (
                <motion.div key={group.label} layout>
                  {/* Group header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="font-clash font-bold"
                      style={{ fontSize: "13px", color: "var(--theme-text)" }}
                    >
                      {group.label}
                    </span>
                    <div
                      className="flex-1"
                      style={{
                        height: "1px",
                        background:
                          "linear-gradient(to right, rgba(255,255,255,0.10), transparent)",
                      }}
                    />
                    <span
                      className="font-dm shrink-0"
                      style={{
                        fontSize: "10px",
                        color: "#c4b5fd",
                        background: "rgba(124,58,237,0.16)",
                        borderRadius: "99px",
                        padding: "2px 9px",
                      }}
                    >
                      {group.items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2.5">
                    {group.items.map((activity, i) => {
                      const billId = (activity.bills as { id: string } | null)
                        ?.id;
                      return (
                        <motion.div
                          key={activity.id}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -16 }}
                          transition={{ delay: i * 0.04, ...SPRING }}
                        >
                          {billId ? (
                            <Link href={`/bills/${billId}`}>
                              <ActivityCard activity={activity} />
                            </Link>
                          ) : (
                            <ActivityCard activity={activity} />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Activity card ──────────────────────────────────────────────────────────
function ActivityCard({ activity }: { activity: ActivityLog }) {
  const { grad, glyph, glow } = accent(activity.activity_type);
  const timeStr = formatTime(activity.created_at);
  const billTitle = (activity.bills as { title?: string } | null)?.title;
  const billId = (activity.bills as { id: string } | null)?.id;

  return (
    <div
      className="relative overflow-hidden flex items-center gap-3.5 active:scale-[0.985]"
      style={{
        borderRadius: "18px",
        padding: "14px",
        background: "var(--theme-bg-card)",
        border: "1px solid var(--theme-border)",
        boxShadow: `0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 22px rgba(${glow},0.06)`,
        transition: "transform 140ms cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      {/* Left gradient accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: "3px", background: grad }}
      />

      {/* Gradient icon chip */}
      <div
        className="shrink-0 flex items-center justify-center font-clash font-bold"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "13px",
          background: grad,
          color: "#fff",
          fontSize: "17px",
          boxShadow: `0 6px 16px rgba(${glow},0.40)`,
        }}
      >
        {glyph}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="font-dm leading-snug"
          style={{ fontSize: "13.5px", color: "var(--theme-text)" }}
        >
          {activity.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {billTitle && (
            <span
              className="font-dm truncate"
              style={{ fontSize: "11px", color: "var(--theme-text-muted)" }}
            >
              {billTitle}
            </span>
          )}
          <span
            className="font-dm shrink-0"
            style={{ fontSize: "10.5px", color: "#6d6d6d" }}
          >
            {billTitle ? "· " : ""}
            {timeStr}
          </span>
        </div>
      </div>

      {billId && (
        <ChevronRight
          size={16}
          className="shrink-0"
          style={{ color: "var(--theme-text-muted)" }}
        />
      )}
    </div>
  );
}
