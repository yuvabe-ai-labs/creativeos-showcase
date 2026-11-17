import { requireShowcaseAdmin } from "@/lib/auth/require-showcase-admin";
import { listShowcaseCategories, listShowcaseReels } from "@/lib/db/showcase";
import { ShowcaseAdmin } from "@/components/admin/showcase-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Showcase admin" };

// Showcase admins (CreativeOS super admins, or a showcase-only login) curate the public page here.
// The actions in src/lib/actions/showcase.ts revalidate this page and the public one.
export default async function AdminPage() {
  const caller = await requireShowcaseAdmin();
  const [categories, reels] = await Promise.all([listShowcaseCategories(), listShowcaseReels()]);
  return <ShowcaseAdmin email={caller.email} categories={categories} reels={reels} />;
}
