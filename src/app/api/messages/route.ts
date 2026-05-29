import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// POST — send a message (text or bill_share)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipientId, body, billId, messageType } = (await req.json()) as {
    recipientId: string;
    body?: string;
    billId?: string;
    messageType?: "text" | "bill_share";
  };

  if (!recipientId) {
    return NextResponse.json({ error: "Missing recipientId" }, { status: 400 });
  }
  const type = messageType === "bill_share" ? "bill_share" : "text";
  if (type === "text" && !body?.trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }
  if (type === "bill_share" && !billId) {
    return NextResponse.json({ error: "Missing billId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      body: body?.trim() || null,
      bill_id: type === "bill_share" ? billId : null,
      message_type: type,
    })
    .select("*, bills(id, title, pay_code, total_amount, category)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}

// PATCH — mark all messages from a given sender as read
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fromUserId } = (await req.json()) as { fromUserId: string };
  if (!fromUserId) {
    return NextResponse.json({ error: "Missing fromUserId" }, { status: 400 });
  }

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .eq("sender_id", fromUserId)
    .is("read_at", null);

  return NextResponse.json({ ok: true });
}
