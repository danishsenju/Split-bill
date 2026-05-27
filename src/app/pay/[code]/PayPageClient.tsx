"use client";

import { useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Copy, Check, Upload, X, ArrowLeft, ChevronRight, Download } from "lucide-react";
import { Bill, BillMember } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, formatDaysRemaining, getDaysRemaining, maskAccount } from "@/lib/utils";
import PayCodeDisplay from "@/components/ui/PayCodeDisplay";
import SwipeConfirm from "@/components/ui/SwipeConfirm";
import BottomSheet from "@/components/ui/BottomSheet";
import Confetti from "@/components/ui/Confetti";
import Grainient from "@/components/ui/Grainient";

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

const GRADIENT = "linear-gradient(90deg, rgb(160, 224, 171), rgb(255, 172, 46) 50%, rgb(165, 45, 37))";
const PILL = "75.024px";

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "14px",
  backdropFilter: "blur(16px)",
};

const primaryBtn: CSSProperties = {
  borderRadius: PILL,
  background: GRADIENT,
  color: "#000",
  fontWeight: 600,
  fontSize: "15px",
  padding: "17px 28px",
  width: "100%",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  letterSpacing: "0.01em",
};

const ghostPill: CSSProperties = {
  borderRadius: PILL,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#fff",
  fontWeight: 400,
  fontSize: "13px",
  padding: "10px 20px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
};

// Atmospheric orbs — position: absolute so they sit inside the page container (not behind it)
function Orbs() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: "-10%", left: "-30%",
        width: "80%", height: "70%",
        background: "radial-gradient(circle, rgba(160,224,171,0.32) 0%, transparent 60%)",
        filter: "blur(70px)",
      }} />
      <div style={{
        position: "absolute", top: "25%", right: "-25%",
        width: "70%", height: "55%",
        background: "radial-gradient(circle, rgba(255,172,46,0.26) 0%, transparent 60%)",
        filter: "blur(80px)",
      }} />
      <div style={{
        position: "absolute", bottom: "-15%", left: "10%",
        width: "75%", height: "60%",
        background: "radial-gradient(circle, rgba(165,45,37,0.26) 0%, transparent 60%)",
        filter: "blur(70px)",
      }} />
    </div>
  );
}

export default function PayPageClient({
  bill,
  member: initialMember,
  organizerProfile,
}: Props) {
  const [member] = useState<BillMember | null>(initialMember);
  const [equalStep, setEqualStep] = useState<EqualStep>("entry");
  const [scanStep, setScanStep] = useState<ScanStep>("tuntut");
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("bank");
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [dismissPromo, setDismissPromo] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [saving, setSaving] = useState(false);

  const daysLeft = getDaysRemaining(bill.due_date);
  const isOverdue = daysLeft < 0;
  const categoryEmoji = bill.category?.split(" ")[0] ?? "🧾";
  const categoryName = bill.category?.replace(/^\S+\s*/, "") ?? "";
  const resolvedName = member?.name ?? "";
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
      if (bill.split_mode === "equal") setEqualStep("success");
      else setScanStep("success");
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

  async function shareBlob(blob: Blob, filename: string, title: string) {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function handleSaveQR() {
    if (!organizerProfile?.qr_url || saving) return;
    setSaving(true);
    try {
      const res = await fetch(organizerProfile.qr_url);
      const blob = await res.blob();
      await shareBlob(blob, "duitnow-qr.png", "DuitNow QR");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBankCard() {
    if (saving) return;
    setSaving(true);
    try {
      const W = 800, H = 440;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Background
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.roundRect(0, 0, W, H, 24);
      ctx.fill();

      // Deep Ocean gradient top bar
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "rgb(160,224,171)");
      grad.addColorStop(0.5, "rgb(255,172,46)");
      grad.addColorStop(1, "rgb(165,45,37)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 12);

      // Title
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillText("Maklumat Bayaran", 48, 76);

      // Branding (top right)
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "18px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("kolekduit", W - 48, 76);
      ctx.textAlign = "left";

      // Rows: Bank, Account, Holder
      const rows: Array<{ label: string; value: string; y: number; mono?: boolean; large?: boolean }> = [
        { label: "Bank", value: organizerProfile?.bank_name ?? "—", y: 140 },
        { label: "No. Akaun", value: organizerProfile?.bank_account ?? "—", y: 205, mono: true, large: true },
        { label: "Nama Pemegang", value: organizerProfile?.bank_holder_name ?? "—", y: 298 },
      ];
      rows.forEach(({ label, value, y, mono, large }) => {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "14px system-ui, sans-serif";
        ctx.fillText(label.toUpperCase(), 48, y);
        ctx.fillStyle = "#ffffff";
        ctx.font = `${large ? "bold" : "500"} ${large ? 36 : 22}px ${mono ? "monospace" : "system-ui, sans-serif"}`;
        ctx.fillText(value, 48, y + (large ? 46 : 30));
      });

      // Divider
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(48, 345); ctx.lineTo(W - 48, 345); ctx.stroke();

      // Jumlah (left) + Kod Rujukan (right)
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText("Jumlah", 48, 375);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px system-ui, sans-serif";
      ctx.fillText(formatRM(amountOwed), 48, 405);

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("Kod Rujukan", W - 48, 375);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px monospace";
      ctx.fillText(bill.pay_code, W - 48, 405);
      ctx.textAlign = "left";

      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
      await shareBlob(blob, "kolekduit-payment.png", "Maklumat Bayaran");
    } finally {
      setSaving(false);
    }
  }

  // ── NO TOKEN → invalid link error ──
  if (!member) {
    return (
      <div style={{ minHeight: "100dvh", background: "transparent", maxWidth: "480px", margin: "0 auto", position: "relative", overflow: "hidden" }}>
        <Orbs />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: "relative", zIndex: 1, padding: "56px 24px 40px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", textAlign: "center" }}
        >
          <div style={{ height: "3px", width: "100%", borderRadius: "2px", background: GRADIENT, boxShadow: "0 0 24px rgba(255,172,46,0.5)" }} />
          <span style={{ fontSize: "48px", marginTop: "24px" }}>🔗</span>
          <h1 style={{ fontFamily: "var(--font-plus-jakarta), system-ui", fontWeight: 800, fontSize: "24px", color: "#fff", lineHeight: 1.2 }}>
            Link Tidak Sah
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", lineHeight: 1.6 }}>
            Link ini bukan untuk anda atau telah tamat. Hubungi penganjur untuk link peribadi anda.
          </p>
          <Link href="/auth/login" style={{ ...primaryBtn, textDecoration: "none", marginTop: "8px" }}>
            Log Masuk
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── EQUAL FLOW ──
  if (bill.split_mode === "equal") {
    return (
      <div style={{ minHeight: "100dvh", background: "transparent", maxWidth: "480px", margin: "0 auto", position: "relative", overflow: "hidden" }}>
        <Orbs />
        <Confetti active={confetti} />

        <AnimatePresence mode="wait">
          {equalStep === "entry" && (
            <motion.div
              key="entry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
              style={{ position: "relative", zIndex: 1, padding: "56px 24px 48px", display: "flex", flexDirection: "column", gap: "0" }}
            >
              {/* Gradient strip top */}
              <div style={{ height: "3px", borderRadius: "2px", background: GRADIENT, marginBottom: "28px", boxShadow: "0 0 28px rgba(255,172,46,0.45)" }} />

              {/* Bill header */}
              <div style={{ marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "20px" }}>{categoryEmoji}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{categoryName}</span>
                  <span style={{
                    marginLeft: "auto",
                    fontSize: "11px",
                    padding: "5px 12px",
                    borderRadius: PILL,
                    border: `1px solid ${isOverdue ? "rgba(255,71,87,0.3)" : "rgba(255,211,42,0.3)"}`,
                    color: isOverdue ? "#ff6b6b" : "#ffd32a",
                    background: isOverdue ? "rgba(255,71,87,0.08)" : "rgba(255,211,42,0.08)",
                  }}>
                    {formatDaysRemaining(bill.due_date)}
                  </span>
                </div>
                <h1 style={{ fontFamily: "var(--font-syne), system-ui", fontWeight: 700, fontSize: "30px", color: "#fff", lineHeight: 1.1, marginBottom: "4px" }}>
                  {bill.title}
                </h1>
                {organizerProfile?.name && (
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>dari {organizerProfile.name}</p>
                )}
                {bill.description && (
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginTop: "6px", lineHeight: 1.5 }}>{bill.description}</p>
                )}
              </div>

              {/* Greeting + amount hero — Grainient member theme */}
              <div style={{ position: "relative", overflow: "hidden", borderRadius: "16px", marginBottom: "16px" }}>
                <div style={{ position: "absolute", inset: 0 }}>
                  <Grainient color1="#af3131" color2="#342475" color3="#a88825" timeSpeed={0.25} colorBalance={0} warpStrength={1} warpFrequency={5} warpSpeed={2} warpAmplitude={50} blendAngle={0} blendSoftness={0.05} rotationAmount={500} noiseScale={2} grainAmount={0.1} grainScale={2} grainAnimated={false} contrast={1.5} gamma={1} saturation={1} centerX={0} centerY={0} zoom={0.9} />
                </div>
                <div style={{ position: "relative", zIndex: 1, padding: "28px 24px", textAlign: "center" }}>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", marginBottom: "4px" }}>
                    Hai, <span style={{ color: "#ffffff", fontWeight: 700 }}>{resolvedName}</span> 👋
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "16px" }}>
                    Jumlah yang perlu dibayar
                  </p>
                  <span style={{
                    display: "block",
                    fontSize: "62px",
                    fontWeight: 800,
                    fontFamily: "var(--font-plus-jakarta), system-ui",
                    lineHeight: 1,
                    color: "#ffffff",
                    letterSpacing: "-0.02em",
                  }}>
                    {formatRM(amountOwed)}
                  </span>
                </div>
              </div>

              {/* Pay Code */}
              <div style={{ ...glass, padding: "20px 20px 16px", marginBottom: "24px" }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
                  Pay Code
                </p>
                <PayCodeDisplay code={bill.pay_code} />
              </div>

              {/* CTA */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowPaymentSheet(true)} style={primaryBtn}>
                Buat Bayaran
                <ChevronRight size={18} />
              </motion.button>

              {/* Payment bottom sheet */}
              <BottomSheet open={showPaymentSheet} onClose={() => setShowPaymentSheet(false)} title="Kaedah Bayaran">
                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  {(["bank", "qr"] as PaymentTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setPaymentTab(tab)}
                      style={{
                        flex: 1, padding: "11px", borderRadius: PILL,
                        fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 200ms ease",
                        ...(paymentTab === tab
                          ? { background: GRADIENT, color: "#000", border: "none" }
                          : { background: "transparent", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.14)" }
                        ),
                      }}
                    >
                      {tab === "bank" ? "Bank Transfer" : "DuitNow QR"}
                    </button>
                  ))}
                </div>

                {paymentTab === "bank" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ ...glass, padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Bank</p>
                        <p style={{ color: "#fff", fontWeight: 600, fontSize: "15px" }}>{organizerProfile?.bank_name ?? "—"}</p>
                      </div>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>No. Akaun</p>
                        <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "20px", letterSpacing: "0.1em", background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                          {organizerProfile?.bank_account ? maskAccount(organizerProfile.bank_account) : "—"}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Nama Pemegang</p>
                        <p style={{ color: "#fff", fontSize: "14px" }}>{organizerProfile?.bank_holder_name ?? "—"}</p>
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={copyAccount} style={{ ...ghostPill, padding: "14px 24px" }}>
                      {copiedAccount ? <Check size={15} style={{ color: "#a0e0ab" }} /> : <Copy size={15} />}
                      {copiedAccount ? "Disalin!" : "Salin No. Akaun"}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveBankCard} disabled={saving} style={{ ...ghostPill, padding: "14px 24px", opacity: saving ? 0.6 : 1 }}>
                      <Download size={15} />
                      {saving ? "Menyimpan..." : "Simpan Maklumat"}
                    </motion.button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                    {organizerProfile?.qr_url ? (
                      <div style={{ background: "#fff", borderRadius: "14px", padding: "12px", width: "196px", height: "196px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={organizerProfile.qr_url} alt="DuitNow QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>
                    ) : (
                      <div style={{ ...glass, width: "196px", height: "196px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center" }}>QR tidak tersedia</p>
                      </div>
                    )}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveQR} disabled={saving || !organizerProfile?.qr_url} style={{ ...ghostPill, padding: "14px 24px", opacity: saving || !organizerProfile?.qr_url ? 0.6 : 1 }}>
                      <Download size={15} />
                      {saving ? "Menyimpan..." : "Simpan QR"}
                    </motion.button>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>Imbas dengan app bank anda</p>
                  </div>
                )}

                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setShowPaymentSheet(false); setEqualStep("swipe"); }} style={{ ...primaryBtn, marginTop: "20px" }}>
                  Dah Transfer?
                  <ChevronRight size={16} />
                </motion.button>
              </BottomSheet>
            </motion.div>
          )}

          {equalStep === "swipe" && (
            <motion.div
              key="swipe"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
              style={{ position: "relative", zIndex: 1, padding: "48px 24px 48px", display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEqualStep("entry")} style={{ ...ghostPill, alignSelf: "flex-start" }}>
                <ArrowLeft size={14} />
                Kembali
              </motion.button>

              {/* Amount hero — Grainient member theme */}
              <div style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
                <div style={{ position: "absolute", inset: 0 }}>
                  <Grainient color1="#af3131" color2="#342475" color3="#a88825" timeSpeed={0.25} colorBalance={0} warpStrength={1} warpFrequency={5} warpSpeed={2} warpAmplitude={50} blendAngle={0} blendSoftness={0.05} rotationAmount={500} noiseScale={2} grainAmount={0.1} grainScale={2} grainAnimated={false} contrast={1.5} gamma={1} saturation={1} centerX={0} centerY={0} zoom={0.9} />
                </div>
                <div style={{ position: "relative", zIndex: 1, padding: "28px 24px", textAlign: "center" }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: "11px",
                    padding: "5px 14px",
                    borderRadius: PILL,
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "#fff",
                    background: "rgba(255,255,255,0.15)",
                    marginBottom: "16px",
                  }}>
                    Menunggu pengesahan
                  </span>
                  <span style={{
                    display: "block",
                    fontSize: "62px",
                    fontWeight: 800,
                    fontFamily: "var(--font-plus-jakarta), system-ui",
                    lineHeight: 1,
                    color: "#ffffff",
                    letterSpacing: "-0.02em",
                    marginBottom: "8px",
                  }}>
                    {formatRM(amountOwed)}
                  </span>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>{bill.title}</p>
                </div>
              </div>

              {/* Upload */}
              <div style={{ ...glass, padding: "20px" }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", marginBottom: "12px" }}>
                  Screenshot Resit Transfer <span style={{ color: "rgba(255,255,255,0.25)" }}>(pilihan)</span>
                </p>
                {screenshot ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Check size={14} style={{ color: "#a0e0ab", flexShrink: 0 }} />
                    <span style={{ color: "#fff", fontSize: "12px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{screenshot.name}</span>
                    <button onClick={() => setScreenshot(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ff6b6b", padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "10px", padding: "18px", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>
                    <Upload size={16} />
                    Lampirkan bukti bayaran
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setScreenshot(f); }} />
                  </label>
                )}
              </div>

              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", lineHeight: 1.6 }}>
                Pastikan dah transfer ke{" "}
                <span style={{ color: "rgba(255,255,255,0.6)" }}>
                  {organizerProfile?.bank_holder_name ?? organizerProfile?.name ?? "penganjur"}
                </span>{" "}
                sebelum confirm
              </p>

              <SwipeConfirm onConfirm={handleConfirm} disabled={confirming} />

              <button onClick={() => setEqualStep("entry")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center" }}>
                ← Belum lagi
              </button>
            </motion.div>
          )}

          {equalStep === "success" && (
            <SuccessScreen name={resolvedName} billTitle={bill.title} amountOwed={amountOwed} memberToken={initialMember?.personal_token ?? ""} dismissPromo={dismissPromo} onDismissPromo={() => setDismissPromo(true)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── SCAN FLOW ──
  return (
    <div style={{ minHeight: "100dvh", background: "transparent", maxWidth: "480px", margin: "0 auto", position: "relative", overflow: "hidden" }}>
      <Orbs />
      <Confetti active={confetti} />

      {scanStep !== "success" && (
        <div style={{ position: "relative", zIndex: 1, padding: "48px 24px 0" }}>
          {/* Gradient strip */}
          <div style={{ height: "3px", borderRadius: "2px", background: GRADIENT, marginBottom: "20px", boxShadow: "0 0 24px rgba(255,172,46,0.4)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {(["tuntut", "semak", "bayar"] as const).map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {i > 0 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>›</span>}
                <span style={{
                  fontSize: "12px", padding: "6px 16px", borderRadius: PILL,
                  ...(scanStep === s
                    ? { background: GRADIENT, color: "#000", fontWeight: 600 }
                    : { color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.1)" }
                  ),
                }}>
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
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            style={{ position: "relative", zIndex: 1, padding: "20px 24px 48px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <h1 style={{ fontFamily: "var(--font-syne), system-ui", fontWeight: 700, fontSize: "26px", color: "#fff" }}>
              Tuntut Item Anda
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: 1.5 }}>
              Pilih item yang anda pesan daripada resit ini.
            </p>
            <div style={{ ...glass, padding: "4px 0" }}>
              {(bill.bill_items ?? []).map((item, idx) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px",
                  borderBottom: idx < (bill.bill_items?.length ?? 0) - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#fff", fontSize: "14px", marginBottom: "2px" }}>{item.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>{item.qty}× {formatRM(item.edited_price)}</p>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 600, background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    {formatRM(item.edited_price * item.qty)}
                  </span>
                </div>
              ))}
              {(bill.bill_items ?? []).length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center", padding: "28px" }}>Tiada item dalam resit</p>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScanStep("semak")} style={primaryBtn}>
              Seterusnya <ChevronRight size={16} />
            </motion.button>
          </motion.div>
        )}

        {scanStep === "semak" && (
          <motion.div
            key="semak"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            style={{ position: "relative", zIndex: 1, padding: "20px 24px 48px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setScanStep("tuntut")} style={{ ...ghostPill, alignSelf: "flex-start" }}>
              <ArrowLeft size={14} /> Kembali
            </motion.button>
            <h1 style={{ fontFamily: "var(--font-syne), system-ui", fontWeight: 700, fontSize: "26px", color: "#fff" }}>Semak Resit</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: 1.5 }}>
              Bandingkan caj dengan resit asal. Flag jika terdapat perbezaan.
            </p>
            <div style={{ ...glass, padding: "20px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                {["Ringkasan", "Resit Asal"].map((tab) => (
                  <button key={tab} style={{ padding: "8px 18px", borderRadius: PILL, fontSize: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
                    {tab}
                  </button>
                ))}
              </div>
              <p style={{ color: "#a0e0ab", fontSize: "13px", textAlign: "center", padding: "12px 0" }}>✓ Semua item sepadan</p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setScanStep("bayar")} style={primaryBtn}>
              Teruskan ke Bayaran <ChevronRight size={16} />
            </motion.button>
          </motion.div>
        )}

        {scanStep === "bayar" && (
          <motion.div
            key="bayar"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            style={{ position: "relative", zIndex: 1, padding: "20px 24px 48px", display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setScanStep("semak")} style={{ ...ghostPill, alignSelf: "flex-start" }}>
              <ArrowLeft size={14} /> Kembali
            </motion.button>

            <div style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
              <div style={{ position: "absolute", inset: 0 }}>
                <Grainient color1="#af3131" color2="#342475" color3="#a88825" timeSpeed={0.25} colorBalance={0} warpStrength={1} warpFrequency={5} warpSpeed={2} warpAmplitude={50} blendAngle={0} blendSoftness={0.05} rotationAmount={500} noiseScale={2} grainAmount={0.1} grainScale={2} grainAnimated={false} contrast={1.5} gamma={1} saturation={1} centerX={0} centerY={0} zoom={0.9} />
              </div>
              <div style={{ position: "relative", zIndex: 1, padding: "28px 24px", textAlign: "center" }}>
                <span style={{ display: "inline-block", fontSize: "11px", padding: "5px 14px", borderRadius: PILL, border: "1px solid rgba(255,255,255,0.25)", color: "#fff", background: "rgba(255,255,255,0.15)", marginBottom: "16px" }}>
                  Menunggu pengesahan
                </span>
                <span style={{ display: "block", fontSize: "62px", fontWeight: 800, fontFamily: "var(--font-plus-jakarta), system-ui", lineHeight: 1, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                  {formatRM(amountOwed)}
                </span>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", marginBottom: "2px" }}>{bill.title}</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>Berdasarkan item yang anda tuntut</p>
              </div>
            </div>

            <div style={{ ...glass, padding: "20px 20px 16px" }}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Pay Code</p>
              <PayCodeDisplay code={bill.pay_code} />
            </div>

            <div style={{ ...glass, padding: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", marginBottom: "12px" }}>
                Screenshot Resit Transfer <span style={{ color: "rgba(255,255,255,0.25)" }}>(pilihan)</span>
              </p>
              {screenshot ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Check size={14} style={{ color: "#a0e0ab", flexShrink: 0 }} />
                  <span style={{ color: "#fff", fontSize: "12px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{screenshot.name}</span>
                  <button onClick={() => setScreenshot(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ff6b6b", padding: 0 }}><X size={14} /></button>
                </div>
              ) : (
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "10px", padding: "18px", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>
                  <Upload size={16} />
                  Lampirkan bukti bayaran
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setScreenshot(f); }} />
                </label>
              )}
            </div>

            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", lineHeight: 1.6 }}>
              Pastikan dah transfer ke{" "}
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{organizerProfile?.bank_holder_name ?? organizerProfile?.name ?? "penganjur"}</span>{" "}
              sebelum confirm
            </p>

            <SwipeConfirm onConfirm={handleConfirm} disabled={confirming} />

            <button onClick={() => setScanStep("semak")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center" }}>
              ← Belum lagi
            </button>
          </motion.div>
        )}

        {scanStep === "success" && (
          <SuccessScreen name={resolvedName} billTitle={bill.title} amountOwed={amountOwed} memberToken={initialMember?.personal_token ?? ""} dismissPromo={dismissPromo} onDismissPromo={() => setDismissPromo(true)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessScreen({ name, billTitle, amountOwed, memberToken, dismissPromo, onDismissPromo }: {
  name: string; billTitle: string; amountOwed: number; memberToken: string; dismissPromo: boolean; onDismissPromo: () => void;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      style={{ position: "relative", zIndex: 1, padding: "56px 24px 48px", display: "flex", flexDirection: "column", gap: "16px" }}
    >
      {/* Gradient strip */}
      <div style={{ height: "3px", borderRadius: "2px", background: "linear-gradient(90deg, rgb(160,224,171), rgb(100,200,120))", marginBottom: "20px", boxShadow: "0 0 28px rgba(160,224,171,0.5)" }} />

      <div style={{ ...glass, padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center" }}>
        {/* Check ring with gradient border */}
        <div style={{
          width: "84px", height: "84px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(160,224,171,0.15) 0%, transparent 70%)",
          border: "1px solid rgba(160,224,171,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 32px rgba(160,224,171,0.2)",
        }}>
          <Check size={38} style={{ color: "#a0e0ab" }} strokeWidth={2.5} />
        </div>

        <div>
          <h2 style={{ fontFamily: "var(--font-syne), system-ui", fontWeight: 700, fontSize: "28px", color: "#fff", marginBottom: "6px" }}>
            Bayaran Disahkan!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
            Terima kasih, <span style={{ color: "#fff", fontWeight: 600 }}>{name}</span>!
          </p>
        </div>

        {/* Receipt summary */}
        <div style={{ width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>Bil</span>
            <span style={{ color: "#fff", fontSize: "12px", fontWeight: 500, maxWidth: "60%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{billTitle}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>Jumlah</span>
            <span style={{ fontSize: "15px", fontWeight: 700, background: "linear-gradient(90deg, rgb(160,224,171), rgb(100,200,120))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {formatRM(amountOwed)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>Tarikh</span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>{dateStr} · {timeStr}</span>
          </div>
        </div>

        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px" }}>Screenshot dan simpan sebagai bukti</p>
      </div>

      {!dismissPromo && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ ...glass, padding: "24px", position: "relative" }}
        >
          <button onClick={onDismissPromo} style={{ position: "absolute", top: "14px", right: "14px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
            <X size={16} />
          </button>
          <h3 style={{ fontFamily: "var(--font-syne), system-ui", fontWeight: 700, fontSize: "18px", color: "#fff", marginBottom: "8px", paddingRight: "24px" }}>
            Nak jadi organizer? 🚀
          </h3>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: 1.6, marginBottom: "18px" }}>
            Buat bil sendiri, track siapa dah bayar, hantar reminder WhatsApp — semua dalam satu app.
          </p>
          <Link
            href={`/auth/register?name=${encodeURIComponent(name)}&token=${encodeURIComponent(memberToken)}`}
            style={{ ...primaryBtn, textDecoration: "none" }}
          >
            Daftar Percuma →
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
