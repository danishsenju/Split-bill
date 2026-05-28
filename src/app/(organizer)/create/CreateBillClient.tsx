"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check, Users, Search, X, MessageCircle } from "lucide-react";
import { ScanResult, WATone } from "@/types";
import { generatePayCode } from "@/lib/paycode";
import { formatRM } from "@/lib/utils";
import { buildWAMessage, buildWAUrl } from "@/lib/whatsapp";
import PayCodeDisplay from "@/components/ui/PayCodeDisplay";
import ReceiptScanner from "@/components/receipt/ReceiptScanner";
import ReceiptEditList from "@/components/receipt/ReceiptEditList";
import WAToneSelector from "@/components/organizer/WAToneSelector";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import Link from "next/link";
import { useLang, createT } from "@/lib/language-context";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs, { Dayjs } from "dayjs";

const PILL = "75.024px";

interface FriendProfile {
  id: string;
  name: string;
  username?: string;
}

interface Friendship {
  id: string;
  friend_user_id: string;
  profiles: FriendProfile | null;
}

function FriendPickerSheet({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  const [friends, setFriends] = useState<Friendship[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/friends?q=")
      .then((r) => r.json())
      .then((d: { friends?: Friendship[] }) => { setFriends(d.friends ?? []); setLoading(false); })
      .catch(() => { setFriends([]); setLoading(false); });
  }, []);

  const filtered = (friends ?? []).filter((f) => {
    if (!query.trim()) return true;
    const p = f.profiles;
    if (!p) return false;
    return p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.username?.toLowerCase().includes(query.toLowerCase()) ?? false);
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          zIndex: 50, display: "flex", alignItems: "flex-end",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: "480px", margin: "0 auto",
            background: "#111111", borderRadius: "24px 24px 0 0",
            border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
            padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
            maxHeight: "70dvh", display: "flex", flexDirection: "column", gap: "16px",
          }}
        >
          {/* Sheet header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="font-clash font-bold text-frost" style={{ fontSize: "16px" }}>
              Tambah dari Kenalan
            </p>
            <button
              onClick={onClose}
              className="active:scale-[0.88]"
              style={{ color: "#6d6d6d", transition: "transform 160ms" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Search inside sheet */}
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6d6d6d", pointerEvents: "none" }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tapis nama..."
              className="font-dm w-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "10px 14px 10px 34px",
                color: "#ffffff",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0" }}>
            {loading && (
              <p className="font-dm text-whisper text-sm text-center py-6">Memuatkan kenalan...</p>
            )}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Users size={24} style={{ color: "#3a3a3a" }} />
                <p className="font-dm text-whisper text-sm">
                  {(friends?.length ?? 0) === 0
                    ? "Belum ada kenalan. Tambah dari halaman Profil → Kenalan."
                    : "Tiada kenalan sepadan."}
                </p>
              </div>
            )}
            {!loading && filtered.map((f, i) => {
              const p = f.profiles;
              if (!p) return null;
              return (
                <button
                  key={f.friend_user_id}
                  onClick={() => { onSelect(p.name); onClose(); }}
                  className="flex items-center gap-3 active:bg-white/5 text-left w-full"
                  style={{
                    padding: "12px 4px",
                    borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    background: "transparent",
                    transition: "background 120ms",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-clash font-bold shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#ffffff", fontSize: "13px" }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dm font-medium text-frost text-sm">{p.name}</p>
                    {p.username && (
                      <p className="font-dm text-whisper" style={{ fontSize: "11px" }}>@{p.username}</p>
                    )}
                  </div>
                  <span
                    className="font-dm shrink-0"
                    style={{
                      fontSize: "11px",
                      padding: "4px 10px",
                      borderRadius: "99px",
                      background: "rgba(255,255,255,0.06)",
                      color: "#6d6d6d",
                    }}
                  >
                    Pilih
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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

function FieldLabel({ children, optional, optionalText = "(pilihan)" }: { children: React.ReactNode; optional?: boolean; optionalText?: string }) {
  return (
    <p className="font-dm mb-2" style={{ fontSize: "12px", color: "#6d6d6d", letterSpacing: "0.04em" }}>
      {children}
      {optional && <span style={{ color: "#3a3a3a" }}> {optionalText}</span>}
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
  const searchParams = useSearchParams();
  const { lang } = useLang();
  const t = createT[lang];
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const category = searchParams.get("category") ?? "";
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
  const [showFriendPicker, setShowFriendPicker] = useState(false);

  // Step 3
  const [createdPayCode, setCreatedPayCode] = useState("");
  const [tone, setTone] = useState<WATone>("firm");
  const [customTemplate, setCustomTemplate] = useState("");
  const [createdMembers, setCreatedMembers] = useState<
    Array<{ name: string; phone: string; personal_token: string; amount_owed: number }>
  >([]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  function openWAForMember(m: { name: string; phone: string; personal_token: string; amount_owed: number }) {
    const formattedDue = dueDate
      ? new Date(dueDate).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" })
      : "";
    // For scan mode the amount is unknown until the member claims items —
    // use a placeholder so the message still makes sense.
    const amountText = splitMode === "scan" ? "(ikut item dipilih)" : m.amount_owed.toFixed(2);
    const msg = buildWAMessage(
      tone,
      {
        nama: m.name,
        amount: amountText,
        tajuk: title,
        due_date: formattedDue,
        code: createdPayCode,
        link: `${appUrl}/pay/${createdPayCode}?t=${m.personal_token}`,
      },
      tone === "custom" ? customTemplate : undefined
    );
    // Empty phone → wa.me/?text=... opens WhatsApp with the message
    // pre-filled and lets the organizer pick a contact manually.
    window.open(buildWAUrl(m.phone, msg), "_blank");
  }

  function validateStep1(): boolean {
    const errs: string[] = [];
    if (!category) errs.push(t.errCategory);
    if (!title.trim()) errs.push(t.errTitle);
    if (!dueDate) errs.push(t.errDueDate);
    if (splitMode === "equal" && (!totalAmount || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0))
      errs.push(t.errAmount);
    if (splitMode === "scan" && !scanResult)
      errs.push(t.errScan);
    setErrors(errs);
    return errs.length === 0;
  }

  function validateStep2(): boolean {
    const errs: string[] = [];
    if (!members.some((m) => m.name.trim()))
      errs.push(t.errMember);
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
          {step === 1 ? t.step1Title : step === 2 ? t.step2Title : t.step3Title}
        </h1>
        {step < 3 && (
          <span className="font-dm text-whisper shrink-0" style={{ fontSize: "12px" }}>{t.stepIndicator(step)}</span>
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
            {/* Title */}
            <div>
              <FieldLabel>{t.labelTitle}</FieldLabel>
              <input
                type="text" value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === "en" ? "e.g. Dinner with the Gang" : "cth: Makan Malam Geng Office"}
                className="font-dm" style={fieldBase}
                onFocus={focusBorder} onBlur={blurBorder}
              />
            </div>

            {/* Description */}
            <div>
              <FieldLabel optional optionalText={t.optional}>{t.labelDesc}</FieldLabel>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder={lang === "en" ? "Additional notes..." : "Nota tambahan..."} rows={3}
                className="font-dm resize-none"
                style={{ ...fieldBase, lineHeight: 1.5 }}
                onFocus={focusBorder} onBlur={blurBorder}
              />
            </div>

            {/* Due date */}
            <div>
              <FieldLabel>{t.labelDueDate}</FieldLabel>
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
                  {t.dateSelected(dayjs(dueDate).format("DD MMM YYYY"))}
                </p>
              )}
            </div>

            {/* Split mode — 2-card grid */}
            <div>
              <FieldLabel>{t.labelSplitMode}</FieldLabel>
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
                          {mode === "equal" ? t.splitEqualLabel : t.splitScanLabel}
                        </p>
                        <p className="font-dm mt-0.5" style={{ fontSize: "11px", color: "#4a4a4a", lineHeight: 1.4 }}>
                          {mode === "equal" ? t.splitEqualDesc : t.splitScanDesc}
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
                  <FieldLabel>{t.labelAmount}</FieldLabel>
                  <input
                    type="number" inputMode="decimal" value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00" className="font-dm" style={fieldBase}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </div>
                <div>
                  <FieldLabel optional optionalText={t.optional}>{t.labelTax}</FieldLabel>
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
                  <div className="flex flex-col gap-4">
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
                        {t.rescanBtn}
                      </button>
                    </div>
                    <ReceiptEditList
                      items={scanResult.items}
                      onChange={(newItems) => {
                        const subtotal = newItems.reduce((s, i) => s + i.price * i.qty, 0);
                        const total = subtotal + scanResult.tax + scanResult.serviceCharge;
                        setScanResult({ ...scanResult, items: newItems, subtotal, total });
                      }}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {errors.length > 0 && <ErrorBox errors={errors} />}

            {/* Next CTA */}
            <PrimaryButton
              onClick={() => { if (validateStep1()) { setErrors([]); setStep(2); } }}
            >
              {t.nextBtn} <ArrowRight size={16} />
            </PrimaryButton>
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
                  <p className="font-dm text-whisper" style={{ fontSize: "11px" }}>{t.totalBill}</p>
                  <p className="font-clash font-bold text-frost" style={{ fontSize: "20px" }}>
                    {formatRM(computedBillTotal)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-4" style={{ background: "#111111" }}>
                  <p className="font-dm text-whisper" style={{ fontSize: "11px" }}>
                    {t.perPerson(validMemberCount)}
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
                    <p className="font-dm text-whisper" style={{ fontSize: "12px" }}>{t.memberLabel(idx + 1)}</p>
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
                    placeholder={t.placeholderName} className="font-dm"
                    style={{ ...fieldBase, background: "rgba(255,255,255,0.03)" }}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                  <input
                    type="tel" value={member.phone}
                    onChange={(e) => updateMember(idx, "phone", e.target.value)}
                    placeholder={t.placeholderPhone} className="font-dm"
                    style={{ ...fieldBase, background: "rgba(255,255,255,0.03)" }}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </motion.div>
              ))}
            </div>

            {/* Add from friends */}
            <button
              onClick={() => setShowFriendPicker(true)}
              className="flex items-center justify-center gap-2 font-dm font-semibold text-sm active:scale-[0.97]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: PILL,
                padding: "12px 0",
                color: "#ffffff",
                transition: "background 150ms, transform 120ms cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              <Users size={15} style={{ color: "#6d6d6d" }} /> Tambah dari Kenalan
            </button>

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
              <Plus size={15} /> {t.addMember}
            </button>

            {/* Friend picker bottom sheet */}
            {showFriendPicker && (
              <FriendPickerSheet
                onClose={() => setShowFriendPicker(false)}
                onSelect={(name) => {
                  // Fill the first empty slot or append a new member
                  const emptyIdx = members.findIndex((m) => !m.name.trim());
                  if (emptyIdx >= 0) {
                    updateMember(emptyIdx, "name", name);
                  } else {
                    setMembers((prev) => [...prev, { name, phone: "" }]);
                  }
                }}
              />
            )}

            {errors.length > 0 && <ErrorBox errors={errors} />}

            {/* Create CTA */}
            <PrimaryButton onClick={handleCreate} disabled={creating}>
              {creating ? (
                <span className="animate-pulse">{t.creating}</span>
              ) : (
                <><Check size={16} /> {t.createBtn}</>
              )}
            </PrimaryButton>
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
                    {t.successDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Pay code */}
            <div
              className="flex flex-col gap-2 p-4"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
            >
              <p className="font-dm text-whisper" style={{ fontSize: "12px" }}>{t.payCodeLabel}</p>
              <PayCodeDisplay code={createdPayCode} />
            </div>

            {/* Member links */}
            <div
              className="flex flex-col p-4 gap-3"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
            >
              <p className="font-dm text-whisper" style={{ fontSize: "12px" }}>{t.memberLinksLabel}</p>
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
                  {splitMode === "scan" ? (
                    <span
                      className="font-dm shrink-0"
                      style={{ fontSize: "11px", color: "#8B9E88", fontStyle: "italic" }}
                    >
                      Ikut item
                    </span>
                  ) : (
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
                  )}
                  <button
                    onClick={() => openWAForMember(m)}
                    title={
                      m.phone
                        ? `Hantar WhatsApp ke ${m.name}`
                        : `Buka WhatsApp — pilih contact untuk ${m.name}`
                    }
                    className="shrink-0 flex items-center justify-center active:scale-[0.9]"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(34,197,94,0.10)",
                      border: "1px solid rgba(34,197,94,0.30)",
                      color: "#22c55e",
                      cursor: "pointer",
                      transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
                    }}
                  >
                    <MessageCircle size={15} />
                  </button>
                </div>
              ))}
            </div>

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
              tone={tone}
              onToneChange={setTone}
              customTemplate={customTemplate}
              onCustomTemplateChange={setCustomTemplate}
            />

            {/* Dashboard CTA */}
            <PrimaryButton href="/dashboard">
              {t.dashboardBtn}
            </PrimaryButton>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
