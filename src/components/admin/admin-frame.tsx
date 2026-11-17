import Image from "next/image";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// The admin's frame: a top bar (logo, who is signed in, sign out) and the page heading with its
// actions. Shared by the page and its loading skeleton; the skeleton passes no email/actions.
export function AdminFrame({
  email,
  actions,
  children,
}: {
  email?: string | null;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const loading = email === undefined;
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
          <Image src="/brand/yuvabe-studios-logo.png" alt="Yuvabe Studios" width={640} height={223} className="h-8 w-auto" />
          {loading ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <form action={signOutAction} className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Showcase</h1>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              The public page of sample reels sales send to prospects. Only reels switched on show there.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions ?? (
              <>
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-28" />
              </>
            )}
          </div>
        </div>
        {children}
      </main>
    </>
  );
}
