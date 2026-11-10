import { PERMISSION_LABELS } from '@/lib/permissions';
import type { PermissionCode, RoleName, User } from '@/types/entities';
import { db, generateTemporaryPassword, nextId } from '../db';
import { asNumber, asString, fail, inRange, invalid, ok, paginate, route } from '../http';
import { audit, staffPermissions, toActivityDto, toUserDto } from '../queries';

function roleId(role: RoleName) {
  return db().roles.find((r) => r.name === role)?.id ?? 2;
}

function validateUser(body: Record<string, unknown>, ignoreId?: number) {
  const errors: Record<string, string> = {};
  const name = asString(body.name);
  const username = asString(body.username).toLowerCase();
  const role = asString(body.role) as RoleName;
  if (name.length < 2) errors.name = 'Enter the full name.';
  if (!/^[a-z0-9._-]{3,}$/.test(username)) {
    errors.username = 'Use at least 3 letters, numbers, dots or dashes.';
  } else if (db().users.some((u) => u.username === username && u.id !== ignoreId)) {
    errors.username = 'This username is taken.';
  }
  if (role !== 'admin' && role !== 'staff') errors.role = 'Choose a role.';
  return { errors, values: { name, username, role } };
}

export const adminHandlers = [
  route('get', '/users', 'settings.manage', () => ok({ data: db().users.map(toUserDto) })),

  route('post', '/users', 'settings.manage', ({ user, body }) => {
    const { errors, values } = validateUser(body);
    const password = typeof body.password === 'string' ? body.password : '';
    if (password.length < 8) errors.password = 'Use at least 8 characters.';
    if (Object.keys(errors).length > 0) return invalid(errors);
    const now = new Date().toISOString();
    const created: User = {
      id: nextId(db().users),
      role_id: roleId(values.role),
      name: values.name,
      username: values.username,
      is_active: true,
      must_change_password: false,
      last_login_at: null,
      created_at: now,
      updated_at: now,
    };
    db().users.push(created);
    db().credentials[created.id] = password;
    audit(user.id, 'user.created', 'user', created.id, {
      username: created.username,
      role: values.role,
    });
    return ok(toUserDto(created), 201);
  }),

  route('put', '/users/:id', 'settings.manage', ({ user, params, body }) => {
    const target = db().users.find((u) => u.id === Number(params.id));
    if (!target) return fail(404, 'User not found.');
    const { errors, values } = validateUser({ ...toUserDto(target), ...body }, target.id);
    if (target.id === user.id && values.role !== 'admin') {
      errors.role = 'You cannot remove your own administrator role.';
    }
    if (Object.keys(errors).length > 0) return invalid(errors);
    const before = { name: target.name, username: target.username };
    target.name = values.name;
    target.username = values.username;
    target.role_id = roleId(values.role);
    if (body.is_active === true) target.is_active = true;
    target.updated_at = new Date().toISOString();
    audit(
      user.id,
      'user.updated',
      'user',
      target.id,
      { username: target.username, role: values.role },
      before,
    );
    return ok(toUserDto(target));
  }),

  route('post', '/users/:id/disable', 'settings.manage', ({ user, params }) => {
    const target = db().users.find((u) => u.id === Number(params.id));
    if (!target) return fail(404, 'User not found.');
    if (target.id === user.id) return fail(422, 'You cannot disable your own account.');
    target.is_active = false;
    target.updated_at = new Date().toISOString();
    audit(user.id, 'user.disabled', 'user', target.id, { username: target.username });
    return ok(toUserDto(target));
  }),

  route('post', '/users/:id/reset-password', 'settings.manage', ({ user, params }) => {
    const target = db().users.find((u) => u.id === Number(params.id));
    if (!target) return fail(404, 'User not found.');
    const temporary_password = generateTemporaryPassword();
    db().credentials[target.id] = temporary_password;
    // As in Laravel: the next sign-in must choose a new password before anything else opens.
    target.must_change_password = true;
    target.updated_at = new Date().toISOString();
    audit(user.id, 'user.password_reset', 'user', target.id, { username: target.username });
    return ok({ temporary_password });
  }),

  route('get', '/roles/permissions', 'settings.manage', () =>
    ok({
      available: db().permissions.map((p) => ({ code: p.code, label: PERMISSION_LABELS[p.code] })),
      staff: staffPermissions(),
    }),
  ),

  route('put', '/roles/staff/permissions', 'settings.manage', ({ user, body }) => {
    const before = staffPermissions();
    const requested = Array.isArray(body.permissions) ? (body.permissions as PermissionCode[]) : [];
    const known = db().permissions.filter((p) => requested.includes(p.code));
    const database = db();
    database.role_permission = [
      ...database.role_permission.filter((rp) => rp.role_id !== 2),
      ...known.map((p) => ({ role_id: 2, permission_id: p.id })),
    ];
    audit(
      user.id,
      'role.permissions_updated',
      'role',
      2,
      { permissions: staffPermissions() },
      { permissions: before },
    );
    return ok({
      available: db().permissions.map((p) => ({ code: p.code, label: PERMISSION_LABELS[p.code] })),
      staff: staffPermissions(),
    });
  }),

  route('get', '/settings/shop', 'settings.manage', () => ok(db().shop_settings)),

  route('put', '/settings/shop', 'settings.manage', ({ user, body }) => {
    const errors: Record<string, string> = {};
    const name = asString(body.name);
    const address = asString(body.address);
    const days = asNumber(body.claim_policy_days);
    if (!name) errors.name = 'Enter the shop name.';
    if (!address) errors.address = 'Enter the address.';
    if (days === null || days < 0 || !Number.isInteger(days)) {
      errors.claim_policy_days = 'Enter a whole number of days.';
    }
    if (Object.keys(errors).length > 0) return invalid(errors);
    const database = db();
    const before = { ...database.shop_settings };
    database.shop_settings = {
      name,
      address,
      contact_number: asString(body.contact_number),
      opening_hours: asString(body.opening_hours),
      receipt_footer: asString(body.receipt_footer),
      claim_policy_days: days ?? 0,
    };
    audit(user.id, 'settings.updated', 'shop_settings', 1, { ...database.shop_settings }, before);
    return ok(database.shop_settings);
  }),

  route('get', '/activity-logs', 'settings.manage', ({ query }) => {
    const userId = Number(query.get('user_id')) || null;
    const entity = query.get('entity');
    const search = (query.get('action') ?? '').trim().toLowerCase();
    const rows = db()
      .audit_logs.filter((log) => !userId || log.user_id === userId)
      .filter((log) => !entity || log.auditable_type === entity)
      .filter((log) => inRange(log.created_at, query.get('from'), query.get('to')))
      .map(toActivityDto)
      .filter(
        (log) =>
          !search || log.summary.toLowerCase().includes(search) || log.action.includes(search),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
    return ok(paginate(rows, query, {}, 20));
  }),

  route('get', '/notifications', null, ({ query }) => {
    const rows = [...db().notifications].sort((a, b) => b.sent_at.localeCompare(a.sent_at));
    return ok(paginate(rows, query, { unread: rows.filter((n) => !n.read_at).length }, 20));
  }),

  route('post', '/notifications/:id/read', null, ({ user, params }) => {
    const row = db().notifications.find((n) => n.id === Number(params.id));
    if (!row) return fail(404, 'Notification not found.');
    row.read_at = row.read_at ?? new Date().toISOString();
    audit(user.id, 'notification.read', 'notification', row.id);
    return ok(row);
  }),
];
