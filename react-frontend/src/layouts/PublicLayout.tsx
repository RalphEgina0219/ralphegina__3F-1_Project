import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageFallback } from '@/app/PageFallback';

export function PublicLayout() {
  return (
    <div className="min-h-dvh bg-foam">
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
