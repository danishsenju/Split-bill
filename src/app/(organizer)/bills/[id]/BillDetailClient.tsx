"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Bell, Flag, Check, X, RotateCcw } from "lucide-react";
import { Bill, Flag as FlagType } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, formatDaysRemaining, getDaysRemaining, getInitial, formatTime, maskAccount } from "@/lib/utils";
import { buildWAUrl, buildWAMessage } from "@/lib/whatsapp";
import ProgressBar from "@/components/ui/ProgressBar";

type MemberFilter = "all" | "unpaid" | "paid";

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
  profile,
}: {
  bill: Bill;
  flags: FlagType[];
  profile: Profile | null;
}) {
  const router = useRouter();
  const [bill, setBill] = useState(initialBill);
  const [memberFilter, setMemberFilter] = useState<MemberFilter>("all");
  const [marking, setMarking] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const members = bill.bill_members ?? [];
  const paidCount = members.filter((m) => m.paid).length;
  const totalCount = members.length;
  const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
  const amountCollected = members.filter((m) => m.paid).reduce((s, m) => s + m.amount_owed, 0);
  const daysLeft = getDaysRemaining(bill.due_date);
  const isOverdue = daysLeft < 0;

  // Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bill-${bill.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bill_members", filter: `bill_id=eq.${bill.id}` }, async () => {
        const { data } = await supabase.from("bills").select("*, bill_members(*), bill_items(*)").eq("id", bill.id).single();
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

  const filteredMembers = members.filter((m) => {
    if (memberFilter === "paid") return m.paid;
    if (memberFilter === "unpaid") return !m.paid;
    return true;
  });

  return (
    <div className="min-h-dvh bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/90 backdrop-blur-md px-4 pt-12 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-syne font-bold text-text-primary flex-1 truncate">{bill.title}</h1>
        <button onClick={() => navigator.share?.({ url: `${appUrl}/bills/${bill.id}` })} className="text-text-secondary">
          <Share2 size={20} />
        </button>
      </div>

      <div className="px-4 pb-8 flex flex-col gap-4">
        {/* Bill info */}
        <div className="surface-card rounded-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">{bill.category.split(" ")[0]}</span>
            <span className="text-text-secondary text-xs font-dm">{bill.category.replace(/^\S+\s*/, "")}</span>
            <span
              className={`ml-auto text-xs font-dm px-2 py-1 rounded-pill ${
                isOverdue ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"
              }`}
            >
              {formatDaysRemaining(bill.due_date)}
            </span>
          </div>

          {bill.description && (
            <p className="text-text-secondary text-sm font-dm">{bill.description}</p>
          )}

          <div className="bg-bg-primary/50 rounded-input px-3 py-2 flex items-center gap-2">
            <span className="text-text-muted text-xs font-dm">Pay Code</span>
            <span className="font-jetbrains text-accent text-sm tracking-widest ml-auto">{bill.pay_code}</span>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-text-muted text-xs font-dm">Terkumpul</p>
              <p className="font-syne font-bold text-xl text-success">{formatRM(amountCollected)}</p>
            </div>
            <div className="text-right">
              <p className="text-text-muted text-xs font-dm">Baki</p>
              <p className="font-syne font-bold text-xl text-danger">{formatRM(bill.total_amount - amountCollected)}</p>
            </div>
          </div>

          <ProgressBar value={progress} />
          <p className="text-text-muted text-xs font-dm text-center">{paidCount} / {totalCount} dah bayar</p>
        </div>

        {/* Flag alert */}
        {flags.length > 0 && (
          <Link href={`/bills/${bill.id}/flags`}>
            <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 rounded-card px-4 py-3">
              <Flag size={18} className="text-danger shrink-0" />
              <div>
                <p className="text-danger text-sm font-dm font-semibold">{flags.length} flag aktif</p>
                <p className="text-text-secondary text-xs font-dm">Tap untuk semak</p>
              </div>
            </div>
          </Link>
        )}

        {/* Send blast reminder */}
        <button
          onClick={() => {
            const unpaid = members.filter((m) => !m.paid && m.phone);
            unpaid.forEach((m) => sendReminder(m));
          }}
          className="flex items-center justify-center gap-2 bg-bg-surface border border-white/10 rounded-btn py-3 text-text-secondary text-sm font-dm"
        >
          <Bell size={16} />
          Hantar Peringatan Semua
        </button>

        {/* Member filter */}
        <div className="flex gap-2">
          {(["all", "unpaid", "paid"] as MemberFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setMemberFilter(f)}
              className={`px-4 py-1.5 rounded-pill text-xs font-dm font-medium transition-colors ${
                memberFilter === f ? "bg-accent text-bg-primary" : "bg-bg-surface text-text-secondary border border-white/10"
              }`}
            >
              {f === "all" ? "Semua" : f === "unpaid" ? "Belum Bayar" : "Dah Bayar"}
            </button>
          ))}
        </div>

        {/* Member rows */}
        <div className="flex flex-col gap-2">
          {filteredMembers.map((member) => (
            <motion.div
              key={member.id}
              layout
              className="surface-card rounded-card p-3 flex items-center gap-3"
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-syne font-bold text-sm shrink-0 ${
                  member.paid ? "bg-success/20 text-success" : "bg-bg-primary text-text-secondary"
                }`}
              >
                {getInitial(member.name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-text-primary font-dm font-medium text-sm truncate">{member.name}</p>
                  {member.paid && (
                    <span className="bg-success/20 text-success text-[10px] font-dm px-1.5 py-0.5 rounded-pill shrink-0">
                      Bayar
                    </span>
                  )}
                </div>
                <p className="text-text-muted text-xs font-dm">
                  {member.paid && member.paid_at
                    ? `Bayar pada ${formatTime(member.paid_at)}`
                    : member.phone ?? "Tiada nombor"}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-text-primary font-dm font-semibold text-sm">{formatRM(member.amount_owed)}</span>
                {!member.paid ? (
                  <div className="flex gap-1">
                    {member.phone && (
                      <button
                        onClick={() => sendReminder(member)}
                        className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center"
                      >
                        <Bell size={14} className="text-warning" />
                      </button>
                    )}
                    <button
                      onClick={() => togglePaid(member.id, false)}
                      disabled={marking === member.id}
                      className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center"
                    >
                      <Check size={14} className="text-success" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => togglePaid(member.id, true)}
                    disabled={marking === member.id}
                    className="w-8 h-8 rounded-full bg-bg-surface flex items-center justify-center border border-white/10"
                  >
                    <RotateCcw size={14} className="text-text-muted" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
