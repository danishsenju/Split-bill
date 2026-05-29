"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, UserPlus, Receipt, MessageCircle } from "lucide-react";
import Grainient from "@/components/ui/Grainient";
import { useLang, chatT } from "@/lib/language-context";

export interface ChatSummary {
  friendId: string;
  name: string;
  username?: string;
  lastBody: string | null; // "__bill__" sentinel for a shared bill
  lastFromMe: boolean;
  lastAt: string | null;
  unread: number;
}

const SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

// Vivid avatar gradients — colorful, non-minimalist
const AVATAR_GRADS = [
  "linear-gradient(135deg, #c084fc, #7c3aed)",
  "linear-gradient(135deg, #38bdf8, #6366f1)",
  "linear-gradient(135deg, #fb7185, #e11d48)",
  "linear-gradient(135deg, #34d399, #0ea5e9)",
  "linear-gradient(135deg, #fbbf24, #f97316)",
  "linear-gradient(135deg, #f472b6, #a855f7)",
];

function gradFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADS[h % AVATAR_GRADS.length];
}

function relTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

export default function ChatListClient({ chats }: { chats: ChatSummary[] }) {
  const { lang } = useLang();
  const t = chatT[lang];
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.username ?? "").toLowerCase().includes(q)
    );
  }, [chats, query]);

  return (
    <div
      className="theme-aware"
      style={{
        background: "var(--theme-bg)",
        minHeight: "100dvh",
        paddingBottom: "112px",
      }}
    >
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="absolute inset-0 z-0">
          <Grainient
            color1="#2563eb"
            color2="#7c1fb3"
            color3="#0d9488"
            timeSpeed={0.6}
            colorBalance={0.0}
            warpStrength={1.0}
            warpFrequency={5.0}
            warpSpeed={2.0}
            warpAmplitude={50.0}
            blendAngle={0.0}
            blendSoftness={0.05}
            rotationAmount={500.0}
            noiseScale={2.0}
            grainAmount={0.1}
            grainScale={2.0}
            grainAnimated={false}
            contrast={1.5}
            gamma={1.0}
            saturation={1.15}
            centerX={0.0}
            centerY={0.0}
            zoom={0.9}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.55))",
            }}
          />
        </div>

        <div
          className="relative z-10 px-5 pb-5"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 28px)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="flex items-end justify-between"
          >
            <h1
              className="font-clash font-bold leading-none"
              style={{
                fontSize: "34px",
                color: "#fff",
                letterSpacing: "-0.02em",
                textShadow: "0 2px 18px rgba(0,0,0,0.5)",
              }}
            >
              {t.pageTitle}
            </h1>
            <Link
              href="/profile/friends"
              className="flex items-center justify-center active:scale-[0.92]"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.20)",
                backdropFilter: "blur(8px)",
                color: "#fff",
                transition: "transform 140ms cubic-bezier(0.23,1,0.32,1)",
              }}
              aria-label={t.addFriends}
            >
              <UserPlus size={18} strokeWidth={2} />
            </Link>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, ...SPRING }}
            className="relative mt-4"
          >
            <Search
              size={15}
              className="absolute"
              style={{
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.6)",
                pointerEvents: "none",
              }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="font-dm w-full"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "14px",
                padding: "11px 16px 11px 38px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                backdropFilter: "blur(8px)",
              }}
            />
          </motion.div>
        </div>
      </header>

      {/* ── LIST ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle, rgba(37,99,235,0.20) 0%, transparent 70%)",
                border: "1px solid rgba(37,99,235,0.25)",
              }}
            >
              <MessageCircle size={34} style={{ color: "#60a5fa" }} />
            </div>
            <div>
              <p
                className="font-clash font-bold text-frost"
                style={{ fontSize: "18px" }}
              >
                {t.empty}
              </p>
              <p
                className="font-dm text-whisper text-sm mt-1"
                style={{ maxWidth: "240px", lineHeight: 1.5 }}
              >
                {t.emptySub}
              </p>
            </div>
            <Link
              href="/profile/friends"
              className="flex items-center gap-2 font-dm font-medium active:scale-[0.96]"
              style={{
                marginTop: "4px",
                padding: "10px 20px",
                borderRadius: "99px",
                fontSize: "13px",
                color: "#fff",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                boxShadow: "0 8px 22px rgba(37,99,235,0.35)",
                transition: "transform 140ms cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              <UserPlus size={15} />
              {t.addFriends}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((c, i) => {
              const grad = gradFor(c.username ?? c.name);
              const initial = c.name.charAt(0).toUpperCase();
              const preview =
                c.lastBody === "__bill__"
                  ? t.sharedBill
                  : c.lastBody ?? "—";
              return (
                <motion.button
                  key={c.friendId}
                  onClick={() => router.push(`/chat/${c.friendId}`)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.035, ...SPRING }}
                  className="flex items-center gap-3.5 text-left active:scale-[0.985]"
                  style={{
                    borderRadius: "18px",
                    padding: "12px 14px",
                    background: "var(--theme-bg-card)",
                    border: "1px solid var(--theme-border)",
                    transition: "transform 140ms cubic-bezier(0.23,1,0.32,1)",
                  }}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className="flex items-center justify-center font-clash font-bold"
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "16px",
                        background: grad,
                        color: "#fff",
                        fontSize: "19px",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
                      }}
                    >
                      {initial}
                    </div>
                    {c.unread > 0 && (
                      <span
                        className="absolute font-clash font-bold flex items-center justify-center"
                        style={{
                          top: "-4px",
                          right: "-4px",
                          minWidth: "20px",
                          height: "20px",
                          padding: "0 5px",
                          borderRadius: "99px",
                          fontSize: "11px",
                          color: "#fff",
                          background: "linear-gradient(135deg, #fb7185, #e11d48)",
                          boxShadow: "0 2px 8px rgba(225,29,72,0.5)",
                          border: "2px solid var(--theme-bg-card)",
                        }}
                      >
                        {c.unread > 9 ? "9+" : c.unread}
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="font-clash font-bold truncate"
                        style={{
                          fontSize: "15px",
                          color: "var(--theme-text)",
                        }}
                      >
                        {c.name}
                      </p>
                      {c.lastAt && (
                        <span
                          className="font-dm shrink-0"
                          style={{
                            fontSize: "10.5px",
                            color: c.unread > 0 ? "#c4b5fd" : "#6d6d6d",
                            fontWeight: c.unread > 0 ? 600 : 400,
                          }}
                        >
                          {relTime(c.lastAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {c.lastBody === "__bill__" && (
                        <Receipt
                          size={12}
                          className="shrink-0"
                          style={{ color: "#34d399" }}
                        />
                      )}
                      <p
                        className="font-dm truncate"
                        style={{
                          fontSize: "12.5px",
                          color:
                            c.unread > 0
                              ? "var(--theme-text)"
                              : "var(--theme-text-muted)",
                          fontWeight: c.unread > 0 ? 500 : 400,
                        }}
                      >
                        {c.lastFromMe && c.lastBody ? `${t.you}: ` : ""}
                        {preview}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
