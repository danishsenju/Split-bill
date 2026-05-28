"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bill } from "@/types";
import { formatRM, formatDaysRemaining, getDaysRemaining, getInitial } from "@/lib/utils";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface BillCardProps {
  bill: Bill;
}

export default function BillCard({ bill }: BillCardProps) {
  const members = bill.bill_members ?? [];
  const paidCount = members.filter((m) => m.paid).length;
  const totalCount = members.length;
  const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
  const daysLeft = getDaysRemaining(bill.due_date);
  const isOverdue = daysLeft < 0;
  const isCompleted = bill.status === "completed";
  const amountCollected = members
    .filter((m) => m.paid)
    .reduce((s, m) => s + m.amount_owed, 0);

  const visibleMembers = members.slice(0, 4);
  const overflow = members.length - 4;

  // Status label — text only, no badge background
  const statusColor = isCompleted
    ? "#22c55e"
    : isOverdue
    ? "#ef4444"
    : "#6d6d6d";

  const statusText = isCompleted
    ? "Selesai"
    : formatDaysRemaining(bill.due_date);

  return (
    <Link href={`/bills/${bill.id}`}>
      <div
        className="theme-aware flex flex-col gap-3 p-4 active:scale-[0.97] select-none"
        style={{
          background: "var(--theme-bg-card)",
          border: "1px solid var(--theme-border)",
          borderRadius: "10px",
          transition:
            "transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 280ms, border-color 280ms",
        }}
      >
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--theme-surface-tint-2)" }}
          >
            <CategoryIcon category={bill.category} size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="font-dm font-semibold text-sm truncate theme-aware"
              style={{ color: "var(--theme-text)" }}
            >
              {bill.title}
            </p>
            <p
              className="font-jetbrains mt-0.5 theme-aware"
              style={{
                fontSize: "11px",
                letterSpacing: "2px",
                color: "var(--theme-text-muted)",
              }}
            >
              {bill.pay_code}
            </p>
          </div>

          <span
            className="font-dm shrink-0"
            style={{ fontSize: "11px", color: statusColor }}
          >
            {statusText}
          </span>
        </div>

        {/* Gradient progress bar */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: "3px", background: "var(--theme-border)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 50%, rgb(165,45,37))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {visibleMembers.map((m, i) => (
                <div
                  key={m.id}
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-clash font-bold border ${i > 0 ? "-ml-1.5" : ""}`}
                  style={{
                    fontSize: "10px",
                    borderColor: "var(--theme-bg-card)",
                    background: m.paid
                      ? "rgba(34,197,94,0.2)"
                      : "var(--theme-surface-tint-2)",
                    color: m.paid ? "#22c55e" : "var(--theme-text-muted)",
                  }}
                >
                  {getInitial(m.name)}
                </div>
              ))}
              {overflow > 0 && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-dm -ml-1.5 border"
                  style={{
                    fontSize: "9px",
                    borderColor: "var(--theme-bg-card)",
                    background: "var(--theme-surface-tint)",
                    color: "var(--theme-text-muted)",
                  }}
                >
                  +{overflow}
                </div>
              )}
            </div>
            <span
              className="font-dm"
              style={{
                fontSize: "11px",
                color: "var(--theme-text-muted)",
              }}
            >
              {paidCount}/{totalCount}
            </span>
          </div>

          <span
            className="font-dm text-sm"
            style={{ color: "var(--theme-text)" }}
          >
            {formatRM(amountCollected)}
            <span
              style={{
                color: "var(--theme-text-muted)",
                fontWeight: 400,
                fontSize: "12px",
              }}
            >
              {" "}/ {formatRM(bill.total_amount)}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
