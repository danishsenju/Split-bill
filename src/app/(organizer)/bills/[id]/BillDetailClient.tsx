"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Bell, Flag, Check } from "lucide-react";
import { Bill, Flag as FlagType } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, formatDaysRemaining, getDaysRemaining, getInitial, formatTime } from "@/lib/utils";
import { buildWAUrl, buildWAMessage } from "@/lib/whatsapp";
import ProgressBar from "@/components/ui/ProgressBar";
import Link from "next/link";

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
  const [bill, setBill] = useState(initialBill);
  const [marking, setMarking] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const members = bill.bill_members ?? [];
  const paidCount = members.filter((m) => m.paid).length;
  const totalCount = members.length;
  const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
  const amountCollected = members.filter((m) => m.paid).reduce((s, m) => s + m.amount_owed, 0);
  const daysLeft = getDaysRemaining(bill.due_date);
  const isOverdue = daysLeft < 0;

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

  return (
    <div className="min-h-dvh bg-bg-primary">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-bg-primary/90 backdrop-blur-md px-4 pt-4 pb-3 flex items-center gap-3 md:top-[60px]">
        <button
          onClick={() => router.back()}
          className="text-text-secondary active:scale-[0.90] p-1"
          style={{ transition: "transform 160ms var(--ease-out)" }}
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-clash font-bold text-text-primary flex-1 truncate">{bill.title}</h1>
        <button
          onClick={() => navigator.share?.({ url: `${appUrl}/bills/${bill.id}` })}
          className="text-text-secondary active:scale-[0.90] p-1"
          style={{ transition: "transform 160ms var(--ease-out)" }}
        >
          <Share2 size={20} />
        </button>
      </div>

      <div className="px-4 pb-8 flex flex-col gap-4">
        {/* Bill summary card */}
        <div className="bg-bg-card border border-[rgba(232,184,75,0.10)] rounded-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-9 h-9 rounded-full bg-bg-primary flex items-center justify-center text-lg shrink-0">
              {bill.category.split(" ")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-dm font-semibold text-sm truncate">{bill.title}</p>
              <p className="text-text-muted text-xs font-dm">{bill.category.replace(/^\S+\s*/, "")}</p>
            </div>
            <span
              className={`text-xs font-dm px-2.5 py-1 rounded-pill shrink-0 ${
                isOverdue ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"
              }`}
            >
              {formatDaysRemaining(bill.due_date)}
            </span>
          </div>

          {bill.description && (
            <p className="text-text-secondary text-sm font-dm">{bill.description}</p>
          )}

          {/* 2-col stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bg-primary/60 rounded-input px-3 py-3 flex flex-col gap-0.5 border border-[rgba(232,184,75,0.08)]">
              <p className="text-text-muted text-[10px] font-dm">Terkumpul</p>
              <p className="font-clash font-bold text-xl text-success">{formatRM(amountCollected)}</p>
            </div>
            <div className="bg-bg-primary/60 rounded-input px-3 py-3 flex flex-col gap-0.5 border border-[rgba(232,184,75,0.08)]">
              <p className="text-text-muted text-[10px] font-dm">Baki</p>
              <p className="font-clash font-bold text-xl text-danger">{formatRM(bill.total_amount - amountCollected)}</p>
            </div>
          </div>

          <ProgressBar value={progress} />
          <p className="text-text-muted text-xs font-dm text-center">{paidCount} / {totalCount} dah bayar</p>

          {/* Pay code row */}
          <div
            className="bg-bg-primary/60 rounded-input px-3 py-2 flex items-center gap-2 border border-accent/15"
            style={{ boxShadow: "0 0 12px rgba(232,184,75,0.06)" }}
          >
            <span className="text-text-muted text-xs font-dm">Pay Code</span>
            <span className="font-jetbrains text-accent text-sm tracking-widest ml-auto">{bill.pay_code}</span>
          </div>
        </div>

        {/* Flag alert */}
        {flags.length > 0 && (
          <Link href={`/bills/${bill.id}/flags`}>
            <div
              className="flex items-center gap-3 bg-warning/8 border border-warning/25 rounded-card px-4 py-3 active:scale-[0.98]"
              style={{ transition: "transform 160ms var(--ease-out)" }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Flag size={18} className="text-warning shrink-0" />
              </motion.div>
              <div>
                <p className="text-warning text-sm font-dm font-semibold">{flags.length} flag aktif</p>
                <p className="text-text-secondary text-xs font-dm">Tap untuk semak</p>
              </div>
            </div>
          </Link>
        )}

        {/* Blast reminder */}
        <button
          onClick={() => {
            const unpaid = members.filter((m) => !m.paid && m.phone);
            unpaid.forEach((m) => sendReminder(m));
          }}
          className="flex items-center justify-center gap-2 bg-bg-surface border border-[rgba(232,184,75,0.10)] rounded-btn py-3 text-text-secondary text-sm font-dm active:scale-[0.97]"
          style={{ transition: "transform 160ms var(--ease-out)" }}
        >
          <Bell size={16} />
          Hantar Peringatan Semua
        </button>

        {/* Unpaid members section */}
        {unpaidMembers.length > 0 && (
          <>
            <p className="text-text-muted text-[10px] font-dm font-semibold uppercase tracking-widest">
              Belum Bayar ({unpaidMembers.length})
            </p>
            <div className="flex flex-col gap-2">
              {unpaidMembers.map((member) => (
                <motion.div
                  key={member.id}
                  layout
                  animate={{ opacity: marking === member.id ? 0.6 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-bg-card border border-[rgba(232,184,75,0.10)] rounded-card p-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-bg-primary text-text-secondary flex items-center justify-center font-clash font-bold text-sm shrink-0">
                    {getInitial(member.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-dm font-medium text-sm truncate">{member.name}</p>
                    <p className="text-text-muted text-xs font-dm">
                      {member.phone ?? "Tiada nombor"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-text-primary font-dm font-semibold text-sm">{formatRM(member.amount_owed)}</span>
                    <div className="flex gap-1">
                      {member.phone && (
                        <button
                          onClick={() => sendReminder(member)}
                          className="w-8 h-8 rounded-full bg-warning/15 flex items-center justify-center active:scale-[0.88]"
                          style={{ transition: "transform 160ms var(--ease-out)" }}
                        >
                          <Bell size={14} className="text-warning" />
                        </button>
                      )}
                      <button
                        onClick={() => togglePaid(member.id, false)}
                        disabled={marking === member.id}
                        className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center active:scale-[0.88]"
                        style={{ transition: "transform 160ms var(--ease-out)" }}
                      >
                        <Check size={14} className="text-success" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Paid members section — horizontal scroll */}
        {paidMembers.length > 0 && (
          <>
            <p className="text-text-muted text-[10px] font-dm font-semibold uppercase tracking-widest">
              Dah Bayar ({paidMembers.length})
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {paidMembers.map((member) => (
                <motion.div
                  key={member.id}
                  layout
                  animate={{ opacity: marking === member.id ? 0.6 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 flex flex-col items-center gap-1 w-16"
                >
                  <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center font-clash font-bold text-sm relative">
                    {getInitial(member.name)}
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success flex items-center justify-center">
                      <Check size={9} className="text-bg-primary" strokeWidth={3} />
                    </span>
                  </div>
                  <p className="text-text-muted text-[10px] font-dm truncate w-full text-center">
                    {member.name.split(" ")[0]}
                  </p>
                  {member.paid_at && (
                    <p className="text-text-muted text-[9px] font-dm text-center leading-tight">
                      {formatTime(member.paid_at)}
                    </p>
                  )}
                  <button
                    onClick={() => togglePaid(member.id, true)}
                    disabled={marking === member.id}
                    className="text-text-muted text-[9px] font-dm mt-0.5 active:opacity-60"
                    style={{ transition: "opacity 150ms var(--ease-out)" }}
                  >
                    Batal
                  </button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
