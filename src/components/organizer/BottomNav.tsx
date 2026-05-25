"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Receipt, Plus, Inbox, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Utama" },
  { href: "/bills", icon: Receipt, label: "Bil" },
  { href: "/create", icon: Plus, label: "", isCTA: true },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/profile", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 max-w-mobile mx-auto z-30"
      style={{
        background: "#000000",
        // Gradient top border — distinctive monopo detail
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
              <Link key={href} href={href} className="relative">
                <motion.div
                  whileTap={{ scale: 0.92 }}
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
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-1 py-1 px-2"
            >
              {/* Active dot indicator */}
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
  );
}
