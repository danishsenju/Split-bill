"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useLang, navT } from "@/lib/language-context";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();
  const t = navT[lang];
  const [userInitial, setUserInitial] = useState("U");
  const [showDropdown, setShowDropdown] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/bills", label: t.bills },
    { href: "/create", label: t.createBill, isCTA: true },
    { href: "/chat", label: t.chat },
  ];

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data }) => {
      if (data.user) {
        const name = data.user.user_metadata?.full_name as string | undefined;
        const email = data.user.email ?? "";
        setUserInitial((name?.[0] ?? email[0] ?? "U").toUpperCase());
      }
    });
  }, []);

  async function handleLogout() {
    const client = createClient();
    await client.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <header
      className="hidden md:block fixed top-0 left-0 right-0 z-40 theme-aware"
      style={{
        background: "var(--theme-bg-overlay)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--theme-border)",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 h-[60px] flex items-center justify-between">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center">
          <span
            className="font-clash font-bold leading-none theme-aware"
            style={{ fontSize: "20px", color: "var(--theme-text)" }}
          >
            Bayar
            <span
              style={{
                background: "var(--gradient-deep-ocean)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Lah
            </span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-6">
          {navLinks.map(({ href, label, isCTA }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

            if (isCTA) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="font-dm text-sm font-medium active:opacity-70"
                  style={{
                    background: "var(--gradient-deep-ocean)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    transition: "opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                >
                  {label}
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-0.5 font-dm text-sm transition-colors duration-150"
                style={{
                  color: active
                    ? "var(--theme-text)"
                    : "var(--theme-text-muted)",
                  transition: "color 150ms cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                {label}
                {active && (
                  <motion.span
                    layoutId="topnav-indicator"
                    className="absolute -bottom-[18px] left-0 right-0"
                    style={{
                      height: "1px",
                      background: "var(--gradient-deep-ocean)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-1.5 active:opacity-70"
            style={{
              background: "transparent",
              border: "1px solid var(--theme-border-strong)",
              borderRadius: "75.024px",
              padding: "4px 10px 4px 5px",
              transition: "border-color 150ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center font-clash font-bold"
              style={{
                background: "var(--theme-bg-card)",
                color: "var(--theme-text)",
                fontSize: "11px",
                border: "1px solid var(--theme-border)",
              }}
            >
              {userInitial}
            </span>
            <ChevronDown
              size={12}
              style={{
                color: "var(--theme-text-muted)",
                transition: "transform 150ms",
              }}
              className={showDropdown ? "rotate-180" : ""}
            />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute right-0 top-full mt-2 w-44 z-50 overflow-hidden"
                  style={{
                    background: "#111111",
                    border: "1px solid rgba(255, 255, 255, 0.10)",
                    borderRadius: "10px",
                  }}
                >
                  <Link
                    href="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm font-dm transition-colors duration-150"
                    style={{ color: "#6d6d6d" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#ffffff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#6d6d6d")
                    }
                  >
                    <User size={14} />
                    {t.profileLink}
                  </Link>
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-dm transition-colors duration-150"
                    style={{ color: "#6d6d6d" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#ef4444")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#6d6d6d")
                    }
                  >
                    <LogOut size={14} />
                    {t.logout}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
