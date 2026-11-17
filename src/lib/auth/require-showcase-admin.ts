import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/auth";
import { canManageShowcase } from "./platform-role";

export type Caller = { userId: string; email: string | null };

/** The signed-in user, or null. getUser() checks the token with Supabase, not just the cookie. */
export const getCaller = cache(async (): Promise<(Caller & { canManage: boolean }) | null> => {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { userId: data.user.id, email: data.user.email ?? null, canManage: canManageShowcase(data.user.app_metadata) };
});

// Gate for /admin pages and every showcase action. Signed out → the sign-in page. Signed in
// but not allowed (canManageShowcase) → 404, so the admin isn't advertised.
export async function requireShowcaseAdmin(): Promise<Caller> {
  const caller = await getCaller();
  if (!caller) redirect("/admin/login");
  if (!caller.canManage) notFound();
  return { userId: caller.userId, email: caller.email };
}
