import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { OfflinePage } from '@/features/pwa/components/OfflinePage';
import type { RouteHandle } from '@/layouts/AppShell';
import { AuthLayout } from '@/layouts/AuthLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { ForbiddenPage, NotFoundPage, RouteErrorPage } from './ErrorPages';
import { PageFallback } from './PageFallback';
import { RequireAuth } from './RequireAuth';
import { RequireCustomer } from './RequireCustomer';
import { RequireRole } from './RequireRole';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const StaffPasswordPage = lazy(() => import('@/features/auth/pages/StaffPasswordPage'));
const AppShell = lazy(() =>
  import('@/layouts/AppShell').then((module) => ({ default: module.AppShell })),
);
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const CustomersPage = lazy(() => import('@/features/customers/pages/CustomersPage'));
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage'));
const OrderBoardPage = lazy(() => import('@/features/orders/pages/OrderBoardPage'));
const NewOrderPage = lazy(() => import('@/features/orders/pages/NewOrderPage'));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage'));
const ScanPage = lazy(() => import('@/features/qr/pages/ScanPage'));
const PaymentsPage = lazy(() => import('@/features/payments/pages/PaymentsPage'));
const InventoryPage = lazy(() => import('@/features/inventory/pages/InventoryPage'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
const SettingsLayout = lazy(() => import('@/features/settings/pages/SettingsLayout'));
const ServicesPage = lazy(() => import('@/features/settings/pages/ServicesPage'));
const PricingUsagePage = lazy(() => import('@/features/settings/pages/PricingUsagePage'));
const BrandingPage = lazy(() => import('@/features/settings/pages/BrandingPage'));
const UsersPage = lazy(() => import('@/features/settings/pages/UsersPage'));
const ShopPage = lazy(() => import('@/features/settings/pages/ShopPage'));
const ActivityPage = lazy(() => import('@/features/settings/pages/ActivityPage'));
const BasketsPage = lazy(() => import('@/features/baskets/pages/BasketsPage'));
const BasketLinkPage = lazy(() => import('@/features/baskets/pages/BasketLinkPage'));
const CustomerLayout = lazy(() =>
  import('@/layouts/CustomerLayout').then((module) => ({ default: module.CustomerLayout })),
);
const CustomerLoginPage = lazy(() => import('@/features/portal/pages/CustomerLoginPage'));
const RegisterPage = lazy(() => import('@/features/portal/pages/RegisterPage'));
const ForcePasswordPage = lazy(() => import('@/features/portal/pages/ForcePasswordPage'));
const PortalHomePage = lazy(() => import('@/features/portal/pages/PortalHomePage'));
const PortalOrdersPage = lazy(() => import('@/features/portal/pages/PortalOrdersPage'));
const PortalOrderPage = lazy(() => import('@/features/portal/pages/PortalOrderPage'));
const PortalAccountPage = lazy(() => import('@/features/portal/pages/PortalAccountPage'));
const DevUiPage = lazy(() => import('./DevUiPage'));

const page = (Page: LazyExoticComponent<ComponentType>) => <Page />;
const fullscreenOnPhone: RouteHandle = { fullscreenOnPhone: true };

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: '/login', element: page(LoginPage) }],
      },
      {
        element: <PublicLayout />,
        children: [
          // The URL on every basket label. Staff see the scan result, anyone else a neutral notice.
          { path: '/b/:token', element: page(BasketLinkPage) },
          // The customer portal: its own pages, layout and session, apart from the staff app.
          { path: '/my/login', element: page(CustomerLoginPage) },
          { path: '/register', element: page(RegisterPage) },
          {
            element: <RequireCustomer />,
            children: [
              { path: '/my/password', element: page(ForcePasswordPage) },
              {
                element: (
                  <Suspense fallback={<PageFallback />}>
                    <CustomerLayout />
                  </Suspense>
                ),
                children: [
                  { path: '/my', element: page(PortalHomePage) },
                  { path: '/my/orders', element: page(PortalOrdersPage) },
                  { path: '/my/orders/:orderNumber', element: page(PortalOrderPage) },
                  { path: '/my/account', element: page(PortalAccountPage) },
                ],
              },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          // Outside the app shell: while a reset password is pending, it is the only page.
          {
            element: <PublicLayout />,
            children: [{ path: '/password', element: page(StaffPasswordPage) }],
          },
          {
            element: (
              <Suspense fallback={<PageFallback />}>
                <AppShell />
              </Suspense>
            ),
            children: [
              { path: '/', element: page(DashboardPage) },
              { path: '/403', element: <ForbiddenPage /> },
              {
                element: <RequireRole ability="customers.manage" />,
                children: [
                  { path: '/customers', element: page(CustomersPage) },
                  { path: '/customers/:id', element: page(CustomersPage) },
                ],
              },
              {
                element: <RequireRole ability="orders.manage" />,
                children: [
                  { path: '/orders', element: page(OrdersPage) },
                  { path: '/orders/board', element: page(OrderBoardPage) },
                  { path: '/orders/new', element: page(NewOrderPage), handle: fullscreenOnPhone },
                  {
                    path: '/orders/:id',
                    element: page(OrderDetailPage),
                    handle: fullscreenOnPhone,
                  },
                ],
              },
              {
                element: <RequireRole ability="baskets.scan" />,
                children: [{ path: '/scan', element: page(ScanPage), handle: fullscreenOnPhone }],
              },
              {
                element: <RequireRole ability="payments.view" />,
                children: [{ path: '/payments', element: page(PaymentsPage) }],
              },
              {
                element: <RequireRole ability="inventory.view" />,
                children: [{ path: '/inventory', element: page(InventoryPage) }],
              },
              {
                element: <RequireRole ability="reports.view" />,
                children: [{ path: '/reports', element: page(ReportsPage) }],
              },
              {
                element: <RequireRole ability="settings.manage" />,
                children: [
                  {
                    path: '/settings',
                    element: page(SettingsLayout),
                    children: [
                      { index: true, element: <Navigate to="services" replace /> },
                      { path: 'services', element: page(ServicesPage) },
                      { path: 'pricing', element: page(PricingUsagePage) },
                      { path: 'branding', element: page(BrandingPage) },
                      { path: 'users', element: page(UsersPage) },
                      {
                        element: <RequireRole ability="baskets.manage" />,
                        children: [{ path: 'baskets', element: page(BasketsPage) }],
                      },
                      { path: 'shop', element: page(ShopPage) },
                      { path: 'activity', element: page(ActivityPage) },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      ...(import.meta.env.DEV
        ? [
            {
              path: '/dev/ui',
              element: (
                <Suspense fallback={<PageFallback />}>
                  <DevUiPage />
                </Suspense>
              ),
            },
          ]
        : []),
      // Not lazy: it must show even when page code can't be downloaded.
      { path: '/offline', element: <OfflinePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes, {
  future: {
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_relativeSplatPath: true,
    v7_skipActionErrorRevalidation: true,
  },
});
