import {
  Banknote,
  Boxes,
  Clock3,
  Gauge,
  HandCoins,
  Package,
  ShoppingBasket,
  Shirt,
  TimerReset,
  Users,
  WashingMachine,
  Weight,
  type LucideIcon,
} from 'lucide-react';
import { ALERT, UI } from '@/components/charts/chartTheme';
import { Delta } from '@/components/charts/Delta';
import { formatValue } from '@/components/charts/format';
import { Sparkline } from '@/components/charts/Sparkline';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { KpiValue } from '@/lib/analytics/types';

const ICONS: Record<string, LucideIcon> = {
  sales: Banknote,
  collected: Banknote,
  revenue: Banknote,
  orders: WashingMachine,
  kilos: Weight,
  aov: HandCoins,
  unpaid: Clock3,
  outstanding: Clock3,
  in_process: Gauge,
  ready: Package,
  overdue_pickups: TimerReset,
  baskets: ShoppingBasket,
  pieces: Shirt,
  customers: Users,
  items: Boxes,
};

/**
 * One KPI from an analytics response: icon, value, change vs the previous period (arrow and
 * text), and a sparkline of the trend, or a progress bar for "18 / 30" values.
 */
export function KpiTile({ kpi, days, compare }: { kpi: KpiValue; days: number; compare: boolean }) {
  const Icon = ICONS[kpi.key] ?? Gauge;
  const warn = kpi.tone === 'warn';
  return (
    <KpiCard
      label={kpi.label}
      icon={<Icon className="size-4 shrink-0" aria-hidden="true" />}
      tone={kpi.tone === 'warn' ? 'warn' : kpi.tone === 'ok' ? 'ok' : 'default'}
      value={
        kpi.progress ? (
          <span className="tabular">
            {kpi.progress.value}
            <span className="text-lg font-bold text-muted"> / {kpi.progress.max}</span>
          </span>
        ) : (
          <span className="tabular">{formatValue(kpi.value, kpi.format)}</span>
        )
      }
      hint={kpi.hint}
      className="flex flex-col"
    >
      {compare && kpi.previous !== null && (
        <Delta pct={kpi.delta_pct} days={days} inverse={kpi.inverse} className="mt-1.5" />
      )}
      {kpi.progress && (
        <ProgressBar
          className="mt-3"
          label={`${kpi.label}: ${kpi.progress.value} of ${kpi.progress.max}`}
          percent={Math.round((kpi.progress.value / Math.max(1, kpi.progress.max)) * 100)}
        />
      )}
      {kpi.spark && kpi.spark.length > 1 && (
        <div className="mt-auto pt-2">
          <Sparkline values={kpi.spark} color={warn ? ALERT.warn : UI.flow} />
        </div>
      )}
    </KpiCard>
  );
}
