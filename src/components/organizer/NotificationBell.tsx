"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ArrowUpRight } from "lucide-react";
import { ActivityLog, ActivityType } from "@/types";
import { formatTime } from "@/lib/utils";
import { useLang, notifT } from "@/lib/language-context";

const SEEN_KEY = "kolekduit_notif_seen_at";
const SPRING = { type: "spring", stiffness: 420, damping: 32 } as const;

// Per-type accent gradient — colorful, non-minimalist (Emil Kowalski vibe)
function accent(type: ActivityType): { grad: string; glyph: string } {
  switch (type) {
    case "payment_confirmed":
    case "payment_manual":
    case "bill_completed":
      return { grad: "linear-gradient(135deg, #34d399, #059669)", glyph: "✓" };
    case "flag_resolved":
      return { grad: "linear-gradient(135deg, #38bdf8, #6366f1)", glyph: "✓" };
    case "flag_created":
      return { grad: "linear-gradient(135deg, #fb7185, #e11d48)", glyph: "⚑" };
    case "reminder_sent":
      return { grad: "linear-gradient(135deg, #fbbf24, #f59e0b)", glyph: "◎" };
    case "bill_created":
      return { grad: "linear-gradient(135deg, #c084fc, #7c3aed)", glyph: "+" };
    default:
      return { grad: "linear-gradient(135deg, #94a3b8, #475569)", glyph: "·" };
  }
}

export default function NotificationBell({
  activities,
}: {
  activities: ActivityLog[];
}) {
  const { lang } = useLang();
  const t = notifT[lang];
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  const newestTs = useMemo(
    () =>
      activities.reduce(
        (max, a) => Math.max(max, new Date(a.created_at).getTime()),
        0
      ),
    [activities]
  );

  useEffect(() => {
    setMounted(true);
    const stored = Number(localStorage.getItem(SEEN_KEY) ?? "0");
    setSeenAt(stored);
  }, []);

  const unseen = useMemo(
    () =>
      mounted
        ? activities.filter((a) => new Date(a.created_at).getTime() > seenAt)
            .length
        : 0,
    [activities, seenAt, mounted]
  );

  function markSeen() {
    setSeenAt(newestTs);
    localStorage.setItem(SEEN_KEY, String(newestTs));
  }

  function toggle() {
    if (!open) markSeen();
    setOpen((v) => !v);
  }

  const recent = activities.slice(0, 6);

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label={t.title}
        className="relative flex items-center justify-center active:scale-[0.92]"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "#F5F0E8",
          transition: "transform 140ms cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        <Bell size={18} strokeWidth={1.9} />
        <AnimatePresence>
          {unseen > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={SPRING}
              className="absolute font-clash font-bold flex items-center justify-center"
              style={{
                top: "-5px",
                right: "-5px",
                minWidth: "18px",
                height: "18px",
                padding: "0 5px",
                borderRadius: "99px",
                fontSize: "10px",
                color: "#fff",
                background: "linear-gradient(135deg, #fb7185, #e11d48)",
                boxShadow: "0 2px 8px rgba(225,29,72,0.55)",
                border: "1.5px solid var(--theme-bg, #000)",
              }}
            >
              {unseen > 9 ? "9+" : unseen}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="nb-backdrop"
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ background: "rgba(0,0,0,0.35)" }}
              onClick={() => setOpen(false)}
            />

            {/* Popup */}
            <motion.div
              key="nb-popup"
              initial={{ opacity: 0, scale: 0.92, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -8 }}
              transition={SPRING}
              className="absolute right-0 z-50 overflow-hidden"
              style={{
                top: "calc(100% + 10px)",
                width: "min(86vw, 320px)",
                transformOrigin: "top right",
                borderRadius: "22px",
                background: "rgba(14,14,18,0.86)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow:
                  "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,58,237,0.10)",
              }}
            >
              {/* Colorful gradient header strip */}
              <div
                style={{
                  height: "3px",
                  background:
                    "linear-gradient(90deg, #7c3aed, #db2777 35%, #f59e0b 70%, #06b6d4)",
                }}
              />

              <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
                <span
                  className="font-clash font-bold"
                  style={{ fontSize: "15px", color: "#F5F0E8" }}
                >
                  {t.title}
                </span>
                {activities.length > 0 && (
                  <span
                    className="font-dm"
                    style={{
                      fontSize: "10px",
                      color: "#c4b5fd",
                      background: "rgba(124,58,237,0.18)",
                      borderRadius: "99px",
                      padding: "2px 9px",
                    }}
                  >
                    {activities.length}
                  </span>
                )}
              </div>

              {/* List */}
              <div
                className="overflow-y-auto scrollbar-hide"
                style={{ maxHeight: "min(56vh, 360px)" }}
              >
                {recent.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
                    <span style={{ fontSize: "28px" }}>🔔</span>
                    <p
                      className="font-dm"
                      style={{ fontSize: "13px", color: "#F5F0E8" }}
                    >
                      {t.empty}
                    </p>
                    <p
                      className="font-dm"
                      style={{ fontSize: "11px", color: "#6d6d6d" }}
                    >
                      {t.emptySub}
                    </p>
                  </div>
                ) : (
                  recent.map((a, i) => {
                    const { grad, glyph } = accent(a.activity_type);
                    const billId = (a.bills as { id: string } | null)?.id;
                    const billTitle = (a.bills as { title?: string } | null)
                      ?.title;
                    const inner = (
                      <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 + i * 0.035, ...SPRING }}
                        className="flex gap-3 px-4 py-2.5 active:opacity-70"
                        style={{
                          borderTop:
                            i === 0
                              ? "none"
                              : "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div
                          className="shrink-0 flex items-center justify-center font-clash font-bold"
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "10px",
                            background: grad,
                            color: "#fff",
                            fontSize: "13px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                          }}
                        >
                          {glyph}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-dm leading-snug"
                            style={{
                              fontSize: "12.5px",
                              color: "#F5F0E8",
                            }}
                          >
                            {a.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {billTitle && (
                              <span
                                className="font-dm truncate"
                                style={{ fontSize: "10.5px", color: "#8b8b9e" }}
                              >
                                {billTitle}
                              </span>
                            )}
                            <span
                              className="font-dm shrink-0"
                              style={{ fontSize: "10px", color: "#5a5a6a" }}
                            >
                              · {formatTime(a.created_at)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                    return billId ? (
                      <Link
                        key={a.id}
                        href={`/bills/${billId}`}
                        onClick={() => setOpen(false)}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div key={a.id}>{inner}</div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <Link
                href="/inbox"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 py-3 active:opacity-70"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(124,58,237,0.10)",
                }}
              >
                <span
                  className="font-dm font-medium"
                  style={{ fontSize: "12.5px", color: "#c4b5fd" }}
                >
                  {t.viewMore}
                </span>
                <ArrowUpRight size={14} color="#c4b5fd" strokeWidth={2.2} />
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
