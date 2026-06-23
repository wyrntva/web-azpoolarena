"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function GAPageTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      (window as any).gtag("config", gaId, {
        page_path: url,
      });
    }
  }, [pathname, searchParams, gaId]);

  return null;
}

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  if (!gaId) return null;

  return (
    <Suspense fallback={null}>
      <GAPageTracker gaId={gaId} />
    </Suspense>
  );
}
