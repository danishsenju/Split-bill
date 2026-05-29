import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// PATCH — update the authenticated user's own profile (details + visibility)
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    username?: string;
    phone?: string;
    hide_phone?: boolean;
    hide_email?: boolean;
  };

  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) {
      return NextResponse.json({ error: "Name too short" }, { status: 400 });
    }
    updates.name = name;
  }

  if (typeof body.username === "string") {
    const username = body.username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }
    // Uniqueness — allow keeping your own
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Username taken" }, { status: 409 });
    }
    updates.username = username;
  }

  if (typeof body.phone === "string") updates.phone = body.phone.trim();
  if (typeof body.hide_phone === "boolean") updates.hide_phone = body.hide_phone;
  if (typeof body.hide_email === "boolean") updates.hide_email = body.hide_email;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
