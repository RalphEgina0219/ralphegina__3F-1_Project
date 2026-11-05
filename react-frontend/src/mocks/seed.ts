import { addDays, format, setHours, setMinutes, subDays, subMinutes } from 'date-fns';
import { formatBasketNumber } from '@/lib/basket';
import { lineSubtotalCents } from '@/lib/billing';
import type { Order, Payment, PaymentMethodCode, StatusCode } from '@/types/entities';
import { generateQrToken, type MockDb } from './db';
import { customerNotice, demoEmail } from './messages';

/** Small seeded generator so that every reset produces the same shop history. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BARANGAYS = [
  'Anilao',
  'Aplaya',
  'Bagong Bayan I',
  'Bagong Bayan II',
  'Batangan',
  'Bukal',
  'Camantigue',
  'Carmundo',
  'Cawayan',
  'Dayhagan',
  'Formon',
  'Hagan',
  'Hagupit',
  'Ipil',
  'Kaligtasan',
  'Labasan',
  'Labonan',
  'Libertad',
  'Lisap',
  'Luna',
  'Malitbog',
  'Mapang',
  'Masaguisi',
  'Mina de Oro',
  'Morente',
  'Ogbot',
  'Orconuma',
  'Poblacion',
  'Pulosahi',
  'Sagana',
  'San Isidro',
  'San Jose',
  'San Juan',
  'Sigange',
  'Sta. Cruz',
  'Tawas',
];

const CUSTOMERS: readonly [string, string, string, string?][] = [
  ['Maria Santos', '09178452210', 'Poblacion', 'Prefers unscented conditioner'],
  ['Ana Reyes', '09171234581', 'Dayhagan'],
  ['Jomar Castillo', '09285541022', 'Batangan'],
  ['Grace Bautista', '09158703364', 'Hagan'],
  ['Mark Villanueva', '09064317790', 'Ipil'],
  ['Joy Mendoza', '09392186603', 'Lisap'],
  ['Rogelio Tan', '09951042287', 'Poblacion'],
  ['Carmela Aquino', '09176620915', 'Labasan', 'Separate white uniforms'],
  ['Dennis Ocampo', '09183307741', 'Dayhagan'],
  ['Rhea Villanueva', '09171198254', 'Ipil'],
  ['Paolo Mendoza', '09267730145', 'Lisap'],
  ['Luis Garcia', '09451126078', 'Poblacion'],
  ['Nina Ramirez', '09198845120', 'Batangan'],
  ['Ben Soriano', '09352214876', 'Hagan'],
  ['Cris Navarro', '09161007723', 'Labasan'],
  ['Elena Cruz', '09473356192', 'Poblacion', 'Call before pickup'],
  ['Arnel Pascual', '09215580346', 'Masaguisi'],
  ['Lorna Dela Cruz', '09175523018', 'Poblacion'],
  ['Ramil Fernandez', '09084412973', 'Sagana'],
  ['Teresita Gonzales', '09293317480', 'Carmundo'],
  ['Angelo Marquez', '09561182734', 'Formon'],
  ['Divina Salazar', '09174490621', 'Morente'],
  ['Noel Aguilar', '09186630245', 'Anilao'],
  ['Cherry Lim', '09778214409', 'Poblacion'],
  ['Eduardo Rivera', '09451873320', 'Bukal'],
  ['Liezl Pangilinan', '09193340176', 'Malitbog'],
  ['Romeo Bernardo', '09354471829', 'Orconuma'],
  ['Shiela Domingo', '09167782401', 'Tawas'],
  ['Vincent Torres', '09286619053', 'Labonan'],
  ['Marites Valdez', '09052238147', 'San Isidro'],
  ['Jerome Santiago', '09613340982', 'San Jose'],
  ['Ofelia Manalastas', '09177706634', 'San Juan'],
  ['Gilbert Rosales', '09298845261', 'Sta. Cruz'],
  ['Rowena Castro', '09454417730', 'Sigange'],
  ['Danilo Evangelista', '09151162298', 'Libertad'],
  ['Pia Francisco', '09264405517', 'Luna'],
  ['Ronald Mercado', '09387720164', 'Mapang'],
  ['Janine Alcantara', '09176349920', 'Hagupit'],
  ['Felix Ignacio', '09203318845', 'Pulosahi'],
  ['Sarah Ramos', '09561047726', 'Cawayan'],
];

/**
 * Legacy profiles: on file from before customer accounts existed, with no account and no orders.
 * They demonstrate "Create account" and cannot receive a new order until they have one.
 */
export const LEGACY_CUSTOMERS: readonly string[] = [
  'Janine Alcantara',
  'Felix Ignacio',
  'Sarah Ramos',
];

const BASKET_COUNT = 30;
/** Lost or broken baskets: kept for their history, never deleted, numbers never reused. */
const RETIRED_BASKETS: readonly number[] = [29, 30];

const SERVICE = { WDF: 1, WASH: 2, COMFORTER: 3, IRONING: 4, EXPRESS: 5, DRY_CLEAN: 6 } as const;
const USER = { LIZA: 1, KEVIN: 2, AIRA: 3, JESSA: 4 } as const;
const STAGES: readonly StatusCode[] = [
  'received',
  'washing',
  'drying',
  'folding',
  'ready_for_pickup',
  'released',
];

type ItemSpec = readonly [serviceId: number, amount: number];

interface OrderSpec {
  customer: string;
  daysAgo: number;
  time: readonly [number, number];
  items: readonly ItemSpec[];
  stage: StatusCode;
  /** 'full', 'none', or a peso amount paid at drop-off. */
  paid: 'full' | 'none' | number;
  method?: PaymentMethodCode;
  by?: number;
  promiseHours?: number;
  notes?: string;
  /** Keep the promised time in the past, to demonstrate the overdue state. */
  overdue?: boolean;
}

/** The orders the approved mockups show, placed relative to the day the data is seeded. */
const FEATURED: readonly OrderSpec[] = [
  {
    customer: 'Arnel Pascual',
    daysAgo: 4,
    time: [10, 15],
    items: [[SERVICE.WDF, 4.5]],
    stage: 'ready_for_pickup',
    paid: 'none',
    by: USER.AIRA,
  },
  {
    customer: 'Lorna Dela Cruz',
    daysAgo: 3,
    time: [13, 40],
    items: [[SERVICE.WASH, 6]],
    stage: 'ready_for_pickup',
    paid: 'full',
    method: 'gcash',
    by: USER.KEVIN,
  },
  {
    customer: 'Dennis Ocampo',
    daysAgo: 1,
    time: [11, 20],
    items: [[SERVICE.WDF, 9]],
    stage: 'released',
    paid: 'full',
    by: USER.KEVIN,
  },
  {
    customer: 'Rogelio Tan',
    daysAgo: 1,
    time: [13, 5],
    items: [
      [SERVICE.WDF, 4],
      [SERVICE.EXPRESS, 1],
    ],
    stage: 'released',
    paid: 'full',
    method: 'gcash',
    by: USER.AIRA,
    promiseHours: 6,
  },
  {
    customer: 'Carmela Aquino',
    daysAgo: 1,
    time: [15, 40],
    items: [
      [SERVICE.WDF, 3.5],
      [SERVICE.EXPRESS, 1],
    ],
    stage: 'ready_for_pickup',
    paid: 'full',
    by: USER.KEVIN,
    promiseHours: 3,
  },
  {
    customer: 'Joy Mendoza',
    daysAgo: 1,
    time: [17, 12],
    items: [[SERVICE.WDF, 7.2]],
    stage: 'ready_for_pickup',
    paid: 'none',
    by: USER.KEVIN,
    promiseHours: 16,
  },
  {
    customer: 'Ben Soriano',
    daysAgo: 1,
    time: [8, 30],
    items: [[SERVICE.WASH, 7]],
    stage: 'washing',
    paid: 'none',
    by: USER.AIRA,
    promiseHours: 10,
    overdue: true,
  },
  {
    customer: 'Cris Navarro',
    daysAgo: 1,
    time: [14, 5],
    items: [[SERVICE.WDF, 8.5]],
    stage: 'drying',
    paid: 100,
    by: USER.AIRA,
  },
  {
    customer: 'Elena Cruz',
    daysAgo: 1,
    time: [16, 25],
    items: [
      [SERVICE.WDF, 5],
      [SERVICE.IRONING, 4],
    ],
    stage: 'folding',
    paid: 'full',
    by: USER.KEVIN,
  },
  {
    customer: 'Nina Ramirez',
    daysAgo: 0,
    time: [6, 40],
    items: [
      [SERVICE.WDF, 3],
      [SERVICE.EXPRESS, 1],
    ],
    stage: 'washing',
    paid: 'full',
    by: USER.KEVIN,
    promiseHours: 8,
  },
  {
    customer: 'Luis Garcia',
    daysAgo: 0,
    time: [6, 58],
    items: [[SERVICE.WDF, 5.5]],
    stage: 'washing',
    paid: 'full',
    method: 'gcash',
    by: USER.AIRA,
  },
  {
    customer: 'Paolo Mendoza',
    daysAgo: 0,
    time: [7, 5],
    items: [[SERVICE.WASH, 6]],
    stage: 'received',
    paid: 'full',
    method: 'gcash',
    by: USER.KEVIN,
  },
  {
    customer: 'Rhea Villanueva',
    daysAgo: 0,
    time: [7, 22],
    items: [[SERVICE.WDF, 4]],
    stage: 'received',
    paid: 'none',
    by: USER.KEVIN,
  },
  {
    customer: 'Mark Villanueva',
    daysAgo: 0,
    time: [7, 30],
    items: [[SERVICE.WASH, 8]],
    stage: 'folding',
    paid: 'full',
    by: USER.AIRA,
    promiseHours: 9,
  },
  {
    customer: 'Grace Bautista',
    daysAgo: 0,
    time: [7, 58],
    items: [[SERVICE.COMFORTER, 2]],
    stage: 'drying',
    paid: 150,
    method: 'gcash',
    by: USER.KEVIN,
    promiseHours: 26,
  },
  {
    customer: 'Jomar Castillo',
    daysAgo: 0,
    time: [8, 15],
    items: [
      [SERVICE.WDF, 5],
      [SERVICE.IRONING, 6],
    ],
    stage: 'received',
    paid: 'full',
    by: USER.KEVIN,
  },
  {
    customer: 'Ana Reyes',
    daysAgo: 0,
    time: [8, 42],
    items: [[SERVICE.WDF, 6.5]],
    stage: 'washing',
    paid: 'none',
    by: USER.KEVIN,
  },
  {
    customer: 'Maria Santos',
    daysAgo: 0,
    time: [9, 20],
    items: [
      [SERVICE.WDF, 6.5],
      [SERVICE.IRONING, 6],
      [SERVICE.EXPRESS, 1],
    ],
    stage: 'washing',
    paid: 200,
    by: USER.KEVIN,
    promiseHours: 8,
    notes: 'Separate white uniforms. Unscented conditioner.',
  },
];

export function createSeed(now: Date): MockDb {
  const rand = mulberry32(20261031);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)] as T;
  const iso = (date: Date) => date.toISOString();
  const seededAt = iso(subDays(now, 120));

  const db: MockDb = {
    roles: [
      { id: 1, name: 'admin' },
      { id: 2, name: 'staff' },
    ],
    permissions: [
      { id: 1, code: 'payments.record' },
      { id: 2, code: 'inventory.stock_out' },
      { id: 3, code: 'payments.void' },
    ],
    role_permission: [
      { role_id: 2, permission_id: 1 },
      { role_id: 2, permission_id: 2 },
    ],
    users: [
      {
        id: USER.LIZA,
        role_id: 1,
        name: 'Liza Ramos',
        username: 'liza.ramos',
        is_active: true,
        last_login_at: iso(subMinutes(now, 150)),
        created_at: seededAt,
        updated_at: seededAt,
      },
      {
        id: USER.KEVIN,
        role_id: 2,
        name: 'Kevin Manalo',
        username: 'kevin.m',
        is_active: true,
        last_login_at: iso(subMinutes(now, 190)),
        created_at: seededAt,
        updated_at: seededAt,
      },
      {
        id: USER.AIRA,
        role_id: 2,
        name: 'Aira Dimaculangan',
        username: 'aira.d',
        is_active: true,
        last_login_at: iso(subDays(now, 1)),
        created_at: seededAt,
        updated_at: seededAt,
      },
      {
        id: USER.JESSA,
        role_id: 2,
        name: 'Jessa Lopez',
        username: 'jessa.l',
        is_active: false,
        last_login_at: iso(subDays(now, 49)),
        created_at: seededAt,
        updated_at: seededAt,
      },
    ],
    credentials: { 1: 'password123', 2: 'password123', 3: 'password123', 4: 'password123' },
    barangays: BARANGAYS.map((name, index) => ({ id: index + 1, name })),
    customers: [],
    customer_accounts: [],
    customer_credentials: {},
    services: [
      {
        id: SERVICE.WDF,
        name: 'Wash-Dry-Fold',
        description: 'Regular, 24-hour turnaround',
        pricing_type: 'per_kg',
        rate_cents: 3500,
        minimum_qty: 3,
        is_active: true,
        created_at: seededAt,
        updated_at: seededAt,
      },
      {
        id: SERVICE.WASH,
        name: 'Wash only',
        description: 'Customer dries at home',
        pricing_type: 'per_kg',
        rate_cents: 2500,
        minimum_qty: 3,
        is_active: true,
        created_at: seededAt,
        updated_at: seededAt,
      },
      {
        id: SERVICE.COMFORTER,
        name: 'Comforter / Blanket',
        description: 'Single or double size',
        pricing_type: 'per_piece',
        rate_cents: 15000,
        minimum_qty: null,
        is_active: true,
        created_at: seededAt,
        updated_at: seededAt,
      },
      {
        id: SERVICE.IRONING,
        name: 'Ironing',
        description: 'Shirts, uniforms, slacks',
        pricing_type: 'per_piece',
        rate_cents: 1500,
        minimum_qty: null,
        is_active: true,
        created_at: seededAt,
        updated_at: seededAt,
      },
      {
        id: SERVICE.EXPRESS,
        name: 'Express (same day)',
        description: 'Flat add-on per order',
        pricing_type: 'flat',
        rate_cents: 5000,
        minimum_qty: null,
        is_active: true,
        created_at: seededAt,
        updated_at: seededAt,
      },
      {
        id: SERVICE.DRY_CLEAN,
        name: 'Dry cleaning',
        description: 'Not offered yet',
        pricing_type: 'per_piece',
        rate_cents: 12000,
        minimum_qty: null,
        is_active: false,
        created_at: seededAt,
        updated_at: seededAt,
      },
    ],
    order_statuses: STAGES.map((code, index) => ({
      id: index + 1,
      code,
      label: ['Received', 'Washing', 'Drying', 'Folding', 'Ready for Pickup', 'Completed'][
        index
      ] as string,
      sort_order: index + 1,
    })),
    orders: [],
    baskets: [],
    order_baskets: [],
    order_items: [],
    payment_methods: [
      { id: 1, code: 'cash', label: 'Cash' },
      { id: 2, code: 'gcash', label: 'GCash' },
    ],
    payments: [],
    order_status_history: [],
    units: [
      { id: 1, code: 'kg', label: 'Kilogram' },
      { id: 2, code: 'L', label: 'Liter' },
      { id: 3, code: 'pcs', label: 'Piece' },
      { id: 4, code: 'rolls', label: 'Roll' },
    ],
    inventory_items: [
      { id: 1, name: 'Detergent powder', unit_id: 1, reorder_level: 5, is_active: true },
      { id: 2, name: 'Fabric conditioner', unit_id: 2, reorder_level: 4, is_active: true },
      { id: 3, name: 'Plastic laundry bags', unit_id: 3, reorder_level: 50, is_active: true },
      { id: 4, name: 'Liquid detergent', unit_id: 2, reorder_level: 5, is_active: true },
      { id: 5, name: 'Bleach', unit_id: 2, reorder_level: 2, is_active: true },
      { id: 6, name: 'Hangers', unit_id: 3, reorder_level: 40, is_active: true },
      { id: 7, name: 'Thermal receipt rolls', unit_id: 4, reorder_level: 3, is_active: true },
      { id: 8, name: 'QR tag stickers', unit_id: 3, reorder_level: 100, is_active: true },
    ],
    inventory_movements: [],
    notifications: [],
    customer_notifications: [],
    shop_settings: {
      name: 'LaundryFlow',
      address: 'Brgy. Poblacion, Bongabong, Oriental Mindoro',
      contact_number: '[SHOP CONTACT NO.]',
      opening_hours: 'Open daily 7:00 AM – 7:00 PM',
      receipt_footer:
        "Salamat po! Unclaimed items after 30 days are the customer's responsibility.",
      claim_policy_days: 30,
    },
    audit_logs: [],
  };

  const audit = (
    at: Date,
    userId: number,
    action: string,
    type: string,
    id: number | null,
    values: Record<string, unknown>,
  ) => {
    db.audit_logs.push({
      id: db.audit_logs.length + 1,
      user_id: userId,
      action,
      auditable_type: type,
      auditable_id: id,
      old_values: null,
      new_values: values,
      created_at: iso(at),
    });
  };

  // Customers: the first dozen are long-time regulars.
  CUSTOMERS.forEach(([full_name, contact_number, barangay, notes], index) => {
    const since = iso(subDays(now, 20 + Math.floor(rand() * 120)));
    db.customers.push({
      id: index + 1,
      full_name,
      contact_number,
      barangay_id: BARANGAYS.indexOf(barangay) + 1,
      street_address: rand() > 0.5 ? `Purok ${1 + Math.floor(rand() * 7)}` : null,
      notes: notes ?? null,
      created_at: since,
      updated_at: since,
    });
  });

  // Every customer except the legacy profiles has an account. Demo password: password123.
  db.customers
    .filter((customer) => !LEGACY_CUSTOMERS.includes(customer.full_name))
    .forEach((customer) => {
      const id = db.customer_accounts.length + 1;
      db.customer_accounts.push({
        id,
        customer_id: customer.id,
        email: demoEmail(customer.full_name),
        is_active: true,
        must_change_password: false,
        last_login_at: null,
        created_at: customer.created_at,
        updated_at: customer.created_at,
      });
      db.customer_credentials[id] = 'password123';
    });

  // Baskets BSK-0001 to BSK-0030, labelled when the shop opened.
  const LABELS = ['Blue, large', 'Blue, medium', 'Green, large', 'Yellow, medium', 'Red, small'];
  for (let n = 1; n <= BASKET_COUNT; n += 1) {
    db.baskets.push({
      id: n,
      basket_number: formatBasketNumber(n),
      qr_token: generateQrToken(),
      label: LABELS[(n - 1) % LABELS.length] as string,
      status: RETIRED_BASKETS.includes(n) ? 'retired' : 'available',
      notes: RETIRED_BASKETS.includes(n) ? 'Cracked handle, replaced' : null,
      created_by: USER.LIZA,
      created_at: seededAt,
      updated_at: seededAt,
    });
  }
  // When each usable basket is free again. Infinity means it holds an active order.
  const busyUntil = new Map<number, number>(
    db.baskets.filter((b) => b.status !== 'retired').map((b) => [b.id, 0]),
  );
  let basketCursor = 0;
  /** Round-robin over the free baskets, so wear spreads and "times used" looks real. */
  const takeBasket = (at: Date): number => {
    const ids = [...busyUntil.keys()];
    for (let tries = 0; tries < ids.length; tries += 1) {
      const id = ids[(basketCursor + tries) % ids.length] as number;
      if ((busyUntil.get(id) ?? Infinity) <= at.getTime()) {
        basketCursor = (basketCursor + tries + 1) % ids.length;
        return id;
      }
    }
    throw new Error('Seed ran out of free baskets');
  };

  const sequences = new Map<string, number>();
  let receiptSeq = 200;

  const addPayment = (
    order: Order,
    amount: number,
    method: PaymentMethodCode,
    by: number,
    at: Date,
  ) => {
    receiptSeq += 1;
    const payment: Payment = {
      id: db.payments.length + 1,
      order_id: order.id,
      payment_method_id: method === 'cash' ? 1 : 2,
      amount_cents: amount,
      reference_number:
        method === 'gcash' ? `5012${Math.floor(100000000 + rand() * 899999999)}` : null,
      receipt_number: `OR-${String(receiptSeq).padStart(6, '0')}`,
      received_by: by,
      paid_at: iso(at),
      voided_at: null,
      voided_by: null,
      void_reason: null,
    };
    db.payments.push(payment);
    audit(at, by, 'payment.recorded', 'payment', payment.id, {
      order_number: order.order_number,
      amount_cents: amount,
      method,
    });
    return payment;
  };

  const addOrder = (spec: OrderSpec) => {
    const customer = db.customers.find((c) => c.full_name === spec.customer);
    if (!customer) throw new Error(`Unknown seed customer ${spec.customer}`);

    let receivedAt = setMinutes(setHours(subDays(now, spec.daysAgo), spec.time[0]), spec.time[1]);
    if (receivedAt > now) receivedAt = subMinutes(now, 12 + (db.orders.length % 50));

    const key = format(receivedAt, 'yyMMdd');
    const sequence = (sequences.get(key) ?? 0) + 1;
    sequences.set(key, sequence);

    const by = spec.by ?? USER.KEVIN;
    const stageIndex = STAGES.indexOf(spec.stage);
    const id = db.orders.length + 1;
    let promisedAt = new Date(receivedAt.getTime() + (spec.promiseHours ?? 28) * 3_600_000);
    const inProcess = stageIndex < 4;
    if (inProcess && !spec.overdue && promisedAt <= now) {
      // Keep active orders on time however late the data is seeded, and inside shop hours.
      promisedAt = new Date(now.getTime() + 3 * 3_600_000);
      if (promisedAt.getHours() >= 19) promisedAt = setMinutes(setHours(addDays(now, 1), 10), 0);
      else if (promisedAt.getHours() < 7) promisedAt = setMinutes(setHours(promisedAt, 10), 0);
    }

    const order: Order = {
      id,
      order_number: `LF-${key}-${String(sequence).padStart(4, '0')}`,
      customer_id: customer.id,
      current_status_id: stageIndex + 1,
      received_by: by,
      received_at: iso(receivedAt),
      promised_at: iso(promisedAt),
      released_at: null,
      notes: spec.notes ?? null,
      created_at: iso(receivedAt),
      updated_at: iso(receivedAt),
    };
    db.orders.push(order);
    audit(receivedAt, by, 'order.created', 'order', id, { order_number: order.order_number });

    let total = 0;
    for (const [serviceId, amount] of spec.items) {
      const service = db.services.find((s) => s.id === serviceId);
      if (!service) throw new Error(`Unknown seed service ${serviceId}`);
      const weight_kg = service.pricing_type === 'per_kg' ? amount : null;
      const quantity = service.pricing_type === 'per_kg' ? null : amount;
      const subtotal_cents = lineSubtotalCents({ ...service, weight_kg, quantity });
      total += subtotal_cents;
      db.order_items.push({
        id: db.order_items.length + 1,
        order_id: id,
        service_id: serviceId,
        weight_kg,
        quantity,
        unit_price_cents: service.rate_cents,
        subtotal_cents,
      });
    }

    // Status history, walking forward from Received at a believable pace but never past now.
    const history: { status: number; at: Date; user: number }[] = [
      { status: 1, at: receivedAt, user: by },
    ];
    let cursor = receivedAt;
    for (let stage = 2; stage <= stageIndex + 1; stage += 1) {
      const worker = pick([USER.KEVIN, USER.AIRA]);
      cursor = new Date(cursor.getTime() + (25 + Math.floor(rand() * 70)) * 60_000);
      if (stage === 6) {
        const pickup = new Date(promisedAt.getTime() + Math.floor(rand() * 240) * 60_000);
        cursor = pickup > cursor ? pickup : cursor;
      }
      history.push({ status: stage, at: cursor, user: worker });
    }

    // Squeeze the whole timeline in before "now" when it would otherwise run into the future.
    const last = history[history.length - 1]?.at ?? receivedAt;
    if (last > now && history.length > 1) {
      const span = now.getTime() - receivedAt.getTime() - 60_000;
      history.forEach((entry, index) => {
        entry.at = new Date(receivedAt.getTime() + (span * index) / (history.length - 1));
      });
    }

    history.forEach((entry, index) => {
      const previous = history[index - 1];
      db.order_status_history.push({
        id: db.order_status_history.length + 1,
        order_id: id,
        from_status_id: previous ? previous.status : null,
        to_status_id: entry.status,
        changed_by: entry.user,
        note: null,
        changed_at: iso(entry.at),
      });
      if (previous) {
        audit(entry.at, entry.user, 'order.status_changed', 'order', id, {
          order_number: order.order_number,
          from: STAGES[previous.status - 1],
          to: STAGES[entry.status - 1],
        });
      }
    });

    const finalAt = history[history.length - 1]?.at ?? receivedAt;
    order.updated_at = iso(finalAt);
    if (spec.stage === 'released') order.released_at = iso(finalAt);

    // Baskets: one per load, a second one for big loads. Completed orders handed theirs back.
    const kilos = spec.items.reduce(
      (sum, [serviceId, amount]) =>
        sum + (serviceId === SERVICE.WDF || serviceId === SERVICE.WASH ? amount : 0),
      0,
    );
    const basketCount = kilos >= 7 || spec.items.length >= 3 ? 2 : 1;
    for (let b = 0; b < basketCount; b += 1) {
      const basketId = takeBasket(receivedAt);
      const done = spec.stage === 'released';
      busyUntil.set(basketId, done ? finalAt.getTime() : Infinity);
      db.order_baskets.push({
        id: db.order_baskets.length + 1,
        order_id: id,
        basket_id: basketId,
        assigned_at: iso(receivedAt),
        assigned_by: by,
        released_at: done ? iso(finalAt) : null,
      });
      if (!done) {
        const basket = db.baskets.find((row) => row.id === basketId);
        if (basket) basket.status = 'in_use';
      }
    }

    // What the customer saw in their account for recent orders.
    if (spec.daysAgo <= 1) {
      history.forEach((entry, index) => {
        const status = STAGES[entry.status - 1] as StatusCode;
        const notice = customerNotice(order.order_number, status);
        db.customer_notifications.push({
          id: db.customer_notifications.length + 1,
          customer_id: customer.id,
          order_id: id,
          type: notice.type,
          message: notice.message,
          sent_at: iso(entry.at),
          read_at: index < history.length - 1 ? iso(entry.at) : null,
        });
      });
    }

    if (spec.stage === 'ready_for_pickup' && spec.daysAgo <= 4) {
      db.notifications.push({
        id: db.notifications.length + 1,
        order_id: id,
        type: 'ready_for_pickup',
        channel: 'in_app',
        message: `${order.order_number} is ready for pickup (${customer.full_name}).`,
        status: 'recorded',
        sent_at: iso(finalAt),
        read_at: null,
      });
    }

    const method = spec.method ?? 'cash';
    if (spec.paid === 'full') {
      addPayment(order, total, method, by, new Date(receivedAt.getTime() + 2 * 60_000));
    } else if (typeof spec.paid === 'number') {
      addPayment(order, spec.paid * 100, method, by, new Date(receivedAt.getTime() + 2 * 60_000));
    }
    return { order, total, finalAt };
  };

  // Older history: released, paid in full, some of it in two instalments.
  const regulars = CUSTOMERS.map(([name]) => name).filter(
    (name) => !LEGACY_CUSTOMERS.includes(name),
  );
  const older: OrderSpec[] = [];
  for (let daysAgo = 13; daysAgo >= 2; daysAgo -= 1) {
    const count = 3 + Math.floor(rand() * 2);
    for (let n = 0; n < count; n += 1) {
      const items: ItemSpec[] = [];
      const kind = rand();
      if (kind < 0.62) items.push([SERVICE.WDF, Math.round((3 + rand() * 7) * 10) / 10]);
      else if (kind < 0.85) items.push([SERVICE.WASH, Math.round((3 + rand() * 6) * 10) / 10]);
      else items.push([SERVICE.COMFORTER, 1 + Math.floor(rand() * 3)]);
      if (rand() < 0.28) items.push([SERVICE.IRONING, 2 + Math.floor(rand() * 8)]);
      if (rand() < 0.14) items.push([SERVICE.EXPRESS, 1]);
      older.push({
        customer: pick(regulars),
        daysAgo,
        time: [7 + Math.floor(rand() * 10), Math.floor(rand() * 60)],
        items,
        stage: 'released',
        paid: 'full',
        method: rand() < 0.3 ? 'gcash' : 'cash',
        by: pick([USER.KEVIN, USER.AIRA, USER.LIZA]),
      });
    }
  }

  // Create every order in time order so that daily sequences and receipt numbers read correctly.
  const all = [...older, ...FEATURED].sort(
    (a, b) => b.daysAgo - a.daysAgo || a.time[0] - b.time[0] || a.time[1] - b.time[1],
  );

  // A released order that had a mistaken payment voided, for the payment history screen.
  let voidedDemoDone = false;
  for (const spec of all) {
    const { order, total, finalAt } = addOrder(spec);
    if (!voidedDemoDone && spec.stage === 'released' && spec.daysAgo <= 6) {
      voidedDemoDone = true;
      const voided = db.payments.find((p) => p.order_id === order.id);
      if (voided) {
        voided.voided_at = iso(finalAt);
        voided.voided_by = USER.LIZA;
        voided.void_reason = 'Wrong amount keyed in at the counter';
        audit(finalAt, USER.LIZA, 'payment.voided', 'payment', voided.id, {
          order_number: order.order_number,
          receipt_number: voided.receipt_number,
          reason: voided.void_reason,
        });
        addPayment(order, total, 'cash', USER.LIZA, finalAt);
      }
    }
  }

  // Inventory: on-hand is computed from these, so they land on the figures in the mockups.
  const moves: readonly [number, number, 'in' | 'out', number, number, string][] = [
    [1, USER.LIZA, 'in', 10, 13, 'Opening stock'],
    [1, USER.KEVIN, 'out', 3, 7, 'Used this week'],
    [1, USER.AIRA, 'out', 3.5, 3, 'Used this week'],
    [1, USER.KEVIN, 'out', 1.5, 0, 'Refilled dispenser'],
    [2, USER.LIZA, 'in', 8, 13, 'Opening stock'],
    [2, USER.AIRA, 'out', 3, 6, 'Used this week'],
    [2, USER.KEVIN, 'out', 1.5, 2, 'Refilled dispenser'],
    [3, USER.LIZA, 'in', 100, 13, 'Opening stock'],
    [3, USER.AIRA, 'out', 25, 6, 'Bagging'],
    [3, USER.KEVIN, 'out', 35, 1, 'Bagging'],
    [4, USER.LIZA, 'in', 8, 13, 'Opening stock'],
    [4, USER.KEVIN, 'out', 6, 5, 'Used this week'],
    [4, USER.LIZA, 'in', 10, 3, 'Supplier delivery, Calapan'],
    [5, USER.LIZA, 'in', 8, 13, 'Opening stock'],
    [5, USER.AIRA, 'out', 2, 4, 'Used this week'],
    [6, USER.LIZA, 'in', 150, 13, 'Opening stock'],
    [6, USER.KEVIN, 'out', 30, 8, 'Given with ironed items'],
    [7, USER.LIZA, 'in', 12, 13, 'Opening stock'],
    [7, USER.AIRA, 'out', 3, 5, 'Loaded in printer'],
    [8, USER.LIZA, 'in', 400, 13, 'Opening stock'],
    [8, USER.KEVIN, 'out', 90, 4, 'Order tags'],
  ];
  moves.forEach(([item_id, user_id, type, quantity, daysAgo, remarks], index) => {
    const moved_at = daysAgo === 0 ? subMinutes(now, 40) : subDays(now, daysAgo);
    db.inventory_movements.push({
      id: index + 1,
      item_id,
      user_id,
      type,
      quantity,
      remarks,
      moved_at: iso(moved_at),
    });
    audit(moved_at, user_id, 'inventory.movement', 'inventory_item', item_id, {
      item_name: db.inventory_items.find((item) => item.id === item_id)?.name,
      type,
      quantity,
      remarks,
    });
  });

  const stockAlerts: readonly [string, number][] = [
    ['Detergent powder is critically low (2 kg left).', 40],
    ['Fabric conditioner is below its reorder level (3.5 L left).', 2 * 1440],
    ['Plastic laundry bags are below their reorder level (40 pcs left).', 1440],
  ];
  stockAlerts.forEach(([message, minutes]) => {
    db.notifications.push({
      id: db.notifications.length + 1,
      order_id: null,
      type: 'low_stock',
      channel: 'in_app',
      message,
      status: 'recorded',
      sent_at: iso(subMinutes(now, minutes)),
      read_at: null,
    });
  });

  audit(subDays(now, 2), USER.LIZA, 'service.updated', 'service', SERVICE.IRONING, {
    name: 'Ironing',
    summary: 'updated rate Ironing ₱12 → ₱15',
  });
  audit(subMinutes(now, 150), USER.LIZA, 'auth.login', 'user', USER.LIZA, {});
  audit(subMinutes(now, 190), USER.KEVIN, 'auth.login', 'user', USER.KEVIN, {});

  db.audit_logs.sort((a, b) => a.created_at.localeCompare(b.created_at));
  db.audit_logs.forEach((log, index) => {
    log.id = index + 1;
  });

  return db;
}
