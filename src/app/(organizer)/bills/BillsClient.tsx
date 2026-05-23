"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Plus } from "lucide-react";
import { Bill, BillStatus } from "@/types";
import { formatRM, getDaysRemaining } from "@/lib/utils";
import BillCard from "@/components/ui/BillCard";

type Filter = "all" | "active" | "overdue" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "active", label: "Aktif" },
  { key: "overdue", label: "Lewat" },
  { key: "completed", label: "Selesai" },
];

export default function BillsClient({ bills }: { bills: Bill[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

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

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-syne font-bold text-2xl text-text-primary">Bil Saya</h1>
          <p className="text-text-secondary text-sm font-dm mt-0.5">
            Baki: <span className="text-danger font-semibold">{formatRM(uncollected)}</span> belum terkumpul
          </p>
        </div>
        <Link
          href="/create"
          className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"
        >
          <Plus size={20} className="text-bg-primary" />
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari tajuk atau Pay Code..."
          className="w-full bg-bg-surface border border-white/10 rounded-input pl-9 pr-4 py-3 text-text-primary font-dm text-sm placeholder:text-text-muted focus:border-accent/50 transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-pill text-xs font-dm font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-accent text-bg-primary"
                : "bg-bg-surface text-text-secondary border border-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bill list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-text-muted font-dm text-sm">
            {search ? "Tiada hasil carian" : "Tiada bil lagi"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          {filtered.map((bill, i) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <BillCard bill={bill} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
