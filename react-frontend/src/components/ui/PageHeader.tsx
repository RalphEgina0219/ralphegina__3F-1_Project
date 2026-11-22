import { ArrowLeft } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { brandName } from '@/features/branding/branding';
import { cn } from '@/lib/cn';

interface PageHeaderProps {
  title: ReactNode;
  /** Used for the browser tab when `title` is not plain text. */
  documentTitle?: string;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string; phoneOnly?: boolean };
  titleClassName?: string;
  className?: string;
}

/** The page's only <h1>, plus its description and actions. */
export function PageHeader({
  title,
  documentTitle,
  eyebrow,
  subtitle,
  actions,
  back,
  titleClassName,
  className,
}: PageHeaderProps) {
  useDocumentTitle(documentTitle ?? (typeof title === 'string' ? title : undefined));

  return (
    <header
      className={cn('mb-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-3', className)}
    >
      <div className="min-w-0">
        {back && (
          <Link
            to={back.to}
            className={cn(
              'mb-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-flow-text hover:text-flow-hover print:hidden',
              back.phoneOnly && 'lg:hidden',
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {back.label}
          </Link>
        )}
        {eyebrow && <p className="text-[13px] text-muted">{eyebrow}</p>}
        <h1
          className={cn(
            'text-2xl leading-tight font-extrabold tracking-[-0.02em] md:text-[28px]',
            titleClassName,
          )}
        >
          {title}
        </h1>
        {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </header>
  );
}

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${brandName()}` : brandName();
  }, [title]);
}
