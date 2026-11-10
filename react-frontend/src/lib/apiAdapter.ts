/**
 * The one place that translates between the screens' contract (src/types/api.ts: snake_case DTOs,
 * flat bodies, `{ message, errors: { field: [msg] } }`) and the Laravel API, which follows the
 * course "API Master Class in Laravel" (docs/COURSE_CONVENTIONS.md):
 *
 * - Resources are JSON:API style: `{ type, id, attributes: { camelCase }, relationships, includes }`,
 *   single ones wrapped in `data`, lists as `{ data, links, meta }`, other answers as
 *   `{ data, message, status }`.
 * - Request bodies are `{ data: { attributes, relationships } }`.
 * - Errors are `{ errors: [{ status, message, source }] }`.
 * - List filters use the course's names (`receivedAt=from,to`, camelCase parameters).
 *
 * Only the real API goes through here. The MSW mock (demo build and tests) still speaks the
 * screens' contract directly.
 */

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** camelCase → snake_case, digits included: readyOver2Days → ready_over_2_days. */
export function snake(key: string): string {
  if (!/^[a-z][a-zA-Z0-9]*$/.test(key) || !/[A-Z]/.test(key)) return key;
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([a-zA-Z])(\d+)/g, '$1_$2')
    .toLowerCase();
}

/** snake_case → camelCase: amount_cents → amountCents. Keys that are not snake_case stay. */
export function camel(key: string): string {
  if (!/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(key)) return key;
  return key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function mapKeys(value: Json, rename: (key: string) => string): Json {
  if (Array.isArray(value)) return value.map((item) => mapKeys(item, rename));
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [rename(key), mapKeys(item, rename)]),
  );
}

const isResource = (value: unknown): boolean =>
  isObject(value) &&
  typeof value.type === 'string' &&
  value.id !== undefined &&
  isObject(value.attributes);

/**
 * A resource becomes the flat DTO the screens know: its id, its attributes in snake_case, the id
 * of each relationship as `<name>_id`, and each included resource under its snake_case name.
 */
export function deserialize(value: Json): Json {
  if (Array.isArray(value)) return value.map(deserialize);
  if (!isObject(value)) return value;
  if (!isResource(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [snake(key), deserialize(item)]),
    );
  }

  const flat: JsonObject = { id: value.id ?? null };
  for (const [key, item] of Object.entries(value.attributes as JsonObject)) {
    flat[snake(key)] = deserialize(mapKeys(item, snake));
  }
  if (isObject(value.relationships)) {
    for (const [name, relation] of Object.entries(value.relationships)) {
      const field = `${snake(name)}_id`;
      if (!isObject(relation) || field in flat) continue;
      const data = relation.data;
      if (data === null) flat[field] = null;
      else if (isObject(data)) flat[field] = data.id ?? null;
    }
  }
  if (isObject(value.includes)) {
    for (const [name, item] of Object.entries(value.includes)) {
      flat[snake(name)] = deserialize(item);
    }
  }
  return flat;
}

/**
 * The response body the screens expect:
 * - a list keeps `{ data, meta }` (meta in snake_case),
 * - a single resource or an ok() answer is unwrapped to its data,
 * - a collection without pagination keeps `{ data }`.
 */
export function adaptResponse(body: unknown): unknown {
  if (!isObject(body) || !('data' in body)) return body;
  if ('meta' in body) {
    return {
      data: deserialize(body.data),
      meta: mapKeys(body.meta ?? {}, snake),
      links: body.links ?? null,
    };
  }
  if (Array.isArray(body.data) && !('message' in body)) return { data: deserialize(body.data) };
  return deserialize(body.data);
}

/** Sign-in and password endpoints take flat bodies (course L8). */
export const isFlatBodyPath = (url: string) =>
  /^\/(customer\/)?auth\//.test(url) || url === '/customer/account/password';

/**
 * A flat snake_case body becomes `{ data: { attributes, relationships } }`: `*_id` keys become
 * to-one relationships and `*_ids` arrays to-many relationships; everything else is an attribute,
 * camelCase all the way down.
 */
export function toResourceBody(body: unknown): unknown {
  if (!isObject(body)) return body;
  const attributes: JsonObject = {};
  const relationships: JsonObject = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (key.endsWith('_ids') && Array.isArray(value)) {
      relationships[`${camel(key.slice(0, -4))}s`] = { data: value.map((id) => ({ id })) };
    } else if (key.endsWith('_id') && (typeof value === 'number' || value === null)) {
      relationships[camel(key.slice(0, -3))] = { data: value === null ? null : { id: value } };
    } else {
      attributes[camel(key)] = mapKeys(value, camel);
    }
  }
  return {
    data: {
      attributes,
      ...(Object.keys(relationships).length > 0 ? { relationships } : {}),
    },
  };
}

/** `data.attributes.items.0.weightKg` → `items.0.weight_kg`; relationships → `<name>_id(s)`. */
export function fieldOf(source: string): string {
  const relation = source.match(/^data\.relationships\.([A-Za-z0-9]+)\.data(?:\.(\d+))?(\.id)?$/);
  if (relation) {
    const name = snake(relation[1] as string);
    const many = relation[2] !== undefined || relation[3] === undefined;
    return many ? `${name.replace(/s$/, '')}_ids` : `${name}_id`;
  }
  const path = source.replace(/^data\.attributes\./, '');
  return path
    .split('.')
    .map((part) => snake(part))
    .join('.');
}

interface CourseError {
  status?: number;
  message?: string;
  source?: string;
}

/** `{ errors: [{ status, message, source }] }` → `{ message, errors: { field: [msg] } }`. */
export function adaptError(body: unknown, status: number | undefined): unknown {
  if (!isObject(body) || !Array.isArray(body.errors)) return body;
  const list = body.errors as unknown as CourseError[];
  const message = list[0]?.message ?? 'Something went wrong. Please try again.';
  if (status !== 422) return { message };
  const errors: Record<string, string[]> = {};
  for (const error of list) {
    if (!error.source || !error.message) continue;
    const field = fieldOf(error.source);
    (errors[field] ??= []).push(error.message);
  }
  return { message, errors };
}

const LIST_INCLUDES = 'customer,baskets,items,receivedBy';

/**
 * Query parameters in the course's style: camelCase names, date ranges as `column=from,to`,
 * and the related data each list needs (`?include=`).
 */
export function adaptParams(url: string, params: unknown): Record<string, unknown> {
  const input = isObject(params) ? { ...(params as Record<string, unknown>) } : {};
  const out: Record<string, unknown> = {};

  const range = (column: string) => {
    const from = input.from as string | undefined;
    const to = input.to as string | undefined;
    delete input.from;
    delete input.to;
    if (from || to) out[column] = `${from ?? to},${to ?? from}`;
  };
  const rename = (from: string, to: string) => {
    if (input[from] !== undefined) out[to] = input[from];
    delete input[from];
  };

  if (url === '/orders' || url === '/balances' || /^\/customers\/\d+\/orders$/.test(url)) {
    range('receivedAt');
    rename('customer_id', 'customer');
    out.include = LIST_INCLUDES;
  } else if (url === '/payments') {
    range('paidAt');
  } else if (url === '/activity-logs') {
    range('createdAt');
    rename('user_id', 'user');
  } else if (url === '/inventory/movements') {
    rename('item_id', 'item');
  }

  for (const [key, value] of Object.entries(input)) out[camel(key)] = value;
  return out;
}

/** PUT replaces a whole resource in the course (L17); the screens' partial edits are PATCH (L18). */
const FULL_REPLACE = [
  /^\/settings\/shop$/,
  /^\/roles\/staff\/permissions$/,
  /^\/customer\/account\/password$/,
  /^\/auth\/password$/,
];

export const methodFor = (method: string, url: string) =>
  method === 'put' && !FULL_REPLACE.some((pattern) => pattern.test(url)) ? 'patch' : method;
