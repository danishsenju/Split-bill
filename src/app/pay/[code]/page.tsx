import { createServerSupabaseClient } from "@/lib/supabase-server";
import PayPageClient from "./PayPageClient";

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function PayPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const { t: token } = await searchParams;

  const supabase = await createServerSupabaseClient();

  // Fetch the bill by pay_code with its members and organizer profile
  const { data: bill } = await supabase
    .from("bills")
    .select("*, bill_members(*), bill_items(*)")
    .eq("pay_code", code)
    .single();

  if (!bill) {
    return (
      <div className="min-h-dvh bg-bg-primary flex flex-col items-center justify-center px-4 gap-4">
        <span className="text-5xl">🔍</span>
        <h1 className="font-syne font-bold text-2xl text-text-primary text-center">
          Bil Tidak Wujud
        </h1>
        <p className="text-text-secondary font-dm text-sm text-center">
          Link ini tidak sah atau bil telah tamat. Hubungi penganjur untuk link yang betul.
        </p>
      </div>
    );
  }

  // Fetch organizer profile
  const { data: organizerProfile } = await supabase
    .from("profiles")
    .select("name, bank_name, bank_account, bank_holder_name, qr_url, payment_method")
    .eq("id", bill.organizer_id)
    .single();

  // Find member by personal_token
  const members = bill.bill_members ?? [];
  const member = token ? members.find((m: { personal_token: string }) => m.personal_token === token) ?? null : null;

  return (
    <PayPageClient
      bill={bill}
      member={member}
      organizerProfile={organizerProfile}
      payCode={code}
      personalToken={token ?? null}
    />
  );
}
