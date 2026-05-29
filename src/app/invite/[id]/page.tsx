import { createServerSupabaseClient } from "@/lib/supabase-server";
import InviteClient from "./InviteClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { id: inviterId } = await params;

  const supabase = await createServerSupabaseClient();

  const { data: inviter } = await supabase
    .from("profiles")
    .select("id, name, username")
    .eq("id", inviterId)
    .maybeSingle();

  // Is someone already logged in? (to offer one-tap "add as contact")
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <InviteClient
      inviterId={inviterId}
      inviterName={(inviter?.name as string) ?? null}
      inviterUsername={(inviter?.username as string) ?? null}
      currentUserId={user?.id ?? null}
    />
  );
}
