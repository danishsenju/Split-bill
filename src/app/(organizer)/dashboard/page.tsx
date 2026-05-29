import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: bills } = await supabase
    .from("bills")
    .select("*, bill_members(*)")
    .eq("organizer_id", user.id)
    .in("status", ["active", "overdue"])
    .order("created_at", { ascending: false });

  const { data: activities } = await supabase
    .from("activity_log")
    .select("*, bills(id, title, pay_code)")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <DashboardClient
      profile={profile}
      bills={bills ?? []}
      userId={user.id}
      activities={activities ?? []}
    />
  );
}
