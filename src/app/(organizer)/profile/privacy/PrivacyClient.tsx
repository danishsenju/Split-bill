"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  AtSign,
  Phone,
  Mail,
  EyeOff,
  Check,
  Loader2,
  Lock,
} from "lucide-react";
import Grainient from "@/components/ui/Grainient";
import { useLang, privacyT } from "@/lib/language-context";

const SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

interface ProfileForm {
  name: string;
  username: string;
  phone: string;
  email: string;
  hide_phone: boolean;
  hide_email: boolean;
}

export default function PrivacyClient({ initial }: { initial: ProfileForm }) {
  const router = useRouter();
  const { lang } = useLang();
  const t = privacyT[lang];

  const [form, setForm] = useState<ProfileForm>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    form.name !== initial.name ||
    form.username !== initial.username ||
    form.phone !== initial.phone ||
    form.hide_phone !== initial.hide_phone ||
    form.hide_email !== initial.hide_email;

  const usernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(form.username);

  async function save() {
    setError("");
    if (form.name.trim().length < 2) {
      setError(t.errSave);
      return;
    }
    if (!usernameValid) {
      setError(t.errUsername);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          phone: form.phone,
          hide_phone: form.hide_phone,
          hide_email: form.hide_email,
        }),
      });
      if (res.status === 409) {
        setError(t.errUsernameTaken);
        return;
      }
      if (!res.ok) {
        setError(t.errSave);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      router.refresh();
    } catch {
      setError(t.errSave);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="theme-aware"
      style={{
        background: "var(--theme-bg)",
        minHeight: "100dvh",
        paddingBottom: "140px",
      }}
    >
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="absolute inset-0 z-0" aria-hidden>
          <Grainient
            color1="#475569"
            color2="#6366f1"
            color3="#0ea5e9"
            timeSpeed={0.4}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1.05}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0.6))",
            }}
          />
        </div>

        <div
          className="relative z-10 px-5 pb-5"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center active:scale-[0.88] mb-4"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#fff",
              backdropFilter: "blur(8px)",
              transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
            }}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            <Lock size={14} style={{ color: "#7dd3fc" }} />
            <span
              className="font-dm uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {t.subtitle}
            </span>
          </div>
          <h1
            className="font-clash font-bold mt-2 leading-none"
            style={{
              fontSize: "30px",
              color: "#fff",
              letterSpacing: "-0.02em",
              textShadow: "0 2px 18px rgba(0,0,0,0.5)",
            }}
          >
            {t.title}
          </h1>
        </div>
      </header>

      <div className="px-5 pt-7 flex flex-col gap-7">
        {/* ── PERSONAL DETAILS ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
        >
          <SectionLabel label={t.secDetails} />
          <div className="flex flex-col gap-3">
            <Field
              icon={<User size={16} />}
              grad="linear-gradient(135deg, #c084fc, #7c3aed)"
              label={t.fName}
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Hafiz Bin Rahman"
            />
            <Field
              icon={<AtSign size={16} />}
              grad="linear-gradient(135deg, #38bdf8, #6366f1)"
              label={t.fUsername}
              value={form.username}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  username: v.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase(),
                }))
              }
              placeholder="hafiz_rahman"
              error={
                form.username.length > 0 && !usernameValid ? t.errUsername : ""
              }
            />
            <Field
              icon={<Phone size={16} />}
              grad="linear-gradient(135deg, #34d399, #0ea5e9)"
              label={t.fPhone}
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder={t.phonePlaceholder}
              type="tel"
            />
            <Field
              icon={<Mail size={16} />}
              grad="linear-gradient(135deg, #fb7185, #f59e0b)"
              label={t.fEmail}
              value={form.email}
              onChange={() => {}}
              placeholder=""
              disabled
              note={t.emailNote}
            />
          </div>
        </motion.div>

        {/* ── VISIBILITY ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.06 }}
        >
          <SectionLabel label={t.secVisibility} />
          <div
            style={{
              background: "var(--theme-bg-card)",
              border: "1px solid var(--theme-border)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <ToggleRow
              icon={<Phone size={15} />}
              grad="linear-gradient(135deg, #34d399, #0ea5e9)"
              label={t.hidePhone}
              sub={t.hidePhoneSub}
              on={form.hide_phone}
              onToggle={() =>
                setForm((f) => ({ ...f, hide_phone: !f.hide_phone }))
              }
              border
            />
            <ToggleRow
              icon={<EyeOff size={15} />}
              grad="linear-gradient(135deg, #fb7185, #e11d48)"
              label={t.hideEmail}
              sub={t.hideEmailSub}
              on={form.hide_email}
              onToggle={() =>
                setForm((f) => ({ ...f, hide_email: !f.hide_email }))
              }
            />
          </div>
        </motion.div>

        {error && (
          <p
            className="font-dm"
            style={{
              fontSize: "13px",
              color: "#ef4444",
              padding: "10px 14px",
              borderRadius: "12px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.22)",
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* ── SAVE BAR ── */}
      <div
        className="fixed left-0 right-0 z-30 max-w-mobile md:max-w-2xl mx-auto bottom-[72px] md:bottom-0 px-5 py-4"
        style={{
          background: "var(--theme-bg-overlay)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="w-full flex items-center justify-center gap-2 font-clash font-bold active:scale-[0.98] disabled:opacity-40"
          style={{
            padding: "15px",
            borderRadius: "16px",
            fontSize: "15px",
            color: "#fff",
            background: saved
              ? "linear-gradient(135deg, #34d399, #059669)"
              : "linear-gradient(135deg, #7c3aed, #4f46e5 55%, #db2777)",
            boxShadow: "0 10px 28px rgba(124,58,237,0.4)",
            transition:
              "transform 140ms cubic-bezier(0.23,1,0.32,1), opacity 150ms, background 250ms",
          }}
        >
          {saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : saved ? (
            <Check size={17} />
          ) : null}
          {saving ? t.saving : saved ? t.saved : t.save}
        </button>
      </div>
    </div>
  );
}

// ─── Field ──────────────────────────────────────────────────────────────────
function Field({
  icon,
  grad,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  note,
  error,
}: {
  icon: React.ReactNode;
  grad: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  disabled?: boolean;
  note?: string;
  error?: string;
}) {
  return (
    <div
      style={{
        background: "var(--theme-bg-card)",
        border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "var(--theme-border)"}`,
        borderRadius: "16px",
        padding: "12px 14px",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "9px",
            background: grad,
            color: "#fff",
            boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-dm uppercase"
            style={{
              fontSize: "9px",
              letterSpacing: "0.12em",
              color: "var(--theme-text-muted)",
            }}
          >
            {label}
          </p>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="font-dm w-full bg-transparent outline-none"
            style={{
              fontSize: "14.5px",
              color: "var(--theme-text)",
              marginTop: "1px",
              caretColor: "#a78bfa",
            }}
          />
        </div>
      </div>
      {error ? (
        <p className="font-dm mt-1.5" style={{ fontSize: "11px", color: "#ef4444" }}>
          {error}
        </p>
      ) : note ? (
        <p
          className="font-dm mt-1.5"
          style={{ fontSize: "11px", color: "var(--theme-text-muted)" }}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}

// ─── Toggle row ─────────────────────────────────────────────────────────────
function ToggleRow({
  icon,
  grad,
  label,
  sub,
  on,
  onToggle,
  border = false,
}: {
  icon: React.ReactNode;
  grad: string;
  label: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
  border?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3.5"
      style={{
        borderBottom: border ? "1px solid var(--theme-border)" : "none",
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          background: grad,
          color: "#fff",
          boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-dm"
          style={{ fontSize: "14px", color: "var(--theme-text)", lineHeight: 1.25 }}
        >
          {label}
        </p>
        <p
          className="font-dm"
          style={{ fontSize: "12px", color: "var(--theme-text-muted)" }}
        >
          {sub}
        </p>
      </div>
      <button
        onClick={onToggle}
        className="shrink-0"
        style={{
          width: "46px",
          height: "26px",
          borderRadius: "99px",
          padding: "2px",
          background: on
            ? "linear-gradient(135deg, #7c3aed, #db2777)"
            : "rgba(255,255,255,0.12)",
          border: on ? "none" : "1px solid rgba(255,255,255,0.14)",
          display: "flex",
          justifyContent: on ? "flex-end" : "flex-start",
          transition: "background 250ms cubic-bezier(0.23,1,0.32,1)",
        }}
        aria-pressed={on}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
          }}
        />
      </button>
    </div>
  );
}

// ─── Section label ──────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <span
      className="font-dm uppercase block mb-3 px-1"
      style={{
        fontSize: "10px",
        letterSpacing: "0.14em",
        color: "var(--theme-text-muted)",
      }}
    >
      {label}
    </span>
  );
}
