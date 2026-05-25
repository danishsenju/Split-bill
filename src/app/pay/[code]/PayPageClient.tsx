"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Upload, X } from "lucide-react";
import { Bill, BillMember } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, formatDaysRemaining, getDaysRemaining, maskAccount } from "@/lib/utils";
import PayCodeDisplay from "@/components/ui/PayCodeDisplay";
import SwipeConfirm from "@/components/ui/SwipeConfirm";
import BottomSheet from "@/components/ui/BottomSheet";
import Confetti from "@/components/ui/Confetti";
import GuestNameInput from "@/components/member/GuestNameInput";

interface OrganizerProfile {
  name: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder_name?: string;
  qr_url?: string;
  payment_method: string;
}

interface Props {
  bill: Bill;
  member: BillMember | null;
  organizerProfile: OrganizerProfile | null;
  payCode: string;
  personalToken: string | null;
}

type EqualStep = "entry" | "payment" | "swipe" | "success";
type ScanStep = "tuntut" | "semak" | "bayar" | "success";
type PaymentTab = "bank" | "qr";

export default function PayPageClient({
  bill,
  member: initialMember,
  organizerProfile,
}: Props) {
  const [member] = useState<BillMember | null>(initialMember);
  const [guestName, setGuestName] = useState("");

  const [equalStep, setEqualStep] = useState<EqualStep>("entry");
  const [scanStep, setScanStep] = useState<ScanStep>("tuntut");

  const [paymentTab, setPaymentTab] = useState<PaymentTab>("bank");
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [dismissPromo, setDismissPromo] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const daysLeft = getDaysRemaining(bill.due_date);
  const isOverdue = daysLeft < 0;
  const categoryEmoji = bill.category?.split(" ")[0] ?? "🧾";
  const categoryName = bill.category?.replace(/^\S+\s*/, "") ?? "";

  const resolvedName = member?.name ?? guestName;
  const amountOwed = member?.amount_owed ?? 0;

  async function handleConfirm() {
    setConfirming(true);
    try {
      const supabase = createClient();

      let screenshotUrl: string | null = null;
      if (screenshot && member) {
        const ext = screenshot.name.split(".").pop() ?? "jpg";
        const path = `screenshots/${member.bill_id}/${member.id}.${ext}`;
        const { data: uploadData } = await supabase.storage
          .from("receipts")
          .upload(path, screenshot, { upsert: true });
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
          screenshotUrl = urlData.publicUrl;
        }
      }

      if (member) {
        await supabase
          .from("bill_members")
          .update({
            paid: true,
            paid_at: new Date().toISOString(),
            confirmed_by: "member",
            payment_screenshot_url: screenshotUrl,
          })
          .eq("id", member.id);
      }

      setConfetti(true);
      if (bill.split_mode === "equal") {
        setEqualStep("success");
      } else {
        setScanStep("success");
      }
    } finally {
      setConfirming(false);
    }
  }

  async function copyAccount() {
    if (organizerProfile?.bank_account) {
      await navigator.clipboard.writeText(organizerProfile.bank_account);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  }

  // Guest name entry
  if (!member && !guestName) {
    return (
      <div className="min-h-dvh bg-bg-primary flex flex-col max-w-sm mx-auto">
        <div className="px-4 pt-12 pb-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{categoryEmoji}</span>
            <span className="text-text-secondary text-xs font-dm">{categoryName}</span>
            <span className={`ml-auto text-xs font-dm px-2 py-1 rounded-pill ${isOverdue ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"}`}>
              {formatDaysRemaining(bill.due_date)}
            </span>
          </div>
          <h1 className="font-clash font-bold text-xl text-text-primary">{bill.title}</h1>
          {organizerProfile?.name && (
            <p className="text-text-muted text-sm font-dm">dari {organizerProfile.name}</p>
          )}
        </div>
        <div className="px-4 flex-1 flex flex-col justify-center">
          <GuestNameInput onComplete={(name) => setGuestName(name)} />
        </div>
      </div>
    );
  }

  // ── EQUAL FLOW ──
  if (bill.split_mode === "equal") {
    return (
      <div className="min-h-dvh bg-bg-primary max-w-sm mx-auto">
        <Confetti active={confetti} />

        <AnimatePresence mode="wait">
          {equalStep === "entry" && (
            <motion.div
              key="entry"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="px-4 pt-12 pb-8 flex flex-col gap-5"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl">{categoryEmoji}</span>
                <span className="text-text-secondary text-xs font-dm">{categoryName}</span>
                <span className={`ml-auto text-xs font-dm px-2 py-1 rounded-pill ${isOverdue ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"}`}>
                  {formatDaysRemaining(bill.due_date)}
                </span>
              </div>

              <div>
                <h1 className="font-clash font-bold text-2xl text-text-primary">{bill.title}</h1>
                {organizerProfile?.name && (
                  <p className="text-text-muted text-sm font-dm">dari {organizerProfile.name}</p>
                )}
                {bill.description && (
                  <p className="text-text-secondary text-sm font-dm mt-1">{bill.description}</p>
                )}
              </div>

              <div className="accent-border rounded-card p-5 flex flex-col items-center gap-2 text-center">
                <p className="font-dm text-text-secondary text-base">
                  Hai, <span className="text-text-primary font-semibold">{resolvedName}</span>! 👋
                </p>
                <p className="text-text-muted text-sm font-dm">Jumlah yang perlu dibayar</p>
                <p className="font-clash font-bold text-5xl text-accent mt-1">
                  {formatRM(amountOwed)}
                </p>
              </div>

              <div className="accent-border rounded-card p-4">
                <p className="text-text-muted text-xs font-dm mb-2">Pay Code</p>
                <PayCodeDisplay code={bill.pay_code} />
              </div>

              <button
                onClick={() => setShowPaymentSheet(true)}
                className="bg-accent text-bg-primary font-dm font-semibold py-4 rounded-btn text-base w-full active:scale-[0.97]"
                style={{ transition: "transform 160ms var(--ease-out)" }}
              >
                Buat Bayaran
              </button>

              <BottomSheet
                open={showPaymentSheet}
                onClose={() => setShowPaymentSheet(false)}
                title="Kaedah Bayaran"
              >
                <div className="flex gap-2 mb-4">
                  {(["bank", "qr"] as PaymentTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setPaymentTab(tab)}
                      className={`flex-1 py-2.5 rounded-btn text-sm font-dm font-medium active:scale-[0.97] ${
                        paymentTab === tab
                          ? "bg-accent text-bg-primary"
                          : "bg-bg-primary text-text-secondary border border-[rgba(232,184,75,0.12)]"
                      }`}
                      style={{ transition: "background 200ms var(--ease-out), color 200ms var(--ease-out), transform 160ms var(--ease-out)" }}
                    >
                      {tab === "bank" ? "Bank Transfer" : "DuitNow QR"}
                    </button>
                  ))}
                </div>

                {paymentTab === "bank" ? (
                  <div className="flex flex-col gap-3">
                    <div
                      className="bg-bg-primary rounded-input px-4 py-4 flex flex-col gap-1.5 border border-[rgba(232,184,75,0.10)]"
                      style={{ boxShadow: "0 0 12px rgba(232,184,75,0.04)" }}
                    >
                      <p className="text-text-muted text-xs font-dm">Bank</p>
                      <p className="text-text-primary font-dm font-semibold text-sm">
                        {organizerProfile?.bank_name ?? "—"}
                      </p>
                      <p className="text-text-muted text-xs font-dm mt-1">No. Akaun</p>
                      <p className="font-jetbrains text-accent text-lg tracking-widest">
                        {organizerProfile?.bank_account
                          ? maskAccount(organizerProfile.bank_account)
                          : "—"}
                      </p>
                      <p className="text-text-muted text-xs font-dm mt-1">Nama Pemegang</p>
                      <p className="text-text-primary font-dm text-sm">
                        {organizerProfile?.bank_holder_name ?? "—"}
                      </p>
                    </div>
                    <button
                      onClick={copyAccount}
                      className="flex items-center justify-center gap-2 bg-bg-surface border border-[rgba(232,184,75,0.12)] rounded-btn py-3 text-text-secondary text-sm font-dm active:scale-[0.97]"
                      style={{ transition: "transform 160ms var(--ease-out)" }}
                    >
                      {copiedAccount ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                      {copiedAccount ? "Disalin!" : "Salin No. Akaun"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    {organizerProfile?.qr_url ? (
                      <div className="bg-white rounded-card p-3 w-52 h-52 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={organizerProfile.qr_url} alt="DuitNow QR" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="bg-bg-primary rounded-card w-52 h-52 flex items-center justify-center">
                        <p className="text-text-muted text-sm font-dm text-center">QR tidak tersedia</p>
                      </div>
                    )}
                    <p className="text-text-muted text-xs font-dm text-center">Imbas dengan app bank anda</p>
                  </div>
                )}

                <button
                  onClick={() => { setShowPaymentSheet(false); setEqualStep("swipe"); }}
                  className="w-full mt-4 bg-accent text-bg-primary font-dm font-semibold py-4 rounded-btn text-sm active:scale-[0.97]"
                  style={{ transition: "transform 160ms var(--ease-out)" }}
                >
                  Dah Transfer? →
                </button>
              </BottomSheet>
            </motion.div>
          )}

          {equalStep === "swipe" && (
            <motion.div
              key="swipe"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="px-4 pt-12 pb-8 flex flex-col gap-5"
            >
              <button
                onClick={() => setEqualStep("entry")}
                className="flex items-center gap-2 text-text-secondary self-start active:opacity-70"
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-dm">Kembali</span>
              </button>

              <div className="accent-border rounded-card p-5 flex flex-col items-center gap-2 text-center">
                <span className="text-xs font-dm px-3 py-1 rounded-pill bg-warning/15 text-warning">
                  Menunggu pengesahan
                </span>
                <p className="font-clash font-bold text-5xl text-accent mt-2">
                  {formatRM(amountOwed)}
                </p>
                <p className="text-text-secondary font-dm text-sm">{bill.title}</p>
              </div>

              <div className="accent-border rounded-card p-4 flex flex-col gap-3">
                <p className="text-text-secondary text-sm font-dm">
                  Screenshot Resit Transfer <span className="text-text-muted">(pilihan)</span>
                </p>
                {screenshot ? (
                  <div className="flex items-center gap-3 bg-bg-primary rounded-input px-3 py-2 border border-[rgba(232,184,75,0.10)]">
                    <Check size={14} className="text-success" />
                    <span className="text-text-primary text-xs font-dm flex-1 truncate">{screenshot.name}</span>
                    <button onClick={() => setScreenshot(null)} className="text-danger"><X size={14} /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border border-dashed border-accent/20 rounded-input py-3 cursor-pointer text-text-secondary text-sm font-dm">
                    <Upload size={16} />
                    Lampirkan bukti bayaran
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setScreenshot(f); }}
                    />
                  </label>
                )}
              </div>

              <p className="text-text-muted text-xs font-dm text-center px-4">
                Pastikan dah transfer ke{" "}
                <span className="text-text-secondary">
                  {organizerProfile?.bank_holder_name ?? organizerProfile?.name ?? "penganjur"}
                </span>{" "}
                sebelum confirm
              </p>

              <SwipeConfirm onConfirm={handleConfirm} disabled={confirming} />

              <button
                onClick={() => setEqualStep("entry")}
                className="text-text-muted text-sm font-dm text-center"
              >
                ← Belum lagi
              </button>
            </motion.div>
          )}

          {equalStep === "success" && (
            <SuccessScreen
              name={resolvedName}
              billTitle={bill.title}
              amountOwed={amountOwed}
              dismissPromo={dismissPromo}
              onDismissPromo={() => setDismissPromo(true)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── SCAN FLOW ──
  return (
    <div className="min-h-dvh bg-bg-primary max-w-sm mx-auto">
      <Confetti active={confetti} />

      {scanStep !== "success" && (
        <div className="px-4 pt-12 pb-3">
          <div className="flex items-center justify-center gap-2 text-xs font-dm">
            {(["tuntut", "semak", "bayar"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <span className="text-text-muted">→</span>}
                <span className={`px-2 py-1 rounded-pill ${scanStep === s ? "bg-accent text-bg-primary font-semibold" : "text-text-muted"}`}>
                  {i + 1} {s === "tuntut" ? "Tuntut" : s === "semak" ? "Semak" : "Bayar"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {scanStep === "tuntut" && (
          <motion.div
            key="tuntut"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="px-4 pb-8 flex flex-col gap-4"
          >
            <h1 className="font-clash font-bold text-xl text-text-primary">Tuntut Item Anda</h1>
            <p className="text-text-secondary text-sm font-dm">Pilih item yang anda pesan daripada resit ini.</p>

            <div className="accent-border rounded-card p-4 flex flex-col gap-2">
              {(bill.bill_items ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-[rgba(232,184,75,0.08)] last:border-0">
                  <div className="flex-1">
                    <p className="text-text-primary font-dm text-sm">{item.name}</p>
                    <p className="text-text-muted text-xs font-dm">{item.qty}× {formatRM(item.edited_price)}</p>
                  </div>
                  <span className="text-accent font-dm text-sm font-semibold">{formatRM(item.edited_price * item.qty)}</span>
                </div>
              ))}
              {(bill.bill_items ?? []).length === 0 && (
                <p className="text-text-muted text-sm font-dm text-center py-4">Tiada item dalam resit</p>
              )}
            </div>

            <button
              onClick={() => setScanStep("semak")}
              className="bg-accent text-bg-primary font-dm font-semibold py-4 rounded-btn text-sm w-full active:scale-[0.97]"
              style={{ transition: "transform 160ms var(--ease-out)" }}
            >
              Seterusnya →
            </button>
          </motion.div>
        )}

        {scanStep === "semak" && (
          <motion.div
            key="semak"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="px-4 pb-8 flex flex-col gap-4"
          >
            <button onClick={() => setScanStep("tuntut")} className="flex items-center gap-2 text-text-secondary self-start">
              <ArrowLeft size={18} />
              <span className="text-sm font-dm">Kembali</span>
            </button>

            <h1 className="font-clash font-bold text-xl text-text-primary">Semak Resit</h1>
            <p className="text-text-secondary text-sm font-dm">Bandingkan caj dengan resit asal. Flag jika terdapat perbezaan.</p>

            <div className="accent-border rounded-card p-4">
              <div className="flex gap-2 mb-3">
                {["Ringkasan", "Resit Asal"].map((tab) => (
                  <button
                    key={tab}
                    className="px-3 py-1.5 rounded-pill text-xs font-dm bg-bg-surface text-text-secondary border border-[rgba(232,184,75,0.10)]"
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <p className="text-text-muted text-sm font-dm text-center py-4">Semua item sepadan ✓</p>
            </div>

            <button
              onClick={() => setScanStep("bayar")}
              className="bg-accent text-bg-primary font-dm font-semibold py-4 rounded-btn text-sm w-full active:scale-[0.97]"
              style={{ transition: "transform 160ms var(--ease-out)" }}
            >
              Teruskan ke Bayaran →
            </button>
          </motion.div>
        )}

        {scanStep === "bayar" && (
          <motion.div
            key="bayar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="px-4 pb-8 flex flex-col gap-5"
          >
            <button onClick={() => setScanStep("semak")} className="flex items-center gap-2 text-text-secondary self-start mt-4">
              <ArrowLeft size={18} />
              <span className="text-sm font-dm">Kembali</span>
            </button>

            <div className="accent-border rounded-card p-5 flex flex-col items-center gap-2 text-center">
              <span className="text-xs font-dm px-3 py-1 rounded-pill bg-warning/15 text-warning">Menunggu pengesahan</span>
              <p className="font-clash font-bold text-5xl text-accent mt-2">{formatRM(amountOwed)}</p>
              <p className="text-text-secondary font-dm text-sm">{bill.title}</p>
              <p className="text-text-muted text-xs font-dm">Berdasarkan item yang anda tuntut</p>
            </div>

            <div className="accent-border rounded-card p-4">
              <PayCodeDisplay code={bill.pay_code} />
            </div>

            <div className="accent-border rounded-card p-4 flex flex-col gap-3">
              <p className="text-text-secondary text-sm font-dm">
                Screenshot Resit Transfer <span className="text-text-muted">(pilihan)</span>
              </p>
              {screenshot ? (
                <div className="flex items-center gap-3 bg-bg-primary rounded-input px-3 py-2 border border-[rgba(232,184,75,0.10)]">
                  <Check size={14} className="text-success" />
                  <span className="text-text-primary text-xs font-dm flex-1 truncate">{screenshot.name}</span>
                  <button onClick={() => setScreenshot(null)} className="text-danger"><X size={14} /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border border-dashed border-accent/20 rounded-input py-3 cursor-pointer text-text-secondary text-sm font-dm">
                  <Upload size={16} />
                  Lampirkan bukti bayaran
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setScreenshot(f); }}
                  />
                </label>
              )}
            </div>

            <p className="text-text-muted text-xs font-dm text-center px-4">
              Pastikan dah transfer ke{" "}
              <span className="text-text-secondary">
                {organizerProfile?.bank_holder_name ?? organizerProfile?.name ?? "penganjur"}
              </span>{" "}
              sebelum confirm
            </p>

            <SwipeConfirm onConfirm={handleConfirm} disabled={confirming} />

            <button onClick={() => setScanStep("semak")} className="text-text-muted text-sm font-dm text-center">
              ← Belum lagi
            </button>
          </motion.div>
        )}

        {scanStep === "success" && (
          <SuccessScreen
            name={resolvedName}
            billTitle={bill.title}
            amountOwed={amountOwed}
            dismissPromo={dismissPromo}
            onDismissPromo={() => setDismissPromo(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessScreen({
  name,
  billTitle,
  amountOwed,
  dismissPromo,
  onDismissPromo,
}: {
  name: string;
  billTitle: string;
  amountOwed: number;
  dismissPromo: boolean;
  onDismissPromo: () => void;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="px-4 pt-12 pb-10 flex flex-col gap-5 items-center"
    >
      <div className="accent-border rounded-card p-6 w-full flex flex-col items-center gap-3 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 100%)" }}
        >
          <Check size={36} className="text-success" strokeWidth={2.5} />
        </div>
        <h2 className="font-clash font-bold text-2xl text-text-primary">Bayaran Disahkan!</h2>
        <p className="text-text-secondary font-dm text-sm">
          Terima kasih, <span className="text-text-primary font-semibold">{name}</span>!
        </p>

        <div className="w-full bg-bg-primary rounded-input px-4 py-3 flex flex-col gap-2 mt-2 border border-[rgba(232,184,75,0.10)]">
          <div className="flex justify-between">
            <span className="text-text-muted text-xs font-dm">Bil</span>
            <span className="text-text-primary text-xs font-dm font-medium truncate max-w-[60%] text-right">{billTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted text-xs font-dm">Jumlah</span>
            <span className="text-success font-dm font-bold text-sm">{formatRM(amountOwed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted text-xs font-dm">Tarikh</span>
            <span className="text-text-secondary text-xs font-dm">{dateStr} · {timeStr}</span>
          </div>
        </div>

        <p className="text-text-muted text-xs font-dm mt-1">Screenshot dan simpan sebagai bukti</p>
      </div>

      {!dismissPromo && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="accent-border rounded-card p-5 w-full flex flex-col gap-3 relative"
        >
          <button
            onClick={onDismissPromo}
            className="absolute top-3 right-3 text-text-muted active:scale-[0.88]"
            style={{ transition: "transform 160ms var(--ease-out)" }}
          >
            <X size={16} />
          </button>
          <h3 className="font-clash font-bold text-text-primary text-base pr-6">
            Nak jadi organizer? 🚀
          </h3>
          <p className="text-text-secondary font-dm text-sm">
            Buat bil sendiri, track siapa dah bayar, hantar reminder WhatsApp — semua dalam satu app.
          </p>
          <Link
            href="/auth/register"
            className="flex items-center justify-center bg-accent text-bg-primary font-dm font-semibold py-3 rounded-btn text-sm active:scale-[0.97]"
            style={{ transition: "transform 160ms var(--ease-out)" }}
          >
            Daftar Percuma →
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
