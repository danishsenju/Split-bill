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
