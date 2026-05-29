"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { Pencil, Trash2, ChevronDown } from "lucide-react";
import { Bill, Profile, ActivityLog } from "@/types";
import { createClient } from "@/lib/supabase";
import { formatRM, getDaysRemaining } from "@/lib/utils";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import Grainient from "@/components/ui/Grainient";
import NotificationBell from "@/components/organizer/NotificationBell";
import { useLang, dashboardT } from "@/lib/language-context";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

interface Props {
  profile: Profile | null;
  bills: Bill[];
  userId: string;
  activities: ActivityLog[];
}

// ─── Main dashboard ────────────────────────────────────────────────────────
export default function DashboardClient({
  profile,
  bills: initialBills,
  userId,
  activities,
}: Props) {
  const { lang } = useLang();
  const t = dashboardT[lang];
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [now, setNow] = useState<Date | null>(null);

  // ─── Bills pagination — accumulating "Show more" ──
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleBills = bills.slice(0, visibleCount);
  const hasMore = bills.length > visibleCount;

  function handleDeleteBill(id: string) {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }

  // Clock — client-only to avoid hydration mismatch
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bill_members" },
        async () => {
          const { data } = await supabase
            .from("bills")
            .select("*, bill_members(*)")
            .eq("organizer_id", userId)
            .in("status", ["active", "overdue"])
            .order("created_at", { ascending: false });
          if (data) setBills(data);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ─── Derived values ──
  const allMembers = bills.flatMap((b) => b.bill_members ?? []);
  const paidMembers = allMembers.filter((m) => m.paid);
  const totalCollected = paidMembers.reduce((s, m) => s + m.amount_owed, 0);
  const totalExpected = allMembers.reduce((s, m) => s + m.amount_owed, 0);
  const progressPct =
    totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
  const firstName = profile?.name?.split(" ")[0] ?? "Organizer";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const collectedToday = paidMembers
    .filter((m) => m.paid_at && new Date(m.paid_at) >= startOfToday)
    .reduce((s, m) => s + m.amount_owed, 0);

  // Sculptural split of the hero amount
  const intPart = Math.floor(totalCollected).toLocaleString("en-MY");
  const decPart = Math.round((totalCollected % 1) * 100)
    .toString()
    .padStart(2, "0");

  const dateLabel = now
    ? `${now.getDate()} ${now
        .toLocaleString(lang === "bm" ? "ms-MY" : "en-MY", { month: "short" })
        .toLowerCase()} · ${now
        .toLocaleTimeString(lang === "bm" ? "ms-MY" : "en-MY", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase()}`
    : "";

  return (
    <div
      className="theme-aware"
      style={{
        background: "var(--theme-bg)",
        minHeight: "100dvh",
        paddingBottom: "112px",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          HERO — atmospheric Deep Ocean orbs floating in space.
          monopo signature: "translucent spherical shapes as primary
          background visuals, creating a sense of depth and fluid motion."
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: "60vh" }}
      >
        {/* ── Grainient WebGL background — warm orange atmosphere ── */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <Grainient
            color1="#f97316"
            color2="#351e93"
            color3="#a07d0f"
            timeSpeed={0.25}
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
            saturation={1.1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>

        {/* ── Bottom fade — blends hero into theme bg below ── */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "32%",
            background:
              "linear-gradient(to bottom, transparent, var(--theme-bg) 95%)",
            pointerEvents: "none",
            zIndex: 1,
            transition: "background 320ms cubic-bezier(0.23,1,0.32,1)",
          }}
        />

        {/* ══════════ HERO CONTENT — floats on atmosphere ══════════ */}
        <div
          className="relative z-10 px-5 flex flex-col"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 24px)",
            paddingBottom: "32px",
            minHeight: "60vh",
          }}
        >
          {/* Live dot + date · notification bell */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: "easeInOut",
                }}
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px rgba(34,197,94,0.7)",
                  display: "inline-block",
                }}
              />
              <span
                className="font-dm uppercase"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  color: "rgba(245,240,232,0.5)",
                  textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                }}
              >
                {dateLabel || "·"}
              </span>
            </div>

            <NotificationBell activities={activities} />
          </motion.div>

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.05 }}
            className="mt-7"
          >
            <p
              className="font-dm"
              style={{
                fontSize: "13px",
                color: "rgba(245,240,232,0.55)",
                textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              }}
            >
              {t.greeting}
            </p>
            <h1
              className="font-clash"
              style={{
                fontSize: "44px",
                color: "#F5F0E8",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.02,
                marginTop: "2px",
                textShadow: "0 2px 16px rgba(0,0,0,0.55)",
              }}
            >
              {firstName}
            </h1>
          </motion.div>

          {/* Amount sculpture — pushed toward bottom of hero zone */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 }}
            className="mt-auto pt-16"
          >
            <p
              className="font-dm uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.20em",
                color: "rgba(245,240,232,0.5)",
                marginBottom: "6px",
                textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              }}
            >
              RM
            </p>
            <div
              className="flex items-baseline"
              style={{ lineHeight: 0.95 }}
            >
              <span
                className="font-clash"
                style={{
                  fontSize: "clamp(64px, 20vw, 96px)",
                  fontWeight: 500,
                  color: "#F5F0E8",
                  letterSpacing: "-0.04em",
                  fontFeatureSettings: '"tnum"',
                  textShadow: "0 4px 24px rgba(0,0,0,0.6)",
                }}
              >
                {intPart}
              </span>
              <span
                className="font-clash"
                style={{
                  fontSize: "clamp(64px, 20vw, 96px)",
                  fontWeight: 500,
                  color: "rgba(245,240,232,0.30)",
                  letterSpacing: "-0.04em",
                  fontFeatureSettings: '"tnum"',
                  textShadow: "0 4px 24px rgba(0,0,0,0.4)",
                }}
              >
                .{decPart}
              </span>
            </div>

            <p
              className="font-dm mt-4"
              style={{
                fontSize: "12px",
                color: "rgba(245,240,232,0.55)",
                textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              }}
            >
              {t.of} {formatRM(totalExpected)}
            </p>

            {/* Hairline progress — Deep Ocean fills with paid % */}
            <div
              className="mt-3 overflow-hidden rounded-full"
              style={{
                height: "1.5px",
                background: "rgba(255,255,255,0.10)",
              }}
            >
              <motion.div
                style={{
                  height: "100%",
                  background:
                    "linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 50%, rgb(165,45,37))",
                  transformOrigin: "left",
                  boxShadow: "0 0 12px rgba(255,172,46,0.4)",
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progressPct / 100 }}
                transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.4 }}
              />
            </div>

            <AnimatePresence>
              {collectedToday > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    delay: 0.6,
                    duration: 0.4,
                    ease: EASE_OUT,
                  }}
                  className="font-dm mt-3 flex items-center gap-1.5"
                  style={{ fontSize: "11px", color: "#a0e0ab" }}
                >
                  <span
                    style={{
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: "#a0e0ab",
                      display: "inline-block",
                      boxShadow: "0 0 4px rgba(160,224,171,0.6)",
                    }}
                  />
                  +{formatRM(collectedToday)} {t.collectedToday}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* ── STATS STRIP ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.3 }}
        className="px-5 py-7"
      >
        <div className="grid grid-cols-3">
          <StatCell value={bills.length} label={t.statBilAktif} />
          <StatCell
            value={allMembers.length}
            label={t.statJumlahAhli}
            divider
          />
          <StatCell
            value={paidMembers.length}
            label={t.statDahBayar}
            divider
            accent={paidMembers.length > 0}
          />
        </div>
      </motion.div>

      {/* ── HAIRLINE ───────────────────────────────────────────────────── */}
      <div
        className="mx-5"
        style={{ height: "1px", background: "var(--theme-hairline)" }}
      />

      {/* ── BILLS LIST ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-7">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex items-baseline justify-between mb-5"
        >
          <h2
            className="font-clash theme-aware"
            style={{
              fontSize: "13px",
              color: "var(--theme-text)",
              letterSpacing: "0.01em",
              fontWeight: 600,
            }}
          >
            {t.sectionBilAktif}
          </h2>
          <Link
            href="/bills"
            className="font-dm active:opacity-50 theme-aware"
            style={{
              fontSize: "11px",
              color: "var(--theme-text-muted)",
              letterSpacing: "0.04em",
              transition: "opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            {t.seeAll}
          </Link>
        </motion.div>

        {bills.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <>
            <div>
              {visibleBills.map((bill, i) => (
                <BillListRow
                  key={bill.id}
                  bill={bill}
                  delay={0.45 + i * 0.05}
                  isFirst={i === 0}
                  onDelete={handleDeleteBill}
                  t={t}
                />
              ))}
            </div>

            {/* ── Pagination footer ── */}
            <AnimatePresence>
              {hasMore && (
                <motion.div
                  key="show-more"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="flex flex-col items-center gap-2 pt-7 pb-2"
                >
                  <button
                    onClick={() =>
                      setVisibleCount((c) =>
                        Math.min(c + PAGE_SIZE, bills.length),
                      )
                    }
                    className="group flex items-center gap-1.5 font-dm active:opacity-60"
                    style={{
                      fontSize: "12px",
                      letterSpacing: "0.04em",
                      color: "#F5F0E8",
                      padding: "8px 4px",
                      transition:
                        "opacity 150ms cubic-bezier(0.23,1,0.32,1)",
                    }}
                  >
                    <span>{t.showMore}</span>
                    <motion.span
                      animate={{ y: [0, 2, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "easeInOut",
                      }}
                    >
                      <ChevronDown size={13} strokeWidth={1.8} />
                    </motion.span>
                  </button>
                  <span
                    className="font-dm uppercase"
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.16em",
                      color: "#6d6d6d",
                    }}
                  >
                    {t.showingXofY(visibleBills.length, bills.length)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stat cell ─────────────────────────────────────────────────────────────
function StatCell({
  value,
  label,
  divider = false,
  accent = false,
}: {
  value: number;
  label: string;
  divider?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-start gap-1.5"
      style={{
        borderLeft: divider ? "1px solid rgba(255,255,255,0.06)" : "none",
        paddingLeft: divider ? "20px" : "0",
      }}
    >
      <CountUp
        to={value}
        color={accent ? "#a0e0ab" : "var(--theme-text)"}
      />
      <span
        className="font-dm uppercase theme-aware"
        style={{
          fontSize: "9px",
          letterSpacing: "0.16em",
          color: "var(--theme-text-muted)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Count-up ──────────────────────────────────────────────────────────────
function CountUp({ to, color }: { to: number; color: string }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(count, to, {
      duration: 0.9,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [to, count]);
  return (
    <span
      className="font-clash"
      style={{
        fontSize: "30px",
        fontWeight: 500,
        color,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        fontFeatureSettings: '"tnum"',
      }}
    >
      {display}
    </span>
  );
}

// ─── Empty state — editorial, restrained ──────────────────────────────────
function EmptyState({
  t,
}: {
  t: (typeof dashboardT)[keyof typeof dashboardT];
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: EASE_OUT }}
      className="flex flex-col items-start gap-4 py-10"
    >
      <h3
        className="font-clash"
        style={{
          fontSize: "20px",
          color: "#F5F0E8",
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        {t.emptyTitle}
      </h3>
      <p
        className="font-dm"
        style={{
          fontSize: "13px",
          color: "#6d6d6d",
          lineHeight: 1.55,
          maxWidth: "320px",
        }}
      >
        {t.emptyDesc}
      </p>
      <div className="mt-2">
        <PrimaryButton
          href="/create"
          fullWidth={false}
          innerClassName="py-2.5 px-6 text-[13px]"
        >
          {t.createBill}
        </PrimaryButton>
      </div>
    </motion.div>
  );
}

// ─── Single bill row — swipe to reveal Edit / Padam ───────────────────────
// Interaction design (à la Emil Kowalski): the row tracks the finger 1:1,
// reveals two actions with spring physics, rubber-bands when over-pulled,
// and a full swipe arms a haptic-confirmed delete that collapses the row.
const EDIT_W = 78; // px slot for the Edit action
const DELETE_W = 78; // px slot for the Padam action
const REST = EDIT_W + DELETE_W; // resting open offset — both actions visible
const SPRING = { type: "spring", stiffness: 520, damping: 42 } as const;

function BillListRow({
  bill,
  delay,
  isFirst,
  onDelete,
  t,
}: {
  bill: Bill;
  delay: number;
  isFirst: boolean;
  onDelete: (id: string) => void;
  t: (typeof dashboardT)[keyof typeof dashboardT];
}) {
  const router = useRouter();
  const members = bill.bill_members ?? [];
  const paidCount = members.filter((m) => m.paid).length;
  const totalCount = members.length;
  const daysLeft = getDaysRemaining(bill.due_date);
  const isOverdue = daysLeft < 0;

  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wRef = useRef(320); // measured row width
  const armRef = useRef(220); // |x| past which a full-swipe delete arms
  const armedRef = useRef(false);
  const draggedRef = useRef(false);
  const removingRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Measure the row so the arm threshold scales with screen width.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      wRef.current = el.offsetWidth;
      armRef.current = Math.max(REST + 64, el.offsetWidth * 0.5);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Arm / disarm the full-swipe delete with a haptic tick on each crossing.
  useEffect(() => {
    const unsub = x.on("change", (v) => {
      const shouldArm = -v >= armRef.current;
      if (shouldArm !== armedRef.current) {
        armedRef.current = shouldArm;
        setArmed(shouldArm);
        navigator.vibrate?.(shouldArm ? 26 : 12);
      }
    });
    return unsub;
  }, [x]);

  // Padam panel grows leftward from its slot to fill the row as you over-pull,
  // swallowing the Edit action — the visual promise that release will delete.
  const deleteWidth = useTransform(x, (v) => {
    const span = armRef.current - REST;
    const tt = span > 0 ? clamp((-v - REST) / span, 0, 1) : 0;
    return DELETE_W + tt * (wRef.current - DELETE_W);
  });
  // Edit fades as the Padam panel closes over it.
  const editOpacity = useTransform(x, (v) => {
    const span = armRef.current - REST;
    return span > 0 ? clamp(1 - (-v - REST) / span, 0, 1) : 1;
  });

  function snapClosed() {
    animate(x, 0, SPRING);
    setOpen(false);
  }
  function snapOpen() {
    animate(x, -REST, SPRING);
    setOpen(true);
  }
  function commitDelete() {
    if (removingRef.current) return;
    removingRef.current = true;
    setArmed(true);
    navigator.vibrate?.([18, 28, 40]);
    // Slide fully off, then collapse the row height → onAnimationComplete deletes.
    animate(x, -wRef.current, {
      ...SPRING,
      onComplete: () => setRemoving(true),
    });
  }
  async function finalizeDelete() {
    const supabase = createClient();
    await supabase.from("bills").delete().eq("id", bill.id);
    onDelete(bill.id);
  }

  function handleClick() {
    if (draggedRef.current) return; // ignore the click that ends a drag
    if (open) {
      snapClosed();
      return;
    }
    router.push(`/bills/${bill.id}`);
  }

  const dueLabel = isOverdue
    ? t.daysAgo(Math.abs(daysLeft))
    : daysLeft === 0
    ? t.today
    : t.daysLeft(daysLeft);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 6 }}
      animate={
        removing
          ? { height: 0, opacity: 0 }
          : { height: "auto", opacity: 1, y: 0 }
      }
      transition={
        removing
          ? { duration: 0.34, ease: EASE_OUT }
          : { delay, duration: 0.4, ease: EASE_OUT }
      }
      onAnimationComplete={() => {
        if (removing) finalizeDelete();
      }}
      style={{
        position: "relative",
        overflow: "hidden",
        borderTop: isFirst ? "none" : "1px solid var(--theme-hairline)",
      }}
    >
      {/* ── Action layer (revealed beneath the row) ── */}
      <div style={{ position: "absolute", inset: 0 }} aria-hidden={!open}>
        {/* Edit */}
        <motion.button
          onClick={() => {
            snapClosed();
            router.push(`/bills/${bill.id}?edit=1`);
          }}
          tabIndex={open ? 0 : -1}
          className="flex flex-col items-center justify-center gap-1 font-dm active:opacity-70"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: DELETE_W,
            width: EDIT_W,
            opacity: editOpacity,
            background: "var(--theme-surface-tint-2)",
            color: "var(--theme-text)",
            fontSize: "11px",
            letterSpacing: "0.02em",
          }}
        >
          <Pencil size={17} strokeWidth={1.8} />
          Edit
        </motion.button>

        {/* Padam — expands on full swipe */}
        <motion.button
          onClick={commitDelete}
          tabIndex={open ? 0 : -1}
          className="flex items-center"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: deleteWidth,
            justifyContent: "flex-end",
            paddingRight: (DELETE_W - 24) / 2,
            background: armed ? "#ef4444" : "rgba(220,38,38,0.92)",
            color: "#fff",
            transition: "background 180ms cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <motion.span
            className="flex flex-col items-center gap-1 font-dm"
            animate={{ scale: armed ? 1.12 : 1 }}
            transition={SPRING}
            style={{ fontSize: "11px", letterSpacing: "0.02em" }}
          >
            <Trash2 size={17} strokeWidth={1.8} />
            Padam
          </motion.span>
        </motion.button>
      </div>

      {/* ── Foreground row (draggable, opaque) ── */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -wRef.current, right: 0 }}
        dragElastic={{ left: 0.04, right: 0.12 }}
        dragMomentum={false}
        style={{
          x,
          position: "relative",
          background: "var(--theme-bg)",
          touchAction: "pan-y",
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
        onDragStart={() => {
          draggedRef.current = false;
        }}
        onDrag={(_, info) => {
          if (Math.abs(info.offset.x) > 4) draggedRef.current = true;
        }}
        onDragEnd={(_, info) => {
          const offset = -x.get();
          const vx = info.velocity.x;
          if (offset >= armRef.current || (vx < -750 && offset > REST)) {
            commitDelete();
          } else if (offset > REST / 2 || vx < -350) {
            snapOpen();
          } else {
            snapClosed();
          }
          // Let the click handler see the drag, then clear the flag.
          setTimeout(() => {
            draggedRef.current = false;
          }, 0);
        }}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        className="flex items-center gap-4 py-5 cursor-pointer active:opacity-95"
      >
        {/* Category icon — monochrome, outlined */}
        <div className="shrink-0">
          <CategoryIcon category={bill.category} size={22} />
        </div>

        {/* Title + sub */}
        <div className="flex-1 min-w-0">
          <p
            className="font-clash truncate theme-aware"
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--theme-text)",
              letterSpacing: "-0.005em",
              lineHeight: 1.2,
            }}
          >
            {bill.title}
          </p>
          <p
            className="font-dm mt-1 theme-aware"
            style={{
              fontSize: "11px",
              color: isOverdue ? "rgb(220,90,80)" : "var(--theme-text-muted)",
              letterSpacing: "0.02em",
            }}
          >
            {paidCount}/{totalCount} · {dueLabel}
          </p>
        </div>

        {/* Amount — right-aligned mono numeric */}
        <span
          className="font-clash shrink-0 theme-aware"
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--theme-text)",
            letterSpacing: "-0.01em",
            fontFeatureSettings: '"tnum"',
          }}
        >
          {formatRM(bill.total_amount)}
        </span>
      </motion.div>
    </motion.div>
  );
}
