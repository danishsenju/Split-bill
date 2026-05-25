import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CreateBillClient from "./CreateBillClient";

export default async function CreateBillPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <Suspense fallback={null}>
      <CreateBillClient />
    </Suspense>
  );
}
