import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    // No query — return current friends
    const { data: friendships } = await supabase
      .from("friendships")
      .select("id, friend_user_id, created_at, profiles!friendships_friend_user_id_fkey(id, name, username)")
      .eq("organizer_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ friends: friendships ?? [] });
  }

  // Search profiles by username — exclude self and existing friends
  const { data: existing } = await supabase
    .from("friendships")
    .select("friend_user_id")
    .eq("organizer_id", user.id);

  const excludeIds = [user.id, ...(existing ?? []).map((f: { friend_user_id: string }) => f.friend_user_id)];

  const { data: results } = await supabase
    .from("profiles")
    .select("id, name, username")
    .ilike("username", `%${q}%`)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .limit(10);

  return NextResponse.json({ results: results ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { friendUserId } = await req.json() as { friendUserId: string };
  if (!friendUserId) return NextResponse.json({ error: "Missing friendUserId" }, { status: 400 });
  if (friendUserId === user.id) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

  const { error } = await supabase
    .from("friendships")
    .upsert(
      { organizer_id: user.id, friend_user_id: friendUserId },
      { onConflict: "organizer_id,friend_user_id", ignoreDuplicates: true }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { friendUserId } = await req.json() as { friendUserId: string };
  if (!friendUserId) return NextResponse.json({ error: "Missing friendUserId" }, { status: 400 });

  await supabase
    .from("friendships")
    .delete()
    .eq("organizer_id", user.id)
    .eq("friend_user_id", friendUserId);

  return NextResponse.json({ ok: true });
}
