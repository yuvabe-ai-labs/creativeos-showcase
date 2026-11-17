"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/auth";
import { canManageShowcase } from "@/lib/auth/platform-role";

export type SignInState = { error?: string } | undefined;

// Sign in with a showcase-only or CreativeOS account. Only showcase admins (canManageShowcase)
// get past this: anyone else is signed
// straight back out, so no half-signed-in session is left behind.
export async function signInAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "That email and password don't match." };
  if (!canManageShowcase(data.user.app_metadata)) {
    await supabase.auth.signOut();
    return { error: "This account can't manage the showcase." };
  }
  redirect("/admin");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
