"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Bell, Flag, Check, Copy } from "lucide-react";
import { Bill, Flag as FlagType } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, formatDaysRemaining, getDaysRemaining, getInitial, formatTime } from "@/lib/utils";
import { buildWAUrl, buildWAMessage } from "@/lib/whatsapp";
import Link from "next/link";
import { NoiseBackground } from "@/components/ui/NoiseBackground";
import { useLang, billDetailT } from "@/lib/language-context";

// Emil: strong ease-out — starts fast, gives instant feedback on enter
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface Profile {
  name: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder_name?: string;
  qr_url?: string;
  payment_method: string;
  phone?: string;
}

export default function BillDetailClient({
  bill: initialBill,
  flags,
}: {
  bill: Bill;
  flags: FlagType[];
  profile: Profile | null;
}) {
  const router = useRouter();
  const { lang } = useLang();
  const t = billDetailT[lang];
  const [bill, setBill] = useState(initialBill);
  const [marking, setMarking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const members = bill.bill_members ?? [];
  const paidCount = members.filter((m) => m.paid).length;
  const totalCount = members.length;
  const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
  const amountCollected = members.filter((m) => m.paid).reduce((s, m) => s + m.amount_owed, 0);
  const isOverdue = getDaysRemaining(bill.due_date) < 0;

  const unpaidMembers = members.filter((m) => !m.paid);
  const paidMembers = members.filter((m) => m.paid);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bill-${bill.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "bill_members",
        filter: `bill_id=eq.${bill.id}`,
      }, async () => {
        const { data } = await supabase
          .from("bills")
          .select("*, bill_members(*), bill_items(*)")
          .eq("id", bill.id)
          .single();
        if (data) setBill(data);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bill.id]);

  async function togglePaid(memberId: string, currentPaid: boolean) {
    setMarking(memberId);
    const supabase = createClient();
    await supabase.from("bill_members").update({
      paid: !currentPaid,
      paid_at: !currentPaid ? new Date().toISOString() : null,
      confirmed_by: !currentPaid ? "organizer" : null,
    }).eq("id", memberId);
    setMarking(null);
  }

  function sendReminder(member: (typeof members)[0]) {
    if (!member.phone) return;
    const msg = buildWAMessage("firm", {
      nama: member.name,
      amount: member.amount_owed.toFixed(2),
      tajuk: bill.title,
      due_date: formatDaysRemaining(bill.due_date),
      code: bill.pay_code,
      link: `${appUrl}/pay/${bill.pay_code}?t=${member.personal_token}`,
    });
    window.open(buildWAUrl(member.phone, msg), "_blank");
  }

  function copyPayCode() {
    navigator.clipboard.writeText(bill.pay_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-dvh bg-[#000]">
      {/* ── Hero with Deep Ocean Gradient atmosphere ── */}
      <div className="relative overflow-hidden">
        {/* Ambient gradient layer */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 20% -10%, rgba(160,224,171,0.18) 0%, transparent 55%), " +
              "radial-gradient(ellipse 80% 60% at 85% 110%, rgba(165,45,37,0.14) 0%, transparent 55%)",
          }}
        />

        {/* Sticky header */}
        <div
          className="sticky top-0 z-20 flex items-center gap-3 px-4 pb-3 md:top-[60px]"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(20px)", paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
        >
          <button
            onClick={() => router.back()}
            /* Emil: 160ms ease-out, only transform */
            className="p-1 text-white/50"
            style={{ transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 160ms cubic-bezier(0.23,1,0.32,1)" }}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.88)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="flex-1 truncate font-clash text-white text-base">{bill.title}</h1>
          <button
            onClick={() => navigator.share?.({ url: `${appUrl}/bills/${bill.id}` })}
            className="p-1 text-white/50"
            style={{ transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 160ms cubic-bezier(0.23,1,0.32,1)" }}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.88)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Share2 size={20} />
          </button>
        </div>

        {/* Hero body */}
        <div className="relative px-5 pt-5 pb-8">
          {/* Category + due date */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{bill.category.split(" ")[0]}</span>
              <span className="font-dm text-sm text-white/40">
                {bill.category.replace(/^\S+\s*/, "")}
              </span>
            </div>
            <span
              className="font-dm text-xs font-medium px-3 py-1 rounded-full"
              style={{
                background: isOverdue ? "rgba(165,45,37,0.2)" : "rgba(255,172,46,0.12)",
                color: isOverdue ? "rgb(220,90,80)" : "rgb(255,172,46)",
                border: `1px solid ${isOverdue ? "rgba(165,45,37,0.35)" : "rgba(255,172,46,0.25)"}`,
              }}
            >
              {formatDaysRemaining(bill.due_date)}
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: t.statCollected, value: formatRM(amountCollected), gradient: true },
              { label: t.statRemaining, value: formatRM(bill.total_amount - amountCollected), gradient: false },
            ].map(({ label, value, gradient }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22, delay: i * 0.05, ease: EASE_OUT }}
              >
                <NoiseBackground
                  gradientColors={
                    gradient
                      ? ["rgb(167,139,250)", "rgb(216,180,254)", "rgb(139,92,246)"]
                      : ["rgb(248,113,113)", "rgb(239,68,68)", "rgb(252,165,165)"]
                  }
                  className="p-4"
                >
                  <p className="font-dm text-xs text-white/35 mb-1">{label}</p>
                  {gradient ? (
                    <p
                      className="font-clash font-bold text-xl"
                      style={{
                        background: "linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {value}
                    </p>
                  ) : (
                    <p className="font-clash font-bold text-xl" style={{ color: "rgb(220,90,80)" }}>
                      {value}
                    </p>
                  )}
                </NoiseBackground>
              </motion.div>
            ))}
          </div>

          {/* Progress bar — only animate transform+opacity (GPU) */}
          <div
            className="w-full h-1.5 mb-2 overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress / 100 }}
              style={{
                background: "linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46))",
                transformOrigin: "left",
              }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            />
          </div>
          <p className="font-dm text-[11px] text-white/30 text-center">
            {t.paidProgress(paidCount, totalCount)}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pb-24 flex flex-col gap-3">

        {/* Pay code card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.08, ease: EASE_OUT }}
        >
          <NoiseBackground
            gradientColors={["rgb(96,165,250)", "rgb(147,197,253)", "rgb(59,130,246)"]}
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <div className="flex-1">
              <p className="font-dm text-[11px] text-white/30 mb-1">Pay Code</p>
              <p
                className="font-jetbrains font-medium text-lg tracking-[3px]"
                style={{
                  background: "linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 55%, rgb(220,90,80))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {bill.pay_code}
              </p>
            </div>
            <button
              onClick={copyPayCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-dm text-xs"
              style={{
                background: copied ? "rgba(160,224,171,0.1)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${copied ? "rgba(160,224,171,0.28)" : "rgba(255,255,255,0.12)"}`,
                color: copied ? "rgb(160,224,171)" : "rgba(255,255,255,0.45)",
                transition: "background 200ms cubic-bezier(0.23,1,0.32,1), border-color 200ms cubic-bezier(0.23,1,0.32,1), color 200ms cubic-bezier(0.23,1,0.32,1), transform 160ms cubic-bezier(0.23,1,0.32,1)",
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Copy size={12} />
              {copied ? t.copiedBtn : t.copyBtn}
            </button>
          </NoiseBackground>
        </motion.div>

        {/* Flag alert */}
        <AnimatePresence>
          {flags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <Link href={`/bills/${bill.id}/flags`}>
                <div
                  className="flex items-center gap-3 px-4 py-3.5 rounded-[10px]"
                  style={{
                    background: "rgba(255,172,46,0.05)",
                    border: "1px solid rgba(255,172,46,0.22)",
                    transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 160ms cubic-bezier(0.23,1,0.32,1)",
                  }}
                  onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                  onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <Flag size={17} style={{ color: "rgb(255,172,46)" }} className="shrink-0" />
                  </motion.div>
                  <div>
                    <p className="font-dm text-sm font-semibold" style={{ color: "rgb(255,172,46)" }}>
                      {t.flagAlert(flags.length)}
                    </p>
                    <p className="font-dm text-xs text-white/30">{t.flagSub}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blast reminder button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.12, ease: EASE_OUT }}
          onClick={() => members.filter((m) => !m.paid && m.phone).forEach(sendReminder)}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-dm text-sm text-white/50"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.09)",
            transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 160ms cubic-bezier(0.23,1,0.32,1)",
          }}
          onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Bell size={15} />
          {t.remindAll}
        </motion.button>

        {/* ── Unpaid members ── */}
        {unpaidMembers.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            <p className="font-dm text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25 px-0.5">
              {t.unpaidSection(unpaidMembers.length)}
            </p>
            {unpaidMembers.map((member, i) => (
              <motion.div
                key={member.id}
                layout
                /* Emil: stagger 40ms apart, scale(0.95)+opacity entry, ease-out */
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: marking === member.id ? 0.45 : 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.16 + i * 0.04, ease: EASE_OUT }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-[10px]"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-clash font-bold text-sm shrink-0 text-white/50"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  {getInitial(member.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-dm font-medium text-sm text-white truncate">{member.name}</p>
                  <p className="font-dm text-xs text-white/30">{member.phone ?? t.noPhone}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-clash font-semibold text-sm text-white">
                    {formatRM(member.amount_owed)}
                  </span>
                  <div className="flex gap-1.5">
                    {member.phone && (
                      <button
                        onClick={() => sendReminder(member)}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: "rgba(255,172,46,0.08)",
                          border: "1px solid rgba(255,172,46,0.18)",
                          transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
                        }}
                        onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.88)")}
                        onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <Bell size={13} style={{ color: "rgb(255,172,46)" }} />
                      </button>
                    )}
                    <button
                      onClick={() => togglePaid(member.id, false)}
                      disabled={marking === member.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(160,224,171,0.08)",
                        border: "1px solid rgba(160,224,171,0.18)",
                        transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
                      }}
                      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.88)")}
                      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <Check size={13} style={{ color: "rgb(160,224,171)" }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Paid members — horizontal scroll ── */}
        {paidMembers.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            <p className="font-dm text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25 px-0.5">
              {t.paidSection(paidMembers.length)}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {paidMembers.map((member, i) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: marking === member.id ? 0.45 : 1, scale: 1 }}
                  /* Emil: stagger 35ms */
                  transition={{ duration: 0.18, delay: i * 0.035, ease: EASE_OUT }}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-clash font-bold text-sm relative"
                    style={{
                      background: "rgba(160,224,171,0.07)",
                      border: "1px solid rgba(160,224,171,0.22)",
                      color: "rgb(160,224,171)",
                    }}
                  >
                    {getInitial(member.name)}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "rgb(160,224,171)" }}
                    >
                      <Check size={9} color="#000" strokeWidth={3} />
                    </span>
                  </div>
                  <p className="font-dm text-[10px] text-white/35 truncate w-full text-center">
                    {member.name.split(" ")[0]}
                  </p>
                  {member.paid_at && (
                    <p className="font-dm text-[9px] text-white/20 text-center leading-tight">
                      {formatTime(member.paid_at)}
                    </p>
                  )}
                  <button
                    onClick={() => togglePaid(member.id, true)}
                    disabled={marking === member.id}
                    className="font-dm text-[9px] text-white/20 mt-0.5"
                    style={{ transition: "opacity 150ms cubic-bezier(0.23,1,0.32,1)" }}
                    onPointerDown={(e) => (e.currentTarget.style.opacity = "0.5")}
                    onPointerUp={(e) => (e.currentTarget.style.opacity = "1")}
                    onPointerLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {t.cancelPaid}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
