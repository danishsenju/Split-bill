import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import CreateBillClient from "./CreateBillClient";

export default async function CreateBillPage() {
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

  return <CreateBillClient profile={profile} />;
}
