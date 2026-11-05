import { create } from 'zustand';
import { api } from '@/lib/api';
import type { CustomerSelfDto } from '@/types/api';

type Status = 'idle' | 'loading' | 'authenticated' | 'guest';

interface CustomerAuthState {
  status: Status;
  customer: CustomerSelfDto | null;
  setCustomer: (customer: CustomerSelfDto | null) => void;
}

/** The customer's session. Entirely separate from the staff auth store. */
export const useCustomerAuth = create<CustomerAuthState>((set) => ({
  status: 'idle',
  customer: null,
  setCustomer: (customer) => set({ customer, status: customer ? 'authenticated' : 'guest' }),
}));

/** Asks the customer guard who is signed in. Runs once, when a customer page first opens. */
export async function bootstrapCustomer() {
  if (useCustomerAuth.getState().status !== 'idle') return;
  useCustomerAuth.setState({ status: 'loading' });
  try {
    const { data } = await api.get<{ customer: CustomerSelfDto }>('/customer/auth/me');
    useCustomerAuth.getState().setCustomer(data.customer);
  } catch {
    useCustomerAuth.getState().setCustomer(null);
  }
}

export function useSignedInCustomer(): CustomerSelfDto {
  const customer = useCustomerAuth((state) => state.customer);
  if (!customer) throw new Error('useSignedInCustomer used outside RequireCustomer');
  return customer;
}
