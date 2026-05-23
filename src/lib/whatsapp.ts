import { WATone } from "@/types";

interface WAMessageVars {
  nama: string;
  amount: string;
  tajuk: string;
  due_date: string;
  code: string;
  link: string;
}

const templates: Record<WATone, string> = {
  firm: `{nama}, sila selesaikan pembayaran RM {amount} untuk {tajuk} sebelum {due_date}. Gunakan Pay Code {code} sebagai rujukan pembayaran. {link}`,
  funny: `Wehh {nama}! Duit tak masuk lagi ni 😅 RM {amount} je beb, kopi pun lagi mahal. Jom settle cepat: {link} (code: {code}) Kang kita kira hutang lain pulak 😂`,
  professional: `Dear {nama}, this is a gentle reminder regarding your payment of RM {amount} for {tajuk}. Kindly complete your payment before {due_date} using reference code {code}. {link}`,
  custom: `{nama}, sila bayar RM {amount} untuk {tajuk}. Code: {code}. {link}`,
};

export function buildWAMessage(tone: WATone, vars: WAMessageVars, customTemplate?: string): string {
  const template = tone === "custom" && customTemplate ? customTemplate : templates[tone];
  return template
    .replace(/{nama}/g, vars.nama)
    .replace(/{amount}/g, vars.amount)
    .replace(/{tajuk}/g, vars.tajuk)
    .replace(/{due_date}/g, vars.due_date)
    .replace(/{code}/g, vars.code)
    .replace(/{link}/g, vars.link);
}

export function buildWAUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

export { templates as waTemplates };
