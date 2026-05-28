import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface MemberRow {
  name: string;
  phone?: string;
}

interface BillItemRow {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CreateBillBody {
  title: string;
  description?: string;
  category: string;
  splitMode: "equal" | "scan";
  totalAmount: number;
  tax: number;
  serviceCharge: number;
  dueDate: string;
  payCode: string;
  storeName?: string;
  members: MemberRow[];
  items?: BillItemRow[];
}

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const userClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
    }

    const body = (await req.json()) as CreateBillBody;
    const {
      title,
      description,
      category,
      splitMode,
      totalAmount,
      tax,
      serviceCharge,
      dueDate,
      payCode,
      storeName,
      members,
      items,
    } = body;

    // Use admin client to bypass RLS — organizer_id is verified from the auth token above
    const admin = await createAdminSupabaseClient();

    // Ensure profile exists for this user (upsert with minimal fields if missing)
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      // Profile was never created during registration — create a minimal one
      const { error: profileError } = await admin.from("profiles").insert({
        id: user.id,
        name: user.email?.split("@")[0] ?? "Organizer",
        email: user.email ?? "",
        payment_method: "bank",
      });
      if (profileError) {
        console.error("Profile create error:", profileError);
        return NextResponse.json(
          { error: "Gagal buat profil pengguna" },
          { status: 500 }
        );
      }
    }

    // Create bill
    const { data: bill, error: billError } = await admin
      .from("bills")
      .insert({
        organizer_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        category,
        split_mode: splitMode,
        total_amount: totalAmount,
        tax,
        service_charge: serviceCharge,
        pay_code: payCode,
        due_date: dueDate,
        status: "active",
        store_name: storeName || null,
        receipt_edited: false,
      })
      .select()
      .single();

    if (billError || !bill) {
      console.error("Bill insert error:", billError);
      return NextResponse.json({ error: "Gagal buat bil" }, { status: 500 });
    }

    // Insert members
    // Equal mode → split total evenly upfront.
    // Scan mode → amount starts at 0; each member's owed amount is computed
    // after they claim their items on the pay page.
    const amountPerPerson = splitMode === "equal" ? totalAmount / members.length : 0;
    const { generatePersonalToken } = await import("@/lib/paycode");

    const memberRows = members.map((m) => ({
      bill_id: bill.id,
      name: m.name.trim(),
      phone: m.phone?.trim() || null,
      amount_owed: amountPerPerson,
      paid: false,
      personal_token: generatePersonalToken(),
    }));

    const { data: insertedMembers, error: memberError } = await admin
      .from("bill_members")
      .insert(memberRows)
      .select();

    if (memberError || !insertedMembers) {
      console.error("Member insert error:", memberError);
      return NextResponse.json(
        { error: "Gagal tambah ahli" },
        { status: 500 }
      );
    }

    // Insert bill items if scan mode
    if (splitMode === "scan" && items && items.length > 0) {
      const itemRows = items.map((item, idx) => ({
        bill_id: bill.id,
        name: item.name,
        original_price: item.price,
        edited_price: item.price,
        qty: item.qty,
        is_edited: false,
        total_units_available: item.qty,
        total_units_claimed: 0,
        item_type: "item" as const,
        sort_order: idx,
      }));
      await admin.from("bill_items").insert(itemRows);
    }

    return NextResponse.json({
      bill,
      members: insertedMembers.map((m) => ({
        name: m.name,
        phone: m.phone ?? "",
        personal_token: m.personal_token,
        amount_owed: m.amount_owed,
      })),
    });
  } catch (err) {
    console.error("Create bill route error:", err);
    return NextResponse.json({ error: "Ralat tidak dijangka" }, { status: 500 });
  }
}
