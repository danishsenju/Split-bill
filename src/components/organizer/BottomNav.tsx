"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Receipt, Plus, Inbox, User, ArrowRight } from "lucide-react";
import { useLang, navT } from "@/lib/language-context";
import CategoryIcon from "@/components/ui/CategoryIcon";

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
        className="md:hidden fixed bottom-0 left-0 right-0 max-w-mobile mx-auto z-30"
        style={{
          background: "#000000",
          borderTop: "1px solid transparent",
          backgroundImage:
            "linear-gradient(#000000, #000000), var(--gradient-deep-ocean)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
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
                  style={{ color: active ? "#ffffff" : "#6d6d6d" }}
                />
                <span
                  className="font-dm leading-none"
                  style={{
                    fontSize: "10px",
                    color: active ? "#ffffff" : "#6d6d6d",
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

                {/* 4×2 grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {CATEGORIES.map(({ key, label }, i) => {
                    const isSelected = selected === key;
                    return (
                      <motion.button
                        key={key}
                        onClick={() => setSelected(key)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: i * 0.03,
                          ease: [0.23, 1, 0.32, 1],
                        }}
                        whileTap={{ scale: 0.94 }}
                        className="flex flex-col items-center gap-2 py-3 px-1"
                        style={{
                          borderRadius: "14px",
                          border: isSelected
                            ? "1.5px solid rgba(212,175,55,0.7)"
                            : "1.5px solid rgba(255,255,255,0.06)",
                          background: isSelected
                            ? "rgba(212,175,55,0.08)"
                            : "rgba(255,255,255,0.03)",
                          transition:
                            "background 150ms cubic-bezier(0.23,1,0.32,1), border-color 150ms cubic-bezier(0.23,1,0.32,1)",
                        }}
                      >
                        <CategoryIcon category={key} size={28} />
                        <span
                          className="font-dm leading-none text-center"
                          style={{
                            fontSize: "10px",
                            color: isSelected ? "#D4AF37" : "#8B9E88",
                            transition: "color 150ms cubic-bezier(0.23,1,0.32,1)",
                          }}
                        >
                          {label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Confirm button */}
                <motion.button
                  onClick={confirm}
                  disabled={!selected}
                  whileTap={selected ? { scale: 0.97 } : {}}
                  transition={{ duration: 0.12 }}
                  className="w-full flex items-center justify-center gap-2 font-dm font-semibold"
                  style={{
                    height: "52px",
                    borderRadius: "14px",
                    fontSize: "15px",
                    background: selected
                      ? "var(--gradient-deep-ocean)"
                      : "rgba(255,255,255,0.06)",
                    color: selected ? "#000000" : "rgba(255,255,255,0.25)",
                    transition:
                      "background 200ms cubic-bezier(0.23,1,0.32,1), color 200ms cubic-bezier(0.23,1,0.32,1)",
                    cursor: selected ? "pointer" : "not-allowed",
                  }}
                >
                  Teruskan
                  <ArrowRight size={16} strokeWidth={2.5} />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
