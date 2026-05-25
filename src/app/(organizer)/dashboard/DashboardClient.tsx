"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, animate } from "framer-motion";
import { Plus } from "lucide-react";
import { Bill, Profile } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, getDaysRemaining } from "@/lib/utils";
import ProgressRing from "@/components/ui/ProgressRing";
import Grainient from "@/components/ui/Grainient";
import { NoiseBackground } from "@/components/ui/NoiseBackground";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { useLang, dashboardT } from "@/lib/language-context";

// ─── Count-up number animation ────────────────────────────────────────────
function CountUp({ to, color }: { to: number; color: string }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, to, {
      duration: 0.7,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [to]);

  return <span style={{ color }}>{display}</span>;
}

// ─── Internal mini card for the 2-col bills grid ──────────────────────────
// Separate from BillCard (used on Bills page) — designed for compact grid layout.
interface MiniBillCardProps {
  bill: Bill;
  delay: number;
  t: typeof dashboardT[keyof typeof dashboardT];
}

function MiniBillCard({ bill, delay, t }: MiniBillCardProps) {
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
              {paidCount}/{totalCount} {t.paid}
            </span>
            <span
              className={`font-dm ${isOverdue ? "text-red-400" : "text-whisper"}`}
              style={{ fontSize: "11px" }}
            >
              {isOverdue
                ? t.daysAgo(Math.abs(daysLeft))
                : daysLeft === 0
                ? t.today
                : t.daysLeft(daysLeft)}
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
  const { lang } = useLang();
  const t = dashboardT[lang];

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
    { value: bills.length,       label: t.statBilAktif,    color: "#D4AF37",  accentColor: "#D4AF37" },
    { value: allMembers.length,  label: t.statJumlahAhli,  color: "#ffffff",  accentColor: "rgba(255,255,255,0.35)" },
    { value: paidMembers.length, label: t.statDahBayar,    color: paidMembers.length > 0 ? "#00D084" : "#ffffff", accentColor: paidMembers.length > 0 ? "#00D084" : "rgba(255,255,255,0.15)" },
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
      <div
        className="relative overflow-hidden px-5 pb-20"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 32px)" }}
      >
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
              {t.greeting}
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
                {t.of} {formatRM(totalExpected)}
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

      {/* ── STATS — Liquid Glass ─────────────────────────────────────────── */}
      {/* Negative margin pulls the card up over the Grainient so backdrop-filter refracts real color */}
      <div
        className="px-4"
        style={{ marginTop: "-40px", position: "relative", zIndex: 10, paddingBottom: "4px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.18, ease: [0.23, 1, 0.32, 1], duration: 0.55 }}
          style={{
            position: "relative",
            borderRadius: "28px",
            overflow: "hidden",
            /* Glass body — low opacity so Grainient bleeds through */
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(48px) saturate(2) brightness(1.08)",
            WebkitBackdropFilter: "blur(48px) saturate(2) brightness(1.08)",
            /* Outer border + glow ring */
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: [
              /* Depth shadow */
              "0 16px 48px rgba(0,0,0,0.55)",
              "0 4px 16px rgba(0,0,0,0.35)",
              /* Top specular edge — brightest at corners */
              "inset 0 1.5px 0 rgba(255,255,255,0.40)",
              /* Bottom dark edge — glass thickness illusion */
              "inset 0 -1px 0 rgba(0,0,0,0.25)",
              /* Left rim highlight */
              "inset 1px 0 0 rgba(255,255,255,0.14)",
              /* Right rim (fainter) */
              "inset -1px 0 0 rgba(255,255,255,0.06)",
            ].join(", "),
          }}
        >
          {/* ── Top lens flare — upper half is brighter (light hits top of glass) */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "60%",
              background:
                "linear-gradient(175deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 35%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 1,
              borderRadius: "28px 28px 0 0",
            }}
          />

          {/* ── Bottom shadow band — glass is slightly darker near base */}
          <div
            style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              height: "35%",
              background: "linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* ── Left caustic streak — refracts strongest on one side */}
          <div
            style={{
              position: "absolute",
              top: "8%", bottom: "8%", left: 0,
              width: "38%",
              background:
                "linear-gradient(to right, rgba(255,255,255,0.07) 0%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* ── Stat columns ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-3" style={{ position: "relative", zIndex: 2 }}>
            {statItems.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.07, ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
                className="flex flex-col items-center py-5 gap-1"
                style={{
                  borderRight:
                    i < 2 ? "1px solid rgba(255,255,255,0.10)" : "none",
                }}
              >
                <p
                  className="font-clash font-bold leading-none"
                  style={{ fontSize: "28px" }}
                >
                  <CountUp to={stat.value} color={stat.color} />
                </p>
                <p
                  className="font-dm text-center"
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.52)",
                    letterSpacing: "0.03em",
                  }}
                >
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Spacing before bills section */}
      <div style={{ height: "8px" }} />

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
            {t.sectionBilAktif}
          </h2>
          <Link
            href="/bills"
            className="font-dm text-whisper active:opacity-50"
            style={{
              fontSize: "14px",
              transition: "opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            {t.seeAll}
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
                  {t.emptyTitle}
                </h3>
                <p className="font-dm text-whisper text-sm">
                  {t.emptyDesc}
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
                {t.createBill}
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── 2-column bills grid ─────────────────────────────────────── */
          <div className="grid grid-cols-2 gap-3">
            {bills.map((bill, i) => (
              <MiniBillCard key={bill.id} bill={bill} delay={i * 0.05} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
