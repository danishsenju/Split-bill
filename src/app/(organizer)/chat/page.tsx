import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ChatListClient, { ChatSummary } from "./ChatListClient";

export default async function ChatPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Friends of this organizer
  const { data: rawFriends } = await supabase
    .from("friendships")
    .select(
      "friend_user_id, profiles!friendships_friend_user_id_fkey(id, name, username)"
    )
    .eq("organizer_id", user.id);

  // Recent messages either sent or received by this user
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, message_type, read_at, created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(300);

  const msgs = messages ?? [];

  const summaries: ChatSummary[] = (rawFriends ?? []).map((f) => {
    const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
    const friendId = f.friend_user_id as string;

    const convo = msgs.filter(
      (m) =>
        (m.sender_id === user.id && m.recipient_id === friendId) ||
        (m.sender_id === friendId && m.recipient_id === user.id)
    );
    const last = convo[0]; // already ordered desc
    const unread = convo.filter(
      (m) => m.recipient_id === user.id && !m.read_at
    ).length;

    return {
      friendId,
      name: (profile?.name as string) ?? "Pengguna",
      username: (profile?.username as string) ?? undefined,
      lastBody:
        last?.message_type === "bill_share"
          ? "__bill__"
          : (last?.body as string) ?? null,
      lastFromMe: last ? last.sender_id === user.id : false,
      lastAt: (last?.created_at as string) ?? null,
      unread,
    };
  });

  // Sort: conversations with messages first (newest), then the rest by name
  summaries.sort((a, b) => {
    if (a.lastAt && b.lastAt)
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
    if (a.lastAt) return -1;
    if (b.lastAt) return 1;
    return a.name.localeCompare(b.name);
  });

  return <ChatListClient chats={summaries} />;
}
