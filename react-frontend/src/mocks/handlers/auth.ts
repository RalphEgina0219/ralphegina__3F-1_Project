import { clearSession, db, persist, setSession } from '../db';
import { asString, currentUser, fail, invalid, ok, publicRoute, route } from '../http';
import { audit, toAuthUser } from '../queries';
import { confirmationProblem } from './portal';

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

  route(
    'put',
    '/auth/password',
    null,
    ({ user, body }) => {
      const current = typeof body.current_password === 'string' ? body.current_password : '';
      if (db().credentials[user.id] !== current) {
        return invalid({ current_password: 'The current password is not correct.' });
      }
      const errors = confirmationProblem(body);
      if (!errors.password && body.password === current) {
        errors.password = 'Choose a password different from the current one.';
      }
      if (Object.keys(errors).length > 0) return invalid(errors);
      const account = db().users.find((u) => u.id === user.id);
      if (!account) return fail(401, 'Unauthenticated.');
      db().credentials[user.id] = body.password as string;
      account.must_change_password = false;
      account.updated_at = new Date().toISOString();
      audit(user.id, 'user.password_changed', 'user', user.id, { username: account.username });
      persist();
      return ok({ user: toAuthUser(account) });
    },
    { whilePasswordPending: true },
  ),
];
