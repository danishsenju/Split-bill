"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Plus, Inbox, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Utama" },
  { href: "/bills", icon: Receipt, label: "Bil" },
  { href: "/create", icon: Plus, label: "Baru", isCTA: true },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/profile", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-mobile mx-auto bg-bg-surface border-t border-white/8 z-30">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, icon: Icon, label, isCTA }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-btn transition-colors ${
                isCTA
                  ? "bg-accent text-bg-primary rounded-full p-3"
                  : active
                  ? "text-accent"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon size={isCTA ? 22 : 20} strokeWidth={active && !isCTA ? 2.5 : 2} />
              {!isCTA && (
                <span className="text-[10px] font-dm leading-none">{label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
