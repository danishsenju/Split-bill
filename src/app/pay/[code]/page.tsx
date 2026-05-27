import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase-server";
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
      <div style={{ minHeight: "100dvh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", gap: "16px" }}>
        <span style={{ fontSize: "48px" }}>🔍</span>
        <h1 style={{ fontFamily: "var(--font-plus-jakarta), system-ui", fontWeight: 800, fontSize: "24px", color: "#fff", textAlign: "center" }}>
          Bil Tidak Wujud
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", textAlign: "center", lineHeight: 1.6 }}>
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

  // Auto-link: if a registered user is viewing their own member link, silently link them
  if (member && !member.user_id) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const admin = await createAdminSupabaseClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("name, username")
        .eq("id", session.user.id)
        .single();

      const updatedName = profile?.name ?? member.name;
      await admin
        .from("bill_members")
        .update({ user_id: session.user.id, name: updatedName })
        .eq("id", member.id);

      // Auto-add as friend of organizer
      await admin.from("friendships").upsert(
        { organizer_id: bill.organizer_id, friend_user_id: session.user.id },
        { onConflict: "organizer_id,friend_user_id", ignoreDuplicates: true }
      );

      // Reflect updated name in the member object passed to client
      member.name = updatedName;
      member.user_id = session.user.id;
    }
  }

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
