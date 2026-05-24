"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Profile, ScanResult } from "@/types";
import { generatePayCode } from "@/lib/paycode";
import { formatRM } from "@/lib/utils";
import PayCodeDisplay from "@/components/ui/PayCodeDisplay";
import ReceiptScanner from "@/components/receipt/ReceiptScanner";
import WAToneSelector from "@/components/organizer/WAToneSelector";
import Link from "next/link";

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

interface Props {
  profile: Profile | null;
}

export default function CreateBillClient({ profile }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 fields
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [splitMode, setSplitMode] = useState<"equal" | "scan">("equal");
  const [totalAmount, setTotalAmount] = useState("");
  const [tax, setTax] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Step 2 fields
  const [members, setMembers] = useState<Member[]>([{ name: "", phone: "" }]);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Step 3 (done)
  const [createdBillId, setCreatedBillId] = useState("");
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
    if (splitMode === "equal" && (!totalAmount || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0)) {
      errs.push("Masukkan jumlah bil yang sah");
    }
    if (splitMode === "scan" && !scanResult) {
      errs.push("Sila imbas resit terlebih dahulu");
    }
    setErrors(errs);
    return errs.length === 0;
  }

  function validateStep2(): boolean {
    const errs: string[] = [];
    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length === 0) errs.push("Tambah sekurang-kurangnya satu ahli");
    setErrors(errs);
    return errs.length === 0;
  }

  function addMember() {
    setMembers((prev) => [...prev, { name: "", phone: "" }]);
  }

  function removeMember(idx: number) {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateMember(idx: number, field: keyof Member, value: string) {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  }

  async function handleCreate() {
    if (!validateStep2()) return;
    setCreating(true);
    setErrors([]);

    try {
      const payCode = generatePayCode(title);
      const validMembers = members.filter((m) => m.name.trim());

      const computedTotal =
        splitMode === "scan" && scanResult ? scanResult.total : Number(totalAmount);
      const computedTax =
        splitMode === "scan" && scanResult ? scanResult.tax : Number(tax || "0");

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          splitMode,
          totalAmount: computedTotal,
          tax: computedTax,
          serviceCharge: splitMode === "scan" && scanResult ? scanResult.serviceCharge : 0,
          dueDate,
          payCode,
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

      setCreatedBillId(json.bill!.id);
      setCreatedPayCode(payCode);
      setCreatedMembers(json.members!);
      setStep(3);
    } catch (err) {
      setErrors([(err as Error).message ?? "Ralat tidak dijangka"]);
    } finally {
      setCreating(false);
    }
  }

  const amountPerPerson =
    splitMode === "equal" && totalAmount && members.filter((m) => m.name.trim()).length > 0
      ? Number(totalAmount) / members.filter((m) => m.name.trim()).length
      : splitMode === "scan" && scanResult && members.filter((m) => m.name.trim()).length > 0
      ? scanResult.total / members.filter((m) => m.name.trim()).length
      : 0;

  return (
    <div className="min-h-dvh bg-bg-primary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/90 backdrop-blur-md px-4 pt-12 pb-3 flex items-center gap-3">
        {step > 1 && step < 3 ? (
          <button
            onClick={() => {
              setErrors([]);
              setStep((prev) => (prev === 2 ? 1 : 1) as 1 | 2 | 3);
            }}
            className="text-text-secondary"
          >
            <ArrowLeft size={22} />
          </button>
        ) : step === 1 ? (
          <button onClick={() => router.back()} className="text-text-secondary">
            <ArrowLeft size={22} />
          </button>
        ) : null}
        <h1 className="font-syne font-bold text-text-primary flex-1">
          {step === 1 ? "Buat Bil Baru" : step === 2 ? "Tambah Ahli" : "Bil Berjaya Dibuat!"}
        </h1>
        {step < 3 && (
          <span className="text-text-muted text-xs font-dm">
            {step}/2
          </span>
        )}
      </div>

      {/* Step indicator */}
      {step < 3 && (
        <div className="px-4 mb-4">
          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-pill transition-colors ${
                  s <= step ? "bg-accent" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── STEP 1 ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="px-4 flex flex-col gap-5"
          >
            {/* Category */}
            <div>
              <p className="text-text-secondary text-sm font-dm mb-2">Kategori</p>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-card border transition-all ${
                      category === cat
                        ? "border-accent bg-accent/10"
                        : "border-white/10 bg-bg-surface"
                    }`}
                  >
                    <span className="text-xl">{cat.split(" ")[0]}</span>
                    <span className="text-[10px] font-dm text-text-secondary leading-tight text-center">
                      {cat.replace(/^\S+\s*/, "")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <p className="text-text-secondary text-sm font-dm mb-2">Tajuk Bil</p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth: Makan Malam Geng Office"
                className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <p className="text-text-secondary text-sm font-dm mb-2">
                Penerangan <span className="text-text-muted">(pilihan)</span>
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nota tambahan..."
                rows={3}
                className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm resize-none"
              />
            </div>

            {/* Due date */}
            <div>
              <p className="text-text-secondary text-sm font-dm mb-2">Tarikh Akhir</p>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm"
                style={{ colorScheme: "dark" }}
              />
            </div>

            {/* Split mode */}
            <div>
              <p className="text-text-secondary text-sm font-dm mb-2">Cara Bahagi</p>
              <div className="flex gap-2">
                {(["equal", "scan"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSplitMode(mode)}
                    className={`flex-1 py-3 rounded-btn border font-dm text-sm font-medium transition-all ${
                      splitMode === mode
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-white/10 bg-bg-surface text-text-secondary"
                    }`}
                  >
                    {mode === "equal" ? "Sama Rata" : "Scan Resit"}
                  </button>
                ))}
              </div>
            </div>

            {/* Equal mode: total + tax */}
            {splitMode === "equal" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col gap-3"
              >
                <div>
                  <p className="text-text-secondary text-sm font-dm mb-2">Jumlah Bil (RM)</p>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm"
                  />
                </div>
                <div>
                  <p className="text-text-secondary text-sm font-dm mb-2">
                    Cukai / SST (RM) <span className="text-text-muted">(pilihan)</span>
                  </p>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm"
                  />
                </div>
              </motion.div>
            )}

            {/* Scan mode: receipt scanner */}
            {splitMode === "scan" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                {!scanResult ? (
                  <ReceiptScanner
                    onScanComplete={(result) => setScanResult(result)}
                    onManualEntry={() => {
                      setScanResult({
                        storeName: "",
                        items: [{ id: "1", name: "", price: 0, qty: 1 }],
                        subtotal: 0,
                        tax: 0,
                        serviceCharge: 0,
                        total: 0,
                      });
                    }}
                  />
                ) : (
                  <div className="surface-card rounded-card p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-text-primary font-dm font-medium text-sm">
                        {scanResult.storeName || "Resit"} — {scanResult.items.length} item
                      </p>
                      <button
                        onClick={() => setScanResult(null)}
                        className="text-text-muted text-xs font-dm underline"
                      >
                        Imbas semula
                      </button>
                    </div>
                    <p className="font-syne font-bold text-accent text-lg">
                      {formatRM(scanResult.total)}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-danger/10 border border-danger/30 rounded-input px-4 py-3 flex flex-col gap-1">
                {errors.map((e, i) => (
                  <p key={i} className="text-danger text-xs font-dm">
                    • {e}
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                if (validateStep1()) {
                  setErrors([]);
                  setStep(2);
                }
              }}
              className="flex items-center justify-center gap-2 bg-accent text-bg-primary font-dm font-semibold py-4 rounded-btn text-sm mt-2"
            >
              Seterusnya
              <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="px-4 flex flex-col gap-4"
          >
            {/* Amount summary */}
            {amountPerPerson > 0 && (
              <div className="surface-card rounded-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-xs font-dm">Jumlah bil</p>
                  <p className="text-text-primary font-syne font-bold">
                    {formatRM(
                      splitMode === "equal"
                        ? Number(totalAmount)
                        : scanResult?.total ?? 0
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-text-muted text-xs font-dm">
                    {members.filter((m) => m.name.trim()).length} ahli · setiap seorang
                  </p>
                  <p className="text-accent font-syne font-bold text-lg">
                    {formatRM(amountPerPerson)}
                  </p>
                </div>
              </div>
            )}

            {/* Members */}
            <div className="flex flex-col gap-3">
              {members.map((member, idx) => (
                <motion.div
                  key={idx}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="surface-card rounded-card p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-text-secondary text-xs font-dm">
                      Ahli {idx + 1}
                    </p>
                    {members.length > 1 && (
                      <button
                        onClick={() => removeMember(idx)}
                        className="text-danger"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMember(idx, "name", e.target.value)}
                    placeholder="Nama ahli"
                    className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm"
                  />
                  <input
                    type="tel"
                    value={member.phone}
                    onChange={(e) => updateMember(idx, "phone", e.target.value)}
                    placeholder="No. telefon (pilihan)"
                    className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm"
                  />
                </motion.div>
              ))}
            </div>

            <button
              onClick={addMember}
              className="flex items-center justify-center gap-2 border border-dashed border-white/20 rounded-card py-4 text-text-secondary text-sm font-dm"
            >
              <Plus size={16} />
              Tambah Ahli
            </button>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-danger/10 border border-danger/30 rounded-input px-4 py-3">
                {errors.map((e, i) => (
                  <p key={i} className="text-danger text-xs font-dm">
                    • {e}
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center justify-center gap-2 bg-accent text-bg-primary font-dm font-semibold py-4 rounded-btn text-sm mt-2 disabled:opacity-60"
            >
              {creating ? (
                <span className="animate-pulse">Sedang cipta bil...</span>
              ) : (
                <>
                  <Check size={16} />
                  Cipta Bil
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ── STEP 3: Done ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 flex flex-col gap-5"
          >
            {/* Success banner */}
            <div className="surface-card rounded-card p-5 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <Check size={28} className="text-success" strokeWidth={2.5} />
              </div>
              <h2 className="font-syne font-bold text-xl text-text-primary">{title}</h2>
              <p className="text-text-secondary text-sm font-dm">
                Bil berjaya dicipta! Kongsikan link pembayaran kepada ahli-ahli.
              </p>
            </div>

            {/* Pay code */}
            <div className="surface-card rounded-card p-4 flex flex-col gap-2">
              <p className="text-text-secondary text-xs font-dm mb-1">Pay Code</p>
              <PayCodeDisplay code={createdPayCode} />
            </div>

            {/* Members list */}
            <div className="surface-card rounded-card p-4 flex flex-col gap-3">
              <p className="text-text-secondary text-xs font-dm">Link Peribadi Ahli</p>
              {createdMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg-primary flex items-center justify-center font-syne font-bold text-xs text-text-secondary shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-dm text-sm font-medium">{m.name}</p>
                    <p className="text-text-muted text-[10px] font-dm truncate">
                      {appUrl}/pay/{createdPayCode}?t={m.personal_token}
                    </p>
                  </div>
                  <span className="text-accent font-dm text-xs font-semibold shrink-0">
                    {formatRM(m.amount_owed)}
                  </span>
                </div>
              ))}
            </div>

            {/* WhatsApp blast */}
            <button
              onClick={() => setShowWA(true)}
              className="flex items-center justify-center gap-2 bg-success/20 border border-success/30 text-success font-dm font-semibold py-4 rounded-btn text-sm"
            >
              <span>📲</span>
              Hantar via WhatsApp
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

            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 bg-accent text-bg-primary font-dm font-semibold py-4 rounded-btn text-sm"
            >
              Pergi ke Dashboard
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
