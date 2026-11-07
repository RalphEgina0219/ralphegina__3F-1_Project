import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ANIMATION_MS } from './chartTheme';

/** One subtle entrance, or none at all for people who asked for less motion (and in print). */
export function useChartAnimation() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  return {
    isAnimationActive: !reduced,
    animationDuration: ANIMATION_MS,
    animationEasing: 'ease-out' as const,
  };
}
