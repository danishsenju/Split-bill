"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Bell } from "lucide-react";
import { Bill, Profile } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, getInitial } from "@/lib/utils";
import ProgressRing from "@/components/ui/ProgressRing";
import BillCard from "@/components/ui/BillCard";

interface Props {
  profile: Profile | null;
  bills: Bill[];
  userId: string;
}

export default function DashboardClient({ profile, bills: initialBills, userId }: Props) {
  const [bills, setBills] = useState<Bill[]>(initialBills);

  // Realtime subscription for bill_members changes
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
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const allMembers = bills.flatMap((b) => b.bill_members ?? []);
  const paidMembers = allMembers.filter((m) => m.paid);
  const totalCollected = paidMembers.reduce((s, m) => s + m.amount_owed, 0);
  const totalExpected = allMembers.reduce((s, m) => s + m.amount_owed, 0);
  const progressPct = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
  const firstName = profile?.name?.split(" ")[0] ?? "Organizer";

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-text-muted text-sm font-dm">Assalamualaikum,</p>
          <h1 className="font-syne font-bold text-2xl text-text-primary">{firstName}! 👋</h1>
        </div>
        <Link href="/inbox">
          <div className="w-10 h-10 rounded-full bg-bg-surface border border-white/10 flex items-center justify-center">
            <Bell size={18} className="text-text-secondary" />
          </div>
        </Link>
      </div>

      {/* Hero Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card rounded-card p-5 mb-6"
      >
        <div className="flex items-center gap-4">
          <ProgressRing
            value={progressPct}
            size={88}
            label={`${Math.round(progressPct)}%`}
            sublabel="terkumpul"
          />
          <div className="flex-1">
            <p className="text-text-muted text-xs font-dm mb-1">Total Terkumpul</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-syne font-bold text-2xl text-accent"
            >
              {formatRM(totalCollected)}
            </motion.p>
            <p className="text-text-muted text-xs font-dm mt-0.5">
              daripada {formatRM(totalExpected)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/8">
          <div className="text-center">
            <p className="font-syne font-bold text-lg text-text-primary">{bills.length}</p>
            <p className="text-text-muted text-xs font-dm">Bil Aktif</p>
          </div>
          <div className="text-center border-x border-white/8">
            <p className="font-syne font-bold text-lg text-text-primary">{allMembers.length}</p>
            <p className="text-text-muted text-xs font-dm">Ahli</p>
          </div>
          <div className="text-center">
            <p className="font-syne font-bold text-lg text-success">{paidMembers.length}</p>
            <p className="text-text-muted text-xs font-dm">Dah Bayar</p>
          </div>
        </div>
      </motion.div>

      {/* Bills */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-syne font-bold text-text-primary">Bil Aktif</h2>
        <Link href="/bills" className="text-accent text-sm font-dm">
          Semua →
        </Link>
      </div>

      {bills.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="surface-card rounded-card p-8 flex flex-col items-center text-center gap-3"
        >
          <span className="text-4xl">🧾</span>
          <h3 className="font-syne font-bold text-text-primary">Tiada bil aktif</h3>
          <p className="text-text-muted text-sm font-dm">
            Buat bil pertama kamu dan kongsikan dengan rakan-rakan.
          </p>
          <Link
            href="/create"
            className="mt-2 flex items-center gap-2 bg-accent text-bg-primary font-dm font-semibold px-5 py-3 rounded-btn text-sm"
          >
            <Plus size={16} />
            Buat Bil Baru
          </Link>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          {bills.map((bill, i) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <BillCard bill={bill} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
