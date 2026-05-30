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
    edit: {
      editAria: "Edit bil",
      title: "Edit Bil",
      secDetails: "Butiran",
      secAmount: "Jumlah",
      secMembers: (n: number) => `Ahli (${n})`,
      fTitle: "Tajuk",
      fDesc: "Penerangan",
      fCategory: "Kategori",
      fDueDate: "Tarikh Akhir",
      dateSelected: (d: string) => `Tarikh akhir · ${d}`,
      fTotal: "Jumlah Bil",
      fTax: "Cukai / SST",
      splitEqually: "Bahagi sama rata",
      perPerson: (amt: string) => `≈ ${amt} setiap seorang`,
      mName: "Nama ahli",
      mPhone: "No. telefon (pilihan)",
      mAmount: "RM",
      followsItems: "Ikut item",
      addMember: "Tambah Ahli",
      paidBadge: "Dah bayar",
      save: "Simpan Perubahan",
      saving: "Menyimpan...",
      errTitle: "Tajuk bil diperlukan",
      errMembers: "Perlu sekurang-kurangnya satu ahli",
      errSave: "Gagal simpan. Cuba lagi.",
      dragHint: "Tarik ke bawah untuk tutup",
    },
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
    edit: {
      editAria: "Edit bill",
      title: "Edit Bill",
      secDetails: "Details",
      secAmount: "Amount",
      secMembers: (n: number) => `Members (${n})`,
      fTitle: "Title",
      fDesc: "Description",
      fCategory: "Category",
      fDueDate: "Due Date",
      dateSelected: (d: string) => `Due · ${d}`,
      fTotal: "Total",
      fTax: "Tax / SST",
      splitEqually: "Split equally",
      perPerson: (amt: string) => `≈ ${amt} each`,
      mName: "Member name",
      mPhone: "Phone (optional)",
      mAmount: "RM",
      followsItems: "Per items",
      addMember: "Add Member",
      paidBadge: "Paid",
      save: "Save Changes",
      saving: "Saving...",
      errTitle: "Bill title is required",
      errMembers: "Need at least one member",
      errSave: "Failed to save. Try again.",
      dragHint: "Drag down to close",
    },
  },
} as const;

// ─── BottomNav / TopNav translations ──────────────────────────────────────
export const navT = {
  bm: {
    home: "Utama",
    bills: "Bil",
    inbox: "Inbox",
    chat: "Chat",
    profile: "Profil",
    createBill: "Buat Bil",
    profileLink: "Profil",
    logout: "Log Keluar",
  },
  en: {
    home: "Home",
    bills: "Bills",
    inbox: "Inbox",
    chat: "Chat",
    profile: "Profile",
    createBill: "Create Bill",
    profileLink: "Profile",
    logout: "Log Out",
  },
} as const;

// ─── Notification popup translations ──────────────────────────────────────
export const notifT = {
  bm: {
    title: "Notifikasi",
    empty: "Tiada notifikasi baru",
    emptySub: "Aktiviti bil akan muncul di sini.",
    viewMore: "Lihat semua",
    markAll: "Tanda dibaca",
    new: "baru",
  },
  en: {
    title: "Notifications",
    empty: "No new notifications",
    emptySub: "Bill activity will appear here.",
    viewMore: "View all",
    markAll: "Mark read",
    new: "new",
  },
} as const;

// ─── Invite / referral translations ──────────────────────────────────────
export const inviteT = {
  bm: {
    // Friends-page invite hero
    heroKicker: "Jemput Kawan",
    heroTitle: "Kongsi link, terus jadi kenalan.",
    heroDesc:
      "Hantar link peribadi ni. Bila kawan daftar, mereka auto jadi kenalan awak — terus boleh kongsi bil & sembang.",
    copy: "Salin Link",
    copied: "Disalin!",
    shareWA: "Kongsi via WhatsApp",
    yourLink: "Link jemputan anda",
    waMessage: (name: string, link: string) =>
      `Jom guna kolekduit — settle hutang tanpa drama! Daftar guna link ni & kita terus jadi kenalan: ${link}`,
    // Landing page
    landKicker: "Anda dijemput",
    invitedByLabel: "Dijemput oleh",
    invitedBy: (name: string) => `${name} jemput anda`,
    landTitle: "Settle hutang,\ntanpa drama.",
    landDesc:
      "kolekduit ialah cara paling smooth untuk kongsi bil, track siapa dah bayar, dan kutip duit — semua dalam satu tempat.",
    whatIsThis: "Apa link ni?",
    whatIsThisDesc:
      "Bila awak daftar melalui link ni, awak terus jadi kenalan penjemput. Lepas tu kamu boleh kongsi bil & sembang dalam app.",
    f1Title: "Split & track",
    f1Desc: "Bahagi bil sama rata atau ikut item. Tengok siapa dah bayar secara langsung.",
    f2Title: "Personal pay link",
    f2Desc: "Setiap ahli dapat link sendiri. Bayar, swipe confirm, siap.",
    f3Title: "Sembang & kongsi",
    f3Desc: "Kongsi bil terus dalam chat atau WhatsApp. Tiada lagi drama hutang.",
    ctaRegister: "Daftar & Jadi Kenalan",
    ctaLogin: "Saya dah ada akaun",
    addFriendCta: "Tambah Sebagai Kenalan",
    adding: "Menambah...",
    added: "Sudah jadi kenalan!",
    ownLink: "Ini link jemputan anda sendiri.",
    goChat: "Pergi ke Sembang",
    // Intro ad sequence
    introSkip: "Langkau",
    introBrand: "kolekduit",
    introOutroKicker: "Mula sekarang",
    introOutroTitle: "Settle hutang,\ntanpa drama.",
    introOutroDesc: "Daftar melalui jemputan ni & terus jadi kenalan.",
    introScenes: (name: string | null) => [
      {
        kicker: "Jemputan peribadi",
        title: name ? `${name}\njemput anda.` : "Anda\ndijemput.",
      },
      { kicker: "01 — Kongsi", title: "Bahagi apa-apa bil\ndalam saat." },
      { kicker: "02 — Jejak", title: "Tengok siapa dah bayar,\nsecara langsung." },
      { kicker: "03 — Selesai", title: "Kutip duit\ntanpa kejar-kejar." },
    ],
  },
  en: {
    heroKicker: "Invite a Friend",
    heroTitle: "Share a link, instantly connect.",
    heroDesc:
      "Send your personal link. When a friend signs up, they're auto-added as your contact — ready to split bills & chat.",
    copy: "Copy Link",
    copied: "Copied!",
    shareWA: "Share via WhatsApp",
    yourLink: "Your invite link",
    waMessage: (name: string, link: string) =>
      `Let's use kolekduit — settle debts without drama! Sign up with my link and we'll instantly connect: ${link}`,
    landKicker: "You're invited",
    invitedByLabel: "Invited by",
    invitedBy: (name: string) => `${name} invited you`,
    landTitle: "Settle debts,\nno drama.",
    landDesc:
      "kolekduit is the smoothest way to split bills, track who has paid, and collect money — all in one place.",
    whatIsThis: "What is this link?",
    whatIsThisDesc:
      "When you sign up through this link, you instantly become the inviter's contact. Then you can share bills & chat in-app.",
    f1Title: "Split & track",
    f1Desc: "Split equally or by item. See who has paid in real time.",
    f2Title: "Personal pay link",
    f2Desc: "Every member gets their own link. Pay, swipe to confirm, done.",
    f3Title: "Chat & share",
    f3Desc: "Share bills right in chat or WhatsApp. No more debt drama.",
    ctaRegister: "Sign Up & Connect",
    ctaLogin: "I already have an account",
    addFriendCta: "Add as Contact",
    adding: "Adding...",
    added: "Connected!",
    ownLink: "This is your own invite link.",
    goChat: "Go to Chats",
    // Intro ad sequence
    introSkip: "Skip",
    introBrand: "kolekduit",
    introOutroKicker: "Get started",
    introOutroTitle: "Settle debts,\nno drama.",
    introOutroDesc: "Sign up through this invite & instantly connect.",
    introScenes: (name: string | null) => [
      {
        kicker: "Personal invitation",
        title: name ? `${name}\ninvited you.` : "You're\ninvited.",
      },
      { kicker: "01 — Split", title: "Divide any bill\nin seconds." },
      { kicker: "02 — Track", title: "See who's paid,\nin real time." },
      { kicker: "03 — Settle", title: "Collect money\nwithout the chase." },
    ],
  },
} as const;

// ─── Privacy & Security translations ──────────────────────────────────────
export const privacyT = {
  bm: {
    title: "Privasi & Keselamatan",
    subtitle: "Urus maklumat & apa yang orang lain nampak",
    secDetails: "Maklumat Diri",
    secVisibility: "Keterlihatan",
    fName: "Nama Penuh",
    fUsername: "Username",
    fPhone: "No. Telefon",
    fEmail: "Email",
    emailNote: "Email tak boleh ditukar di sini",
    hidePhone: "Sembunyi nombor telefon",
    hidePhoneSub: "Pengguna lain tak nampak nombor awak",
    hideEmail: "Sembunyi email",
    hideEmailSub: "Pengguna lain tak nampak email awak",
    save: "Simpan Perubahan",
    saving: "Menyimpan...",
    saved: "Disimpan!",
    errUsername: "Username 3–20 aksara, huruf/nombor/_ sahaja",
    errUsernameTaken: "Username sudah digunakan",
    errSave: "Gagal simpan. Cuba lagi.",
    phonePlaceholder: "+60123456789",
  },
  en: {
    title: "Privacy & Security",
    subtitle: "Manage your info & what others can see",
    secDetails: "Personal Details",
    secVisibility: "Visibility",
    fName: "Full Name",
    fUsername: "Username",
    fPhone: "Phone Number",
    fEmail: "Email",
    emailNote: "Email can't be changed here",
    hidePhone: "Hide phone number",
    hidePhoneSub: "Other users won't see your number",
    hideEmail: "Hide email",
    hideEmailSub: "Other users won't see your email",
    save: "Save Changes",
    saving: "Saving...",
    saved: "Saved!",
    errUsername: "Username 3–20 chars, letters/numbers/_ only",
    errUsernameTaken: "Username already taken",
    errSave: "Failed to save. Try again.",
    phonePlaceholder: "+60123456789",
  },
} as const;

// ─── Chat translations ─────────────────────────────────────────────────────
export const chatT = {
  bm: {
    pageTitle: "Sembang",
    searchPlaceholder: "Cari kenalan...",
    empty: "Belum ada sembang",
    emptySub: "Tambah kenalan untuk mula bersembang.",
    addFriends: "Cari Kenalan",
    you: "Awak",
    sharedBill: "Kongsi bil",
    typePlaceholder: "Tulis mesej...",
    send: "Hantar",
    shareBill: "Kongsi Bil",
    shareBillTitle: "Kongsi Bil",
    shareBillSub: "Pilih bil untuk dikongsi",
    noBills: "Tiada bil aktif untuk dikongsi.",
    sendInChat: "Hantar dalam sembang",
    sendWhatsApp: "Hantar via WhatsApp",
    viewBill: "Lihat Bil",
    payCode: "Pay Code",
    online: "Dalam talian",
    billShareMsg: (title: string) => `Saya kongsi bil "${title}" dengan awak`,
    today: "Hari ini",
    yesterday: "Semalam",
  },
  en: {
    pageTitle: "Chats",
    searchPlaceholder: "Search contacts...",
    empty: "No chats yet",
    emptySub: "Add a contact to start chatting.",
    addFriends: "Find Contacts",
    you: "You",
    sharedBill: "Shared a bill",
    typePlaceholder: "Type a message...",
    send: "Send",
    shareBill: "Share Bill",
    shareBillTitle: "Share a Bill",
    shareBillSub: "Pick a bill to share",
    noBills: "No active bills to share.",
    sendInChat: "Send in chat",
    sendWhatsApp: "Send via WhatsApp",
    viewBill: "View Bill",
    payCode: "Pay Code",
    online: "Online",
    billShareMsg: (title: string) => `I shared the bill "${title}" with you`,
    today: "Today",
    yesterday: "Yesterday",
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
    subtitle: "Semua aktiviti bil & bayaran awak",
    filterAll: "Semua",
    filterFlags: "Flags",
    filterPayment: "Bayaran",
    filterReminder: "Reminder",
    flagBadge: (n: number) => `${n} bendera`,
    statPayments: "Bayaran",
    statFlags: "Flags",
    statReminders: "Reminder",
    groupToday: "Hari Ini",
    groupYesterday: "Semalam",
    groupOlder: "Sebelum Ini",
    emptyTitle: "Tiada aktiviti",
    emptyDesc: "Notifikasi bil dan bayaran akan muncul di sini.",
  },
  en: {
    pageTitle: "Inbox",
    subtitle: "All your bill & payment activity",
    filterAll: "All",
    filterFlags: "Flags",
    filterPayment: "Payments",
    filterReminder: "Reminders",
    flagBadge: (n: number) => `${n} flag${n !== 1 ? "s" : ""}`,
    statPayments: "Payments",
    statFlags: "Flags",
    statReminders: "Reminders",
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
