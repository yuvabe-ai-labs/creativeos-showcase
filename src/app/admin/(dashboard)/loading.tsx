import { AdminFrame } from "@/components/admin/admin-frame";
import { ShowcaseAdminSkeleton } from "@/components/admin/showcase-admin-skeleton";

// The admin's real heading straight away; the account and the reel list shimmer until loaded.
export default function Loading() {
  return (
    <AdminFrame>
      <ShowcaseAdminSkeleton />
    </AdminFrame>
  );
}
