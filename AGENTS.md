# Working on this repo

This is NOT the Next.js you know: Next 16 has breaking changes. Read the relevant guide in
`node_modules/next/dist/docs/` before writing code. `proxy.ts` replaces middleware.

## Rules for the showcase (from the people who asked for it)

- **Never show a brand name** on the public page: not in titles, links or file names. The server
  refuses titles containing a client's name (`findBrandInTitle`).
- **No counts** of reels, brands or categories on the public page. The first chip is "Featured".
- **No download, share, copy-link or contact buttons** on the public page.
- The intro is the eyebrow "Made with CreativeOS" and the heading only; no line claiming which steps happen in CreativeOS.

## Design

Yuvabe Studios design system, copied from CreativeOS: tokens in `src/app/globals.css`, Clash
Display + Gilroy only, purple `#5829c7` used sparingly, Lucide icons at 1.5 stroke, easing
`cubic-bezier(0.22,1,0.36,1)` only. Controls are shadcn (Base UI) primitives from
`src/components/ui/`, never raw `<button>`/`<input>`.

## Database

The tables belong to CreativeOS (migration `0063_showcase.sql` there). Schema changes go in a new
CreativeOS migration, never here.
