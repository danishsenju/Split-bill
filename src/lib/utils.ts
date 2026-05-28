export function formatRM(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

export function maskAccount(account: string): string {
  if (account.length <= 4) return account;
  return account.slice(0, 4) + " •••• " + account.slice(-4);
}

export function getDaysRemaining(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDaysRemaining(dueDate: string): string {
  const days = getDaysRemaining(dueDate);
  if (days < 0) return `${Math.abs(days)} hari lepas`;
  if (days === 0) return "Hari ini";
  if (days === 1) return "Esok";
  return `${days} hari lagi`;
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ms-MY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─── Category atmospheric color palette ───────────────────────────────────
// Used for tinted glow/halo on bill cards and detail hero.
// Tones are muted (monopo-aligned) — never harsh saturation.
export interface CategoryTone {
  /** Full RGB triplet, e.g. "165,45,37" — for use in rgba() */
  rgb: string;
  /** Solid hex for accent text/dot */
  hex: string;
}

export function categoryTone(category: string): CategoryTone {
  const key = category.toLowerCase();
  if (key.includes("makan")) return { rgb: "165,45,37", hex: "#A52D25" };       // brick red
  if (key.includes("hiburan")) return { rgb: "157,123,184", hex: "#9D7BB8" };   // dusty lavender
  if (key.includes("trip")) return { rgb: "91,138,184", hex: "#5B8AB8" };       // atmospheric blue
  if (key.includes("rumah")) return { rgb: "245,240,232", hex: "#F5F0E8" };     // frost white
  if (key.includes("kesihatan")) return { rgb: "212,157,176", hex: "#D49DB0" }; // powder rose
  if (key.includes("belajar")) return { rgb: "160,224,171", hex: "#A0E0AB" };   // sage green
  if (key.includes("beli")) return { rgb: "255,172,46", hex: "#FFAC2E" };       // warm amber
  return { rgb: "139,158,136", hex: "#8B9E88" };                                 // whisper sage (others)
}
