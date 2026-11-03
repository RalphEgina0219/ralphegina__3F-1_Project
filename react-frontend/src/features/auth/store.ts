import { create } from 'zustand';
import { api } from '@/lib/api';
import { can, type Ability } from '@/lib/permissions';
import type { AuthUser } from '@/types/api';

type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** True after a deliberate sign-out: the next person must not inherit this user's page. */
  signedOut: boolean;
  setUser: (user: AuthUser | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  signedOut: false,
  setUser: (user) => set({ user, status: user ? 'authenticated' : 'guest', signedOut: false }),
  signOut: () => set({ user: null, status: 'guest', signedOut: true }),
}));

/** Asks the API who is signed in. Called once while the app starts. */
export async function bootstrapAuth() {
  try {
    const { data } = await api.get<{ user: AuthUser }>('/auth/me');
    useAuthStore.getState().setUser(data.user);
  } catch {
    useAuthStore.getState().setUser(null);
  }
}

export function useCurrentUser(): AuthUser {
  const user = useAuthStore((state) => state.user);
  if (!user) throw new Error('useCurrentUser used outside RequireAuth');
  return user;
}

export function useCan(ability: Ability): boolean {
  return can(
    useAuthStore((state) => state.user),
    ability,
  );
}

export const roleLabel = (role: AuthUser['role']) =>
  role === 'admin' ? 'Administrator · Owner' : 'Laundry Staff';
