import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { token, userId, name } = await req.json() as {
      token: string;
      userId: string;
      name: string;
    };

    if (!token || !userId || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = await createAdminSupabaseClient();

    // Find the bill_member by personal_token
    const { data: memberRow, error: findErr } = await admin
      .from("bill_members")
      .select("id, bill_id, user_id")
      .eq("personal_token", token)
      .single();

    if (findErr || !memberRow) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Update member: link user_id and set registered name
    await admin
      .from("bill_members")
      .update({ user_id: userId, name })
      .eq("id", memberRow.id);

    // Look up organizer_id from the bill
    const { data: bill } = await admin
      .from("bills")
      .select("organizer_id")
      .eq("id", memberRow.bill_id)
      .single();

    // Auto-add as friend of organizer (ignore if already exists)
    if (bill?.organizer_id && bill.organizer_id !== userId) {
      await admin.from("friendships").upsert(
        { organizer_id: bill.organizer_id, friend_user_id: userId },
        { onConflict: "organizer_id,friend_user_id", ignoreDuplicates: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
