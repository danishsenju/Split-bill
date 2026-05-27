import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import FriendsClient from "./FriendsClient";

export default async function FriendsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: raw } = await supabase
    .from("friendships")
    .select("id, friend_user_id, created_at, profiles!friendships_friend_user_id_fkey(id, name, username)")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  // Supabase returns joined rows as arrays; normalize to single object
  const friendships = (raw ?? []).map((f) => ({
    id: f.id as string,
    friend_user_id: f.friend_user_id as string,
    created_at: f.created_at as string,
    profiles: Array.isArray(f.profiles)
      ? (f.profiles[0] as { id: string; name: string; username?: string } | undefined) ?? null
      : (f.profiles as { id: string; name: string; username?: string } | null),
  }));

  return <FriendsClient initialFriends={friendships} />;
}
