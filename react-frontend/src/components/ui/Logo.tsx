import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  /** Draw only the drop and wave, without the rounded tile. */
  bare?: boolean;
}

/** Water droplet with a wave line inside a rounded square. */
export function Logo({ className, bare = false }: LogoProps) {
  return (
    <svg viewBox="0 0 40 40" className={cn('size-10 shrink-0', className)} aria-hidden="true">
      {!bare && <rect width="40" height="40" rx="10" className="fill-ink-2" />}
      <path d="M20 7c5 6.4 9 10.9 9 16a9 9 0 0 1-18 0c0-5.1 4-9.600 9-16z" className="fill-aqua" />
      <path
        d="M12.500 24.500c2.500-1.800 5-1.800 7.500 0s5 1.800 7.500 0"
        fill="none"
        strokeWidth="2.400"
        strokeLinecap="round"
        className="stroke-ink"
      />
    </svg>
  );
}
