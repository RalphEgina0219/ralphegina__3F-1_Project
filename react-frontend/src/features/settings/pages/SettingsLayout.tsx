import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageFallback } from '@/app/PageFallback';
import { PageHeader } from '@/components/ui/PageHeader';
import { NavTabs } from '@/components/ui/Tabs';

const TABS = [
  { to: '/settings/services', label: 'Services & rates' },
  { to: '/settings/pricing', label: 'Pricing & Usage' },
  { to: '/settings/users', label: 'Users & roles' },
  { to: '/settings/baskets', label: 'Baskets' },
  { to: '/settings/shop', label: 'Shop profile' },
  { to: '/settings/activity', label: 'Activity log' },
];

export default function SettingsLayout() {
  return (
    <>
      <PageHeader
        title="Settings & Users"
        subtitle="Administrator only. Changes to rates apply to new orders; existing orders keep the rate they were billed at."
      />
      <NavTabs label="Settings sections" items={TABS} className="mb-5" />
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </>
  );
}
