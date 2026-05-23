"use client";

import Link from "next/link";
import { Bill } from "@/types";
import { formatRM, formatDaysRemaining, getDaysRemaining } from "@/lib/utils";
import ProgressBar from "./ProgressBar";

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
  const amountCollected = members.filter((m) => m.paid).reduce((s, m) => s + m.amount_owed, 0);

  return (
    <Link href={`/bills/${bill.id}`}>
      <div className="surface-card rounded-card p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{bill.category.split(" ")[0]}</span>
            <div className="min-w-0">
              <p className="text-text-primary font-dm font-semibold text-sm truncate">{bill.title}</p>
              <p className="text-text-muted text-xs font-jetbrains mt-0.5">{bill.pay_code}</p>
            </div>
          </div>
          <span
            className={`text-xs font-dm px-2 py-1 rounded-pill shrink-0 ${
              isOverdue
                ? "bg-danger/20 text-danger"
                : bill.status === "completed"
                ? "bg-success/20 text-success"
                : "bg-warning/20 text-warning"
            }`}
          >
            {bill.status === "completed" ? "Selesai" : formatDaysRemaining(bill.due_date)}
          </span>
        </div>

        <ProgressBar value={progress} />

        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-xs font-dm">
            {paidCount}/{totalCount} dah bayar
          </span>
          <span className="text-text-primary text-sm font-dm font-semibold">
            {formatRM(amountCollected)}
            <span className="text-text-muted font-normal"> / {formatRM(bill.total_amount)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
