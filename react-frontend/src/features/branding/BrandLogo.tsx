import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/features/theme/ThemeProvider';
import { cn } from '@/lib/cn';
import { useBranding } from './BrandingProvider';

interface BrandLogoProps {
  className?: string;
  /** On the dark sidebar and headers a light-background logo sits on a small light chip. */
  onInk?: boolean;
}

/** The shop's logo, or the LaundryFlow drop when none was uploaded. Dark mode uses the dark logo when there is one. */
export function BrandLogo({ className, onInk }: BrandLogoProps) {
  const branding = useBranding();
  const { theme } = useTheme();
  if (!branding.logo_url) return <Logo className={className} />;

  const dark = theme === 'dark' && branding.logo_dark_url;
  const src = dark ? (branding.logo_dark_url as string) : branding.logo_url;
  // A logo made for a light background needs a light chip behind it wherever the surface is dark.
  const chip = !dark && (onInk || theme === 'dark');
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-control',
        chip && 'bg-white p-1',
        className ?? 'size-10',
      )}
    >
      <img src={src} alt="" aria-hidden="true" className="size-full object-contain" />
    </span>
  );
}
