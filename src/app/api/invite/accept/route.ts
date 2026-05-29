import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase-server";

// POST — accept an invite: create a bidirectional friendship between the
// authenticated user and the inviter so both can see & chat with each other.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviterId } = (await req.json()) as { inviterId: string };
  if (!inviterId) {
    return NextResponse.json({ error: "Missing inviterId" }, { status: 400 });
  }
  if (inviterId === user.id) {
    return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
  }

  // Make sure the inviter actually exists
  const admin = await createAdminSupabaseClient();
  const { data: inviter } = await admin
    .from("profiles")
    .select("id")
    .eq("id", inviterId)
    .maybeSingle();
  if (!inviter) {
    return NextResponse.json({ error: "Inviter not found" }, { status: 404 });
  }

  // Bidirectional friendship — admin client bypasses RLS so both rows persist
  const { error } = await admin.from("friendships").upsert(
    [
      { organizer_id: inviterId, friend_user_id: user.id },
      { organizer_id: user.id, friend_user_id: inviterId },
    ],
    { onConflict: "organizer_id,friend_user_id", ignoreDuplicates: true }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
