import Image from "next/image";
import { redirect } from "next/navigation";
import { getCaller } from "@/lib/auth/require-showcase-admin";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in · Showcase admin" };

export default async function LoginPage() {
  const caller = await getCaller();
  if (caller?.canManage) redirect("/admin");

  return (
    <main className="login-surface flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-card">
        <Image src="/brand/yuvabe-studios-logo.png" alt="Yuvabe Studios" width={640} height={223} className="h-10 w-auto" />
        <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight">Showcase admin</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">Sign in to add and arrange reels.</p>
        <SignInForm />
      </div>
    </main>
  );
}
