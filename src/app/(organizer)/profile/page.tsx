import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: ownedBills } = await supabase
    .from("bills")
    .select("id, bill_members(amount_owed, paid)")
    .eq("organizer_id", user.id);

  const billCount = ownedBills?.length ?? 0;
  const totalCollected =
    ownedBills
      ?.flatMap((b) => b.bill_members ?? [])
      .filter((m) => m.paid)
      .reduce((s, m) => s + m.amount_owed, 0) ?? 0;

  return (
    <ProfileClient
      profile={profile}
      billCount={billCount}
      totalCollected={totalCollected}
    />
  );
}
