import { describe, expect, it } from 'vitest';
import { http, login, startMockApiForTests } from './test-utils';

startMockApiForTests();

/** The mock API keeps the same must_change_password rules as Laravel's EnsureAccountIsUsable. */
describe('staff password reset', () => {
  it('makes the next sign-in choose a new password before anything else opens', async () => {
    await login('liza.ramos');
    const reset = await http.post('/users/2/reset-password');
    expect(reset.status).toBe(200);
    const temporary = reset.data.temporary_password as string;
    expect(temporary).toBeTruthy();
    const listed = await http.get('/users');
    expect(JSON.stringify(listed.data)).not.toContain(temporary);

    expect((await login('kevin.m')).status).toBe(422);
    const signedIn = await http.post('/auth/login', { username: 'kevin.m', password: temporary });
    expect(signedIn.data.user.must_change_password).toBe(true);

    const blocked = await http.get('/orders');
    expect(blocked.status).toBe(403);
    expect(blocked.data.message).toBe('Change your temporary password first.');
    expect((await http.get('/auth/me')).data.user.must_change_password).toBe(true);

    const wrong = await http.put('/auth/password', {
      current_password: 'nope',
      password: 'fresh-pass1',
      password_confirmation: 'fresh-pass1',
    });
    expect(wrong.status).toBe(422);
    expect(Object.keys(wrong.data.errors)).toEqual(['current_password']);

    const changed = await http.put('/auth/password', {
      current_password: temporary,
      password: 'fresh-pass1',
      password_confirmation: 'fresh-pass1',
    });
    expect(changed.status).toBe(200);
    expect(changed.data.user.must_change_password).toBe(false);
    expect((await http.get('/orders')).status).toBe(200);
  });

  it('lets a signed-in staff member change their own password', async () => {
    await login('kevin.m');
    const same = await http.put('/auth/password', {
      current_password: 'password123',
      password: 'password123',
      password_confirmation: 'password123',
    });
    expect(same.data.errors.password).toEqual([
      'Choose a password different from the current one.',
    ]);
    const changed = await http.put('/auth/password', {
      current_password: 'password123',
      password: 'newpass123',
      password_confirmation: 'newpass123',
    });
    expect(changed.status).toBe(200);
    expect(
      (await http.post('/auth/login', { username: 'kevin.m', password: 'newpass123' })).status,
    ).toBe(200);
  });
});
