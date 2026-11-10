/**
 * The Laravel API's JWT access tokens (course: Authorization: Bearer <token>). Staff and customers
 * have separate tokens, because they sign in to separate guards: a customer token is rejected by
 * every staff route and the reverse.
 *
 * Kept in localStorage so an installed app stays signed in; cleared on sign-out and whenever the
 * API refuses the token. Storage can be blocked (private mode): then the token lives in memory.
 */
export type TokenKind = 'staff' | 'customer';

const KEYS: Record<TokenKind, string> = {
  staff: 'laundryflow.token.staff',
  customer: 'laundryflow.token.customer',
};

const memory: Partial<Record<TokenKind, string>> = {};

export function getToken(kind: TokenKind): string | null {
  try {
    return localStorage.getItem(KEYS[kind]) ?? memory[kind] ?? null;
  } catch {
    return memory[kind] ?? null;
  }
}

export function setToken(kind: TokenKind, token: string | null) {
  if (token) memory[kind] = token;
  else delete memory[kind];
  try {
    if (token) localStorage.setItem(KEYS[kind], token);
    else localStorage.removeItem(KEYS[kind]);
  } catch {
    // Blocked storage: the in-memory copy is enough for this tab.
  }
}

export const clearToken = (kind: TokenKind) => setToken(kind, null);
