import { adminHandlers } from './admin';
import { authHandlers } from './auth';
import { customerHandlers } from './customers';
import { dashboardHandlers } from './dashboard';
import { inventoryHandlers } from './inventory';
import { orderHandlers } from './orders';
import { paymentHandlers } from './payments';
import { publicHandlers } from './public';
import { reportHandlers } from './reports';
import { serviceHandlers } from './services';

export const handlers = [
  ...authHandlers,
  ...publicHandlers,
  ...dashboardHandlers,
  ...customerHandlers,
  ...serviceHandlers,
  ...orderHandlers,
  ...paymentHandlers,
  ...inventoryHandlers,
  ...reportHandlers,
  ...adminHandlers,
];
