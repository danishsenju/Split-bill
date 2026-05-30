"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  Loader2,
  UserPlus,
} from "lucide-react";
import { useLang, inviteT } from "@/lib/language-context";

// Silk is a WebGL canvas — load client-only to avoid SSR window access.
const Silk = dynamic(() => import("@/components/ui/Silk"), { ssr: false });

// Emil Kowalski signature easing — slow-out expo. Restrained, expensive.
const EASE = [0.16, 1, 0.3, 1] as const;
const SCENE_MS = 3400;
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

  const scenes = t.introScenes(inviterName);
  const lastStep = scenes.length; // final step renders the CTA panel
  const [step, setStep] = useState(0);
  const onOutro = step >= lastStep;

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

  // Auto-advance the ad scenes (story-style). Stops on the CTA panel.
  useEffect(() => {
    if (onOutro) return;
    const id = setTimeout(() => setStep((s) => s + 1), SCENE_MS);
    return () => clearTimeout(id);
  }, [step, onOutro]);

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

  const next = () => setStep((s) => Math.min(s + 1, lastStep));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const skip = () => setStep(lastStep);

  const grad = gradFor(inviterUsername ?? inviterName ?? inviterId);
  const initial = (inviterName ?? "?").charAt(0).toUpperCase();
  const scene = scenes[Math.min(step, scenes.length - 1)];

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "#06040f" }}
    >
      {/* ── SILK BACKDROP ── */}
      <div className="absolute inset-0 z-0" aria-hidden>
        <Silk
          speed={5}
          scale={1}
          color="#270d90"
          noiseIntensity={1.5}
          rotation={4.18}
        />
      </div>

      {/* Cinematic darkening + bottom gradient so editorial text stays legible */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,4,15,0.55) 0%, rgba(6,4,15,0.15) 32%, rgba(6,4,15,0.35) 64%, rgba(6,4,15,0.92) 100%)",
        }}
      />
      {/* Subtle radial halo, top — gives depth without adding colour */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 55%)",
        }}
      />

      {/* ── TAP ZONES (scene nav, disabled on CTA panel) ── */}
      {!onOutro && (
        <>
          <button
            aria-label="Previous"
            onClick={prev}
            className="absolute left-0 top-0 z-20 h-full"
            style={{ width: "32%", background: "transparent" }}
          />
          <button
            aria-label="Next"
            onClick={next}
            className="absolute right-0 top-0 z-20 h-full"
            style={{ width: "68%", background: "transparent" }}
          />
        </>
      )}

      {/* ── FOREGROUND ── */}
      <div
        className="relative z-30 mx-auto flex h-full w-full max-w-mobile flex-col px-7 pointer-events-none"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 16px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 36px)",
        }}
      >
        {/* Progress bars */}
        <div className="flex items-center gap-1.5 pointer-events-none">
          {Array.from({ length: scenes.length + 1 }).map((_, i) => (
            <div
              key={i}
              className="relative flex-1 overflow-hidden"
              style={{
                height: "2px",
                borderRadius: "99px",
                background: "rgba(255,255,255,0.16)",
              }}
            >
              {i < step && (
                <div
                  className="absolute inset-0"
                  style={{ background: "rgba(255,255,255,0.92)" }}
                />
              )}
              {i === step && (
                <motion.div
                  key={`fill-${step}`}
                  className="absolute inset-y-0 left-0"
                  style={{ background: "rgba(255,255,255,0.92)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: onOutro ? 0.6 : SCENE_MS / 1000,
                    ease: onOutro ? EASE : "linear",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Header: brand · skip */}
        <div className="mt-5 flex items-center justify-between">
          <span
            className="font-dm uppercase"
            style={{
              fontSize: "11px",
              letterSpacing: "0.34em",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {t.introBrand}
          </span>
          {!onOutro && (
            <button
              onClick={skip}
              className="font-dm uppercase active:opacity-60 pointer-events-auto"
              style={{
                fontSize: "11px",
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.55)",
                padding: "4px 2px",
              }}
            >
              {t.introSkip} →
            </button>
          )}
        </div>

        {/* Spacer pushes content to lower third — editorial, expensive */}
        <div className="flex-1" />

        <AnimatePresence mode="wait">
          {!onOutro ? (
            <motion.div
              key={`scene-${step}`}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: EASE }}
              className="pointer-events-none"
            >
              {/* Inviter avatar on the first scene */}
              {step === 0 && inviterName && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="mb-6 flex items-center justify-center font-clash font-bold"
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "18px",
                    background: grad,
                    color: "#fff",
                    fontSize: "24px",
                    boxShadow: "0 12px 34px rgba(0,0,0,0.5)",
                  }}
                >
                  {initial}
                </motion.div>
              )}

              <TextReveal
                text={scene.kicker}
                className="font-dm uppercase"
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.26em",
                  color: "rgba(255,255,255,0.62)",
                  marginBottom: "18px",
                }}
                stagger={0.03}
              />
              <TextReveal
                text={scene.title}
                delay={0.12}
                stagger={0.06}
                className="font-clash"
                style={{
                  fontSize: "clamp(38px, 12vw, 52px)",
                  fontWeight: 700,
                  lineHeight: 1.02,
                  letterSpacing: "-0.04em",
                  color: "#fff",
                  textShadow: "0 6px 40px rgba(0,0,0,0.45)",
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="outro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="pointer-events-auto"
            >
              <TextReveal
                text={t.introOutroKicker}
                className="font-dm uppercase"
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.26em",
                  color: "rgba(255,255,255,0.62)",
                  marginBottom: "16px",
                }}
                stagger={0.03}
              />
              <TextReveal
                text={t.introOutroTitle}
                delay={0.1}
                stagger={0.06}
                className="font-clash"
                style={{
                  fontSize: "clamp(38px, 12vw, 52px)",
                  fontWeight: 700,
                  lineHeight: 1.02,
                  letterSpacing: "-0.04em",
                  color: "#fff",
                  textShadow: "0 6px 40px rgba(0,0,0,0.45)",
                }}
              />
              <motion.p
                initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.45 }}
                className="font-dm mt-5"
                style={{
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.7)",
                  maxWidth: "320px",
                }}
              >
                {t.introOutroDesc}
              </motion.p>

              {/* Contextual CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
                className="mt-9 flex flex-col gap-3"
              >
                {isOwnLink ? (
                  <>
                    <PrimaryButton onClick={copyLink}>
                      {copied ? <Check size={17} /> : <Copy size={17} />}
                      {copied ? t.copied : t.copy}
                    </PrimaryButton>
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
                          background: "rgba(52,211,153,0.12)",
                          border: "1px solid rgba(52,211,153,0.28)",
                          color: "#34d399",
                          fontSize: "15px",
                        }}
                      >
                        <Check size={18} />
                        {t.added}
                      </div>
                      <GhostButton
                        onClick={() => router.push(`/chat/${inviterId}`)}
                      >
                        {t.goChat}
                        <ArrowRight size={16} />
                      </GhostButton>
                    </>
                  ) : (
                    <PrimaryButton onClick={addNow} disabled={adding}>
                      {adding ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <UserPlus size={17} />
                      )}
                      {adding ? t.adding : t.addFriendCta}
                    </PrimaryButton>
                  )
                ) : (
                  <>
                    <Link href="/auth/register" style={{ display: "block" }}>
                      <PrimaryButton>
                        {t.ctaRegister}
                        <ArrowRight size={16} />
                      </PrimaryButton>
                    </Link>
                    <Link href="/auth/login" style={{ display: "block" }}>
                      <GhostButton>{t.ctaLogin}</GhostButton>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Emil-style word reveal: blur + slide up, staggered ───────────────────────
function TextReveal({
  text,
  className,
  style,
  delay = 0,
  stagger = 0.055,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  stagger?: number;
}) {
  const lines = text.split("\n");
  let wordIndex = 0;
  return (
    <span
      className={className}
      style={{ display: "block", whiteSpace: "pre-line", ...style }}
    >
      {lines.map((line, li) => {
        const words = line.split(" ");
        return (
          <span key={li} style={{ display: "block" }}>
            {words.map((word, wi) => {
              const i = wordIndex++;
              return (
                <motion.span
                  key={wi}
                  style={{ display: "inline-block", willChange: "transform" }}
                  initial={{ opacity: 0, y: "0.5em", filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, ease: EASE, delay: delay + i * stagger }}
                >
                  {word}
                  {wi < words.length - 1 ? " " : ""}
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}

// ─── Premium light CTA — monochrome, no gradient noise ────────────────────────
function PrimaryButton({
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
        color: "#0b0712",
        background: "#f4f1ea",
        boxShadow: "0 14px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.6)",
        transition: "transform 140ms cubic-bezier(0.16,1,0.3,1), opacity 150ms",
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
        color: "rgba(255,255,255,0.82)",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transition: "transform 140ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </button>
  );
}
