"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Bill, Profile } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, getDaysRemaining } from "@/lib/utils";
import ProgressRing from "@/components/ui/ProgressRing";
import Grainient from "@/components/ui/Grainient";
import { NoiseBackground } from "@/components/ui/NoiseBackground";
import CategoryIcon from "@/components/ui/CategoryIcon";

// ─── Internal mini card for the 2-col bills grid ──────────────────────────
// Separate from BillCard (used on Bills page) — designed for compact grid layout.
interface MiniBillCardProps {
  bill: Bill;
  delay: number;
}

function MiniBillCard({ bill, delay }: MiniBillCardProps) {
  const members = bill.bill_members ?? [];
  const paidCount = members.filter((m) => m.paid).length;
  const totalCount = members.length;
  const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
  const daysLeft = getDaysRemaining(bill.due_date);
  const isOverdue = daysLeft < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
    >
      <Link href={`/bills/${bill.id}`}>
        <NoiseBackground
          containerClassName="active:scale-[0.97] select-none"
          className="flex flex-col gap-3 p-3"
        >
          <CategoryIcon
            category={bill.category}
            size={28}
          />

          <p
            className="font-clash font-bold text-frost text-sm leading-tight"
            style={{
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {bill.title}
          </p>

          <p className="font-clash font-bold text-frost text-base leading-none">
            {formatRM(bill.total_amount)}
          </p>

          {/* Gradient progress bar */}
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 50%, rgb(165,45,37))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ duration: 0.8, delay: delay + 0.1, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="font-dm text-whisper" style={{ fontSize: "11px" }}>
              {paidCount}/{totalCount} bayar
            </span>
            <span
              className={`font-dm ${isOverdue ? "text-red-400" : "text-whisper"}`}
              style={{ fontSize: "11px" }}
            >
              {isOverdue
                ? `${Math.abs(daysLeft)}h lepas`
                : daysLeft === 0
                ? "Hari ini"
                : `${daysLeft}h lagi`}
            </span>
          </div>
        </NoiseBackground>
      </Link>
    </motion.div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────
interface Props {
  profile: Profile | null;
  bills: Bill[];
  userId: string;
}

// ─── Main dashboard component ───────────────────────────────────────────────
export default function DashboardClient({ profile, bills: initialBills, userId }: Props) {
  const [bills, setBills] = useState<Bill[]>(initialBills);

  // Supabase realtime subscription
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

  // Derived values
  const allMembers = bills.flatMap((b) => b.bill_members ?? []);
  const paidMembers = allMembers.filter((m) => m.paid);
  const totalCollected = paidMembers.reduce((s, m) => s + m.amount_owed, 0);
  const totalExpected = allMembers.reduce((s, m) => s + m.amount_owed, 0);
  const progressPct = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
  const firstName = profile?.name?.split(" ")[0] ?? "Organizer";

  const statItems = [
    { value: bills.length, label: "Bil Aktif" },
    { value: allMembers.length, label: "Jumlah Ahli" },
    { value: paidMembers.length, label: "Dah Bayar" },
  ];

  const heroContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const heroItemVariants = {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] } },
  };

  return (
    <div style={{ background: "#000000", minHeight: "100dvh", paddingBottom: "96px" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-8 pb-8">
        {/* Grainient WebGL background */}
        <div className="absolute inset-0 pointer-events-none">
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

        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10"
        >
          {/* Greeting */}
          <motion.div variants={heroItemVariants} className="mb-6">
            <p
              className="font-dm mb-1"
              style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
            >
              Assalamualaikum,
            </p>
            <h1
              className="font-clash font-bold leading-tight"
              style={{ fontSize: "30px", color: "#ffffff", textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
            >
              {firstName}
            </h1>
          </motion.div>

          {/* Amount row */}
          <motion.div
            variants={heroItemVariants}
            className="flex items-end justify-between gap-4"
          >
            <div>
              <p
                className="font-clash font-bold leading-none"
                style={{ fontSize: "48px", letterSpacing: "-0.02em", color: "#ffffff", textShadow: "0 2px 16px rgba(0,0,0,0.45)" }}
              >
                {formatRM(totalCollected)}
              </p>
              <p
                className="font-dm mt-2"
                style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
              >
                daripada {formatRM(totalExpected)}
              </p>
            </div>

            <ProgressRing
              value={progressPct}
              size={88}
              strokeWidth={5}
              color="#ffffff"
              bgColor="rgba(255,255,255,0.15)"
              label={`${Math.round(progressPct)}%`}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Separator */}
      <div
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.10) 70%, transparent)",
        }}
      />

      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3" style={{ background: "#000000" }}>
        {statItems.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
            className="flex flex-col items-center py-5 gap-1"
            style={{
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}
          >
            <p
              className="font-clash font-bold text-frost leading-none"
              style={{ fontSize: "28px" }}
            >
              {stat.value}
            </p>
            <p className="font-dm text-whisper text-center" style={{ fontSize: "11px" }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Separator */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

      {/* ── BILLS SECTION ────────────────────────────────────────────────── */}
      <div className="px-5 pt-7">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-5"
        >
          <h2
            className="font-clash font-bold text-frost leading-none"
            style={{ fontSize: "22px" }}
          >
            Bil Aktif
          </h2>
          <Link
            href="/bills"
            className="font-dm text-whisper active:opacity-50"
            style={{
              fontSize: "14px",
              transition: "opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            Semua →
          </Link>
        </motion.div>

        {bills.length === 0 ? (
          /* ── Empty state ─────────────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="relative overflow-hidden flex flex-col items-center text-center gap-5 py-12 px-6"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(160,224,171,0.12) 0%, transparent 65%)",
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-5">
              <span className="text-4xl">🧾</span>
              <div>
                <h3
                  className="font-clash font-bold text-frost mb-1"
                  style={{ fontSize: "18px" }}
                >
                  Tiada bil aktif
                </h3>
                <p className="font-dm text-whisper text-sm">
                  Buat bil pertama kamu dan kongsikan dengan rakan-rakan.
                </p>
              </div>
              <Link
                href="/create"
                className="flex items-center gap-2 font-dm font-semibold text-sm active:scale-[0.97]"
                style={{
                  background:
                    "linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 50%, rgb(165,45,37))",
                  borderRadius: "75.024px",
                  padding: "12px 28px",
                  color: "#000000",
                  transition: "transform 160ms cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                <Plus size={15} />
                Buat Bil Baru
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── 2-column bills grid ─────────────────────────────────────── */
          <div className="grid grid-cols-2 gap-3">
            {bills.map((bill, i) => (
              <MiniBillCard key={bill.id} bill={bill} delay={i * 0.05} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
