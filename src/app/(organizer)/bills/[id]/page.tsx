import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import BillDetailClient from "./BillDetailClient";

export default async function BillDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: bill } = await supabase
    .from("bills")
    .select("*, bill_members(*), bill_items(*)")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();

  if (!bill) notFound();

  const { data: flags } = await supabase
    .from("flags")
    .select("*, bill_members(name), bill_items(name)")
    .eq("bill_id", id)
    .eq("status", "pending");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, bank_name, bank_account, bank_holder_name, qr_url, payment_method, phone")
    .eq("id", user.id)
    .single();

  return (
    <BillDetailClient
      bill={bill}
      flags={flags ?? []}
      profile={profile}
      initialEdit={edit === "1"}
    />
  );
}
