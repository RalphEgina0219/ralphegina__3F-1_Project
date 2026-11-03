import { cn } from '@/lib/cn';

interface WaveDividerProps {
  className?: string;
  /** Fill class of the front wave, usually the color of the section below. */
  fill?: string;
  /** Optional fill class of a second wave behind the first. */
  backFill?: string;
}

const FRONT = 'M0 58c150-30 310-34 480-10s300 42 480 14 320-38 480-16v74H0z';
const BACK = 'M0 34c170-34 340-26 500 2s300 34 470 6 320-28 470-12v90H0z';

export function WaveDivider({ className, fill = 'fill-foam', backFill }: WaveDividerProps) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={cn('block h-10 w-full', className)}
      aria-hidden="true"
    >
      {backFill && <path d={BACK} className={backFill} />}
      <path d={FRONT} className={fill} />
    </svg>
  );
}
