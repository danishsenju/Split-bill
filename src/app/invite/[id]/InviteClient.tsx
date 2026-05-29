"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  Receipt,
  Sparkles,
  Wallet,
  MessageCircle,
  Loader2,
  UserPlus,
} from "lucide-react";
import Grainient from "@/components/ui/Grainient";
import { useLang, inviteT } from "@/lib/language-context";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const SPRING = { type: "spring", stiffness: 360, damping: 30 } as const;
const INVITE_KEY = "kolekduit_invite";

const AVATAR_GRADS = [
  "linear-gradient(135deg, #c084fc, #7c3aed)",
  "linear-gradient(135deg, #38bdf8, #6366f1)",
  "linear-gradient(135deg, #fb7185, #e11d48)",
  "linear-gradient(135deg, #34d399, #0ea5e9)",
  "linear-gradient(135deg, #fbbf24, #f97316)",
];
function gradFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADS[h % AVATAR_GRADS.length];
}

export default function InviteClient({
  inviterId,
  inviterName,
  inviterUsername,
  currentUserId,
}: {
  inviterId: string;
  inviterName: string | null;
  inviterUsername: string | null;
  currentUserId: string | null;
}) {
  const { lang } = useLang();
  const t = inviteT[lang];
  const router = useRouter();

  const isOwnLink = currentUserId === inviterId;
  const isLoggedInOther = !!currentUserId && currentUserId !== inviterId;

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const link = `${appUrl}/invite/${inviterId}`;

  // Stash invite for not-logged-in visitors so register/login can finalize it
  useEffect(() => {
    if (!currentUserId && inviterName) {
      localStorage.setItem(INVITE_KEY, inviterId);
    }
  }, [currentUserId, inviterId, inviterName]);

  async function addNow() {
    setAdding(true);
    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviterId }),
      });
      if (res.ok) setAdded(true);
    } finally {
      setAdding(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const grad = gradFor(inviterUsername ?? inviterName ?? inviterId);
  const initial = (inviterName ?? "?").charAt(0).toUpperCase();

  const features = [
    {
      icon: <Receipt size={18} />,
      grad: "linear-gradient(135deg, #34d399, #0ea5e9)",
      title: t.f1Title,
      desc: t.f1Desc,
    },
    {
      icon: <Wallet size={18} />,
      grad: "linear-gradient(135deg, #c084fc, #7c3aed)",
      title: t.f2Title,
      desc: t.f2Desc,
    },
    {
      icon: <MessageCircle size={18} />,
      grad: "linear-gradient(135deg, #fb7185, #f59e0b)",
      title: t.f3Title,
      desc: t.f3Desc,
    },
  ];

  return (
    <div
      className="relative min-h-dvh overflow-x-hidden"
      style={{ background: "#050507" }}
    >
      {/* ── GRAINIENT BACKDROP ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <Grainient
          color1="#7c1fb3"
          color2="#2563eb"
          color3="#db2777"
          timeSpeed={0.22}
          colorBalance={-0.05}
          warpStrength={1}
          warpFrequency={4.5}
          warpSpeed={1.8}
          warpAmplitude={55}
          blendAngle={25}
          blendSoftness={0.12}
          rotationAmount={420}
          noiseScale={2}
          grainAmount={0.14}
          grainScale={1.8}
          grainAnimated={false}
          contrast={1.45}
          gamma={1}
          saturation={1.2}
          zoom={0.85}
        />
      </div>
      {/* Vignette for legibility */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 0%, transparent 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      <div
        className="relative z-10 mx-auto w-full max-w-mobile px-6"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 40px)",
          paddingBottom: "48px",
        }}
      >
        {/* Kicker + inviter pill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex items-center justify-between"
        >
          <span
            className="font-dm uppercase"
            style={{
              fontSize: "10px",
              letterSpacing: "0.24em",
              color: "rgba(255,255,255,0.6)",
              textShadow: "0 1px 8px rgba(0,0,0,0.6)",
            }}
          >
            kolekduit
          </span>
          <span
            className="font-dm uppercase"
            style={{
              fontSize: "10px",
              letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {t.landKicker}
          </span>
        </motion.div>

        {/* Inviter identity */}
        {inviterName && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.08 }}
            className="flex items-center gap-3 mt-9"
          >
            <div
              className="flex items-center justify-center font-clash font-bold shrink-0"
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "18px",
                background: grad,
                color: "#fff",
                fontSize: "22px",
                boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
              }}
            >
              {initial}
            </div>
            <div>
              <p
                className="font-dm"
                style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}
              >
                {t.invitedByLabel}
              </p>
              <p
                className="font-clash font-bold leading-tight"
                style={{ fontSize: "18px", color: "#fff" }}
              >
                {inviterName}
                {inviterUsername && (
                  <span
                    className="font-dm font-normal"
                    style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}
                  >
                    {"  "}@{inviterUsername}
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* Big title */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.14 }}
          className="font-clash mt-7"
          style={{
            fontSize: "clamp(40px, 13vw, 56px)",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.035em",
            lineHeight: 0.98,
            whiteSpace: "pre-line",
            textShadow: "0 4px 30px rgba(0,0,0,0.55)",
          }}
        >
          {t.landTitle}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.22 }}
          className="font-dm mt-5"
          style={{
            fontSize: "14.5px",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.72)",
            maxWidth: "330px",
            textShadow: "0 1px 10px rgba(0,0,0,0.5)",
          }}
        >
          {t.landDesc}
        </motion.p>

        {/* Feature cards */}
        <div className="flex flex-col gap-3 mt-9">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.3 + i * 0.07 }}
              className="flex items-center gap-3.5 overflow-hidden"
              style={{
                borderRadius: "20px",
                padding: "15px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: f.grad,
                  color: "#fff",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                }}
              >
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-clash font-bold"
                  style={{ fontSize: "15px", color: "#fff" }}
                >
                  {f.title}
                </p>
                <p
                  className="font-dm mt-0.5"
                  style={{
                    fontSize: "12.5px",
                    lineHeight: 1.45,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* What is this explainer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.55 }}
          className="mt-5 overflow-hidden"
          style={{
            borderRadius: "20px",
            padding: "18px",
            background:
              "linear-gradient(135deg, rgba(124,31,179,0.22), rgba(37,99,235,0.18))",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={15} style={{ color: "#fbbf24" }} />
            <p
              className="font-clash font-bold"
              style={{ fontSize: "14px", color: "#fff" }}
            >
              {t.whatIsThis}
            </p>
          </div>
          <p
            className="font-dm mt-2"
            style={{
              fontSize: "12.5px",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            {t.whatIsThisDesc}
          </p>
        </motion.div>

        {/* ── CTAs ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.66 }}
          className="mt-8 flex flex-col gap-3"
        >
          {isOwnLink ? (
            <>
              <p
                className="font-dm text-center"
                style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}
              >
                {t.ownLink}
              </p>
              <GradientButton onClick={copyLink}>
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? t.copied : t.copy}
              </GradientButton>
              <GhostButton onClick={() => router.push("/chat")}>
                {t.goChat}
                <ArrowRight size={16} />
              </GhostButton>
            </>
          ) : isLoggedInOther ? (
            added ? (
              <>
                <div
                  className="flex items-center justify-center gap-2 font-clash font-bold"
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    background: "rgba(52,211,153,0.14)",
                    border: "1px solid rgba(52,211,153,0.3)",
                    color: "#34d399",
                    fontSize: "15px",
                  }}
                >
                  <Check size={18} />
                  {t.added}
                </div>
                <GradientButton onClick={() => router.push(`/chat/${inviterId}`)}>
                  {t.goChat}
                  <ArrowRight size={16} />
                </GradientButton>
              </>
            ) : (
              <GradientButton onClick={addNow} disabled={adding}>
                {adding ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <UserPlus size={17} />
                )}
                {adding ? t.adding : t.addFriendCta}
              </GradientButton>
            )
          ) : (
            <>
              <Link href="/auth/register" style={{ display: "block" }}>
                <GradientButton>
                  {t.ctaRegister}
                  <ArrowRight size={16} />
                </GradientButton>
              </Link>
              <Link href="/auth/login" style={{ display: "block" }}>
                <GhostButton>{t.ctaLogin}</GhostButton>
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Gradient CTA ───────────────────────────────────────────────────────────
function GradientButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 font-clash font-bold active:scale-[0.98] disabled:opacity-50"
      style={{
        padding: "16px",
        borderRadius: "16px",
        fontSize: "15px",
        color: "#fff",
        background: "linear-gradient(135deg, #7c3aed, #4f46e5 55%, #db2777)",
        boxShadow: "0 12px 32px rgba(124,58,237,0.42)",
        transition: "transform 140ms cubic-bezier(0.23,1,0.32,1), opacity 150ms",
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 font-dm font-medium active:scale-[0.98]"
      style={{
        padding: "14px",
        borderRadius: "16px",
        fontSize: "14px",
        color: "rgba(255,255,255,0.85)",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(8px)",
        transition: "transform 140ms cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      {children}
    </button>
  );
}
