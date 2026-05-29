"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Receipt, Plus, X, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Message } from "@/types";
import { formatRM, formatTime } from "@/lib/utils";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { useLang, chatT } from "@/lib/language-context";

const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;
const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

interface Friend {
  id: string;
  name: string;
  username?: string;
}

interface ShareBill {
  id: string;
  title: string;
  pay_code: string;
  total_amount: number;
  category: string;
}

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

const SENT_GRAD = "linear-gradient(135deg, #7c3aed, #4f46e5 55%, #db2777)";

export default function ConversationClient({
  userId,
  friend,
  initialMessages,
  shareableBills,
}: {
  userId: string;
  friend: Friend;
  initialMessages: Message[];
  shareableBills: ShareBill[];
}) {
  const { lang } = useLang();
  const t = chatT[lang];
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const grad = gradFor(friend.username ?? friend.name);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  // Auto-scroll to newest
  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    });
  }
  useEffect(() => {
    scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Realtime — incoming messages from this friend
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${userId}-${friend.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          const row = payload.new as Message;
          if (row.sender_id !== friend.id) return;
          // Fetch with bill join for bill_share rendering
          const { data } = await supabase
            .from("messages")
            .select("*, bills(id, title, pay_code, total_amount, category)")
            .eq("id", row.id)
            .single();
          const full = (data as Message) ?? row;
          setMessages((prev) =>
            prev.some((m) => m.id === full.id) ? prev : [...prev, full]
          );
          // Mark read immediately since the chat is open
          supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("id", row.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, friend.id]);

  async function sendText() {
    const body = draft.trim();
    if (!body || sending) return;
    setDraft("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender_id: userId,
      recipient_id: friend.id,
      body,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: friend.id, body }),
      });
      const json = (await res.json()) as { message?: Message };
      if (json.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? json.message! : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  }

  async function shareBillInChat(bill: ShareBill) {
    setSheetOpen(false);
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender_id: userId,
      recipient_id: friend.id,
      message_type: "bill_share",
      bill_id: bill.id,
      created_at: new Date().toISOString(),
      bills: {
        id: bill.id,
        title: bill.title,
        pay_code: bill.pay_code,
        total_amount: bill.total_amount,
        category: bill.category,
      },
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: friend.id,
          billId: bill.id,
          messageType: "bill_share",
        }),
      });
      const json = (await res.json()) as { message?: Message };
      if (json.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? json.message! : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }

  function shareBillWhatsApp(bill: ShareBill) {
    setSheetOpen(false);
    const link = `${appUrl}/pay/${bill.pay_code}`;
    const msg =
      lang === "bm"
        ? `Hai! Jom settle bil "${bill.title}" (${formatRM(
            bill.total_amount
          )}). Pay Code: ${bill.pay_code}. Bayar di sini: ${link}`
        : `Hi! Let's settle the bill "${bill.title}" (${formatRM(
            bill.total_amount
          )}). Pay Code: ${bill.pay_code}. Pay here: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div
      className="theme-aware flex flex-col"
      style={{ background: "var(--theme-bg)", minHeight: "100dvh" }}
    >
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 md:top-[60px] flex items-center gap-3 px-4 py-3"
        style={{
          background: "var(--theme-bg-overlay)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          paddingTop: "calc(env(safe-area-inset-top) + 12px)",
        }}
      >
        <button
          onClick={() => router.push("/chat")}
          className="active:scale-[0.88] shrink-0"
          style={{
            color: "var(--theme-text-muted)",
            transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)",
          }}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>

        <div
          className="flex items-center justify-center font-clash font-bold shrink-0"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "13px",
            background: grad,
            color: "#fff",
            fontSize: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
          }}
        >
          {friend.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="font-clash font-bold truncate"
            style={{ fontSize: "15px", color: "var(--theme-text)" }}
          >
            {friend.name}
          </p>
          <div className="flex items-center gap-1.5">
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#34d399",
                boxShadow: "0 0 6px rgba(52,211,153,0.7)",
              }}
            />
            <span
              className="font-dm"
              style={{ fontSize: "11px", color: "var(--theme-text-muted)" }}
            >
              {friend.username ? `@${friend.username}` : t.online}
            </span>
          </div>
        </div>
      </header>

      {/* ── MESSAGES ─────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-5"
        style={{ paddingBottom: "168px" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle, rgba(124,58,237,0.20) 0%, transparent 70%)",
                border: "1px solid rgba(124,58,237,0.22)",
              }}
            >
              <MessageSquare size={28} style={{ color: "#a78bfa" }} />
            </div>
            <p
              className="font-dm text-whisper text-sm"
              style={{ maxWidth: "220px", lineHeight: 1.5 }}
            >
              {lang === "bm"
                ? `Mula bersembang dengan ${friend.name}`
                : `Start chatting with ${friend.name}`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {messages.map((m) => {
                const mine = m.sender_id === userId;
                return (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={SPRING}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    {m.message_type === "bill_share" ? (
                      <BillShareBubble
                        message={m}
                        mine={mine}
                        appUrl={appUrl}
                        t={t}
                      />
                    ) : (
                      <TextBubble message={m} mine={mine} />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── COMPOSER ─────────────────────────────────────────────────────── */}
      <div
        className="fixed left-0 right-0 z-30 max-w-mobile md:max-w-2xl mx-auto bottom-[72px] md:bottom-0"
        style={{
          background: "var(--theme-bg-overlay)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2 px-3 py-3">
          {/* Share bill */}
          <button
            onClick={() => setSheetOpen(true)}
            className="shrink-0 flex items-center justify-center active:scale-[0.9]"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #34d399, #0ea5e9)",
              color: "#fff",
              boxShadow: "0 6px 16px rgba(14,165,233,0.32)",
              transition: "transform 140ms cubic-bezier(0.23,1,0.32,1)",
            }}
            aria-label={t.shareBill}
          >
            <Plus size={20} strokeWidth={2.4} />
          </button>

          {/* Input */}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            placeholder={t.typePlaceholder}
            className="font-dm flex-1 min-w-0"
            style={{
              background: "var(--theme-bg-card)",
              border: "1px solid var(--theme-border-strong)",
              borderRadius: "99px",
              padding: "11px 18px",
              color: "var(--theme-text)",
              fontSize: "14px",
              outline: "none",
            }}
          />

          {/* Send */}
          <button
            onClick={sendText}
            disabled={!draft.trim() || sending}
            className="shrink-0 flex items-center justify-center active:scale-[0.9] disabled:opacity-40"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              background: SENT_GRAD,
              color: "#fff",
              boxShadow: "0 6px 16px rgba(124,58,237,0.35)",
              transition:
                "transform 140ms cubic-bezier(0.23,1,0.32,1), opacity 150ms",
            }}
            aria-label={t.send}
          >
            <Send size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* ── SHARE BILL SHEET ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.72)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              key="sheet"
              className="fixed bottom-0 left-0 right-0 max-w-mobile md:max-w-2xl mx-auto z-50"
              style={{
                background: "var(--theme-bg-elevated)",
                borderRadius: "24px 24px 0 0",
                borderTop: "1px solid var(--theme-border)",
                maxHeight: "72vh",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.34, ease: EASE_DRAWER }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div
                  style={{
                    width: "36px",
                    height: "4px",
                    borderRadius: "99px",
                    background: "rgba(255,255,255,0.15)",
                  }}
                />
              </div>

              <div className="flex items-center justify-between px-5 pt-2 pb-3">
                <div>
                  <p
                    className="font-clash font-bold"
                    style={{ fontSize: "18px", color: "var(--theme-text)" }}
                  >
                    {t.shareBillTitle}
                  </p>
                  <p
                    className="font-dm"
                    style={{ fontSize: "12px", color: "var(--theme-text-muted)" }}
                  >
                    {t.shareBillSub}
                  </p>
                </div>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="active:scale-[0.9]"
                  style={{ color: "var(--theme-text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div
                className="px-4 pb-8 overflow-y-auto scrollbar-hide"
                style={{ maxHeight: "56vh" }}
              >
                {shareableBills.length === 0 ? (
                  <p
                    className="font-dm text-center py-10"
                    style={{ fontSize: "13px", color: "var(--theme-text-muted)" }}
                  >
                    {t.noBills}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {shareableBills.map((bill) => (
                      <div
                        key={bill.id}
                        className="overflow-hidden"
                        style={{
                          borderRadius: "18px",
                          background: "var(--theme-bg-card)",
                          border: "1px solid var(--theme-border)",
                        }}
                      >
                        <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
                          <CategoryIcon category={bill.category} size={22} />
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-clash font-bold truncate"
                              style={{
                                fontSize: "14px",
                                color: "var(--theme-text)",
                              }}
                            >
                              {bill.title}
                            </p>
                            <p
                              className="font-dm"
                              style={{
                                fontSize: "11.5px",
                                color: "var(--theme-text-muted)",
                              }}
                            >
                              {formatRM(bill.total_amount)} · {bill.pay_code}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-px" style={{ background: "var(--theme-border)" }}>
                          <button
                            onClick={() => shareBillInChat(bill)}
                            className="flex items-center justify-center gap-1.5 py-3 font-dm font-medium active:opacity-70"
                            style={{
                              background: "var(--theme-bg-card)",
                              color: "#a78bfa",
                              fontSize: "12.5px",
                            }}
                          >
                            <MessageSquare size={14} />
                            {t.sendInChat}
                          </button>
                          <button
                            onClick={() => shareBillWhatsApp(bill)}
                            className="flex items-center justify-center gap-1.5 py-3 font-dm font-medium active:opacity-70"
                            style={{
                              background: "var(--theme-bg-card)",
                              color: "#34d399",
                              fontSize: "12.5px",
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                            </svg>
                            {t.sendWhatsApp}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Text bubble ────────────────────────────────────────────────────────────
function TextBubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <div
      className="flex flex-col"
      style={{ maxWidth: "78%", alignItems: mine ? "flex-end" : "flex-start" }}
    >
      <div
        className="font-dm"
        style={{
          padding: "10px 14px",
          fontSize: "14px",
          lineHeight: 1.45,
          color: mine ? "#fff" : "var(--theme-text)",
          background: mine ? SENT_GRAD : "var(--theme-bg-card)",
          border: mine ? "none" : "1px solid var(--theme-border)",
          borderRadius: mine
            ? "18px 18px 5px 18px"
            : "18px 18px 18px 5px",
          boxShadow: mine
            ? "0 6px 18px rgba(124,58,237,0.28)"
            : "none",
          wordBreak: "break-word",
        }}
      >
        {message.body}
      </div>
      <span
        className="font-dm"
        style={{ fontSize: "9.5px", color: "#6d6d6d", margin: "3px 6px 0" }}
      >
        {formatTime(message.created_at)}
      </span>
    </div>
  );
}

// ─── Bill share bubble ──────────────────────────────────────────────────────
function BillShareBubble({
  message,
  mine,
  appUrl,
  t,
}: {
  message: Message;
  mine: boolean;
  appUrl: string;
  t: (typeof chatT)[keyof typeof chatT];
}) {
  const bill = message.bills;
  if (!bill) return null;

  return (
    <div
      className="flex flex-col"
      style={{ maxWidth: "82%", alignItems: mine ? "flex-end" : "flex-start" }}
    >
      <div
        className="overflow-hidden"
        style={{
          width: "min(74vw, 280px)",
          borderRadius: mine ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
          background: "var(--theme-bg-card)",
          border: "1px solid var(--theme-border-strong)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        {/* Colorful header strip */}
        <div
          className="flex items-center gap-2 px-3.5 py-2"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #db2777)",
          }}
        >
          <Receipt size={13} color="#fff" />
          <span
            className="font-dm font-medium"
            style={{ fontSize: "11px", color: "#fff", letterSpacing: "0.02em" }}
          >
            {t.sharedBill}
          </span>
        </div>

        <div className="px-3.5 pt-3 pb-3">
          <div className="flex items-center gap-2.5">
            <CategoryIcon category={bill.category} size={20} />
            <p
              className="font-clash font-bold flex-1 min-w-0 truncate"
              style={{ fontSize: "15px", color: "var(--theme-text)" }}
            >
              {bill.title}
            </p>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div>
              <p
                className="font-dm uppercase"
                style={{
                  fontSize: "8.5px",
                  letterSpacing: "0.12em",
                  color: "var(--theme-text-muted)",
                }}
              >
                {t.payCode}
              </p>
              <p
                className="font-jetbrains"
                style={{
                  fontSize: "13px",
                  color: "#a78bfa",
                  letterSpacing: "2px",
                  marginTop: "1px",
                }}
              >
                {bill.pay_code}
              </p>
            </div>
            <p
              className="font-clash font-bold"
              style={{ fontSize: "18px", color: "var(--theme-text)" }}
            >
              {formatRM(bill.total_amount)}
            </p>
          </div>

          <Link
            href={`${appUrl}/pay/${bill.pay_code}`}
            target="_blank"
            className="flex items-center justify-center mt-3 font-dm font-medium active:scale-[0.97]"
            style={{
              padding: "9px",
              borderRadius: "12px",
              fontSize: "12.5px",
              color: "#fff",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              boxShadow: "0 6px 16px rgba(124,58,237,0.3)",
              transition: "transform 140ms cubic-bezier(0.23,1,0.32,1)",
            }}
          >
            {t.viewBill}
          </Link>
        </div>
      </div>
      <span
        className="font-dm"
        style={{ fontSize: "9.5px", color: "#6d6d6d", margin: "3px 6px 0" }}
      >
        {formatTime(message.created_at)}
      </span>
    </div>
  );
}
