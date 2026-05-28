import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import FlagsClient from "./FlagsClient";

export default async function FlagsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: bill } = await supabase
    .from("bills")
    .select("id, title, pay_code")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();

  if (!bill) notFound();

  const { data: flags } = await supabase
    .from("flags")
    .select("*, bill_members(name, phone), bill_items(name, original_price, edited_price)")
    .eq("bill_id", id)
    .order("created_at", { ascending: false });

  return <FlagsClient bill={bill} flags={flags ?? []} />;
}
