import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import BillsClient from "./BillsClient";

export default async function BillsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: bills } = await supabase
    .from("bills")
    .select("*, bill_members(*)")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  return <BillsClient bills={bills ?? []} />;
}
