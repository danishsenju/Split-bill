"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from "framer-motion";
import { X, Plus, Trash2, Check, Scale, User } from "lucide-react";
import { Bill } from "@/types";
import { createClient } from "@/lib/supabase";
import { generatePersonalToken } from "@/lib/paycode";
import { formatRM, getInitial, categoryTone } from "@/lib/utils";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLang, billDetailT } from "@/lib/language-context";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs, { Dayjs } from "dayjs";

// Emil: drawer ease — heavy out, weightless settle
const DRAWER_EASE = [0.32, 0.72, 0, 1] as const;
const SHEET_SPRING = { type: "spring", stiffness: 420, damping: 40 } as const;
const SOFT_SPRING = { type: "spring", stiffness: 460, damping: 34 } as const;

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

const catLabel = (c: string) => c.replace(/^\S+\s*/, "");

interface EditMember {
  _key: string;
  id?: string; // existing DB row; undefined = newly added
  name: string;
  phone: string;
  amount: string; // kept as string for the input
  paid: boolean;
  personal_token?: string;
}

const fieldBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "13px 14px",
  color: "var(--theme-text)",
  width: "100%",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 180ms cubic-bezier(0.23,1,0.32,1), background 180ms",
};
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
};

const newKey = () =>
  `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export default function EditBillSheet({
  bill,
  onClose,
  onSaved,
}: {
  bill: Bill;
  onClose: () => void;
  onSaved: (updated: Bill) => void;
}) {
  const { lang } = useLang();
  const t = billDetailT[lang].edit;
  const isScan = bill.split_mode === "scan";

  // ── Form state ──
  const [title, setTitle] = useState(bill.title);
  const [description, setDescription] = useState(bill.description ?? "");
  const [category, setCategory] = useState(bill.category);
  const [dueDate, setDueDate] = useState(bill.due_date?.slice(0, 10) ?? "");
  const [total, setTotal] = useState(String(bill.total_amount ?? ""));
  const [tax, setTax] = useState(bill.tax ? String(bill.tax) : "");
  const [members, setMembers] = useState<EditMember[]>(
    (bill.bill_members ?? []).map((m) => ({
      _key: m.id,
      id: m.id,
      name: m.name,
      phone: m.phone ?? "",
      amount: String(m.amount_owed ?? 0),
      paid: m.paid,
      personal_token: m.personal_token,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accent = categoryTone(category);

  // ── Drag-to-dismiss ──
  const y = useMotionValue(0);
  const sheetH = useRef(900);
  const backdropOpacity = useTransform(y, [0, 520], [1, 0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    sheetH.current = window.innerHeight;
    y.set(sheetH.current);
    setMounted(true);
    animate(y, 0, { ...SHEET_SPRING, damping: 38 });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closedRef = useRef(false);
  function dismiss() {
    if (closedRef.current) return;
    closedRef.current = true;
    animate(y, sheetH.current, {
      duration: 0.28,
      ease: DRAWER_EASE,
      onComplete: onClose,
    });
  }

  function onHandleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 130 || info.velocity.y > 750) {
      navigator.vibrate?.(12);
      dismiss();
    } else {
      animate(y, 0, SHEET_SPRING);
    }
  }

  // ── Member ops ──
  function updateMember(key: string, patch: Partial<EditMember>) {
    setMembers((prev) =>
      prev.map((m) => (m._key === key ? { ...m, ...patch } : m)),
    );
  }
  function addMember() {
    navigator.vibrate?.(10);
    const share =
      !isScan && Number(total) > 0
        ? (Number(total) / (members.length + 1)).toFixed(2)
        : "";
    setMembers((prev) => [
      ...prev,
      { _key: newKey(), name: "", phone: "", amount: share, paid: false },
    ]);
  }
  function removeMember(key: string) {
    navigator.vibrate?.(14);
    setMembers((prev) => prev.filter((m) => m._key !== key));
  }
  function splitEqually() {
    const tot = Number(total) || 0;
    const n = members.length;
    if (n === 0 || tot <= 0) return;
    navigator.vibrate?.(16);
    const base = Math.floor((tot / n) * 100) / 100;
    setMembers((prev) =>
      prev.map((m, i) => ({
        ...m,
        amount: (i === n - 1
          ? +(tot - base * (n - 1)).toFixed(2)
          : base
        ).toFixed(2),
      })),
    );
  }

  const perPersonHint =
    !isScan && Number(total) > 0 && members.length > 0
      ? formatRM(Number(total) / members.length)
      : null;

  // ── Save ──
  async function handleSave() {
    const named = members.filter((m) => m.name.trim());
    if (!title.trim()) {
      setError(t.errTitle);
      return;
    }
    if (named.length === 0) {
      setError(t.errMembers);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const supabase = createClient();

      const billPatch: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        due_date: dueDate,
      };
      if (!isScan) {
        billPatch.total_amount = Number(total) || 0;
        billPatch.tax = Number(tax) || 0;
      }
      const { error: billErr } = await supabase
        .from("bills")
        .update(billPatch)
        .eq("id", bill.id);
      if (billErr) throw billErr;

      const original = bill.bill_members ?? [];
      const keptIds = new Set(named.filter((m) => m.id).map((m) => m.id));
      const removed = original.filter((o) => !keptIds.has(o.id));

      const ops: PromiseLike<unknown>[] = [];

      if (removed.length > 0) {
        ops.push(
          supabase
            .from("bill_members")
            .delete()
            .in(
              "id",
              removed.map((r) => r.id),
            ),
        );
      }

      for (const m of named) {
        if (m.id) {
          ops.push(
            supabase
              .from("bill_members")
              .update({
                name: m.name.trim(),
                phone: m.phone.trim() || null,
                ...(isScan ? {} : { amount_owed: Number(m.amount) || 0 }),
              })
              .eq("id", m.id),
          );
        }
      }

      const inserts = named
        .filter((m) => !m.id)
        .map((m) => ({
          bill_id: bill.id,
          name: m.name.trim(),
          phone: m.phone.trim() || null,
          amount_owed: isScan ? 0 : Number(m.amount) || 0,
          paid: false,
          personal_token: generatePersonalToken(),
        }));
      if (inserts.length > 0) {
        ops.push(supabase.from("bill_members").insert(inserts));
      }

      await Promise.all(ops);

      const { data: fresh } = await supabase
        .from("bills")
        .select("*, bill_members(*), bill_items(*)")
        .eq("id", bill.id)
        .single();

      navigator.vibrate?.([14, 24, 30]);
      if (fresh) onSaved(fresh as Bill);
      dismiss();
    } catch (err) {
      console.error("Edit bill save error:", err);
      setError(t.errSave);
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop — opacity tracks the sheet's y so it fades with the slide */}
      <motion.div
        onClick={dismiss}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          background: "rgba(0,0,0,0.62)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: backdropOpacity,
          visibility: mounted ? "visible" : "hidden",
        }}
      />

      {/* Sheet */}
      <motion.div
        style={{
          y,
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 61,
          maxWidth: 480,
          margin: "0 auto",
          maxHeight: "94dvh",
          display: "flex",
          flexDirection: "column",
          background: "#0b0b0c",
          borderTop: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "26px 26px 0 0",
          boxShadow: "0 -24px 70px rgba(0,0,0,0.65)",
          overflow: "hidden",
          visibility: mounted ? "visible" : "hidden",
        }}
      >
        {/* Drag handle — the only draggable zone */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDrag={(_, info) => y.set(Math.max(0, info.offset.y))}
          onDragEnd={onHandleDragEnd}
          className="shrink-0 flex flex-col items-center pt-3 pb-1.5 relative z-10"
          style={{ cursor: "grab", touchAction: "none" }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 99,
              background: "rgba(255,255,255,0.22)",
            }}
          />
        </motion.div>

        {/* ── Atmospheric header — category-tinted, crossfades on change ── */}
        <div className="shrink-0 relative overflow-hidden">
          <AnimatePresence>
            <motion.div
              key={accent.hex}
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: DRAWER_EASE }}
              className="absolute inset-0 pointer-events-none"
            >
              <motion.div
                animate={{ x: ["0%", "10%", "0%"], y: ["0%", "-12%", "0%"] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: "-90%",
                  left: "-15%",
                  width: "70%",
                  paddingBottom: "70%",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, rgba(${accent.rgb},0.30) 0%, transparent 65%)`,
                  filter: "blur(40px)",
                }}
              />
              <motion.div
                animate={{ x: ["0%", "-8%", "0%"], y: ["0%", "8%", "0%"] }}
                transition={{
                  duration: 22,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }}
                style={{
                  position: "absolute",
                  top: "-70%",
                  right: "-15%",
                  width: "60%",
                  paddingBottom: "60%",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, rgba(${accent.rgb},0.18) 0%, transparent 65%)`,
                  filter: "blur(44px)",
                }}
              />
            </motion.div>
          </AnimatePresence>

          <div className="relative flex items-center gap-3.5 px-5 pb-4 pt-1">
            {/* Category icon tile */}
            <motion.div
              key={category}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SOFT_SPRING}
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: `rgba(${accent.rgb},0.12)`,
                border: `1px solid rgba(${accent.rgb},0.30)`,
                boxShadow: `0 6px 22px rgba(${accent.rgb},0.18)`,
              }}
            >
              <CategoryIcon category={category} size={22} selected />
            </motion.div>

            <div className="flex-1 min-w-0">
              <p
                className="font-dm uppercase mb-0.5"
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.22em",
                  color: `rgba(${accent.rgb},0.8)`,
                }}
              >
                {catLabel(category)}
              </p>
              <h2
                className="font-clash truncate"
                style={{
                  fontSize: "21px",
                  fontWeight: 500,
                  color: "#F5F0E8",
                  letterSpacing: "-0.015em",
                  lineHeight: 1.1,
                }}
              >
                {t.title}
              </h2>
            </div>

            <motion.button
              onClick={dismiss}
              whileTap={{ scale: 0.86 }}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(245,240,232,0.7)",
              }}
            >
              <X size={17} />
            </motion.button>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-5 pt-2 flex flex-col gap-7"
          style={{ overscrollBehavior: "contain" }}
        >
          {/* ── Section: Details ── */}
          <Section label={t.secDetails} accent={accent.hex} delay={0.05}>
            <Field label={t.fTitle}>
              {/* Title with leading category icon adornment */}
              <div
                className="flex items-center gap-2.5"
                style={{ ...fieldBase, padding: "0 12px 0 14px" }}
              >
                <CategoryIcon
                  category={category}
                  size={17}
                  style={{ flexShrink: 0, opacity: 0.85 }}
                />
                <div
                  style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }}
                />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-dm flex-1"
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--theme-text)",
                    fontSize: "15px",
                    fontWeight: 500,
                    padding: "13px 0",
                  }}
                />
              </div>
            </Field>

            <Field label={t.fDesc}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="font-dm resize-none"
                style={{ ...fieldBase, lineHeight: 1.5 }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>
          </Section>

          {/* ── Section: Category — icon tile grid ── */}
          <Section label={t.fCategory} accent={accent.hex} delay={0.09}>
            <div className="grid grid-cols-4 gap-2.5">
              {CATEGORIES.map((c) => {
                const sel = c === category;
                const tone = categoryTone(c);
                return (
                  <motion.button
                    key={c}
                    onClick={() => {
                      navigator.vibrate?.(9);
                      setCategory(c);
                    }}
                    whileTap={{ scale: 0.92 }}
                    className="relative overflow-hidden flex flex-col items-center justify-center gap-1.5 py-3"
                    style={{
                      borderRadius: "14px",
                      background: sel ? `rgba(${tone.rgb},0.10)` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${
                        sel ? `rgba(${tone.rgb},0.40)` : "rgba(255,255,255,0.07)"
                      }`,
                      transition:
                        "background 240ms cubic-bezier(0.23,1,0.32,1), border-color 240ms",
                    }}
                  >
                    <AnimatePresence>
                      {sel && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35, ease: DRAWER_EASE }}
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `radial-gradient(ellipse 90% 70% at 50% 25%, rgba(${tone.rgb},0.22) 0%, transparent 70%)`,
                            filter: "blur(6px)",
                          }}
                        />
                      )}
                    </AnimatePresence>
                    <motion.div
                      animate={{ scale: sel ? 1.12 : 1, y: sel ? -1 : 0 }}
                      transition={SOFT_SPRING}
                      className="relative z-10"
                    >
                      <CategoryIcon category={c} size={21} selected={sel} />
                    </motion.div>
                    <span
                      className="font-dm relative z-10 truncate max-w-full px-0.5"
                      style={{
                        fontSize: "9.5px",
                        letterSpacing: "0.01em",
                        color: sel ? "#F5F0E8" : "rgba(245,240,232,0.4)",
                        transition: "color 240ms",
                      }}
                    >
                      {catLabel(c)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </Section>

          {/* ── Section: Due date — full calendar ── */}
          <Section label={t.fDueDate} accent={accent.hex} delay={0.13}>
            <div
              className="overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px",
                padding: "4px 6px",
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateCalendar
                  value={dueDate ? dayjs(dueDate) : null}
                  onChange={(val: Dayjs | null) => {
                    navigator.vibrate?.(8);
                    setDueDate(val ? val.format("YYYY-MM-DD") : "");
                  }}
                  sx={{
                    width: "100%",
                    "& .MuiPickersCalendarHeader-root": { color: "#F5F0E8", paddingLeft: "12px" },
                    "& .MuiDayCalendar-weekDayLabel": { color: "#8B9E88" },
                    "& .MuiPickersDay-root": {
                      color: "#F5F0E8",
                      background: "transparent",
                      fontFamily: "inherit",
                      "&:hover": { background: `rgba(${accent.rgb},0.15)` },
                      "&.Mui-selected": {
                        background: accent.hex,
                        color: "#0A1628",
                        fontWeight: 700,
                        boxShadow: `0 4px 16px rgba(${accent.rgb},0.40)`,
                        "&:hover": { background: accent.hex },
                        "&:focus": { background: accent.hex },
                      },
                      "&.MuiPickersDay-today": {
                        border: `1px solid rgba(${accent.rgb},0.6)`,
                      },
                    },
                    "& .MuiPickersArrowSwitcher-button": { color: "#F5F0E8" },
                    "& .MuiPickersCalendarHeader-switchViewButton": { color: "#F5F0E8" },
                    "& .Mui-disabled": { color: "#4A5E4C !important" },
                  }}
                />
              </LocalizationProvider>
            </div>
            {dueDate && (
              <motion.p
                key={dueDate}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-dm text-center"
                style={{
                  fontSize: "11px",
                  color: `rgba(${accent.rgb},0.85)`,
                  letterSpacing: "0.02em",
                }}
              >
                {t.dateSelected(dayjs(dueDate).format("DD MMM YYYY"))}
              </motion.p>
            )}
          </Section>

          {/* ── Section: Amount (equal mode only) ── */}
          {!isScan && (
            <Section label={t.secAmount} accent={accent.hex} delay={0.17}>
              <div className="grid grid-cols-2 gap-3">
                {/* Total — sculptural */}
                <div className="flex flex-col gap-1.5">
                  <span
                    className="font-dm"
                    style={{ fontSize: "11px", color: "#6d6d6d" }}
                  >
                    {t.fTotal}
                  </span>
                  <div
                    className="flex items-center"
                    style={{ ...fieldBase, padding: "0 14px", height: 56 }}
                  >
                    <span
                      className="font-dm"
                      style={{
                        fontSize: "12px",
                        color: "rgba(245,240,232,0.4)",
                        marginRight: 6,
                      }}
                    >
                      RM
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      placeholder="0.00"
                      className="font-clash tabular-nums"
                      style={{
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        width: "100%",
                        color: "var(--theme-text)",
                        fontSize: "20px",
                        fontWeight: 500,
                        letterSpacing: "-0.02em",
                      }}
                    />
                  </div>
                </div>
                {/* Tax */}
                <div className="flex flex-col gap-1.5">
                  <span
                    className="font-dm"
                    style={{ fontSize: "11px", color: "#6d6d6d" }}
                  >
                    {t.fTax}
                  </span>
                  <div
                    className="flex items-center"
                    style={{ ...fieldBase, padding: "0 14px", height: 56 }}
                  >
                    <span
                      className="font-dm"
                      style={{
                        fontSize: "12px",
                        color: "rgba(245,240,232,0.4)",
                        marginRight: 6,
                      }}
                    >
                      RM
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      placeholder="0.00"
                      className="font-clash tabular-nums"
                      style={{
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        width: "100%",
                        color: "var(--theme-text)",
                        fontSize: "20px",
                        fontWeight: 500,
                        letterSpacing: "-0.02em",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* ── Section: Members ── */}
          <Section label={t.secMembers(members.length)} accent={accent.hex} delay={0.21}>
            {!isScan && perPersonHint && (
              <div className="flex items-center justify-between -mt-1">
                <span
                  className="font-dm"
                  style={{ fontSize: "11px", color: "rgba(245,240,232,0.4)" }}
                >
                  {t.perPerson(perPersonHint)}
                </span>
                <motion.button
                  onClick={splitEqually}
                  whileTap={{ scale: 0.94 }}
                  className="flex items-center gap-1.5 font-dm"
                  style={{
                    fontSize: "11px",
                    padding: "6px 11px",
                    borderRadius: "99px",
                    background: "rgba(160,224,171,0.08)",
                    border: "1px solid rgba(160,224,171,0.22)",
                    color: "rgb(160,224,171)",
                  }}
                >
                  <Scale size={12} />
                  {t.splitEqually}
                </motion.button>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <AnimatePresence initial={false} mode="popLayout">
                {members.map((m) => {
                  const initial = getInitial(m.name);
                  return (
                    <motion.div
                      key={m._key}
                      layout
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95, x: -28 }}
                      transition={SOFT_SPRING}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        className="flex gap-3 p-3"
                        style={{
                          background: "rgba(255,255,255,0.025)",
                          border: `1px solid ${
                            m.paid ? "rgba(34,197,94,0.20)" : "rgba(255,255,255,0.07)"
                          }`,
                          borderRadius: "14px",
                        }}
                      >
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-clash font-bold shrink-0 mt-0.5"
                          style={{
                            fontSize: "14px",
                            background: m.paid
                              ? "rgba(34,197,94,0.10)"
                              : "var(--theme-surface-tint-2)",
                            border: `1px solid ${
                              m.paid ? "rgba(34,197,94,0.28)" : "rgba(255,255,255,0.08)"
                            }`,
                            color: m.paid ? "#22c55e" : "var(--theme-text-secondary)",
                          }}
                        >
                          {initial || <User size={15} strokeWidth={1.8} />}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              value={m.name}
                              onChange={(e) =>
                                updateMember(m._key, { name: e.target.value })
                              }
                              placeholder={t.mName}
                              className="font-dm flex-1"
                              style={fieldBase}
                              onFocus={onFocus}
                              onBlur={onBlur}
                            />
                            {m.paid && (
                              <span
                                className="font-dm shrink-0 flex items-center gap-1"
                                style={{
                                  fontSize: "10px",
                                  padding: "5px 9px",
                                  borderRadius: "99px",
                                  background: "rgba(34,197,94,0.10)",
                                  border: "1px solid rgba(34,197,94,0.25)",
                                  color: "#22c55e",
                                }}
                              >
                                <Check size={10} strokeWidth={3} />
                                {t.paidBadge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="tel"
                              value={m.phone}
                              onChange={(e) =>
                                updateMember(m._key, { phone: e.target.value })
                              }
                              placeholder={t.mPhone}
                              className="font-dm flex-1"
                              style={fieldBase}
                              onFocus={onFocus}
                              onBlur={onBlur}
                            />
                            {isScan ? (
                              <span
                                className="font-dm shrink-0 text-center"
                                style={{
                                  fontSize: "11px",
                                  color: "#8B9E88",
                                  fontStyle: "italic",
                                  width: 84,
                                }}
                              >
                                {t.followsItems}
                              </span>
                            ) : (
                              <div
                                className="flex items-center shrink-0"
                                style={{ ...fieldBase, width: 104, padding: "0 12px" }}
                              >
                                <span
                                  className="font-dm"
                                  style={{
                                    fontSize: "12px",
                                    color: "rgba(245,240,232,0.4)",
                                    marginRight: 4,
                                  }}
                                >
                                  {t.mAmount}
                                </span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  value={m.amount}
                                  onChange={(e) =>
                                    updateMember(m._key, { amount: e.target.value })
                                  }
                                  placeholder="0.00"
                                  className="font-clash tabular-nums"
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    width: "100%",
                                    color: "var(--theme-text)",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                  }}
                                />
                              </div>
                            )}
                            <motion.button
                              onClick={() => removeMember(m._key)}
                              whileTap={{ scale: 0.85 }}
                              className="w-9 h-9 shrink-0 rounded-[10px] flex items-center justify-center"
                              style={{
                                background: "rgba(239,68,68,0.06)",
                                border: "1px solid rgba(239,68,68,0.18)",
                                color: "#ef4444",
                              }}
                            >
                              <Trash2 size={15} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Add member — dashed ghost */}
            <motion.button
              onClick={addMember}
              whileTap={{ scale: 0.98 }}
              layout
              className="flex items-center justify-center gap-2 font-dm text-sm"
              style={{
                border: "1px dashed rgba(255,255,255,0.16)",
                borderRadius: "14px",
                padding: "14px 0",
                color: "#8B9E88",
                background: "transparent",
              }}
            >
              <Plus size={15} /> {t.addMember}
            </motion.button>
          </Section>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 py-3"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "12px",
                }}
              >
                <p className="font-dm text-xs" style={{ color: "#ef4444" }}>
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky save footer */}
        <div
          className="shrink-0 px-5 pt-3"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(11,11,12,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="animate-pulse">{t.saving}</span>
            ) : (
              <>
                <Check size={16} /> {t.save}
              </>
            )}
          </PrimaryButton>
        </div>
      </motion.div>
    </>
  );
}

// ─── Section wrapper — accent dot + staggered entrance ────────────────────
function Section({
  label,
  accent,
  delay,
  children,
}: {
  label: string;
  accent: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: DRAWER_EASE }}
      className="flex flex-col gap-3.5"
    >
      <div className="flex items-center gap-2">
        <motion.span
          layout
          style={{
            width: 6,
            height: 6,
            borderRadius: 99,
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
            transition: "background 240ms, box-shadow 240ms",
          }}
        />
        <p
          className="font-dm uppercase"
          style={{
            fontSize: "10px",
            letterSpacing: "0.18em",
            color: "rgba(245,240,232,0.5)",
          }}
        >
          {label}
        </p>
      </div>
      {children}
    </motion.div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="font-dm"
        style={{ fontSize: "11px", color: "#6d6d6d", letterSpacing: "0.02em" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
