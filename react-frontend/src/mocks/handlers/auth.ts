import { clearSession, db, persist, setSession } from '../db';
import { asString, currentUser, fail, invalid, ok, publicRoute } from '../http';
import { audit, toAuthUser } from '../queries';

export const authHandlers = [
  publicRoute('post', '/auth/login', ({ body }) => {
    const username = asString(body.username).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    if (!username || !password) {
      return invalid({
        ...(username ? {} : { username: 'Enter your username.' }),
        ...(password ? {} : { password: 'Enter your password.' }),
      });
    }

    const user = db().users.find((u) => u.username.toLowerCase() === username);
    if (!user || db().credentials[user.id] !== password) {
      return fail(422, 'These credentials do not match our records.', {
        username: ['These credentials do not match our records.'],
      });
    }
    if (!user.is_active) {
      return fail(422, 'This account is disabled. Please ask the shop owner.', {
        username: ['This account is disabled. Please ask the shop owner.'],
      });
    }

    user.last_login_at = new Date().toISOString();
    setSession(user.id, body.remember === true);
    audit(user.id, 'auth.login', 'user', user.id);
    return ok({ user: toAuthUser(user) });
  }),

  publicRoute('post', '/auth/logout', () => {
    const user = currentUser();
    clearSession();
    if (user) audit(user.id, 'auth.logout', 'user', user.id);
    persist();
    return new Response(null, { status: 204 });
  }),

  publicRoute('get', '/auth/me', () => {
    const user = currentUser();
    return user ? ok({ user }) : fail(401, 'Unauthenticated.');
  }),
];
