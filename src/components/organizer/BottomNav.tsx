"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Receipt, Plus, Inbox, User, ArrowRight } from "lucide-react";
import { useLang, navT } from "@/lib/language-context";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const CATEGORIES = [
  { key: "🍽️ Makan",     label: "Food" },
  { key: "🎉 Hiburan",   label: "Fun" },
  { key: "✈️ Trip",      label: "Trip" },
  { key: "🏠 Rumah",     label: "Home" },
  { key: "🏥 Kesihatan", label: "Health" },
  { key: "📚 Belajar",   label: "Study" },
  { key: "🛒 Beli-belah",label: "Shopping" },
  { key: "💡 Lain-lain", label: "Others" },
];

const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();
  const t = navT[lang];

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t.home },
    { href: "/bills", icon: Receipt, label: t.bills },
    { href: "/create", icon: Plus, label: "", isCTA: true },
    { href: "/inbox", icon: Inbox, label: t.inbox },
    { href: "/profile", icon: User, label: t.profile },
  ];

  function openSheet() {
    setSelected(null);
    setSheetOpen(true);
  }

  function confirm() {
    if (!selected) return;
    setSheetOpen(false);
    router.push(`/create?category=${encodeURIComponent(selected)}`);
  }

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 max-w-mobile mx-auto z-30 theme-aware"
        style={{
          background: "var(--theme-bg)",
          borderTop: "1px solid var(--theme-border)",
        }}
      >
        <div className="flex items-center justify-around px-3 py-2">
          {navItems.map(({ href, icon: Icon, label, isCTA }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

            if (isCTA) {
              return (
                <button key={href} onClick={openSheet} className="relative">
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    transition={{ duration: 0.1 }}
                    className="flex items-center justify-center"
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "75.024px",
                      background: "var(--gradient-deep-ocean)",
                    }}
                  >
                    <Icon size={22} color="#000000" strokeWidth={2.5} />
                  </motion.div>
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-1 py-1 px-2"
              >
                {active && (
                  <motion.span
                    layoutId="bottomnav-indicator"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: "var(--gradient-deep-ocean)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.5}
                  style={{
                    color: active
                      ? "var(--theme-text)"
                      : "var(--theme-text-muted)",
                  }}
                />
                <span
                  className="font-dm leading-none theme-aware"
                  style={{
                    fontSize: "10px",
                    color: active
                      ? "var(--theme-text)"
                      : "var(--theme-text-muted)",
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Category sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Backdrop */}
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

            {/* Sheet */}
            <motion.div
              key="sheet"
              className="fixed bottom-0 left-0 right-0 max-w-mobile mx-auto z-50"
              style={{
                background: "#0D0D0D",
                borderRadius: "24px 24px 0 0",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.32, ease: EASE_DRAWER }}
            >
              {/* Drag handle */}
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

              <div className="px-5 pt-2 pb-8">
                {/* Heading */}
                <p
                  className="font-syne font-bold mb-5"
                  style={{ fontSize: "18px", color: "#F5F0E8" }}
                >
                  Pilih Kategori
                </p>

                {/* 4×2 grid — monopo style: monochrome, distinction by surface */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {CATEGORIES.map(({ key, label }, i) => {
                    const isSelected = selected === key;
                    return (
                      <motion.button
                        key={key}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: i * 0.03,
                          ease: [0.23, 1, 0.32, 1],
                        }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelected(key)}
                        className="relative overflow-hidden flex flex-col items-center justify-center gap-2 py-5 px-2"
                        style={{
                          background: isSelected ? "#161616" : "#0a0a0a",
                          border: `1px solid ${
                            isSelected
                              ? "rgba(255,255,255,0.40)"
                              : "rgba(255,255,255,0.06)"
                          }`,
                          borderRadius: "14px",
                          transition:
                            "background 220ms cubic-bezier(0.23,1,0.32,1), border-color 220ms cubic-bezier(0.23,1,0.32,1)",
                        }}
                      >
                        {/* Deep Ocean halo — only on selected, atmospheric warmth */}
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,172,46,0.08) 0%, transparent 65%)",
                              filter: "blur(8px)",
                            }}
                          />
                        )}

                        <span className="relative z-10">
                          <CategoryIcon
                            category={key}
                            size={28}
                            selected={isSelected}
                          />
                        </span>
                        <span
                          className="relative z-10 font-dm leading-none text-center"
                          style={{
                            fontSize: "10px",
                            letterSpacing: isSelected ? "0" : "0.04em",
                            fontWeight: isSelected ? 500 : 400,
                            color: isSelected ? "#F5F0E8" : "#6d6d6d",
                            transition:
                              "color 220ms cubic-bezier(0.23,1,0.32,1), letter-spacing 220ms",
                          }}
                        >
                          {label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Confirm button */}
                <PrimaryButton
                  onClick={confirm}
                  disabled={!selected}
                  innerClassName="py-3.5 text-[15px]"
                >
                  Teruskan
                  <ArrowRight size={16} strokeWidth={2.5} />
                </PrimaryButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
