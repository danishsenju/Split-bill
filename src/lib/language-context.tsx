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
    const stored = localStorage.getItem("kolekduit_lang") as Lang | null;
    if (stored === "en" || stored === "bm") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("kolekduit_lang", l);
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

// ─── Profile page translations ────────────────────────────────────────────
export const profileT = {
  bm: {
    statBillsMade: "Bil Dibuat",
    statCollected: "Terkumpul",
    sectionPayment: "Kaedah Pembayaran",
    changeBtn: "Tukar →",
    active: "Aktif",
    noPayment: "Tiada kaedah pembayaran",
    addNow: "Tambah sekarang",
    sectionSettings: "Tetapan",
    reminderLabel: "Peringatan",
    reminderSub: "Hantar sebelum tarikh akhir",
    reminderUnit: "h",
    langLabel: "Bahasa / Language",
    waLabel: "Notifikasi WhatsApp",
    waSub: "Hantar peringatan auto",
    privacyLabel: "Privasi & Keselamatan",
    privacySub: "Data dan akaun",
    loggingOut: "Sedang keluar...",
    logout: "Log Keluar",
  },
  en: {
    statBillsMade: "Bills Made",
    statCollected: "Collected",
    sectionPayment: "Payment Method",
    changeBtn: "Change →",
    active: "Active",
    noPayment: "No payment method",
    addNow: "Add now",
    sectionSettings: "Settings",
    reminderLabel: "Reminder",
    reminderSub: "Send before due date",
    reminderUnit: "d",
    langLabel: "Bahasa / Language",
    waLabel: "WhatsApp Notifications",
    waSub: "Send auto reminders",
    privacyLabel: "Privacy & Security",
    privacySub: "Data and account",
    loggingOut: "Logging out...",
    logout: "Log Out",
  },
} as const;

// ─── Bill detail page translations ────────────────────────────────────────
export const billDetailT = {
  bm: {
    statCollected: "Terkumpul",
    statRemaining: "Baki",
    paidProgress: (paid: number, total: number) => `${paid} / ${total} dah bayar`,
    copyBtn: "Salin",
    copiedBtn: "Disalin!",
    flagAlert: (n: number) => `${n} flag aktif`,
    flagSub: "Tap untuk semak",
    remindAll: "Hantar Peringatan Semua",
    unpaidSection: (n: number) => `Belum Bayar (${n})`,
    noPhone: "Tiada nombor",
    paidSection: (n: number) => `Dah Bayar (${n})`,
    cancelPaid: "Batal",
  },
  en: {
    statCollected: "Collected",
    statRemaining: "Remaining",
    paidProgress: (paid: number, total: number) => `${paid} / ${total} paid`,
    copyBtn: "Copy",
    copiedBtn: "Copied!",
    flagAlert: (n: number) => `${n} active flag${n !== 1 ? "s" : ""}`,
    flagSub: "Tap to review",
    remindAll: "Send Reminder to All",
    unpaidSection: (n: number) => `Unpaid (${n})`,
    noPhone: "No number",
    paidSection: (n: number) => `Paid (${n})`,
    cancelPaid: "Undo",
  },
} as const;

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

// ─── Create Bill page translations ────────────────────────────────────────
export const createT = {
  bm: {
    step1Title: "Buat Bil Baru",
    step2Title: "Tambah Ahli",
    step3Title: "Bil Berjaya Dibuat!",
    stepIndicator: (s: number) => `${s}/2`,
    // field labels
    labelCategory: "Kategori",
    labelTitle: "Tajuk Bil",
    labelDesc: "Penerangan",
    labelDueDate: "Tarikh Akhir",
    labelSplitMode: "Cara Bahagi",
    labelAmount: "Jumlah Bil (RM)",
    labelTax: "Cukai / SST (RM)",
    optional: "(pilihan)",
    dateSelected: (d: string) => `Dipilih: ${d}`,
    // split modes
    splitEqualLabel: "Sama Rata",
    splitEqualDesc: "Bahagi sama untuk semua",
    splitScanLabel: "Scan Resit",
    splitScanDesc: "Imbas & perinci setiap item",
    rescanBtn: "Imbas semula",
    // step 2
    totalBill: "Jumlah bil",
    perPerson: (n: number) => `${n} ahli · setiap seorang`,
    memberLabel: (n: number) => `Ahli ${n}`,
    placeholderName: "Nama ahli",
    placeholderPhone: "No. telefon (pilihan)",
    addMember: "Tambah Ahli",
    nextBtn: "Seterusnya",
    creating: "Sedang cipta bil...",
    createBtn: "Cipta Bil",
    // step 3
    successDesc: "Bil berjaya dicipta! Kongsi link kepada ahli-ahli.",
    payCodeLabel: "Pay Code",
    memberLinksLabel: "Link Peribadi Ahli",
    whatsappBtn: "Hantar via WhatsApp",
    dashboardBtn: "Pergi ke Dashboard",
    // validation
    errCategory: "Pilih kategori bil",
    errTitle: "Tajuk bil diperlukan",
    errDueDate: "Tarikh akhir diperlukan",
    errAmount: "Masukkan jumlah bil yang sah",
    errScan: "Sila imbas resit terlebih dahulu",
    errMember: "Tambah sekurang-kurangnya satu ahli",
    // category display labels
    categoryLabels: {
      "🍽️ Makan": "Makan",
      "🎉 Hiburan": "Hiburan",
      "✈️ Trip": "Trip",
      "🏠 Rumah": "Rumah",
      "🏥 Kesihatan": "Kesihatan",
      "📚 Belajar": "Belajar",
      "🛒 Beli-belah": "Beli-belah",
      "💡 Lain-lain": "Lain-lain",
    } as Record<string, string>,
  },
  en: {
    step1Title: "Create New Bill",
    step2Title: "Add Members",
    step3Title: "Bill Created!",
    stepIndicator: (s: number) => `${s}/2`,
    labelCategory: "Category",
    labelTitle: "Bill Title",
    labelDesc: "Description",
    labelDueDate: "Due Date",
    labelSplitMode: "Split Mode",
    labelAmount: "Bill Total (RM)",
    labelTax: "Tax / SST (RM)",
    optional: "(optional)",
    dateSelected: (d: string) => `Selected: ${d}`,
    splitEqualLabel: "Equal Split",
    splitEqualDesc: "Divide equally for everyone",
    splitScanLabel: "Scan Receipt",
    splitScanDesc: "Scan & itemise each item",
    rescanBtn: "Rescan",
    totalBill: "Bill total",
    perPerson: (n: number) => `${n} member${n !== 1 ? "s" : ""} · each`,
    memberLabel: (n: number) => `Member ${n}`,
    placeholderName: "Member name",
    placeholderPhone: "Phone number (optional)",
    addMember: "Add Member",
    nextBtn: "Next",
    creating: "Creating bill...",
    createBtn: "Create Bill",
    successDesc: "Bill created! Share the link with your members.",
    payCodeLabel: "Pay Code",
    memberLinksLabel: "Member Personal Links",
    whatsappBtn: "Send via WhatsApp",
    dashboardBtn: "Go to Dashboard",
    errCategory: "Select a bill category",
    errTitle: "Bill title is required",
    errDueDate: "Due date is required",
    errAmount: "Enter a valid bill amount",
    errScan: "Please scan a receipt first",
    errMember: "Add at least one member",
    categoryLabels: {
      "🍽️ Makan": "Food",
      "🎉 Hiburan": "Fun",
      "✈️ Trip": "Trip",
      "🏠 Rumah": "Home",
      "🏥 Kesihatan": "Health",
      "📚 Belajar": "Study",
      "🛒 Beli-belah": "Shopping",
      "💡 Lain-lain": "Others",
    } as Record<string, string>,
  },
} as const;

// ─── Inbox page translations ───────────────────────────────────────────────
export const inboxT = {
  bm: {
    pageTitle: "Peti Masuk",
    filterAll: "Semua",
    filterFlags: "Flags",
    filterPayment: "Bayaran",
    filterReminder: "Reminder",
    flagBadge: (n: number) => `${n} bendera`,
    groupToday: "Hari Ini",
    groupYesterday: "Semalam",
    groupOlder: "Sebelum Ini",
    emptyTitle: "Tiada aktiviti",
    emptyDesc: "Notifikasi bil dan bayaran akan muncul di sini.",
  },
  en: {
    pageTitle: "Inbox",
    filterAll: "All",
    filterFlags: "Flags",
    filterPayment: "Payments",
    filterReminder: "Reminders",
    flagBadge: (n: number) => `${n} flag${n !== 1 ? "s" : ""}`,
    groupToday: "Today",
    groupYesterday: "Yesterday",
    groupOlder: "Earlier",
    emptyTitle: "No activity",
    emptyDesc: "Bill and payment notifications will appear here.",
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
    live: "Live",
    collectedToday: "hari ni",
    showMore: "Lihat lagi",
    showingXofY: (shown: number, total: number) =>
      `Menunjuk ${shown} dari ${total}`,
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
    live: "Live",
    collectedToday: "today",
    showMore: "Show more",
    showingXofY: (shown: number, total: number) =>
      `Showing ${shown} of ${total}`,
  },
} as const;
