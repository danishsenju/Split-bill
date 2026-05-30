import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    email: string;
    password: string;
    name: string;
    username: string;
    phone?: string;
    payment_method: "bank" | "qr";
    bank_name?: string;
    bank_account?: string;
    bank_holder_name?: string;
  };

  const supabase = adminClient();

  // Username uniqueness check
  const { data: existingUsername } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", body.username.toLowerCase())
    .maybeSingle();
  if (existingUsername) {
    return NextResponse.json(
      { error: "Username sudah digunakan. Pilih username lain." },
      { status: 409 }
    );
  }

  // Create user with email pre-confirmed — no verification email needed
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  });

  if (createError || !userData.user) {
    const msg = createError?.message ?? "Pendaftaran gagal";
    // Friendlier message for duplicate email
    if (msg.toLowerCase().includes("already been registered") || msg.toLowerCase().includes("already registered")) {
      return NextResponse.json({ error: "Email ini sudah didaftarkan. Sila log masuk." }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userData.user.id,
    name: body.name.trim(),
    username: body.username.toLowerCase(),
    email: body.email,
    phone: body.phone || null,
    payment_method: body.payment_method,
    bank_name: body.payment_method === "bank" ? (body.bank_name ?? null) : null,
    bank_account: body.payment_method === "bank" ? (body.bank_account ?? null) : null,
    bank_holder_name: body.payment_method === "bank" ? (body.bank_holder_name ?? null) : null,
  });

  if (profileError) {
    // Roll back the auth user so the email can be reused
    await supabase.auth.admin.deleteUser(userData.user.id);
    return NextResponse.json(
      { error: "Gagal simpan profil: " + profileError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, userId: userData.user.id });
}
