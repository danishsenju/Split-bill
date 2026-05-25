"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "bm" | "en";

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageCtx>({
  lang: "bm",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bm");

  useEffect(() => {
    const stored = localStorage.getItem("bayarlah_lang") as Lang | null;
    if (stored === "en" || stored === "bm") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("bayarlah_lang", l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// ─── BottomNav / TopNav translations ──────────────────────────────────────
export const navT = {
  bm: {
    home: "Utama",
    bills: "Bil",
    inbox: "Inbox",
    profile: "Profil",
    createBill: "Buat Bil",
    profileLink: "Profil",
    logout: "Log Keluar",
  },
  en: {
    home: "Home",
    bills: "Bills",
    inbox: "Inbox",
    profile: "Profile",
    createBill: "Create Bill",
    profileLink: "Profile",
    logout: "Log Out",
  },
} as const;

// ─── Bills page translations ───────────────────────────────────────────────
export const billsT = {
  bm: {
    pageTitle: "Bil Saya",
    outstanding: "Baki Belum Terkumpul",
    searchPlaceholder: "Cari tajuk atau Pay Code...",
    filterAll: "Semua",
    filterActive: "Aktif",
    filterOverdue: "Lewat",
    filterCompleted: "Selesai",
    groupOverdue: "Lewat",
    groupActive: "Aktif",
    groupCompleted: "Selesai",
    emptySearch: "Tiada hasil carian",
    emptyAll: "Tiada bil lagi",
  },
  en: {
    pageTitle: "My Bills",
    outstanding: "Outstanding Balance",
    searchPlaceholder: "Search title or Pay Code...",
    filterAll: "All",
    filterActive: "Active",
    filterOverdue: "Overdue",
    filterCompleted: "Completed",
    groupOverdue: "Overdue",
    groupActive: "Active",
    groupCompleted: "Completed",
    emptySearch: "No results found",
    emptyAll: "No bills yet",
  },
} as const;

// ─── Dashboard translations ────────────────────────────────────────────────
export const dashboardT = {
  bm: {
    greeting: "Assalamualaikum,",
    of: "daripada",
    statBilAktif: "Bil Aktif",
    statJumlahAhli: "Jumlah Ahli",
    statDahBayar: "Dah Bayar",
    sectionBilAktif: "Bil Aktif",
    seeAll: "Semua →",
    emptyTitle: "Tiada bil aktif",
    emptyDesc: "Buat bil pertama kamu dan kongsikan dengan rakan-rakan.",
    createBill: "Buat Bil Baru",
    paid: "bayar",
    daysAgo: (n: number) => `${n}h lepas`,
    today: "Hari ini",
    daysLeft: (n: number) => `${n}h lagi`,
  },
  en: {
    greeting: "Good day,",
    of: "of",
    statBilAktif: "Active Bills",
    statJumlahAhli: "Total Members",
    statDahBayar: "Paid",
    sectionBilAktif: "Active Bills",
    seeAll: "All →",
    emptyTitle: "No active bills",
    emptyDesc: "Create your first bill and share it with your friends.",
    createBill: "Create New Bill",
    paid: "paid",
    daysAgo: (n: number) => `${n}d ago`,
    today: "Today",
    daysLeft: (n: number) => `${n}d left`,
  },
} as const;
