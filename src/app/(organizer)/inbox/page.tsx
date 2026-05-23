import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import InboxClient from "./InboxClient";

export default async function InboxPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: activities } = await supabase
    .from("activity_log")
    .select("*, bills(id, title, pay_code), bill_members(id, name), flags(id, status)")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  return <InboxClient activities={activities ?? []} />;
}
