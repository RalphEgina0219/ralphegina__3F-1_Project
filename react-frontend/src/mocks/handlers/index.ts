import { notFoundHandler } from '../http';
import { adminHandlers } from './admin';
import { authHandlers } from './auth';
import { basketHandlers } from './baskets';
import { customerHandlers } from './customers';
import { dashboardHandlers } from './dashboard';
import { inventoryHandlers } from './inventory';
import { orderHandlers } from './orders';
import { paymentHandlers } from './payments';
import { portalHandlers } from './portal';
import { reportHandlers } from './reports';
import { serviceHandlers } from './services';
import { washTypeHandlers } from './washTypes';

export const handlers = [
  ...authHandlers,
  ...portalHandlers,
  ...dashboardHandlers,
  ...customerHandlers,
  ...serviceHandlers,
  ...washTypeHandlers,
  ...basketHandlers,
  ...orderHandlers,
  ...paymentHandlers,
  ...inventoryHandlers,
  ...reportHandlers,
  ...adminHandlers,
  // Last: any API path nobody claims, including the removed receipt and tracking endpoints.
  notFoundHandler,
];
