# CLAUDE.md — BayarLah

> Read this file fully before writing any code, making any decision, or suggesting anything.
> This is the single source of truth for the entire project.

---

## What is BayarLah

BayarLah is a Malaysian split-bill and payment tracker PWA built with Next.js 14, Supabase, Tailwind CSS, and Framer Motion. It allows an organizer to create a bill, share a personal payment link to each member, and track who has paid in real time.

Tagline: **Settle hutang, tanpa drama.**

This is a hackathon submission for Kracked Dev (RM500 prize). Every decision must optimize for judge impression, demo reliability, and UX polish — in that order.

---

## Core Rules — Never Break These

1. **Never break working features.** If something works, do not refactor it unless explicitly asked.
2. **Mobile-first always.** Max width 480px. Every component must work perfectly on a phone screen.
3. **No real payment gateway.** Member self-declares payment via swipe confirm. This is intentional.
4. **Bahasa Malaysia first.** All UI copy in BM. Code comments in English.
5. **Gemini 2.0 Flash for receipt scanning only.** Never use AI for anything else in the app.
6. **Supabase Realtime for dashboard updates.** When a member confirms payment, organizer dashboard must update without refresh.
7. **Guest flow for members only.** Organizer must register. Member can proceed as guest (name only).
8. **Personal links per member.** Each member gets a unique URL. Not one shared link.
9. **Pay Code is reference only.** It goes in bank transfer rujukan field. It is NOT an app login code.
10. **Never remove the flag system.** It is a core differentiator.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 14 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 3 |
| Animation | Framer Motion | 11 |
| Database | Supabase PostgreSQL | latest |
| Auth | Supabase Auth | latest |
| Realtime | Supabase Realtime | latest |
| Storage | Supabase Storage | latest |
| AI | Google Gemini 2.0 Flash | latest |
| Icons | Lucide React | 0.383 |
| PWA | next-pwa | 5 |
| Deployment | Vercel | latest |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=https://bayarlah.vercel.app
```

Never hardcode these. Always use process.env.

---

## Folder Structure

```
bayarlah/
├── app/
│   ├── (organizer)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── bills/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── create/
│   │   │   └── page.tsx
│   │   ├── inbox/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   ├── pay/
│   │   └── [code]/
│   │       └── page.tsx        ← member payment page
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── api/
│   │   └── scan/
│   │       └── route.ts        ← Gemini API route
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/
│   │   ├── SwipeConfirm.tsx
│   │   ├── BillCard.tsx
│   │   ├── PayCodeDisplay.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Confetti.tsx
│   ├── organizer/
│   │   ├── DashboardHero.tsx
│   │   ├── BillDetail.tsx
│   │   ├── MemberRow.tsx
│   │   ├── FlagDetail.tsx
│   │   └── WAToneSelector.tsx
│   ├── member/
│   │   ├── MemberEntry.tsx
│   │   ├── GuestNameInput.tsx
│   │   ├── ItemClaimList.tsx
│   │   ├── ComparisonTable.tsx
│   │   ├── PaymentScreen.tsx
│   │   └── SuccessScreen.tsx
│   └── receipt/
│       ├── ReceiptScanner.tsx
│       └── ReceiptEditList.tsx
├── lib/
│   ├── supabase.ts
│   ├── supabase-server.ts
│   ├── gemini.ts
│   ├── paycode.ts              ← generate pay code
│   ├── whatsapp.ts             ← build WA message per tone
│   └── utils.ts
├── types/
│   └── index.ts                ← all TypeScript types
├── public/
│   ├── manifest.json
│   └── icons/
└── middleware.ts               ← auth guard for organizer routes
```

---

## Design System

### Colors

```css
--color-bg-primary: #0A1628
--color-bg-surface: #1C2E20
--color-bg-card: #162318
--color-primary: #1B4332
--color-accent: #D4AF37
--color-success: #00D084
--color-danger: #FF4757
--color-warning: #FFD32A
--color-text-primary: #F5F0E8
--color-text-secondary: #8B9E88
--color-text-muted: #4A5E4C
--color-border: rgba(255,255,255,0.08)
--color-glass: rgba(255,255,255,0.05)
```

### Typography

```
Heading: Syne (700, 800)
Body: DM Sans (400, 500, 600)
Mono: JetBrains Mono (400, 500) — Pay Code only
```

### Border Radius

```
Cards: 20px
Buttons: 14px
Pills: 99px
Inputs: 12px
Bottom sheets: 24px top only
```

### Spacing Scale

```
4px — micro
8px — tight
16px — default
24px — section
32px — large
```

---

## Key Components Behaviour

### SwipeConfirm
- Horizontal drag gesture — not a tap
- Thumb slides right to confirm
- Track text: "Geser untuk confirm — sudah bayar →"
- On complete: thumb becomes checkmark, trigger confetti
- Cannot swipe back after confirmed

### PayCodeDisplay
- Font: JetBrains Mono 500 22px
- Letter spacing: 3px
- Has copy button
- Shows hint: "Masuk dalam rujukan pembayaran"

### ReceiptScanner
- Calls /api/scan with base64 image
- Shows loading: "AI sedang baca resit..."
- Returns editable item list
- All edits logged with ✏️ badge and original price
- If scan fails: graceful fallback to manual entry

### ComparisonTable
- Two tabs: Ringkasan | Resit Asal
- Ringkasan: Item | Resit | Caj | Status
- Green row + checkmark if same
- Red row + flag button if different
- Flag opens bottom sheet with note input

### WAToneSelector
- Four tones: Firm | Funny 😂 | Professional | Custom
- Preview updates live as tone changes
- Variables auto-inserted: {nama}, {amount}, {code}, {link}

---

## User Flows

### Organizer Flow
1. Register → setup payment method (bank acc OR DuitNow QR)
2. Dashboard → create bill
3. Create bill step 1: category, title, description, due date, split mode
4. If equal: enter total + optional tax
5. If scan resit: snap → AI extract → edit → confirm
6. Create bill step 2: add members (name + phone)
7. Bill created: Pay Code generated, personal links generated
8. Share via WA with tone selector
9. Monitor dashboard realtime
10. Handle flags if any
11. Bill archives when all paid

### Member Flow (Equal Bill)
1. Open personal link from WA
2. Choose: Guest (name only) | Login | Register
3. See name, bill details, amount
4. Tap "Buat Bayaran"
5. See payment method (bank or QR)
6. Do transfer in banking app, put Pay Code in rujukan
7. Back to app, swipe confirm
8. Confetti + success screen
9. Optional: register to become organizer

### Member Flow (Scan Resit — Unequal Bill)
1-3. Same as equal bill
4. Step 1 — Tuntut items: see receipt image, tap items claimed
5. Handle shared items: stepper for units
6. Step 2 — Semak resit: comparison table, flag if wrong
7. Step 3 — Bayar: same as equal bill from step 4

---

## Pay Code Format

```typescript
// Format: XXX-XXXX
// XXX = first 3 letters of bill title (uppercase)
// XXXX = 4 random alphanumeric

function generatePayCode(title: string): string {
  const prefix = title
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X')
  const suffix = Math.random()
    .toString(36)
    .toUpperCase()
    .slice(2, 6)
  return `${prefix}-${suffix}`
}
```

---

## WhatsApp Message Tones

### Firm
```
{nama}, sila selesaikan pembayaran RM {amount} untuk {tajuk} sebelum {due_date}. Gunakan Pay Code {code} sebagai rujukan pembayaran. {link}
```

### Funny
```
Wehh {nama}! Duit tak masuk lagi ni 😅 RM {amount} je beb, kopi pun lagi mahal. Jom settle cepat: {link} (code: {code}) Kang kita kira hutang lain pulak 😂
```

### Professional
```
Dear {nama}, this is a gentle reminder regarding your payment of RM {amount} for {tajuk}. Kindly complete your payment before {due_date} using reference code {code}. {link}
```

### Custom
Organizer writes their own. App inserts {amount}, {code}, {link} as variables.

---

## Gemini API — Receipt Scan

Endpoint: `POST /api/scan`

Request:
```typescript
{
  image: string  // base64
  mimeType: string  // image/jpeg | image/png
}
```

Response:
```typescript
{
  storeName: string
  items: Array<{
    id: string
    name: string
    price: number
    qty: number
  }>
  subtotal: number
  tax: number
  serviceCharge: number
  total: number
}
```

Prompt to Gemini: Extract ALL line items. Return ONLY JSON. No markdown. Price = unit price × qty already. Assume MYR if currency unclear.

---

## Supabase Realtime

Subscribe to bill_members changes for organizer dashboard:

```typescript
supabase
  .channel(`bill-${billId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'bill_members',
    filter: `bill_id=eq.${billId}`
  }, (payload) => {
    // update dashboard state
  })
  .subscribe()
```

---

## Demo Data

Pre-populate on first load for judges:

```
Organizer: Hafiz Bin Rahman
Email: hafiz@demo.com
Bank: Maybank 5142****7766

Bill 1: Makan Malam Geng Office
Category: 🍽️ Makan
Total: RM 156.00
Members: 5 (Hafiz paid, Syira unpaid, Amin unpaid, Zack paid, Danish unpaid)
Due: 3 days from today
Pay Code: MKN-7X2M
Mode: Equal (RM 31.20 each)

Bill 2: Seafood Trip ke Lumut
Category: ✈️ Trip
Total: RM 135.30
Members: 3 (Faris paid, Aiman unpaid — has flag, Razif unpaid)
Due: 5 days from today
Pay Code: TRP-K4N9
Mode: Scan resit (unequal)
```

---

## Common Mistakes — Avoid These

- Do not use `any` type in TypeScript
- Do not fetch Supabase in client components — use server actions or API routes for sensitive operations
- Do not forget to unsubscribe Realtime channels on component unmount
- Do not store full receipt image in database — use Supabase Storage, store URL only
- Do not make Pay Code entry a required field in the app — it is for bank transfer only
- Do not block member from proceeding after flagging — flag and payment are independent
- Do not show organizer's full bank account number — mask it (5142 •••• 7766)
- Do not allow guest users to access organizer routes — middleware must guard these

---

## Definition of Done

A feature is complete when:
1. Works on mobile (375px width minimum)
2. Handles empty state
3. Handles error state
4. Supabase data persists on refresh
5. No TypeScript errors
6. Matches design handoff screens
