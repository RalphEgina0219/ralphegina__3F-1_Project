import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import type { RouteHandle } from '@/layouts/AppShell';
import { AuthLayout } from '@/layouts/AuthLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { ForbiddenPage, NotFoundPage, RouteErrorPage } from './ErrorPages';
import { PageFallback } from './PageFallback';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const AppShell = lazy(() =>
  import('@/layouts/AppShell').then((module) => ({ default: module.AppShell })),
);
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const CustomersPage = lazy(() => import('@/features/customers/pages/CustomersPage'));
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage'));
const OrderBoardPage = lazy(() => import('@/features/orders/pages/OrderBoardPage'));
const NewOrderPage = lazy(() => import('@/features/orders/pages/NewOrderPage'));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage'));
const ReceiptPage = lazy(() => import('@/features/orders/pages/ReceiptPage'));
const ScanPage = lazy(() => import('@/features/qr/pages/ScanPage'));
const PaymentsPage = lazy(() => import('@/features/payments/pages/PaymentsPage'));
const InventoryPage = lazy(() => import('@/features/inventory/pages/InventoryPage'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
const SettingsLayout = lazy(() => import('@/features/settings/pages/SettingsLayout'));
const ServicesPage = lazy(() => import('@/features/settings/pages/ServicesPage'));
const UsersPage = lazy(() => import('@/features/settings/pages/UsersPage'));
const ShopPage = lazy(() => import('@/features/settings/pages/ShopPage'));
const ActivityPage = lazy(() => import('@/features/settings/pages/ActivityPage'));
const TrackPage = lazy(() => import('@/features/tracking/pages/TrackPage'));
const TrackLookupPage = lazy(() => import('@/features/tracking/pages/TrackLookupPage'));
const DevUiPage = lazy(() => import('./DevUiPage'));

const page = (Page: LazyExoticComponent<ComponentType>) => <Page />;
const fullscreenOnPhone: RouteHandle = { fullscreenOnPhone: true };

const routes: RouteObject[] = [
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
          { path: '/track', element: page(TrackLookupPage) },
          { path: '/track/:token', element: page(TrackPage) },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
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
                  {
                    path: '/orders/:id/receipt',
                    element: page(ReceiptPage),
                    handle: fullscreenOnPhone,
                  },
                ],
              },
              {
                element: <RequireRole ability="qr.scan" />,
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
                      { path: 'users', element: page(UsersPage) },
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
