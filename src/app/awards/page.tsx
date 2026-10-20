import { PortalNavbar } from "@/components/marketing/portal-navbar";
import { Suspense } from "react";
import { PortalFooter } from "@/components/marketing/portal-footer";
import { AwardsGallery } from "@/components/marketing/awards-gallery";
import { getWebSession as auth } from "@/lib/web-session";
import { listApprovedAwardsForGallery } from "@/lib/web-data";
import { toGalleryAward } from "@/lib/award-gallery";

export default async function AwardsGalleryPage() {
  const [session, awards] = await Promise.all([auth(), listApprovedAwardsForGallery()]);
  const currentUser = session?.user ? { name: session.user.name ?? "未命名用户", role: session.user.role } : null;
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PortalNavbar currentUser={currentUser} />
      <Suspense fallback={<p className="p-8 text-center">正在加载荣誉展示…</p>}>
        <AwardsGallery awards={awards.map(toGalleryAward)} />
      </Suspense>
      <PortalFooter />
    </div>
  );
}
