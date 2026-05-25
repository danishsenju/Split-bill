"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ActivityLog, ActivityType } from "@/types";
import { formatTime } from "@/lib/utils";
import Grainient from "@/components/ui/Grainient";

type FilterType = "semua" | "flags" | "bayaran" | "reminder";

const FILTER_LABELS: Record<FilterType, string> = {
  semua: "Semua",
  flags: "Flags",
  bayaran: "Bayaran",
  reminder: "Reminder",
};

// Dot color for the timeline indicator
function getDotColor(type: ActivityType): string {
  switch (type) {
    case "payment_confirmed":
    case "payment_manual":
    case "flag_resolved":
    case "bill_completed":
      return "#22c55e";
    case "flag_created":
      return "#ef4444";
    case "reminder_sent":
      return "#f59e0b";
    case "bill_created":
      return "#ffffff";
    default:
      return "#6d6d6d";
  }
}

// Small emoji glyph shown inside the dot
function getDotGlyph(type: ActivityType): string {
  switch (type) {
    case "payment_confirmed":
    case "payment_manual":
    case "flag_resolved":
    case "bill_completed":
      return "✓";
    case "flag_created":
      return "⚑";
    case "reminder_sent":
      return "◎";
    case "bill_created":
      return "+";
    default:
      return "·";
  }
}

function matchesFilter(type: ActivityType, filter: FilterType): boolean {
  if (filter === "semua") return true;
  if (filter === "flags") return type === "flag_created" || type === "flag_resolved";
  if (filter === "bayaran") return type === "payment_confirmed" || type === "payment_manual";
  if (filter === "reminder") return type === "reminder_sent";
  return true;
}

function groupByDate(list: ActivityLog[]): { label: string; items: ActivityLog[] }[] {
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
  if (todayItems.length > 0) groups.push({ label: "Hari Ini", items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: "Semalam", items: yesterdayItems });
  if (olderItems.length > 0) groups.push({ label: "Sebelum Ini", items: olderItems });
  return groups;
}

interface Props {
  activities: ActivityLog[];
}

export default function InboxClient({ activities }: Props) {
  const [filter, setFilter] = useState<FilterType>("semua");

  const filtered = activities.filter((a) => matchesFilter(a.activity_type, filter));
  const groups = groupByDate(filtered);
  const activeFlags = activities.filter((a) => a.activity_type === "flag_created").length;

  return (
    <div style={{ background: "#000000", minHeight: "100dvh", paddingBottom: "112px" }}>

      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 md:top-[60px] overflow-hidden"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Grainient background */}
        <div className="absolute inset-0 z-0">
          <Grainient
            color1="#20203a"
            color2="#3e21b3"
            color3="#1a396d"
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
            saturation={1.0}
            centerX={0.0}
            centerY={0.0}
            zoom={0.9}
          />
          {/* Dark overlay so text stays readable */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          />
        </div>

        {/* Header content sits above the canvas */}
        <div className="relative z-10 px-5 pt-6 pb-4">
        {/* Title row */}
        <div className="flex items-end justify-between mb-4">
          <h1
            className="font-clash font-bold text-frost leading-none"
            style={{ fontSize: "28px" }}
          >
            Peti Masuk
          </h1>

          {/* Active flag badge */}
          {activeFlags > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5"
              style={{
                background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "75.024px",
                padding: "4px 10px",
              }}
            >
              <span style={{ fontSize: "10px" }}>⚑</span>
              <span
                className="font-dm"
                style={{ fontSize: "11px", color: "#ef4444" }}
              >
                {activeFlags} bendera
              </span>
            </motion.div>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="whitespace-nowrap font-dm text-xs shrink-0 active:scale-[0.95]"
              style={{
                padding: "6px 16px",
                borderRadius: "75.024px",
                border:
                  filter === f
                    ? "1px solid rgba(255,255,255,0.3)"
                    : "1px solid transparent",
                color: filter === f ? "#ffffff" : "#6d6d6d",
                background: "transparent",
                transition:
                  "color 150ms cubic-bezier(0.23,1,0.32,1), border-color 150ms cubic-bezier(0.23,1,0.32,1), transform 120ms",
              }}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        </div>
      </header>

      {/* ── FEED ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            /* Empty state */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            >
              {/* Orb glow */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
                  border: "1px solid rgba(255,255,255,0.06)",
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
                  Tiada aktiviti
                </p>
                <p
                  className="font-dm text-whisper text-sm mt-1"
                  style={{ maxWidth: "220px", lineHeight: 1.5 }}
                >
                  Notifikasi bil dan bayaran akan muncul di sini.
                </p>
              </div>
            </motion.div>
          ) : (
            /* Timeline groups */
            <div className="flex flex-col gap-6">
              {groups.map((group) => (
                <motion.div key={group.label} layout>

                  {/* Section divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="font-dm uppercase shrink-0"
                      style={{ fontSize: "10px", letterSpacing: "0.10em", color: "#6d6d6d" }}
                    >
                      {group.label}
                    </span>
                    <div
                      className="flex-1"
                      style={{ height: "1px", background: "rgba(255,255,255,0.06)" }}
                    />
                    <span
                      className="font-dm shrink-0"
                      style={{
                        fontSize: "10px",
                        color: "#6d6d6d",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "99px",
                        padding: "2px 8px",
                      }}
                    >
                      {group.items.length}
                    </span>
                  </div>

                  {/* Timeline items */}
                  <div className="relative">
                    {/* Vertical connector line */}
                    <div
                      className="absolute top-3 bottom-3 pointer-events-none"
                      style={{
                        left: "11px",
                        width: "1px",
                        background:
                          "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 15%, rgba(255,255,255,0.08) 85%, transparent)",
                      }}
                    />

                    <div className="flex flex-col gap-0">
                      {group.items.map((activity, i) => {
                        const billId = (activity.bills as { id: string } | null)?.id;
                        return (
                          <motion.div
                            key={activity.id}
                            layout
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{
                              delay: i * 0.04,
                              ease: [0.23, 1, 0.32, 1],
                              duration: 0.3,
                            }}
                          >
                            {billId ? (
                              <Link href={`/bills/${billId}`}>
                                <TimelineItem activity={activity} />
                              </Link>
                            ) : (
                              <TimelineItem activity={activity} />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
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

// ─── Timeline item ─────────────────────────────────────────────────────────
function TimelineItem({ activity }: { activity: ActivityLog }) {
  const dotColor = getDotColor(activity.activity_type);
  const glyph = getDotGlyph(activity.activity_type);
  const timeStr = formatTime(activity.created_at);
  const billTitle = (activity.bills as { title?: string } | null)?.title;

  return (
    <div
      className="flex gap-4 py-3 active:opacity-70"
      style={{ transition: "opacity 150ms" }}
    >
      {/* Timeline dot */}
      <div className="shrink-0 flex flex-col items-center" style={{ width: "24px" }}>
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
          style={{
            background: `${dotColor}18`,
            border: `1px solid ${dotColor}40`,
            color: dotColor,
            fontSize: "9px",
            fontWeight: 700,
            lineHeight: 1,
            fontFamily: "inherit",
          }}
        >
          {glyph}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className="font-dm text-frost leading-snug flex-1"
            style={{ fontSize: "14px" }}
          >
            {activity.description}
          </p>
          <span
            className="font-dm shrink-0"
            style={{ fontSize: "10px", color: "#6d6d6d", marginTop: "2px" }}
          >
            {timeStr}
          </span>
        </div>

        {billTitle && (
          <p
            className="font-dm mt-1 truncate"
            style={{ fontSize: "12px", color: "#6d6d6d" }}
          >
            {billTitle}
          </p>
        )}
      </div>
    </div>
  );
}
