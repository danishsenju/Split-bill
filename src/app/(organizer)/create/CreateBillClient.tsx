"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ScanResult } from "@/types";
import { generatePayCode } from "@/lib/paycode";
import { formatRM } from "@/lib/utils";
import PayCodeDisplay from "@/components/ui/PayCodeDisplay";
import ReceiptScanner from "@/components/receipt/ReceiptScanner";
import WAToneSelector from "@/components/organizer/WAToneSelector";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { NoiseBackground } from "@/components/ui/NoiseBackground";
import Link from "next/link";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs, { Dayjs } from "dayjs";

const CATEGORIES = [
  "🍽️ Makan",
  "🎉 Hiburan",
  "✈️ Trip",
  "🏠 Rumah",
  "🏥 Kesihatan",
  "📚 Belajar",
  "🛒 Beli-belah",
  "💡 Lain-lain",
];

interface Member {
  name: string;
  phone: string;
}

// Shared base style for all text inputs / textareas
const fieldBase: React.CSSProperties = {
  background: "#111111",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "12px 16px",
  color: "#ffffff",
  width: "100%",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 150ms cubic-bezier(0.23,1,0.32,1)",
};

const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)");
const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)");

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p className="font-dm mb-2" style={{ fontSize: "12px", color: "#6d6d6d", letterSpacing: "0.04em" }}>
      {children}
      {optional && <span style={{ color: "#3a3a3a" }}> (pilihan)</span>}
    </p>
  );
}

function ErrorBox({ errors }: { errors: string[] }) {
  return (
    <div
      className="flex flex-col gap-1 px-4 py-3"
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: "10px",
      }}
    >
      {errors.map((e, i) => (
        <p key={i} className="font-dm text-xs" style={{ color: "#ef4444" }}>
          • {e}
        </p>
      ))}
    </div>
  );
}

export default function CreateBillClient() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [splitMode, setSplitMode] = useState<"equal" | "scan">("equal");
  const [totalAmount, setTotalAmount] = useState("");
  const [tax, setTax] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Step 2
  const [members, setMembers] = useState<Member[]>([{ name: "", phone: "" }]);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Step 3
  const [createdPayCode, setCreatedPayCode] = useState("");
  const [showWA, setShowWA] = useState(false);
  const [createdMembers, setCreatedMembers] = useState<
    Array<{ name: string; phone: string; personal_token: string; amount_owed: number }>
  >([]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  function validateStep1(): boolean {
    const errs: string[] = [];
    if (!category) errs.push("Pilih kategori bil");
    if (!title.trim()) errs.push("Tajuk bil diperlukan");
    if (!dueDate) errs.push("Tarikh akhir diperlukan");
    if (splitMode === "equal" && (!totalAmount || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0))
      errs.push("Masukkan jumlah bil yang sah");
    if (splitMode === "scan" && !scanResult)
      errs.push("Sila imbas resit terlebih dahulu");
    setErrors(errs);
    return errs.length === 0;
  }

  function validateStep2(): boolean {
    const errs: string[] = [];
    if (!members.some((m) => m.name.trim()))
      errs.push("Tambah sekurang-kurangnya satu ahli");
    setErrors(errs);
    return errs.length === 0;
  }

  function addMember() { setMembers((p) => [...p, { name: "", phone: "" }]); }
  function removeMember(idx: number) { setMembers((p) => p.filter((_, i) => i !== idx)); }
  function updateMember(idx: number, field: keyof Member, value: string) {
    setMembers((p) => p.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  }

  async function handleCreate() {
    if (!validateStep2()) return;
    setCreating(true);
    setErrors([]);
    try {
      const payCode = generatePayCode(title);
      const validMembers = members.filter((m) => m.name.trim());
      const computedTotal = splitMode === "scan" && scanResult ? scanResult.total : Number(totalAmount);
      const computedTax   = splitMode === "scan" && scanResult ? scanResult.tax   : Number(tax || "0");

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category, splitMode,
          totalAmount: computedTotal,
          tax: computedTax,
          serviceCharge: splitMode === "scan" && scanResult ? scanResult.serviceCharge : 0,
          dueDate, payCode,
          storeName: splitMode === "scan" && scanResult ? scanResult.storeName : undefined,
          members: validMembers,
          items: splitMode === "scan" && scanResult ? scanResult.items : undefined,
        }),
      });

      const json = await res.json() as {
        bill?: { id: string };
        members?: Array<{ name: string; phone: string; personal_token: string; amount_owed: number }>;
        error?: string;
      };

      if (!res.ok || json.error) throw new Error(json.error ?? "Gagal buat bil");
      setCreatedPayCode(payCode);
      setCreatedMembers(json.members!);
      setStep(3);
    } catch (err) {
      setErrors([(err as Error).message ?? "Ralat tidak dijangka"]);
    } finally {
      setCreating(false);
    }
  }

  const validMemberCount = members.filter((m) => m.name.trim()).length;
  const computedBillTotal = splitMode === "equal" ? Number(totalAmount) || 0 : scanResult?.total ?? 0;
  const amountPerPerson = validMemberCount > 0 && computedBillTotal > 0
    ? computedBillTotal / validMemberCount : 0;

  return (
    <div style={{ background: "#000000", minHeight: "100dvh", paddingBottom: "96px" }}>

      {/* ── STICKY HEADER ───────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 md:top-[60px]"
        style={{
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {step < 3 && (
          <button
            onClick={() => { setErrors([]); if (step === 2) { setStep(1); } else { router.back(); } }}
            className="active:scale-[0.88] shrink-0"
            style={{ color: "#6d6d6d", transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)" }}
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <h1 className="font-clash font-bold text-frost flex-1 leading-none" style={{ fontSize: "18px" }}>
          {step === 1 ? "Buat Bil Baru" : step === 2 ? "Tambah Ahli" : "Bil Berjaya Dibuat!"}
        </h1>
        {step < 3 && (
          <span className="font-dm text-whisper shrink-0" style={{ fontSize: "12px" }}>{step}/2</span>
        )}
      </header>

      {/* ── GRADIENT STEP PROGRESS ──────────────────────────────────────── */}
      {step < 3 && (
        <div style={{ height: "2px", background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            style={{ height: "100%", background: "var(--gradient-deep-ocean)" }}
            animate={{ width: step === 1 ? "50%" : "100%" }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════════════
            STEP 1 — Bill details
        ══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="px-5 pt-6 flex flex-col gap-6"
          >
            {/* Category — 4×2 grid */}
            <div>
              <FieldLabel>Kategori</FieldLabel>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const sel = category === cat;

                  const iconAndLabel = (
                    <>
                      <CategoryIcon
                        category={cat}
                        size={22}
                        style={{
                          opacity: sel ? 1 : 0.4,
                          transition: "opacity 150ms cubic-bezier(0.23,1,0.32,1)",
                        }}
                      />
                      <span
                        className="font-dm text-center leading-tight"
                        style={{
                          fontSize: "9px",
                          color: sel ? "#ffffff" : "#6d6d6d",
                          maxWidth: "44px",
                          transition: "color 150ms cubic-bezier(0.23,1,0.32,1)",
                        }}
                      >
                        {cat.replace(/^\S+\s*/, "")}
                      </span>
                    </>
                  );

                  if (sel) {
                    return (
                      <NoiseBackground
                        key={cat}
                        containerClassName="rounded-[10px]"
                        gradientColors={[
                          "rgb(160, 224, 171)",
                          "rgb(255, 172, 46)",
                          "rgb(165, 45, 37)",
                        ]}
                      >
                        <button
                          onClick={() => setCategory(cat)}
                          className="flex flex-col items-center gap-1.5 py-3 w-full active:scale-[0.95]"
                          style={{
                            background: "transparent",
                            border: "none",
                            transition: "transform 120ms cubic-bezier(0.23,1,0.32,1)",
                          }}
                        >
                          {iconAndLabel}
                        </button>
                      </NoiseBackground>
                    );
                  }

                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className="flex flex-col items-center gap-1.5 py-3 active:scale-[0.93]"
                      style={{
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "10px",
                        transition: "transform 120ms cubic-bezier(0.23,1,0.32,1)",
                      }}
                    >
                      {iconAndLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <FieldLabel>Tajuk Bil</FieldLabel>
              <input
                type="text" value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth: Makan Malam Geng Office"
                className="font-dm" style={fieldBase}
                onFocus={focusBorder} onBlur={blurBorder}
              />
            </div>

            {/* Description */}
            <div>
              <FieldLabel optional>Penerangan</FieldLabel>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Nota tambahan..." rows={3}
                className="font-dm resize-none"
                style={{ ...fieldBase, lineHeight: 1.5 }}
                onFocus={focusBorder} onBlur={blurBorder}
              />
            </div>

            {/* Due date */}
            <div>
              <FieldLabel>Tarikh Akhir</FieldLabel>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateCalendar
                  value={dueDate ? dayjs(dueDate) : null}
                  onChange={(val: Dayjs | null) =>
                    setDueDate(val ? val.format("YYYY-MM-DD") : "")
                  }
                  disablePast
                  sx={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    "& .MuiPickersCalendarHeader-root": { color: "#F5F0E8" },
                    "& .MuiDayCalendar-weekDayLabel": { color: "#8B9E88" },
                    "& .MuiPickersDay-root": {
                      color: "#F5F0E8",
                      background: "transparent",
                      "&:hover": { background: "rgba(212,175,55,0.15)" },
                      "&.Mui-selected": {
                        background: "#D4AF37",
                        color: "#0A1628",
                        fontWeight: 700,
                        "&:hover": { background: "#c49d2e" },
                      },
                      "&.MuiPickersDay-today": {
                        border: "1px solid #D4AF37",
                      },
                    },
                    "& .MuiPickersArrowSwitcher-button": { color: "#F5F0E8" },
                    "& .MuiPickersCalendarHeader-switchViewButton": { color: "#F5F0E8" },
                    "& .Mui-disabled": { color: "#4A5E4C !important" },
                  }}
                />
              </LocalizationProvider>
              {dueDate && (
                <p className="font-dm text-xs mt-1" style={{ color: "#8B9E88" }}>
                  Dipilih: {dayjs(dueDate).format("DD MMM YYYY")}
                </p>
              )}
            </div>

            {/* Split mode — 2-card grid */}
            <div>
              <FieldLabel>Cara Bahagi</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                {(["equal", "scan"] as const).map((mode) => {
                  const sel = splitMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setSplitMode(mode)}
                      className="flex flex-col gap-2 p-4 text-left active:scale-[0.96]"
                      style={{
                        background: sel ? "rgba(255,255,255,0.04)" : "#111111",
                        border: sel ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "10px",
                        transition: "background 150ms, border-color 150ms, transform 120ms cubic-bezier(0.23,1,0.32,1)",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{mode === "equal" ? "⚖️" : "📷"}</span>
                      <div>
                        <p className="font-dm font-semibold" style={{ fontSize: "13px", color: sel ? "#ffffff" : "#6d6d6d" }}>
                          {mode === "equal" ? "Sama Rata" : "Scan Resit"}
                        </p>
                        <p className="font-dm mt-0.5" style={{ fontSize: "11px", color: "#4a4a4a", lineHeight: 1.4 }}>
                          {mode === "equal" ? "Bahagi sama untuk semua" : "Imbas & perinci setiap item"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Equal mode fields */}
            {splitMode === "equal" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <div>
                  <FieldLabel>Jumlah Bil (RM)</FieldLabel>
                  <input
                    type="number" inputMode="decimal" value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00" className="font-dm" style={fieldBase}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </div>
                <div>
                  <FieldLabel optional>Cukai / SST (RM)</FieldLabel>
                  <input
                    type="number" inputMode="decimal" value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    placeholder="0.00" className="font-dm" style={fieldBase}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </div>
              </motion.div>
            )}

            {/* Scan mode */}
            {splitMode === "scan" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden"
              >
                {!scanResult ? (
                  <ReceiptScanner
                    onScanComplete={(result) => setScanResult(result)}
                    onManualEntry={() => setScanResult({
                      storeName: "", items: [{ id: "1", name: "", price: 0, qty: 1 }],
                      subtotal: 0, tax: 0, serviceCharge: 0, total: 0,
                    })}
                  />
                ) : (
                  <div
                    className="flex items-center justify-between p-4"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
                  >
                    <div>
                      <p className="font-dm text-frost font-medium text-sm">
                        {scanResult.storeName || "Resit"} — {scanResult.items.length} item
                      </p>
                      <p className="font-clash font-bold text-frost mt-0.5" style={{ fontSize: "18px" }}>
                        {formatRM(scanResult.total)}
                      </p>
                    </div>
                    <button
                      onClick={() => setScanResult(null)}
                      className="font-dm text-whisper active:opacity-50"
                      style={{ fontSize: "13px", transition: "opacity 150ms" }}
                    >
                      Imbas semula
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {errors.length > 0 && <ErrorBox errors={errors} />}

            {/* Next CTA */}
            <button
              onClick={() => { if (validateStep1()) { setErrors([]); setStep(2); } }}
              className="flex items-center justify-center gap-2 font-dm font-semibold text-sm active:scale-[0.97]"
              style={{
                background: "var(--gradient-deep-ocean)",
                borderRadius: "75.024px",
                padding: "14px 0",
                color: "#000000",
                transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              Seterusnya <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 2 — Add members
        ══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="px-5 pt-6 flex flex-col gap-4"
          >
            {/* Amount summary — 2-col stat grid */}
            {amountPerPerson > 0 && (
              <div
                className="grid grid-cols-2 gap-px overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                }}
              >
                <div className="flex flex-col gap-1 p-4" style={{ background: "#111111" }}>
                  <p className="font-dm text-whisper" style={{ fontSize: "11px" }}>Jumlah bil</p>
                  <p className="font-clash font-bold text-frost" style={{ fontSize: "20px" }}>
                    {formatRM(computedBillTotal)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-4" style={{ background: "#111111" }}>
                  <p className="font-dm text-whisper" style={{ fontSize: "11px" }}>
                    {validMemberCount} ahli · setiap seorang
                  </p>
                  <p
                    className="font-clash font-bold"
                    style={{
                      fontSize: "20px",
                      background: "var(--gradient-deep-ocean)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {formatRM(amountPerPerson)}
                  </p>
                </div>
              </div>
            )}

            {/* Member cards */}
            <div className="flex flex-col gap-3">
              {members.map((member, idx) => (
                <motion.div
                  key={idx} layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex flex-col gap-3 p-4"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-dm text-whisper" style={{ fontSize: "12px" }}>Ahli {idx + 1}</p>
                    {members.length > 1 && (
                      <button
                        onClick={() => removeMember(idx)}
                        className="active:scale-[0.88]"
                        style={{ color: "#ef4444", transition: "transform 160ms" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text" value={member.name}
                    onChange={(e) => updateMember(idx, "name", e.target.value)}
                    placeholder="Nama ahli" className="font-dm"
                    style={{ ...fieldBase, background: "rgba(255,255,255,0.03)" }}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                  <input
                    type="tel" value={member.phone}
                    onChange={(e) => updateMember(idx, "phone", e.target.value)}
                    placeholder="No. telefon (pilihan)" className="font-dm"
                    style={{ ...fieldBase, background: "rgba(255,255,255,0.03)" }}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </motion.div>
              ))}
            </div>

            {/* Add member — ghost dashed */}
            <button
              onClick={addMember}
              className="flex items-center justify-center gap-2 font-dm text-sm active:scale-[0.97]"
              style={{
                border: "1px dashed rgba(255,255,255,0.15)",
                borderRadius: "10px",
                padding: "14px 0",
                color: "#6d6d6d",
                background: "transparent",
                transition: "color 150ms, border-color 150ms, transform 120ms",
              }}
            >
              <Plus size={15} /> Tambah Ahli
            </button>

            {errors.length > 0 && <ErrorBox errors={errors} />}

            {/* Create CTA */}
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center justify-center gap-2 font-dm font-semibold text-sm active:scale-[0.97] disabled:opacity-50"
              style={{
                background: "var(--gradient-deep-ocean)",
                borderRadius: "75.024px",
                padding: "14px 0",
                color: "#000000",
                transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 200ms",
              }}
            >
              {creating ? (
                <span className="animate-pulse">Sedang cipta bil...</span>
              ) : (
                <><Check size={16} /> Cipta Bil</>
              )}
            </button>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 3 — Success
        ══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="px-5 pt-6 flex flex-col gap-4"
          >
            {/* Success hero */}
            <div
              className="relative overflow-hidden flex flex-col items-center gap-4 py-8 px-5 text-center"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-36 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse, rgba(34,197,94,0.18) 0%, transparent 70%)",
                  filter: "blur(20px)",
                  marginTop: "-20px",
                }}
              />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)" }}
                >
                  <Check size={26} style={{ color: "#22c55e" }} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="font-clash font-bold text-frost" style={{ fontSize: "20px" }}>{title}</h2>
                  <p className="font-dm text-whisper text-sm mt-1">
                    Bil berjaya dicipta! Kongsi link kepada ahli-ahli.
                  </p>
                </div>
              </div>
            </div>

            {/* Pay code */}
            <div
              className="flex flex-col gap-2 p-4"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
            >
              <p className="font-dm text-whisper" style={{ fontSize: "12px" }}>Pay Code</p>
              <PayCodeDisplay code={createdPayCode} />
            </div>

            {/* Member links */}
            <div
              className="flex flex-col p-4 gap-3"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
            >
              <p className="font-dm text-whisper" style={{ fontSize: "12px" }}>Link Peribadi Ahli</p>
              {createdMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-clash font-bold shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#ffffff", fontSize: "12px" }}
                  >
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dm font-medium text-frost text-sm">{m.name}</p>
                    <p className="font-dm text-whisper truncate" style={{ fontSize: "10px" }}>
                      {appUrl}/pay/{createdPayCode}?t={m.personal_token}
                    </p>
                  </div>
                  <span
                    className="font-clash font-bold shrink-0"
                    style={{
                      fontSize: "13px",
                      background: "var(--gradient-deep-ocean)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {formatRM(m.amount_owed)}
                  </span>
                </div>
              ))}
            </div>

            {/* WhatsApp ghost button */}
            <button
              onClick={() => setShowWA(true)}
              className="flex items-center justify-center gap-2 font-dm font-semibold text-sm active:scale-[0.97]"
              style={{
                background: "transparent",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "75.024px",
                padding: "14px 0",
                color: "#22c55e",
                transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              <span>📲</span> Hantar via WhatsApp
            </button>

            {showWA && (
              <WAToneSelector
                billTitle={title}
                payCode={createdPayCode}
                members={createdMembers.map((m) => ({
                  name: m.name,
                  phone: m.phone,
                  amount: m.amount_owed.toFixed(2),
                  link: `${appUrl}/pay/${createdPayCode}?t=${m.personal_token}`,
                }))}
                dueDate={dueDate}
                onClose={() => setShowWA(false)}
              />
            )}

            {/* Dashboard CTA */}
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 font-dm font-semibold text-sm active:scale-[0.97]"
              style={{
                background: "var(--gradient-deep-ocean)",
                borderRadius: "75.024px",
                padding: "14px 0",
                color: "#000000",
                transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              Pergi ke Dashboard
            </Link>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
