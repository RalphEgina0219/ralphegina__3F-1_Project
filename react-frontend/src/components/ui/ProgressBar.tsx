import { cn } from '@/lib/cn';

interface ProgressBarProps {
  percent: number;
  barClass?: string;
  label: string;
  className?: string;
}

export function ProgressBar({ percent, barClass = 'bg-flow', label, className }: ProgressBarProps) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-foam-2', className)}
    >
      <div className={cn('h-full rounded-full', barClass)} style={{ width: `${value}%` }} />
    </div>
  );
}
