import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PrivacyClient from "./PrivacyClient";

export default async function PrivacyPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, username, phone, email, hide_phone, hide_email")
    .eq("id", user.id)
    .single();

  return (
    <PrivacyClient
      initial={{
        name: profile?.name ?? "",
        username: profile?.username ?? "",
        phone: profile?.phone ?? "",
        email: profile?.email ?? user.email ?? "",
        hide_phone: profile?.hide_phone ?? false,
        hide_email: profile?.hide_email ?? false,
      }}
    />
  );
}
