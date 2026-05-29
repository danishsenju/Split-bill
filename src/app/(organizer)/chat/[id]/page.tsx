import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import ConversationClient from "./ConversationClient";
import { Message } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { id: friendId } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Friend profile
  const { data: friend } = await supabase
    .from("profiles")
    .select("id, name, username")
    .eq("id", friendId)
    .single();

  if (!friend) notFound();

  // Mark incoming messages from this friend as read
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .eq("sender_id", friendId)
    .is("read_at", null);

  // Conversation history (ascending)
  const { data: messages } = await supabase
    .from("messages")
    .select("*, bills(id, title, pay_code, total_amount, category)")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true })
    .limit(200);

  // Active bills the organizer can share
  const { data: bills } = await supabase
    .from("bills")
    .select("id, title, pay_code, total_amount, category, status")
    .eq("organizer_id", user.id)
    .in("status", ["active", "overdue"])
    .order("created_at", { ascending: false });

  return (
    <ConversationClient
      userId={user.id}
      friend={friend as { id: string; name: string; username?: string }}
      initialMessages={(messages ?? []) as Message[]}
      shareableBills={
        (bills ?? []) as {
          id: string;
          title: string;
          pay_code: string;
          total_amount: number;
          category: string;
        }[]
      }
    />
  );
}
