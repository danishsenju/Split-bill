"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Flag, Check, X, MessageSquare } from "lucide-react";
import { Flag as FlagType } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, getInitial, formatTime } from "@/lib/utils";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface BillSummary {
  id: string;
  title: string;
  pay_code: string;
}

export default function FlagsClient({
  bill,
  flags: initialFlags,
}: {
  bill: BillSummary;
  flags: FlagType[];
}) {
  const router = useRouter();
  const [flags, setFlags] = useState<FlagType[]>(initialFlags);
  const [resolvingFlag, setResolvingFlag] = useState<FlagType | null>(null);
  const [resolvedPrice, setResolvedPrice] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const pending = flags.filter((f) => f.status === "pending");
  const resolved = flags.filter((f) => f.status !== "pending");

  function openResolveSheet(flag: FlagType) {
    setResolvingFlag(flag);
    setResolvedPrice(
      flag.charged_price?.toFixed(2) ?? flag.original_price?.toFixed(2) ?? ""
    );
    setExplanation("");
  }

  function closeSheet() {
    setResolvingFlag(null);
    setResolvedPrice("");
    setExplanation("");
  }

  async function handleResolve() {
    if (!resolvingFlag || submitting) return;
    setSubmitting(true);
    const supabase = createClient();
    const price = Number(resolvedPrice);
    const { error } = await supabase
      .from("flags")
      .update({
        status: "resolved",
        resolved_price: isNaN(price) ? null : price,
        organizer_explanation: explanation.trim() || null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", resolvingFlag.id);
    if (!error) {
      setFlags((prev) =>
        prev.map((f) =>
          f.id === resolvingFlag.id
            ? {
                ...f,
                status: "resolved",
                resolved_price: isNaN(price) ? undefined : price,
                organizer_explanation: explanation.trim() || undefined,
                resolved_at: new Date().toISOString(),
              }
            : f
        )
      );
      closeSheet();
    }
    setSubmitting(false);
  }

  async function handleDismiss(flagId: string) {
    setDismissingId(flagId);
    const supabase = createClient();
    const { error } = await supabase
      .from("flags")
      .update({ status: "dismissed", resolved_at: new Date().toISOString() })
      .eq("id", flagId);
    if (!error) {
      setFlags((prev) =>
        prev.map((f) =>
          f.id === flagId
            ? { ...f, status: "dismissed", resolved_at: new Date().toISOString() }
            : f
        )
      );
    }
    setDismissingId(null);
  }

  return (
    <div className="min-h-dvh" style={{ background: "#000000", paddingBottom: "112px" }}>
      {/* Sticky header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 md:top-[60px]"
        style={{
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="active:scale-[0.88] shrink-0"
          style={{
            color: "#6d6d6d",
            transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-clash font-bold text-frost leading-none" style={{ fontSize: "18px" }}>
            Flag Ahli
          </h1>
          <p className="font-dm text-whisper mt-0.5 truncate" style={{ fontSize: "11px" }}>
            {bill.title}
          </p>
        </div>
        {pending.length > 0 && (
          <span
            className="font-dm shrink-0"
            style={{
              fontSize: "11px",
              padding: "4px 10px",
              borderRadius: "99px",
              background: "rgba(255,172,46,0.10)",
              border: "1px solid rgba(255,172,46,0.25)",
              color: "rgb(255,172,46)",
            }}
          >
            {pending.length} pending
          </span>
        )}
      </header>

      <div className="px-5 pt-6 flex flex-col gap-6">
        {/* Empty state */}
        {flags.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="flex flex-col items-center text-center gap-4 py-16 px-6"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.20)",
              }}
            >
              <Check size={24} style={{ color: "#22c55e" }} />
            </div>
            <div>
              <h3 className="font-clash font-bold text-frost mb-1" style={{ fontSize: "18px" }}>
                Tiada flag
              </h3>
              <p className="font-dm text-whisper text-sm">
                Ahli kamu jujur 🎉
              </p>
            </div>
          </motion.div>
        )}

        {/* Pending flags */}
        {pending.length > 0 && (
          <section>
            <p
              className="font-dm uppercase mb-3"
              style={{ fontSize: "10px", letterSpacing: "0.10em", color: "#6d6d6d" }}
            >
              Perlu Perhatian
            </p>
            <div className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {pending.map((flag, i) => (
                  <FlagCard
                    key={flag.id}
                    flag={flag}
                    delay={i * 0.05}
                    onResolve={() => openResolveSheet(flag)}
                    onDismiss={() => handleDismiss(flag.id)}
                    dismissing={dismissingId === flag.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Resolved / dismissed */}
        {resolved.length > 0 && (
          <section>
            <p
              className="font-dm uppercase mb-3"
              style={{ fontSize: "10px", letterSpacing: "0.10em", color: "#6d6d6d" }}
            >
              Selesai
            </p>
            <div className="flex flex-col gap-2">
              {resolved.map((flag, i) => (
                <motion.div
                  key={flag.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  transition={{ delay: i * 0.03, ease: EASE_OUT }}
                  className="flex items-center gap-3 px-4 py-3 rounded-[10px]"
                  style={{
                    background: "#0e0e0e",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background:
                        flag.status === "resolved"
                          ? "rgba(34,197,94,0.10)"
                          : "rgba(255,255,255,0.05)",
                      border:
                        flag.status === "resolved"
                          ? "1px solid rgba(34,197,94,0.25)"
                          : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {flag.status === "resolved" ? (
                      <Check size={13} style={{ color: "#22c55e" }} />
                    ) : (
                      <X size={13} style={{ color: "#6d6d6d" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dm text-sm text-frost truncate">
                      {flag.bill_items?.name ?? "Item"}
                    </p>
                    <p className="font-dm text-whisper truncate" style={{ fontSize: "11px" }}>
                      {flag.bill_members?.name ?? "Ahli"} ·{" "}
                      {flag.status === "resolved" ? "Selesai" : "Diabaikan"}
                    </p>
                  </div>
                  {flag.resolved_at && (
                    <span className="font-dm text-whisper shrink-0" style={{ fontSize: "10px" }}>
                      {formatTime(flag.resolved_at)}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Resolve bottom sheet */}
      <AnimatePresence>
        {resolvingFlag && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSheet}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                zIndex: 50,
              }}
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 51,
                background: "#111111",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "24px 24px 0 0",
                padding: "24px 20px calc(env(safe-area-inset-bottom) + 24px)",
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <p className="font-clash font-bold text-frost" style={{ fontSize: "16px" }}>
                  Selesaikan Flag
                </p>
                <button
                  onClick={closeSheet}
                  className="active:scale-[0.88]"
                  style={{
                    color: "#6d6d6d",
                    transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Item summary */}
                <div
                  className="px-4 py-3 rounded-[10px]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p className="font-dm font-medium text-frost text-sm">
                    {resolvingFlag.bill_items?.name ?? "Item"}
                  </p>
                  <div className="flex items-baseline gap-3 mt-1">
                    {resolvingFlag.original_price != null && (
                      <span className="font-dm text-whisper" style={{ fontSize: "11px" }}>
                        Asal {formatRM(resolvingFlag.original_price)}
                      </span>
                    )}
                    {resolvingFlag.charged_price != null && (
                      <span className="font-dm" style={{ fontSize: "11px", color: "rgb(255,172,46)" }}>
                        Dicaj {formatRM(resolvingFlag.charged_price)}
                      </span>
                    )}
                  </div>
                  {resolvingFlag.member_note && (
                    <p className="font-dm text-whisper mt-2" style={{ fontSize: "12px", lineHeight: 1.4 }}>
                      &ldquo;{resolvingFlag.member_note}&rdquo;
                    </p>
                  )}
                </div>

                {/* Resolved price */}
                <div>
                  <p className="font-dm mb-2" style={{ fontSize: "12px", color: "#6d6d6d" }}>
                    Harga betul (RM)
                  </p>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={resolvedPrice}
                    onChange={(e) => setResolvedPrice(e.target.value)}
                    placeholder="0.00"
                    className="font-dm w-full"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 150ms cubic-bezier(0.23,1,0.32,1)",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
                  />
                </div>

                {/* Explanation */}
                <div>
                  <p className="font-dm mb-2" style={{ fontSize: "12px", color: "#6d6d6d" }}>
                    Penjelasan untuk ahli <span style={{ color: "#3a3a3a" }}>(pilihan)</span>
                  </p>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="cth: Salah taip dalam resit, harga sebenar RM 12.00"
                    rows={3}
                    className="font-dm w-full resize-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      lineHeight: 1.5,
                      transition: "border-color 150ms cubic-bezier(0.23,1,0.32,1)",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
                  />
                </div>

                <PrimaryButton
                  onClick={handleResolve}
                  disabled={submitting || !resolvedPrice.trim()}
                >
                  <Check size={16} />
                  {submitting ? "Menyimpan..." : "Selesaikan"}
                </PrimaryButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Single pending flag card ─────────────────────────────────────────────
function FlagCard({
  flag,
  delay,
  onResolve,
  onDismiss,
  dismissing,
}: {
  flag: FlagType;
  delay: number;
  onResolve: () => void;
  onDismiss: () => void;
  dismissing: boolean;
}) {
  const memberName = flag.bill_members?.name ?? "Ahli";
  const itemName = flag.bill_items?.name ?? "Item";
  const original = flag.original_price;
  const charged = flag.charged_price;
  const diff = original != null && charged != null ? charged - original : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay, duration: 0.3, ease: EASE_OUT }}
      className="relative overflow-hidden p-4 rounded-[10px] flex flex-col gap-3"
      style={{
        background: "#111111",
        border: "1px solid rgba(255,172,46,0.20)",
      }}
    >
      {/* Subtle orange glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,172,46,0.10) 0%, transparent 70%)",
          filter: "blur(20px)",
          transform: "translate(20%, -20%)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-3">
        {/* Header: member + item */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-clash font-bold shrink-0"
            style={{
              background: "rgba(255,172,46,0.08)",
              border: "1px solid rgba(255,172,46,0.20)",
              color: "rgb(255,172,46)",
              fontSize: "13px",
            }}
          >
            {getInitial(memberName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-dm font-medium text-frost text-sm truncate">{memberName}</p>
            <p className="font-dm text-whisper truncate" style={{ fontSize: "11px" }}>
              flag {itemName}
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            className="shrink-0"
          >
            <Flag size={15} style={{ color: "rgb(255,172,46)" }} />
          </motion.div>
        </div>

        {/* Price comparison */}
        {original != null && charged != null && (
          <div
            className="grid grid-cols-3 gap-px overflow-hidden rounded-[10px]"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex flex-col items-center py-2.5 px-2" style={{ background: "#111111" }}>
              <p className="font-dm text-whisper" style={{ fontSize: "10px" }}>Asal</p>
              <p className="font-clash font-bold text-frost mt-0.5" style={{ fontSize: "13px" }}>
                {formatRM(original)}
              </p>
            </div>
            <div className="flex flex-col items-center py-2.5 px-2" style={{ background: "#111111" }}>
              <p className="font-dm text-whisper" style={{ fontSize: "10px" }}>Dicaj</p>
              <p
                className="font-clash font-bold mt-0.5"
                style={{ fontSize: "13px", color: "rgb(255,172,46)" }}
              >
                {formatRM(charged)}
              </p>
            </div>
            <div className="flex flex-col items-center py-2.5 px-2" style={{ background: "#111111" }}>
              <p className="font-dm text-whisper" style={{ fontSize: "10px" }}>Beza</p>
              <p
                className="font-clash font-bold mt-0.5"
                style={{
                  fontSize: "13px",
                  color: diff != null && diff > 0 ? "#ef4444" : "#22c55e",
                }}
              >
                {diff != null ? `${diff > 0 ? "+" : ""}${formatRM(diff)}` : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Member note */}
        {flag.member_note && (
          <div className="flex items-start gap-2">
            <MessageSquare size={12} style={{ color: "#6d6d6d", marginTop: "3px" }} className="shrink-0" />
            <p
              className="font-dm text-whisper italic flex-1"
              style={{ fontSize: "12px", lineHeight: 1.5 }}
            >
              &ldquo;{flag.member_note}&rdquo;
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={onDismiss}
            disabled={dismissing}
            className="flex-1 font-dm font-medium text-sm active:scale-[0.97] disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "75.024px",
              padding: "10px 0",
              color: "rgba(255,255,255,0.7)",
              transition:
                "transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 200ms",
            }}
          >
            {dismissing ? "..." : "Abaikan"}
          </button>
          <div className="flex-1">
            <PrimaryButton onClick={onResolve} innerClassName="py-2.5 px-3 text-sm">
              <Check size={14} />
              Selesaikan
            </PrimaryButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
