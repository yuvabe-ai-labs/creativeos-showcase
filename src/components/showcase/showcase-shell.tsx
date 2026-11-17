import Image from "next/image";

// The public page's frame: logo, intro and footer. None of it waits on data, so the loading
// screen renders the same shell and only the gallery inside it is a skeleton.
export function ShowcaseShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="login-surface flex-1 overflow-x-clip">
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-8">
        <header>
          <Image
            src="/brand/yuvabe-studios-logo.png"
            alt="Yuvabe Studios"
            width={640}
            height={223}
            priority
            className="h-11 w-auto sm:h-14"
          />
        </header>

        <div className="mt-10 max-w-2xl sm:mt-14">
          <p className="text-eyebrow text-muted-foreground">Made with CreativeOS</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            A selection of reels we&apos;ve made
          </h1>
          <p className="mt-4 text-muted-foreground">
            Every reel here was made by our team with CreativeOS, our AI production studio. Tap any
            reel to watch it with sound.
          </p>
        </div>

        <div className="mt-6">{children}</div>

        <footer className="mt-20 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Yuvabe Studios
        </footer>
      </div>
    </main>
  );
}
