import { subDays, subMinutes } from 'date-fns';
import { formatBasketNumber } from '@/lib/basket';
import { lineSubtotalCents } from '@/lib/billing';
import {
  addDays,
  manilaDay,
  manilaHour,
  manilaInstant,
  weekdayOf,
  type DayKey,
} from '@/lib/analytics/time';
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

/** Usable baskets were 30 at opening; the shop bought 40 more as it grew. 29 and 30 are retired. */
const BASKET_COUNT = 70;
/** Lost or broken baskets: kept for their history, never deleted, numbers never reused. */
const RETIRED_BASKETS: readonly number[] = [29, 30];

/** Days of history before today. With today, 120 days in all. */
const HISTORY_DAYS = 119;
/** Older events stay in the tables they belong to; only these last days get audit-log rows. */
const AUDIT_DAYS = 14;
/** Jessa Lopez left the shop (her account is disabled) about 49 days ago. */
const JESSA_LEFT_DAYS_AGO = 49;

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

/** Drop-offs per hour of a shop day (7 AM to 6 PM): a morning rush and an after-work rush. */
const HOUR_WEIGHTS: readonly [hour: number, weight: number][] = [
  [7, 1.6],
  [8, 1.9],
  [9, 1.7],
  [10, 1.1],
  [11, 0.8],
  [12, 0.6],
  [13, 0.6],
  [14, 0.7],
  [15, 0.9],
  [16, 1.5],
  [17, 1.7],
  [18, 0.9],
];

const FIRST_NAMES = [
  'Adrian',
  'Alma',
  'Alvin',
  'Amelia',
  'Andrea',
  'Anthony',
  'April',
  'Arlene',
  'Benjie',
  'Bernadette',
  'Carlo',
  'Carmen',
  'Catherine',
  'Cesar',
  'Christian',
  'Clarissa',
  'Daisy',
  'Darwin',
  'Dolores',
  'Edgar',
  'Edwin',
  'Erlinda',
  'Ernesto',
  'Evelyn',
  'Fernando',
  'Florence',
  'Gemma',
  'Gerald',
  'Gina',
  'Hazel',
  'Imelda',
  'Irene',
  'Jasmine',
  'Jayson',
  'Jennifer',
  'Jessica',
  'Joel',
  'Jonathan',
  'Josefina',
  'Kristine',
  'Leah',
  'Leonardo',
  'Lilibeth',
  'Lourdes',
  'Manuel',
  'Marlon',
  'Melanie',
  'Michelle',
  'Nestor',
  'Norma',
  'Oscar',
  'Patricia',
  'Perla',
  'Ramon',
  'Ricardo',
  'Rosalie',
  'Ruben',
  'Susan',
  'Victor',
  'Wilma',
];

const LAST_NAMES = [
  'Abad',
  'Agustin',
  'Alonzo',
  'Andrada',
  'Arellano',
  'Bacani',
  'Bautista',
  'Belmonte',
  'Cabrera',
  'Calderon',
  'Concepcion',
  'Cordero',
  'Cortez',
  'David',
  'De Guzman',
  'De Leon',
  'Del Rosario',
  'Dizon',
  'Esguerra',
  'Estrada',
  'Fajardo',
  'Flores',
  'Galang',
  'Gatchalian',
  'Guevarra',
  'Hernandez',
  'Ilagan',
  'Jimenez',
  'Lacson',
  'Lagman',
  'Lopez',
  'Macaraeg',
  'Magbanua',
  'Malabanan',
  'Manalo',
  'Medina',
  'Mercado',
  'Miranda',
  'Morales',
  'Nepomuceno',
  'Ordoñez',
  'Panganiban',
  'Perez',
  'Quiambao',
  'Quijano',
  'Reyes',
  'Robles',
  'Roque',
  'Sablan',
  'Salvador',
  'Samonte',
  'Sison',
  'Soriano',
  'Tolentino',
  'Umali',
  'Valencia',
  'Velasco',
  'Villafuerte',
  'Yap',
  'Zamora',
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

/** A payment planned with an order: a fixed amount, or whatever the order still owes. */
interface PlannedPayment {
  at: number;
  by: number;
  method: PaymentMethodCode;
  amount: number | 'full' | 'rest' | 'deposit';
}

/** Everything about one order, decided before it is written into the tables. */
interface PlannedOrder {
  customerId: number;
  receivedAt: number;
  items: readonly ItemSpec[];
  /** Status changes already made by now, starting with Received. */
  steps: { status: number; at: number; by: number }[];
  promisedAt: number;
  by: number;
  payments: PlannedPayment[];
  notes: string | null;
  /** One of the hand-written orders from the mockups. */
  featured: boolean;
}

export function createSeed(now: Date): MockDb {
  const rand = mulberry32(20261031);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)] as T;
  const between = (min: number, max: number) => min + rand() * (max - min);
  const weighted = <T>(entries: readonly (readonly [T, number])[]): T => {
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = rand() * total;
    for (const [value, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return value;
    }
    return (entries[entries.length - 1] as readonly [T, number])[0];
  };
  const iso = (value: Date | number) => new Date(value).toISOString();
  const HOUR = 3_600_000;
  const MINUTE = 60_000;
  const nowMs = now.getTime();
  const today = manilaDay(now);
  const seededAt = iso(manilaInstant(addDays(today, -HISTORY_DAYS - 1), 9));
  const auditFrom = nowMs - AUDIT_DAYS * 24 * HOUR;

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
    at: number,
    userId: number,
    action: string,
    type: string,
    id: number | null,
    values: Record<string, unknown>,
  ) => {
    if (at < auditFrom) return;
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

  /** Moves a time that falls after closing (7 PM) or before opening (7 AM) to the next opening. */
  const shopHours = (ms: number) => {
    const hour = manilaHour(ms);
    const day = manilaDay(ms);
    if (hour >= 19) return manilaInstant(addDays(day, 1), 7, Math.floor(between(0, 50))).getTime();
    if (hour < 7) return manilaInstant(day, 7, Math.floor(between(0, 50))).getTime();
    return ms;
  };

  /** Who was at the counter that day. Jessa worked shifts until she left. */
  const staffOn = (daysAgo: number) =>
    daysAgo > JESSA_LEFT_DAYS_AGO
      ? weighted<number>([
          [USER.KEVIN, 0.3],
          [USER.AIRA, 0.25],
          [USER.JESSA, 0.3],
          [USER.LIZA, 0.15],
        ])
      : weighted<number>([
          [USER.KEVIN, 0.42],
          [USER.AIRA, 0.38],
          [USER.LIZA, 0.2],
        ]);
  const daysAgoOf = (ms: number) => Math.max(0, Math.round((nowMs - ms) / (24 * HOUR)));

  // Customers from the mockups: long-time regulars, on file since the shop opened.
  const usedNames = new Set<string>();
  const usedPhones = new Set<string>();
  CUSTOMERS.forEach(([full_name, contact_number, barangay, notes], index) => {
    const since = iso(
      manilaInstant(addDays(today, -HISTORY_DAYS + Math.floor(rand() * 25)), 8, 30),
    );
    usedNames.add(full_name);
    usedPhones.add(contact_number);
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

  const openAccount = (customerId: number, fullName: string, at: string) => {
    const id = db.customer_accounts.length + 1;
    db.customer_accounts.push({
      id,
      customer_id: customerId,
      email: demoEmail(fullName),
      is_active: true,
      must_change_password: false,
      last_login_at: null,
      created_at: at,
      updated_at: at,
    });
    db.customer_credentials[id] = 'password123';
  };

  // Every customer except the legacy profiles has an account. Demo password: password123.
  db.customers
    .filter((customer) => !LEGACY_CUSTOMERS.includes(customer.full_name))
    .forEach((customer) => openAccount(customer.id, customer.full_name, customer.created_at));

  /** Customers who can be served: everyone with an account, with how often they have come. */
  const pool = db.customers
    .filter((customer) => !LEGACY_CUSTOMERS.includes(customer.full_name))
    .map((customer) => ({
      id: customer.id,
      since: Date.parse(customer.created_at),
      orders: 0,
      regular: true,
    }));
  const usedEmails = new Set(db.customer_accounts.map((account) => account.email));

  /** A walk-in registered at the counter a few minutes before their first drop-off. */
  const signUp = (at: number) => {
    let fullName = '';
    for (let tries = 0; tries < 200 && !fullName; tries += 1) {
      const candidate = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      if (!usedNames.has(candidate) && !usedEmails.has(demoEmail(candidate))) fullName = candidate;
    }
    if (!fullName) throw new Error('Seed ran out of customer names');
    let phone = '';
    while (!phone || usedPhones.has(phone)) {
      phone = `09${String(Math.floor(rand() * 1e9)).padStart(9, '0')}`;
    }
    usedNames.add(fullName);
    usedPhones.add(phone);
    usedEmails.add(demoEmail(fullName));
    const created = iso(at - Math.floor(between(2, 10)) * MINUTE);
    const id = db.customers.length + 1;
    const barangay =
      rand() < 0.28
        ? BARANGAYS.indexOf('Poblacion') + 1
        : 1 + Math.floor(rand() * BARANGAYS.length);
    db.customers.push({
      id,
      full_name: fullName,
      contact_number: phone,
      barangay_id: barangay,
      street_address: rand() > 0.5 ? `Purok ${1 + Math.floor(rand() * 7)}` : null,
      notes: null,
      created_at: created,
      updated_at: created,
    });
    openAccount(id, fullName, created);
    const entry = { id, since: Date.parse(created), orders: 0, regular: false };
    pool.push(entry);
    return entry;
  };

  /** About 45% of drop-offs come from returning customers, more of them as the shop matures. */
  const chooseCustomer = (at: number, daysAgo: number) => {
    const newShare = 0.45 + 0.17 * (daysAgo / HISTORY_DAYS);
    const known = pool.filter((entry) => entry.since <= at);
    if (known.length === 0 || rand() < newShare) return signUp(at);
    return weighted(
      known.map((entry) => [entry, (entry.orders + 1) ** 1.3 * (entry.regular ? 2.5 : 1)] as const),
    );
  };

  // Baskets BSK-0001 to BSK-0070. The first 30 were labelled when the shop opened.
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
  const takeBasket = (at: number): number => {
    const ids = [...busyUntil.keys()];
    for (let tries = 0; tries < ids.length; tries += 1) {
      const id = ids[(basketCursor + tries) % ids.length] as number;
      if ((busyUntil.get(id) ?? Infinity) <= at) {
        basketCursor = (basketCursor + tries + 1) % ids.length;
        return id;
      }
    }
    throw new Error('Seed ran out of free baskets');
  };

  // ---------------------------------------------------------------------------------------------
  // Plan every order first, then write them in time order (order numbers and receipts read right).

  const plans: PlannedOrder[] = [];

  /** The mockup orders, exactly as before: they hold today's active work. */
  for (const spec of FEATURED) {
    const customer = db.customers.find((c) => c.full_name === spec.customer);
    if (!customer) throw new Error(`Unknown seed customer ${spec.customer}`);
    let receivedAt = manilaInstant(
      addDays(today, -spec.daysAgo),
      spec.time[0],
      spec.time[1],
    ).getTime();
    if (receivedAt > nowMs) receivedAt = nowMs - (12 + (plans.length % 50)) * MINUTE;
    const by = spec.by ?? USER.KEVIN;
    const stageIndex = STAGES.indexOf(spec.stage);
    let promisedAt = receivedAt + (spec.promiseHours ?? 28) * HOUR;
    if (stageIndex < 4 && !spec.overdue && promisedAt <= nowMs) {
      // Keep active orders on time however late the data is seeded, and inside shop hours.
      promisedAt = nowMs + 3 * HOUR;
      if (manilaHour(promisedAt) >= 19) promisedAt = manilaInstant(addDays(today, 1), 10).getTime();
      else if (manilaHour(promisedAt) < 7) {
        promisedAt = manilaInstant(manilaDay(promisedAt), 10).getTime();
      }
    }

    // Status history, walking forward from Received at a believable pace but never past now.
    const steps = [{ status: 1, at: receivedAt, by }];
    let cursor = receivedAt;
    for (let stage = 2; stage <= stageIndex + 1; stage += 1) {
      const worker = pick([USER.KEVIN, USER.AIRA]);
      cursor += (25 + Math.floor(rand() * 70)) * MINUTE;
      if (stage === 6) cursor = Math.max(cursor, promisedAt + Math.floor(rand() * 240) * MINUTE);
      steps.push({ status: stage, at: cursor, by: worker });
    }
    const last = steps[steps.length - 1]?.at ?? receivedAt;
    if (last > nowMs && steps.length > 1) {
      const span = nowMs - receivedAt - MINUTE;
      steps.forEach((step, index) => {
        step.at = receivedAt + (span * index) / (steps.length - 1);
      });
    }

    const method = spec.method ?? 'cash';
    const payments: PlannedPayment[] = [];
    if (spec.paid === 'full')
      payments.push({ at: receivedAt + 2 * MINUTE, by, method, amount: 'full' });
    else if (typeof spec.paid === 'number') {
      payments.push({ at: receivedAt + 2 * MINUTE, by, method, amount: spec.paid * 100 });
    }
    plans.push({
      customerId: customer.id,
      receivedAt,
      items: spec.items,
      steps,
      promisedAt,
      by,
      payments,
      notes: spec.notes ?? null,
      featured: true,
    });
  }

  /** What a drop-off on `day` at `at` looks like: services, timeline and payments. */
  const planOrder = (at: number, daysAgo: number, force?: 'unclaimed' | 'unclaimed-deposit') => {
    const customer = chooseCustomer(at, daysAgo);
    customer.orders += 1;
    const by = staffOn(daysAgo);

    const items: ItemSpec[] = [];
    const kind = rand();
    if (kind < 0.6) items.push([SERVICE.WDF, Math.round(between(3, 9.5) * 10) / 10]);
    else if (kind < 0.75) items.push([SERVICE.WASH, Math.round(between(3, 8.5) * 10) / 10]);
    else if (kind < 0.85) items.push([SERVICE.COMFORTER, 1 + Math.floor(rand() * 3)]);
    else if (kind < 0.95) items.push([SERVICE.IRONING, 3 + Math.floor(rand() * 13)]);
    else {
      items.push([SERVICE.WDF, Math.round(between(3, 8) * 10) / 10]);
      items.push([SERVICE.IRONING, 2 + Math.floor(rand() * 8)]);
    }
    if (kind < 0.6 && rand() < 0.1) items.push([SERVICE.IRONING, 2 + Math.floor(rand() * 8)]);
    const express = rand() < 0.2;
    if (express) items.push([SERVICE.EXPRESS, 1]);

    // Received to Ready: 18–30 hours, or 4–8 hours for Express. The shop works 7 AM to 7 PM.
    const readyAt = shopHours(at + between(express ? 4 : 18, express ? 8 : 30) * HOUR);
    const span = readyAt - at;
    const times = [
      at,
      shopHours(at + between(10, 60) * MINUTE),
      shopHours(at + span * between(0.38, 0.5)),
      shopHours(at + span * between(0.7, 0.82)),
      readyAt,
    ];
    for (let index = 1; index < times.length; index += 1) {
      times[index] = Math.max(times[index] as number, (times[index - 1] as number) + 5 * MINUTE);
    }
    // Pickup: most the same or next day, a few leave it for days.
    const wait = rand();
    const pickupDelay =
      wait < 0.55
        ? between(0.5, 8)
        : wait < 0.85
          ? between(18, 34)
          : wait < 0.95
            ? between(40, 70)
            : wait < 0.99
              ? between(72, 120)
              : between(150, 300);
    const pickupAt = force ? Infinity : shopHours((times[4] as number) + pickupDelay * HOUR);
    if (pickupAt !== Infinity) times.push(Math.max(pickupAt, (times[4] as number) + 10 * MINUTE));

    const steps = times
      .map((time, index) => ({
        status: index + 1,
        at: time,
        by: index === 0 ? by : staffOn(daysAgo),
      }))
      .filter((step) => step.at <= nowMs - MINUTE);
    const promisedAt = shopHours(at + (express ? 6 : 24) * HOUR);

    // About 25% leave a deposit, some pay everything at drop-off, most pay when they collect.
    const payments: PlannedPayment[] = [];
    const mode = force === 'unclaimed' ? 1 : force === 'unclaimed-deposit' ? 0 : rand();
    const method = (): PaymentMethodCode => (rand() < 0.7 ? 'cash' : 'gcash');
    const pickupStep = steps[5];
    if (mode < 0.25) {
      payments.push({ at: at + 2 * MINUTE, by, method: method(), amount: 'deposit' });
      if (pickupStep)
        payments.push({ at: pickupStep.at, by: pickupStep.by, method: method(), amount: 'rest' });
    } else if (mode < 0.4) {
      payments.push({ at: at + 2 * MINUTE, by, method: method(), amount: 'full' });
    } else if (pickupStep) {
      payments.push({ at: pickupStep.at, by: pickupStep.by, method: method(), amount: 'full' });
    }

    plans.push({
      customerId: customer.id,
      receivedAt: at,
      items,
      steps,
      promisedAt,
      by,
      payments,
      notes: force ? 'Unclaimed. Customer was texted twice.' : null,
      featured: false,
    });
  };

  // History: busier on weekends, a morning and an after-work rush, and steady growth.
  for (let daysAgo = HISTORY_DAYS; daysAgo >= 0; daysAgo -= 1) {
    const day: DayKey = addDays(today, -daysAgo);
    const growth = 9 + 7 * ((HISTORY_DAYS - daysAgo) / HISTORY_DAYS);
    const weekend = weekdayOf(day) >= 5 ? 1.35 : 1;
    const count = Math.round(growth * weekend * between(0.85, 1.15));
    const times: number[] = [];
    for (let n = 0; n < count; n += 1) {
      const hour = weighted(HOUR_WEIGHTS.map(([h, w]) => [h, w] as const));
      const at = manilaInstant(day, hour, Math.floor(rand() * 60)).getTime();
      // Today's mockup orders already cover the first hours; history adds the rest of the day so far.
      if (daysAgo === 0 && (hour < 10 || at > nowMs - 15 * MINUTE)) continue;
      times.push(at);
    }
    times.sort((a, b) => a - b);
    times.forEach((at, index) => {
      // Two loads nobody came back for, to show old unpaid balances and long waits.
      const force =
        index === 0 && daysAgo === 34
          ? 'unclaimed'
          : index === 0 && daysAgo === 12
            ? 'unclaimed-deposit'
            : undefined;
      planOrder(at, daysAgo, force);
    });
  }

  // ---------------------------------------------------------------------------------------------
  // Write the orders.

  const sequences = new Map<string, number>();
  let receiptSeq = 200;
  const statusAt = (status: number) => STAGES[status - 1] as StatusCode;

  const addPayment = (
    order: Order,
    amount: number,
    method: PaymentMethodCode,
    by: number,
    at: number,
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

  /** Ready-for-pickup notices for the staff bell: the mockup orders only, as in the designs. */
  const writeOrder = (plan: PlannedOrder) => {
    const customer = db.customers.find((c) => c.id === plan.customerId);
    if (!customer) throw new Error(`Unknown seed customer ${plan.customerId}`);
    const key = manilaDay(plan.receivedAt).slice(2).replace(/-/g, '');
    const sequence = (sequences.get(key) ?? 0) + 1;
    sequences.set(key, sequence);
    const id = db.orders.length + 1;
    const last = plan.steps[plan.steps.length - 1] ?? {
      status: 1,
      at: plan.receivedAt,
      by: plan.by,
    };
    const daysAgo = daysAgoOf(plan.receivedAt);

    const order: Order = {
      id,
      order_number: `LF-${key}-${String(sequence).padStart(4, '0')}`,
      customer_id: customer.id,
      current_status_id: last.status,
      received_by: plan.by,
      received_at: iso(plan.receivedAt),
      promised_at: iso(plan.promisedAt),
      released_at: last.status === 6 ? iso(last.at) : null,
      notes: plan.notes,
      created_at: iso(plan.receivedAt),
      updated_at: iso(last.at),
    };
    db.orders.push(order);
    audit(plan.receivedAt, plan.by, 'order.created', 'order', id, {
      order_number: order.order_number,
    });

    let total = 0;
    for (const [serviceId, amount] of plan.items) {
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

    plan.steps.forEach((step, index) => {
      const previous = plan.steps[index - 1];
      db.order_status_history.push({
        id: db.order_status_history.length + 1,
        order_id: id,
        from_status_id: previous ? previous.status : null,
        to_status_id: step.status,
        changed_by: step.by,
        note: null,
        changed_at: iso(step.at),
      });
      if (previous) {
        audit(step.at, step.by, 'order.status_changed', 'order', id, {
          order_number: order.order_number,
          from: statusAt(previous.status),
          to: statusAt(step.status),
        });
      }
    });

    // Baskets: one per load, a second one for big loads. Completed orders handed theirs back.
    const kilos = plan.items.reduce(
      (sum, [serviceId, amount]) =>
        sum + (serviceId === SERVICE.WDF || serviceId === SERVICE.WASH ? amount : 0),
      0,
    );
    const done = last.status === 6;
    const basketCount = kilos >= 7 || plan.items.length >= 3 ? 2 : 1;
    for (let b = 0; b < basketCount; b += 1) {
      const basketId = takeBasket(plan.receivedAt);
      busyUntil.set(basketId, done ? last.at : Infinity);
      db.order_baskets.push({
        id: db.order_baskets.length + 1,
        order_id: id,
        basket_id: basketId,
        assigned_at: iso(plan.receivedAt),
        assigned_by: plan.by,
        released_at: done ? iso(last.at) : null,
      });
      if (!done) {
        const basket = db.baskets.find((row) => row.id === basketId);
        if (basket) basket.status = 'in_use';
      }
    }

    // What the customer saw in their account for recent orders.
    if (daysAgo <= 1) {
      plan.steps.forEach((step, index) => {
        const notice = customerNotice(order.order_number, statusAt(step.status));
        db.customer_notifications.push({
          id: db.customer_notifications.length + 1,
          customer_id: customer.id,
          order_id: id,
          type: notice.type,
          message: notice.message,
          sent_at: iso(step.at),
          read_at: index < plan.steps.length - 1 ? iso(step.at) : null,
        });
      });
    }

    if (plan.featured && last.status === 5 && daysAgo <= 4) {
      db.notifications.push({
        id: db.notifications.length + 1,
        order_id: id,
        type: 'ready_for_pickup',
        channel: 'in_app',
        message: `${order.order_number} is ready for pickup (${customer.full_name}).`,
        status: 'recorded',
        sent_at: iso(last.at),
        read_at: null,
      });
    }

    let paid = 0;
    for (const payment of plan.payments) {
      const due = total - paid;
      const amount =
        payment.amount === 'full' || payment.amount === 'rest'
          ? due
          : payment.amount === 'deposit'
            ? Math.min(due, Math.max(5000, Math.floor((total * between(0.3, 0.6)) / 1000) * 1000))
            : Math.min(due, payment.amount);
      if (amount <= 0) continue;
      addPayment(order, amount, payment.method, payment.by, payment.at);
      paid += amount;
    }
    return { order, finalAt: last.at };
  };

  plans.sort((a, b) => a.receivedAt - b.receivedAt);

  // A completed order that had a mistaken payment voided, for the payment history screen.
  let voidedDemoDone = false;
  for (const plan of plans) {
    const { order, finalAt } = writeOrder(plan);
    if (!voidedDemoDone && order.released_at && daysAgoOf(plan.receivedAt) <= 6) {
      const voided = db.payments.find((p) => p.order_id === order.id);
      if (voided) {
        voidedDemoDone = true;
        voided.voided_at = iso(finalAt);
        voided.voided_by = USER.LIZA;
        voided.void_reason = 'Wrong amount keyed in at the counter';
        audit(finalAt, USER.LIZA, 'payment.voided', 'payment', voided.id, {
          order_number: order.order_number,
          receipt_number: voided.receipt_number,
          reason: voided.void_reason,
        });
        // The replacement covers what the voided payment had paid.
        addPayment(order, voided.amount_cents, 'cash', USER.LIZA, finalAt);
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Supplies: daily use follows the laundry received, with restocks when an item runs low.
  // Worked backwards from today's levels (the figures in the mockups), so they land exactly.

  interface Supply {
    item: number;
    /** Use per order, from its lines. */
    use: (lines: { service: number; amount: number }[]) => number;
    /** Today's on-hand level. */
    target: number;
    restock: number;
    whole: boolean;
  }
  const kg = (lines: { service: number; amount: number }[], ...services: number[]) =>
    lines
      .filter((line) => services.includes(line.service))
      .reduce((sum, line) => sum + line.amount, 0);
  const SUPPLIES: readonly Supply[] = [
    {
      item: 1,
      use: (l) => kg(l, SERVICE.WDF, SERVICE.WASH) * 0.012,
      target: 2,
      restock: 25,
      whole: false,
    },
    { item: 2, use: (l) => kg(l, SERVICE.WDF) * 0.007, target: 3.5, restock: 12, whole: false },
    { item: 3, use: () => 1, target: 40, restock: 300, whole: true },
    {
      item: 4,
      use: (l) => kg(l, SERVICE.COMFORTER) * 0.3 + kg(l, SERVICE.WASH) * 0.004,
      target: 12,
      restock: 10,
      whole: false,
    },
    { item: 5, use: (l) => kg(l, SERVICE.WDF) * 0.0015, target: 6, restock: 4, whole: false },
    { item: 6, use: (l) => kg(l, SERVICE.IRONING) * 0.5, target: 120, restock: 150, whole: true },
    { item: 7, use: () => 1 / 80, target: 9, restock: 6, whole: true },
    { item: 8, use: () => 0.3, target: 310, restock: 500, whole: true },
  ];
  const linesByDay = new Map<DayKey, { service: number; amount: number }[][]>();
  for (const order of db.orders) {
    const day = manilaDay(order.received_at);
    const lines = db.order_items
      .filter((item) => item.order_id === order.id)
      .map((item) => ({ service: item.service_id, amount: item.weight_kg ?? item.quantity ?? 0 }));
    linesByDay.set(day, [...(linesByDay.get(day) ?? []), lines]);
  }
  const firstDay = addDays(today, -HISTORY_DAYS);
  const days: DayKey[] = [];
  for (let day = firstDay; day <= today; day = addDays(day, 1)) days.push(day);

  const moves: {
    item: number;
    type: 'in' | 'out';
    quantity: number;
    at: number;
    by: number;
    remarks: string;
  }[] = [];
  for (const supply of SUPPLIES) {
    const reorder = db.inventory_items.find((item) => item.id === supply.item)?.reorder_level ?? 0;
    const cap = reorder + supply.restock;
    const round = (value: number) =>
      supply.whole ? Math.round(value) : Math.round(value * 10) / 10;
    // Daily use, with whole units carried over so that pieces add up.
    const usage: number[] = [];
    let carry = 0;
    for (const day of days) {
      const raw =
        (linesByDay.get(day) ?? []).reduce((sum, lines) => sum + supply.use(lines), 0) + carry;
      const used = round(raw);
      carry = raw - used;
      usage.push(Math.max(0, used));
    }
    let level = supply.target;
    for (let index = days.length - 1; index >= 0; index -= 1) {
      const day = days[index] as DayKey;
      const used = usage[index] as number;
      const daysAgo = HISTORY_DAYS - index;
      const closing =
        index === days.length - 1 ? nowMs - 40 * MINUTE : manilaInstant(day, 18, 45).getTime();
      if (used > 0) {
        moves.push({
          item: supply.item,
          type: 'out',
          quantity: used,
          at: closing,
          by: staffOn(daysAgo),
          remarks: 'Used today',
        });
      }
      level = round(level + used);
      // Before this day the level was higher; a delivery explains it once it tops the shelf.
      while (level > cap && index > 0) {
        moves.push({
          item: supply.item,
          type: 'in',
          quantity: supply.restock,
          at: manilaInstant(day, 9, 30).getTime(),
          by: USER.LIZA,
          remarks: 'Supplier delivery, Calapan',
        });
        level = round(level - supply.restock);
      }
    }
    moves.push({
      item: supply.item,
      type: 'in',
      quantity: level,
      at: manilaInstant(firstDay, 7, 30).getTime(),
      by: USER.LIZA,
      remarks: 'Opening stock',
    });
  }
  moves.sort((a, b) => a.at - b.at || (a.type === 'in' ? -1 : 1));
  moves.forEach((move, index) => {
    db.inventory_movements.push({
      id: index + 1,
      item_id: move.item,
      user_id: move.by,
      type: move.type,
      quantity: move.quantity,
      remarks: move.remarks,
      moved_at: iso(move.at),
    });
    audit(move.at, move.by, 'inventory.movement', 'inventory_item', move.item, {
      item_name: db.inventory_items.find((item) => item.id === move.item)?.name,
      type: move.type,
      quantity: move.quantity,
      remarks: move.remarks,
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
      sent_at: iso(nowMs - minutes * MINUTE),
      read_at: null,
    });
  });

  audit(nowMs - 2 * 24 * HOUR, USER.LIZA, 'service.updated', 'service', SERVICE.IRONING, {
    name: 'Ironing',
    summary: 'updated rate Ironing ₱12 → ₱15',
  });
  audit(nowMs - 150 * MINUTE, USER.LIZA, 'auth.login', 'user', USER.LIZA, {});
  audit(nowMs - 190 * MINUTE, USER.KEVIN, 'auth.login', 'user', USER.KEVIN, {});

  db.audit_logs.sort((a, b) => a.created_at.localeCompare(b.created_at));
  db.audit_logs.forEach((log, index) => {
    log.id = index + 1;
  });

  return db;
}
