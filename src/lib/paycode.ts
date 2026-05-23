export function generatePayCode(title: string): string {
  const prefix = title
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
  const suffix = Math.random()
    .toString(36)
    .toUpperCase()
    .slice(2, 6);
  return `${prefix}-${suffix}`;
}

export function generatePersonalToken(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
