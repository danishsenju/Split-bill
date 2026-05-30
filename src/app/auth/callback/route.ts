import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // no-op in Server Component context
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`);
  }

  // Create profile from user_metadata if it doesn't exist yet
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existingProfile) {
    const meta = data.user.user_metadata ?? {};
    await supabase.from("profiles").insert({
      id: data.user.id,
      name: meta.name ?? "",
      username: meta.username ?? "",
      email: data.user.email ?? "",
      phone: meta.phone ?? null,
      payment_method: meta.payment_method ?? "bank",
      bank_name: meta.bank_name ?? null,
      bank_account: meta.bank_account ?? null,
      bank_holder_name: meta.bank_holder_name ?? null,
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
