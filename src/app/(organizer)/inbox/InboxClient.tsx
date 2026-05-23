"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle,
  Flag,
  Bell,
  FileText,
  CreditCard,
  Plus,
} from "lucide-react";
import { ActivityLog, ActivityType } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";

type FilterType = "semua" | "flags" | "bayaran" | "reminder";

interface Props {
  activities: ActivityLog[];
}

const FILTER_LABELS: Record<FilterType, string> = {
  semua: "Semua",
  flags: "Flags",
  bayaran: "Bayaran",
  reminder: "Reminder",
};

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "payment_confirmed":
    case "payment_manual":
      return <CheckCircle size={18} className="text-success" />;
    case "flag_created":
      return <Flag size={18} className="text-danger" />;
    case "flag_resolved":
      return <Flag size={18} className="text-success" />;
    case "reminder_sent":
      return <Bell size={18} className="text-warning" />;
    case "bill_created":
      return <Plus size={18} className="text-accent" />;
    case "bill_completed":
      return <FileText size={18} className="text-success" />;
    default:
      return <CreditCard size={18} className="text-text-secondary" />;
  }
}

function getActivityBg(type: ActivityType): string {
  switch (type) {
    case "payment_confirmed":
    case "payment_manual":
      return "bg-success/10";
    case "flag_created":
      return "bg-danger/10";
    case "flag_resolved":
      return "bg-success/10";
    case "reminder_sent":
      return "bg-warning/10";
    case "bill_created":
    case "bill_completed":
      return "bg-accent/10";
    default:
      return "bg-bg-surface";
  }
}

function matchesFilter(type: ActivityType, filter: FilterType): boolean {
  if (filter === "semua") return true;
  if (filter === "flags") return type === "flag_created" || type === "flag_resolved";
  if (filter === "bayaran") return type === "payment_confirmed" || type === "payment_manual";
  if (filter === "reminder") return type === "reminder_sent";
  return true;
}

export default function InboxClient({ activities }: Props) {
  const [filter, setFilter] = useState<FilterType>("semua");

  const filtered = activities.filter((a) => matchesFilter(a.activity_type, filter));

  return (
    <div className="min-h-dvh bg-bg-primary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/90 backdrop-blur-md px-4 pt-12 pb-3">
        <h1 className="font-syne font-bold text-2xl text-text-primary mb-3">
          Peti Masuk
        </h1>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-pill text-xs font-dm font-medium whitespace-nowrap transition-colors shrink-0 ${
                filter === f
                  ? "bg-accent text-bg-primary"
                  : "bg-bg-surface text-text-secondary border border-white/10"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-2 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-3"
            >
              <span className="text-5xl">📭</span>
              <p className="font-syne font-bold text-text-primary text-lg">
                Tiada aktiviti lagi
              </p>
              <p className="text-text-muted text-sm font-dm text-center">
                Notifikasi bil dan bayaran akan muncul di sini.
              </p>
            </motion.div>
          ) : (
            filtered.map((activity, i) => {
              const billId = (activity.bills as { id: string } | null)?.id;

              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {billId ? (
                    <Link href={`/bills/${billId}`}>
                      <ActivityItem activity={activity} />
                    </Link>
                  ) : (
                    <ActivityItem activity={activity} />
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: ActivityLog }) {
  const dateStr = formatDate(activity.created_at);
  const timeStr = formatTime(activity.created_at);

  return (
    <div className="surface-card rounded-card p-4 flex items-start gap-3">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getActivityBg(
          activity.activity_type
        )}`}
      >
        {getActivityIcon(activity.activity_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-dm text-sm leading-snug">
          {activity.description}
        </p>
        {(activity.bills as { title?: string } | null)?.title && (
          <p className="text-text-muted text-xs font-dm mt-0.5 truncate">
            {(activity.bills as { title: string }).title}
          </p>
        )}
        <p className="text-text-muted text-[10px] font-dm mt-1">
          {dateStr} · {timeStr}
        </p>
      </div>
    </div>
  );
}
