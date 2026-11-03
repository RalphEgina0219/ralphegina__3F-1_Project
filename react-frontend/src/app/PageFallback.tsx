import { Skeleton } from '@/components/ui/States';

export function PageFallback() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-4 p-4 md:p-6">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-28 w-full rounded-card" />
      <Skeleton className="h-72 w-full rounded-card" />
    </div>
  );
}
