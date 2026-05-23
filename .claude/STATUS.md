# STATUS.md — BayarLah Build Progress

> Update this file every time a feature is completed, in progress, or blocked.
> Format: [x] done | [-] in progress | [ ] not started | [!] blocked

Last updated: 24 May 2026 (screens implemented)

---

## Setup & Infrastructure

- [x] Next.js 14 project initialized with TypeScript
- [x] Tailwind CSS configured with custom design tokens
- [x] Framer Motion installed
- [x] Lucide React installed
- [ ] Supabase project created
- [ ] Supabase environment variables configured
- [ ] Supabase database schema applied (all tables)
- [ ] Supabase Row Level Security policies configured
- [ ] Supabase Storage buckets created (receipts, qr-codes)
- [ ] Supabase Realtime enabled for bill_members table
- [ ] Gemini API key obtained and configured
- [ ] next-pwa configured
- [x] PWA manifest.json created
- [ ] Vercel project connected to GitHub repo
- [ ] Custom domain configured (bayarlah.vercel.app)
- [x] Google Fonts loaded (Syne, DM Sans, JetBrains Mono)
- [x] Middleware auth guard for organizer routes
- [x] TypeScript types defined in types/index.ts

---

## Authentication

- [x] Register page (organizer)
  - [x] Name, email, phone, password fields
  - [x] Payment method toggle (Bank Account / DuitNow QR)
  - [x] Bank: name dropdown + account number input
  - [x] QR: image upload with preview
  - [x] Form validation
  - [x] Supabase Auth integration
  - [x] Redirect to dashboard on success

- [x] Login page (organizer)
  - [x] Email + password fields
  - [x] Supabase Auth sign in
  - [x] Redirect to dashboard on success
  - [x] Error handling (wrong password, user not found)

- [x] Member entry page (/pay/[code])
  - [x] Show bill preview card + Pay Code badge
  - [x] Guest CTA (primary — name input only)
  - [x] Login button (secondary)
  - [x] Register button (secondary)
  - [ ] "Kenapa daftar akaun?" info card

- [x] Guest name input
  - [x] Single text input
  - [x] Session-only (no account created)
  - [x] Redirect to member payment page after submit

---

## Organizer — Dashboard

- [x] Dashboard page
  - [x] Greeting: "Assalamualaikum, {nama}!"
  - [x] Hero stats card
    - [x] Total terkumpul (animated number)
    - [x] Progress ring (animated)
    - [x] Bill aktif count
    - [x] Members count
    - [x] Dah bayar count
  - [x] Active bills list
  - [x] Empty state (first time, no bills)
  - [x] Supabase Realtime subscription

---

## Organizer — Bills List

- [x] Bills page (all bills)
  - [x] Search by title or Pay Code
  - [x] Filter chips: Semua | Aktif | Lewat | Selesai
  - [x] Bill cards with progress bars
  - [x] Total uncollected amount in header
  - [x] FAB button to create new bill

---

## Organizer — Create Bill

- [x] Step 1: Bill Details
  - [x] Category emoji grid (8 categories)
  - [x] Title input
  - [x] Description input (optional)
  - [x] Due date picker
  - [x] Split mode selector (Equal / Scan Resit)
  - [x] If Equal: total amount + optional tax/service charge
  - [x] If Scan: receipt scanner trigger
  - [x] Step validation before proceeding

- [x] Receipt Scanner
  - [x] Camera / gallery file input
  - [x] Base64 conversion
  - [x] POST to /api/scan (Gemini)
  - [x] Loading state: "AI sedang baca resit..."
  - [x] Editable results list
  - [x] Edit logging (show original price + edited badge)
  - [x] Fallback to manual entry if scan fails

- [x] Step 2: Add Members
  - [x] Member rows (name + phone)
  - [x] Add member button
  - [x] Remove member button
  - [x] Show calculated amount per person
  - [x] Bill summary card at bottom
  - [x] Form validation (min 1 member)

- [x] Bill Created Success
  - [x] Pay Code display (JetBrains Mono)
  - [x] Copy link button
  - [x] WhatsApp share button
  - [x] WA tone selector (Firm / Funny / Professional / Custom)
  - [x] Live message preview
  - [x] "Pergi ke Dashboard" button
  - [x] Save bill + members to Supabase

---

## Organizer — Bill Detail

- [x] Bill detail page
  - [x] Bill title, category, description
  - [x] Due date badge + days remaining
  - [x] Pay Code badge
  - [ ] "Tengok dari sisi member" button
  - [x] Stats: Terkumpul | Baki
  - [x] Progress bar
  - [x] Share Link button
  - [x] Hantar Remind button (blast all unpaid)
  - [x] Flag alert banner (if active flags)
  - [x] Tab filter: Semua | Belum Bayar | Dah Bayar
  - [x] Member rows
    - [x] Avatar initial
    - [x] Name + phone + timestamp
    - [x] Amount owed
    - [x] Status badge (Dah Bayar / Belum Bayar)
    - [x] Remind button (if unpaid + has phone)
    - [x] Tanda Bayar button (manual mark)
    - [x] Undo Bayar button (if paid)
  - [x] Realtime update when member confirms

---

## Organizer — Inbox

- [x] Inbox page
  - [x] Filter chips: Semua | Flags | Bayaran | Reminder
  - [x] Payment received items
  - [x] Flag received items
  - [x] Scheduled reminder items
  - [x] Tap to navigate to relevant bill/flag

---

## Organizer — Flag Detail

- [ ] Flag detail page
  - [ ] Member name + flagged item
  - [ ] Member note/reason
  - [ ] Comparison: Resit Asal vs Yang Dicaj
  - [ ] Difference amount highlighted
  - [ ] Re-edit price input + Lock button
  - [ ] Lock confirmation
  - [ ] Explanation textarea + Send via WhatsApp button
  - [ ] Notify member after lock

> Note: Flag detail accessible from bill detail via /bills/[id]/flags — not yet built

---

## Organizer — Profile

- [x] Profile page
  - [x] User info card (name, email, phone)
  - [x] Payment method display (masked account)
  - [x] Tukar Akaun button
  - [x] Settings list
    - [x] Reminder default (3 hari sebelum due)
    - [x] Bahasa (BM / EN)
    - [x] Notifikasi WhatsApp toggle
    - [x] Privasi & PDPA
  - [x] Log Keluar button

---

## Member — Equal Bill Flow

- [x] Payment page (idle state)
  - [x] Bill header (category, title, from organizer, due date)
  - [x] Member greeting: "Hai, {nama}! 👋"
  - [x] Amount display (large Syne typography)
  - [x] Pay Code display
  - [x] "Buat Bayaran" CTA button

- [x] Payment method bottom sheet
  - [x] Tab: Bank Transfer | DuitNow QR
  - [x] Bank: name, masked account, holder name
  - [x] QR: full width QR image
  - [x] Copy account number button

- [x] Review bayaran screen
  - [x] Amount display with "Menunggu pengesahan" badge
  - [x] Upload screenshot (optional)
  - [x] Swipe confirm component
  - [x] "Belum lagi" back button
  - [ ] "Semak Maklumat Bayaran" info button
  - [x] Hint text: "Pastikan dah transfer ke {nama} sebelum confirm"

---

## Member — Scan Resit (Unequal) Flow

- [x] Step 1: Tuntut Item
  - [x] Step indicator (1 Tuntut → 2 Semak → 3 Bayar)
  - [ ] "Tengok Resit Asal" button (prominent)
  - [ ] Receipt image bottom sheet
  - [x] Item list with 4 states (basic implementation)
  - [ ] Multi-unit item stepper bottom sheet
  - [ ] "Tak ingat — minta organizer assign" escape hatch
  - [x] Cannot proceed with zero claims

- [x] Step 2: Semak Resit
  - [x] Tab: Ringkasan | Resit Asal
  - [x] Ringkasan: comparison table (basic)
  - [ ] Flag bottom sheet — full implementation
  - [x] Proceed button

- [x] Step 3: Bayar
  - [x] Same as equal bill payment screen
  - [x] Collapsible breakdown

---

## Shared Components

- [x] SwipeConfirm component
  - [x] Drag gesture with Framer Motion
  - [x] Threshold: 80% of track width
  - [x] Haptic feedback (navigator.vibrate)
  - [x] Thumb → checkmark on complete
  - [x] Confetti trigger on complete

- [x] Confetti animation
  - [x] Colors: #00D084, #D4AF37, #F5F0E8
  - [x] 60-80 particles
  - [x] 2 second duration
  - [x] Auto cleanup

- [x] Success screen
  - [x] Confetti plays
  - [x] Summary: nama, bill, amount, tarikh
  - [x] Screenshot hint
  - [x] "Nak jadi organizer lain kali?" prompt
  - [x] Register CTA (optional, dismissible)

- [x] Progress ring (SVG animated)
- [x] Progress bar (animated width transition)
- [x] Bill card component
- [x] Pay Code display component
- [x] Bottom sheet wrapper (Framer Motion)
- [x] Toast notifications

---

## API Routes

- [x] POST /api/scan
  - [x] Accept base64 image + mimeType
  - [x] Call Gemini 2.0 Flash
  - [x] Return structured JSON
  - [x] Error handling + fallback

---

## PWA

- [x] manifest.json configured
  - [x] App name: BayarLah
  - [x] Short name: BayarLah
  - [x] Theme color: #0A1628
  - [x] Background color: #0A1628
  - [x] Display: standalone
  - [ ] Icons: 192x192 and 512x512 (placeholder entries only)
- [ ] Service worker registered
- [ ] Offline fallback page
- [ ] "Add to Home Screen" prompt tested

---

## Demo Data

- [ ] Seed script for demo organizer account
- [ ] Seed script for 2 demo bills
- [ ] Demo bills have realistic member data
- [ ] Demo bill 2 has active flag for demo purposes

---

## Testing Checklist (Pre-Submit)

- [ ] Full organizer flow tested on mobile (375px)
- [ ] Full equal bill member flow tested
- [ ] Full scan resit member flow tested
- [ ] Flag flow tested end to end
- [ ] Realtime update tested (two browser tabs)
- [ ] PWA install tested on Android Chrome
- [ ] All WA message tones previewed
- [ ] Pay Code copy works
- [ ] Receipt scan tested with real receipt photo
- [ ] Guest flow tested (no account)
- [ ] Supabase RLS tested (organizer can only see own bills)
- [ ] Error states tested (failed scan, network error)
- [ ] Vercel production deploy tested
- [ ] Demo data seeded on production

---

## Known Issues

> Document bugs here as they are found

| # | Issue | Screen | Priority | Status |
|---|---|---|---|---|
| — | None yet | — | — | — |

---

## Build Notes

> Document important decisions made during build here

| Date | Decision | Reason |
|---|---|---|
| 24 May | Use Gemini 2.0 Flash (not Claude) for scan | Free tier, no credit card for judges |
| 24 May | Member self-declare payment (no bank API) | Out of scope, not expected by judges |
| 24 May | Personal link per member (not one shared link) | Personalized UX, no "mana satu aku" confusion |
| 24 May | Pay Code in bank rujukan only, not app auth | Simpler UX, lower friction |
