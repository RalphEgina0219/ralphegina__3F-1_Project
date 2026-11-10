<?php

namespace Database\Seeders;

use App\Support\Analytics\ManilaTime as T;
use App\Support\BasketCodes;
use App\Support\Billing;
use App\Support\CustomerNotice;
use App\Support\Js;
use Database\Seeders\Demo\Mulberry32;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * 120 days of shop history, a faithful port of react-frontend/src/mocks/seed.ts: the same random
 * generator and seed, the same calls in the same order, so the Laravel demo shows the same orders,
 * customers, charts and reports as the frontend's demo. Weekend peaks, morning and after-work
 * rushes, the service mix, the cash/GCash split, turnaround, returning customers, 70 baskets
 * (BSK-0029 and BSK-0030 retired) and today's active orders in their baskets.
 *
 * Only the QR tokens differ: they are cryptographically random, as real labels must be.
 * Every account's password is password123.
 */
class DemoSeeder extends Seeder
{
    private const CUSTOMERS = [
        ['Maria Santos', '09178452210', 'Poblacion', 'Prefers unscented conditioner'],
        ['Ana Reyes', '09171234581', 'Dayhagan'], ['Jomar Castillo', '09285541022', 'Batangan'],
        ['Grace Bautista', '09158703364', 'Hagan'], ['Mark Villanueva', '09064317790', 'Ipil'],
        ['Joy Mendoza', '09392186603', 'Lisap'], ['Rogelio Tan', '09951042287', 'Poblacion'],
        ['Carmela Aquino', '09176620915', 'Labasan', 'Separate white uniforms'],
        ['Dennis Ocampo', '09183307741', 'Dayhagan'], ['Rhea Villanueva', '09171198254', 'Ipil'],
        ['Paolo Mendoza', '09267730145', 'Lisap'], ['Luis Garcia', '09451126078', 'Poblacion'],
        ['Nina Ramirez', '09198845120', 'Batangan'], ['Ben Soriano', '09352214876', 'Hagan'],
        ['Cris Navarro', '09161007723', 'Labasan'],
        ['Elena Cruz', '09473356192', 'Poblacion', 'Call before pickup'],
        ['Arnel Pascual', '09215580346', 'Masaguisi'], ['Lorna Dela Cruz', '09175523018', 'Poblacion'],
        ['Ramil Fernandez', '09084412973', 'Sagana'], ['Teresita Gonzales', '09293317480', 'Carmundo'],
        ['Angelo Marquez', '09561182734', 'Formon'], ['Divina Salazar', '09174490621', 'Morente'],
        ['Noel Aguilar', '09186630245', 'Anilao'], ['Cherry Lim', '09778214409', 'Poblacion'],
        ['Eduardo Rivera', '09451873320', 'Bukal'], ['Liezl Pangilinan', '09193340176', 'Malitbog'],
        ['Romeo Bernardo', '09354471829', 'Orconuma'], ['Shiela Domingo', '09167782401', 'Tawas'],
        ['Vincent Torres', '09286619053', 'Labonan'], ['Marites Valdez', '09052238147', 'San Isidro'],
        ['Jerome Santiago', '09613340982', 'San Jose'], ['Ofelia Manalastas', '09177706634', 'San Juan'],
        ['Gilbert Rosales', '09298845261', 'Sta. Cruz'], ['Rowena Castro', '09454417730', 'Sigange'],
        ['Danilo Evangelista', '09151162298', 'Libertad'], ['Pia Francisco', '09264405517', 'Luna'],
        ['Ronald Mercado', '09387720164', 'Mapang'], ['Janine Alcantara', '09176349920', 'Hagupit'],
        ['Felix Ignacio', '09203318845', 'Pulosahi'], ['Sarah Ramos', '09561047726', 'Cawayan'],
    ];

    /** On file from before customer accounts existed: no account, no orders. */
    private const LEGACY = ['Janine Alcantara', 'Felix Ignacio', 'Sarah Ramos'];

    private const BASKET_COUNT = 70;

    private const RETIRED_BASKETS = [29, 30];

    /** Big loads get a second basket only while more than this many are free. */
    private const SPARE_BASKETS = 10;

    private const HISTORY_DAYS = 119;

    private const AUDIT_DAYS = 14;

    private const JESSA_LEFT_DAYS_AGO = 49;

    private const WDF = 1;

    private const WASH = 2;

    private const COMFORTER = 3;

    private const IRONING = 4;

    private const EXPRESS = 5;

    private const LIZA = 1;

    private const KEVIN = 2;

    private const AIRA = 3;

    private const JESSA = 4;

    private const STAGES = ['received', 'washing', 'drying', 'folding', 'ready_for_pickup', 'released'];

    private const HOUR_WEIGHTS = [[7, 1.6], [8, 1.9], [9, 1.7], [10, 1.1], [11, 0.8], [12, 0.6], [13, 0.6], [14, 0.7], [15, 0.9], [16, 1.5], [17, 1.7], [18, 0.9]];

    private const FIRST_NAMES = ['Adrian', 'Alma', 'Alvin', 'Amelia', 'Andrea', 'Anthony', 'April', 'Arlene', 'Benjie', 'Bernadette', 'Carlo', 'Carmen', 'Catherine', 'Cesar', 'Christian', 'Clarissa', 'Daisy', 'Darwin', 'Dolores', 'Edgar', 'Edwin', 'Erlinda', 'Ernesto', 'Evelyn', 'Fernando', 'Florence', 'Gemma', 'Gerald', 'Gina', 'Hazel', 'Imelda', 'Irene', 'Jasmine', 'Jayson', 'Jennifer', 'Jessica', 'Joel', 'Jonathan', 'Josefina', 'Kristine', 'Leah', 'Leonardo', 'Lilibeth', 'Lourdes', 'Manuel', 'Marlon', 'Melanie', 'Michelle', 'Nestor', 'Norma', 'Oscar', 'Patricia', 'Perla', 'Ramon', 'Ricardo', 'Rosalie', 'Ruben', 'Susan', 'Victor', 'Wilma'];

    private const LAST_NAMES = ['Abad', 'Agustin', 'Alonzo', 'Andrada', 'Arellano', 'Bacani', 'Bautista', 'Belmonte', 'Cabrera', 'Calderon', 'Concepcion', 'Cordero', 'Cortez', 'David', 'De Guzman', 'De Leon', 'Del Rosario', 'Dizon', 'Esguerra', 'Estrada', 'Fajardo', 'Flores', 'Galang', 'Gatchalian', 'Guevarra', 'Hernandez', 'Ilagan', 'Jimenez', 'Lacson', 'Lagman', 'Lopez', 'Macaraeg', 'Magbanua', 'Malabanan', 'Manalo', 'Medina', 'Mercado', 'Miranda', 'Morales', 'Nepomuceno', 'Ordoñez', 'Panganiban', 'Perez', 'Quiambao', 'Quijano', 'Reyes', 'Robles', 'Roque', 'Sablan', 'Salvador', 'Samonte', 'Sison', 'Soriano', 'Tolentino', 'Umali', 'Valencia', 'Velasco', 'Villafuerte', 'Yap', 'Zamora'];

    /** The hand-written orders from the mockups: today's active work. [customer, daysAgo, [h, m], items, stage, paid, method, by, promiseHours, notes, overdue] */
    private const FEATURED = [
        ['Arnel Pascual', 4, [10, 15], [[self::WDF, 4.5]], 'ready_for_pickup', 'none', null, self::AIRA],
        ['Lorna Dela Cruz', 3, [13, 40], [[self::WASH, 6]], 'ready_for_pickup', 'full', 'gcash', self::KEVIN],
        ['Dennis Ocampo', 1, [11, 20], [[self::WDF, 9]], 'released', 'full', null, self::KEVIN],
        ['Rogelio Tan', 1, [13, 5], [[self::WDF, 4], [self::EXPRESS, 1]], 'released', 'full', 'gcash', self::AIRA, 6],
        ['Carmela Aquino', 1, [15, 40], [[self::WDF, 3.5], [self::EXPRESS, 1]], 'ready_for_pickup', 'full', null, self::KEVIN, 3],
        ['Joy Mendoza', 1, [17, 12], [[self::WDF, 7.2]], 'ready_for_pickup', 'none', null, self::KEVIN, 16],
        ['Ben Soriano', 1, [8, 30], [[self::WASH, 7]], 'washing', 'none', null, self::AIRA, 10, null, true],
        ['Cris Navarro', 1, [14, 5], [[self::WDF, 8.5]], 'drying', 100, null, self::AIRA],
        ['Elena Cruz', 1, [16, 25], [[self::WDF, 5], [self::IRONING, 4]], 'folding', 'full', null, self::KEVIN],
        ['Nina Ramirez', 0, [6, 40], [[self::WDF, 3], [self::EXPRESS, 1]], 'washing', 'full', null, self::KEVIN, 8],
        ['Luis Garcia', 0, [6, 58], [[self::WDF, 5.5]], 'washing', 'full', 'gcash', self::AIRA],
        ['Paolo Mendoza', 0, [7, 5], [[self::WASH, 6]], 'received', 'full', 'gcash', self::KEVIN],
        ['Rhea Villanueva', 0, [7, 22], [[self::WDF, 4]], 'received', 'none', null, self::KEVIN],
        ['Mark Villanueva', 0, [7, 30], [[self::WASH, 8]], 'folding', 'full', null, self::AIRA, 9],
        ['Grace Bautista', 0, [7, 58], [[self::COMFORTER, 2]], 'drying', 150, 'gcash', self::KEVIN, 26],
        ['Jomar Castillo', 0, [8, 15], [[self::WDF, 5], [self::IRONING, 6]], 'received', 'full', null, self::KEVIN],
        ['Ana Reyes', 0, [8, 42], [[self::WDF, 6.5]], 'washing', 'none', null, self::KEVIN],
        ['Maria Santos', 0, [9, 20], [[self::WDF, 6.5], [self::IRONING, 6], [self::EXPRESS, 1]], 'washing', 200, null, self::KEVIN, 8, 'Separate white uniforms. Unscented conditioner.'],
    ];

    private const MINUTE = 60_000;

    private const HOUR = 3_600_000;

    private Mulberry32 $rand;

    private int $nowMs;

    private string $today;

    private int $auditFrom;

    /** @var array<string, list<array<string, mixed>>> */
    private array $rows = [];

    public function run(): void
    {
        $started = microtime(true);
        $this->rand = new Mulberry32(20261031);
        // SEED_NOW_MS pins "now" (epoch ms), to compare with the frontend seed for the same instant.
        $this->nowMs = (int) (env('SEED_NOW_MS') ?: floor(microtime(true) * 1000));
        $this->today = T::day($this->nowMs);
        $this->auditFrom = $this->nowMs - self::AUDIT_DAYS * 24 * self::HOUR;
        $seededAt = T::instant(T::addDays($this->today, -self::HISTORY_DAYS - 1), 9);

        $reference = new ReferenceDataSeeder;
        $reference->seededAt = $this->dt($seededAt);
        $reference->setContainer($this->container)->setCommand($this->command);
        $reference->run();

        foreach ([[self::LIZA, 150 * self::MINUTE], [self::KEVIN, 190 * self::MINUTE], [self::AIRA, 24 * self::HOUR], [self::JESSA, 49 * 24 * self::HOUR]] as [$id, $ago]) {
            DB::table('users')->where('id', $id)->update(['last_login_at' => $this->dt($this->nowMs - $ago)]);
        }

        $this->generate($seededAt);
        $this->write();

        $this->command?->info(sprintf('Demo history: %d orders, %d customers, %d payments (%.1fs).',
            count($this->rows['orders']), count($this->rows['customers']), count($this->rows['payments']), microtime(true) - $started));
    }

    // Random helpers, exactly as in seed.ts -----------------------------------------------------

    private function rand(): float
    {
        return $this->rand->next();
    }

    private function pick(array $list): mixed
    {
        return $list[(int) floor($this->rand() * count($list))];
    }

    private function between(float $min, float $max): float
    {
        return $min + $this->rand() * ($max - $min);
    }

    /** @param  list<array{0: mixed, 1: float}>  $entries */
    private function weighted(array $entries): mixed
    {
        $total = 0.0;
        foreach ($entries as [, $weight]) {
            $total += $weight;
        }
        $roll = $this->rand() * $total;
        foreach ($entries as [$value, $weight]) {
            $roll -= $weight;
            if ($roll <= 0) {
                return $value;
            }
        }

        return $entries[count($entries) - 1][0];
    }

    private function shopHours(int|float $ms): int
    {
        $hour = T::hour($ms);
        $day = T::day($ms);
        if ($hour >= 19) {
            return T::instant(T::addDays($day, 1), 7, (int) floor($this->between(0, 50)));
        }
        if ($hour < 7) {
            return T::instant($day, 7, (int) floor($this->between(0, 50)));
        }

        return (int) $ms;
    }

    private function staffOn(int $daysAgo): int
    {
        return $daysAgo > self::JESSA_LEFT_DAYS_AGO
            ? $this->weighted([[self::KEVIN, 0.3], [self::AIRA, 0.25], [self::JESSA, 0.3], [self::LIZA, 0.15]])
            : $this->weighted([[self::KEVIN, 0.42], [self::AIRA, 0.38], [self::LIZA, 0.2]]);
    }

    private function daysAgoOf(int|float $ms): int
    {
        return max(0, Js::round(($this->nowMs - $ms) / (24 * self::HOUR)));
    }

    /** Epoch ms -> the Manila wall-clock time the database stores (session time zone +08:00). */
    private function dt(int|float $ms): string
    {
        return gmdate('Y-m-d H:i:s', (int) floor($ms / 1000) + 8 * 3600);
    }

    private function audit(int|float $at, ?int $userId, string $action, string $type, ?int $id, array $values): void
    {
        if ($at < $this->auditFrom) {
            return;
        }
        $this->rows['audit_logs'][] = [
            'user_id' => $userId,
            'action' => $action,
            'auditable_type' => $type,
            'auditable_id' => $id,
            'old_values' => null,
            'new_values' => json_encode($values, JSON_UNESCAPED_UNICODE),
            'created_at' => $at,
        ];
    }

    // The history ------------------------------------------------------------------------------

    private function generate(int $seededAt): void
    {
        $barangays = ReferenceDataSeeder::BARANGAYS;
        $services = [];
        foreach (ReferenceDataSeeder::SERVICES as $s) {
            $services[$s[0]] = ['pricing_type' => $s[3], 'rate_cents' => $s[4], 'minimum_qty' => $s[5]];
        }
        $this->rows = array_fill_keys(['customers', 'customer_accounts', 'baskets', 'orders', 'order_items', 'order_status_history', 'order_baskets', 'payments', 'notifications', 'inventory_movements', 'audit_logs'], []);

        // Customers from the mockups: long-time regulars, on file since the shop opened.
        $usedNames = [];
        $usedPhones = [];
        $usedEmails = [];
        foreach (self::CUSTOMERS as $index => $c) {
            $since = T::instant(T::addDays($this->today, -self::HISTORY_DAYS + (int) floor($this->rand() * 25)), 8, 30);
            $usedNames[$c[0]] = true;
            $usedPhones[$c[1]] = true;
            $this->rows['customers'][] = [
                'id' => $index + 1,
                'full_name' => $c[0],
                'contact_number' => $c[1],
                'barangay_id' => array_search($c[2], $barangays, true) + 1,
                'street_address' => $this->rand() > 0.5 ? 'Purok '.(1 + (int) floor($this->rand() * 7)) : null,
                'notes' => $c[3] ?? null,
                'created_at' => $since,
            ];
        }

        // Every customer except the legacy profiles has an account.
        $pool = [];
        foreach ($this->rows['customers'] as $customer) {
            if (in_array($customer['full_name'], self::LEGACY, true)) {
                continue;
            }
            $this->openAccount($customer['id'], $customer['full_name'], $customer['created_at']);
            $usedEmails[CustomerNotice::demoEmail($customer['full_name'])] = true;
            $pool[] = ['id' => $customer['id'], 'since' => $customer['created_at'], 'orders' => 0, 'regular' => true];
        }

        $signUp = function (int|float $at) use (&$usedNames, &$usedPhones, &$usedEmails, &$pool, $barangays): int {
            $fullName = '';
            for ($tries = 0; $tries < 200 && $fullName === ''; $tries++) {
                $candidate = $this->pick(self::FIRST_NAMES).' '.$this->pick(self::LAST_NAMES);
                if (! isset($usedNames[$candidate]) && ! isset($usedEmails[CustomerNotice::demoEmail($candidate)])) {
                    $fullName = $candidate;
                }
            }
            $phone = '';
            while ($phone === '' || isset($usedPhones[$phone])) {
                $phone = '09'.str_pad((string) (int) floor($this->rand() * 1e9), 9, '0', STR_PAD_LEFT);
            }
            $usedNames[$fullName] = true;
            $usedPhones[$phone] = true;
            $usedEmails[CustomerNotice::demoEmail($fullName)] = true;
            $created = $at - (int) floor($this->between(2, 10)) * self::MINUTE;
            $id = count($this->rows['customers']) + 1;
            $barangay = $this->rand() < 0.28 ? array_search('Poblacion', $barangays, true) + 1 : 1 + (int) floor($this->rand() * count($barangays));
            $this->rows['customers'][] = [
                'id' => $id,
                'full_name' => $fullName,
                'contact_number' => $phone,
                'barangay_id' => $barangay,
                'street_address' => $this->rand() > 0.5 ? 'Purok '.(1 + (int) floor($this->rand() * 7)) : null,
                'notes' => null,
                'created_at' => $created,
            ];
            $this->openAccount($id, $fullName, $created);
            $pool[] = ['id' => $id, 'since' => $created, 'orders' => 0, 'regular' => false];

            return count($pool) - 1;
        };

        /** About 45% of drop-offs come from returning customers, more as the shop matures. */
        $chooseCustomer = function (int|float $at, int $daysAgo) use (&$pool, $signUp): int {
            $newShare = 0.45 + 0.17 * ($daysAgo / self::HISTORY_DAYS);
            $known = [];
            foreach ($pool as $index => $entry) {
                if ($entry['since'] <= $at) {
                    $known[] = $index;
                }
            }
            if ($known === [] || $this->rand() < $newShare) {
                return $signUp($at);
            }

            return $this->weighted(array_map(
                fn ($index) => [$index, (($pool[$index]['orders'] + 1) ** 1.3) * ($pool[$index]['regular'] ? 2.5 : 1)],
                $known,
            ));
        };

        // Baskets BSK-0001 to BSK-0070; the first 30 were labelled when the shop opened.
        $labels = ['Blue, large', 'Blue, medium', 'Green, large', 'Yellow, medium', 'Red, small'];
        $busyUntil = [];
        for ($n = 1; $n <= self::BASKET_COUNT; $n++) {
            $retired = in_array($n, self::RETIRED_BASKETS, true);
            $this->rows['baskets'][$n] = [
                'id' => $n,
                'basket_number' => BasketCodes::formatBasketNumber($n),
                'qr_token' => BasketCodes::generateToken(),
                'label' => $labels[($n - 1) % count($labels)],
                'status' => $retired ? 'retired' : 'available',
                'notes' => $retired ? 'Cracked handle, replaced' : null,
                'created_by' => self::LIZA,
                'created_at' => $seededAt,
            ];
            if (! $retired) {
                $busyUntil[$n] = 0;
            }
        }
        $basketIds = array_keys($busyUntil);
        $basketCursor = 0;
        $takeBasket = function (int|float $at, bool $optional = false) use (&$busyUntil, $basketIds, &$basketCursor): ?int {
            $count = count($basketIds);
            // A big load's second basket only while plenty are free, so evening rushes never run out.
            if ($optional && count(array_filter($basketIds, fn ($id) => $busyUntil[$id] <= $at)) <= self::SPARE_BASKETS) {
                return null;
            }
            for ($tries = 0; $tries < $count; $tries++) {
                $id = $basketIds[($basketCursor + $tries) % $count];
                if ($busyUntil[$id] <= $at) {
                    $basketCursor = ($basketCursor + $tries + 1) % $count;

                    return $id;
                }
            }
            // A second basket is a nicety: in a rush, a big load shares one.
            if ($optional) {
                return null;
            }
            // A rush busier than the baskets on hand: take the one whose earlier, completed order
            // frees it soonest. Never a basket that still holds an active order (INF).
            $soonest = null;
            foreach ($basketIds as $id) {
                if ($busyUntil[$id] !== INF && ($soonest === null || $busyUntil[$id] < $busyUntil[$soonest])) {
                    $soonest = $id;
                }
            }
            if ($soonest === null) {
                throw new \RuntimeException('Seed ran out of free baskets');
            }
            $basketCursor = (array_search($soonest, $basketIds, true) + 1) % $count;

            return $soonest;
        };

        // Plan every order first, then write them in time order.
        $plans = [];
        foreach (self::FEATURED as $spec) {
            [$name, $daysAgo, $time, $items, $stage, $paidSpec] = $spec;
            $method = $spec[6] ?? 'cash';
            $by = $spec[7] ?? self::KEVIN;
            $promiseHours = $spec[8] ?? 28;
            $notes = $spec[9] ?? null;
            $overdue = $spec[10] ?? false;
            $customerId = null;
            foreach ($this->rows['customers'] as $c) {
                if ($c['full_name'] === $name) {
                    $customerId = $c['id'];
                    break;
                }
            }

            $receivedAt = T::instant(T::addDays($this->today, -$daysAgo), $time[0], $time[1]);
            if ($receivedAt > $this->nowMs) {
                $receivedAt = $this->nowMs - (12 + (count($plans) % 50)) * self::MINUTE;
            }
            $stageIndex = array_search($stage, self::STAGES, true);
            $promisedAt = $receivedAt + $promiseHours * self::HOUR;
            if ($stageIndex < 4 && ! $overdue && $promisedAt <= $this->nowMs) {
                // Keep active orders on time however late the data is seeded, and inside shop hours.
                $promisedAt = $this->nowMs + 3 * self::HOUR;
                if (T::hour($promisedAt) >= 19) {
                    $promisedAt = T::instant(T::addDays($this->today, 1), 10);
                } elseif (T::hour($promisedAt) < 7) {
                    $promisedAt = T::instant(T::day($promisedAt), 10);
                }
            }

            $steps = [['status' => 1, 'at' => $receivedAt, 'by' => $by]];
            $cursor = $receivedAt;
            for ($s = 2; $s <= $stageIndex + 1; $s++) {
                $worker = $this->pick([self::KEVIN, self::AIRA]);
                $cursor += (25 + (int) floor($this->rand() * 70)) * self::MINUTE;
                if ($s === 6) {
                    $cursor = max($cursor, $promisedAt + (int) floor($this->rand() * 240) * self::MINUTE);
                }
                $steps[] = ['status' => $s, 'at' => $cursor, 'by' => $worker];
            }
            $last = end($steps)['at'];
            if ($last > $this->nowMs && count($steps) > 1) {
                $span = $this->nowMs - $receivedAt - self::MINUTE;
                foreach ($steps as $i => $step) {
                    $steps[$i]['at'] = $receivedAt + ($span * $i) / (count($steps) - 1);
                }
            }

            $payments = [];
            if ($paidSpec === 'full') {
                $payments[] = ['at' => $receivedAt + 2 * self::MINUTE, 'by' => $by, 'method' => $method, 'amount' => 'full'];
            } elseif (is_int($paidSpec)) {
                $payments[] = ['at' => $receivedAt + 2 * self::MINUTE, 'by' => $by, 'method' => $method, 'amount' => $paidSpec * 100];
            }
            $plans[] = ['customer' => $customerId, 'receivedAt' => $receivedAt, 'items' => $items, 'steps' => $steps, 'promisedAt' => $promisedAt, 'by' => $by, 'payments' => $payments, 'notes' => $notes, 'featured' => true];
        }

        $planOrder = function (int $at, int $daysAgo, ?string $force) use (&$plans, &$pool, $chooseCustomer) {
            $index = $chooseCustomer($at, $daysAgo);
            $pool[$index]['orders']++;
            $customerId = $pool[$index]['id'];
            $by = $this->staffOn($daysAgo);

            $items = [];
            $kind = $this->rand();
            if ($kind < 0.6) {
                $items[] = [self::WDF, Js::round($this->between(3, 9.5) * 10) / 10];
            } elseif ($kind < 0.75) {
                $items[] = [self::WASH, Js::round($this->between(3, 8.5) * 10) / 10];
            } elseif ($kind < 0.85) {
                $items[] = [self::COMFORTER, 1 + (int) floor($this->rand() * 3)];
            } elseif ($kind < 0.95) {
                $items[] = [self::IRONING, 3 + (int) floor($this->rand() * 13)];
            } else {
                $items[] = [self::WDF, Js::round($this->between(3, 8) * 10) / 10];
                $items[] = [self::IRONING, 2 + (int) floor($this->rand() * 8)];
            }
            if ($kind < 0.6 && $this->rand() < 0.1) {
                $items[] = [self::IRONING, 2 + (int) floor($this->rand() * 8)];
            }
            $express = $this->rand() < 0.2;
            if ($express) {
                $items[] = [self::EXPRESS, 1];
            }

            // Received to Ready: 18–30 hours, or 4–8 hours for Express. The shop works 7 AM to 7 PM.
            $readyAt = $this->shopHours($at + $this->between($express ? 4 : 18, $express ? 8 : 30) * self::HOUR);
            $span = $readyAt - $at;
            $times = [$at];
            $times[] = $this->shopHours($at + $this->between(10, 60) * self::MINUTE);
            $times[] = $this->shopHours($at + $span * $this->between(0.38, 0.5));
            $times[] = $this->shopHours($at + $span * $this->between(0.7, 0.82));
            $times[] = $readyAt;
            for ($i = 1; $i < count($times); $i++) {
                $times[$i] = max($times[$i], $times[$i - 1] + 5 * self::MINUTE);
            }

            // Pickup: most the same or next day, a few leave it for days.
            $wait = $this->rand();
            $pickupDelay = $wait < 0.55 ? $this->between(0.5, 8)
                : ($wait < 0.85 ? $this->between(18, 34)
                    : ($wait < 0.95 ? $this->between(40, 70)
                        : ($wait < 0.99 ? $this->between(72, 120) : $this->between(150, 300))));
            if (! $force) {
                $pickupAt = $this->shopHours($times[4] + $pickupDelay * self::HOUR);
                $times[] = max($pickupAt, $times[4] + 10 * self::MINUTE);
            }

            $steps = [];
            foreach ($times as $i => $time) {
                $steps[] = ['status' => $i + 1, 'at' => $time, 'by' => $i === 0 ? $by : $this->staffOn($daysAgo)];
            }
            $steps = array_values(array_filter($steps, fn ($step) => $step['at'] <= $this->nowMs - self::MINUTE));
            $promisedAt = $this->shopHours($at + ($express ? 6 : 24) * self::HOUR);

            // About 25% leave a deposit, some pay everything at drop-off, most pay when they collect.
            $payments = [];
            $mode = $force === 'unclaimed' ? 1 : ($force === 'unclaimed-deposit' ? 0 : $this->rand());
            $method = fn () => $this->rand() < 0.7 ? 'cash' : 'gcash';
            $pickupStep = $steps[5] ?? null;
            if ($mode < 0.25) {
                $payments[] = ['at' => $at + 2 * self::MINUTE, 'by' => $by, 'method' => $method(), 'amount' => 'deposit'];
                if ($pickupStep) {
                    $payments[] = ['at' => $pickupStep['at'], 'by' => $pickupStep['by'], 'method' => $method(), 'amount' => 'rest'];
                }
            } elseif ($mode < 0.4) {
                $payments[] = ['at' => $at + 2 * self::MINUTE, 'by' => $by, 'method' => $method(), 'amount' => 'full'];
            } elseif ($pickupStep) {
                $payments[] = ['at' => $pickupStep['at'], 'by' => $pickupStep['by'], 'method' => $method(), 'amount' => 'full'];
            }

            $plans[] = ['customer' => $customerId, 'receivedAt' => $at, 'items' => $items, 'steps' => $steps, 'promisedAt' => $promisedAt, 'by' => $by, 'payments' => $payments, 'notes' => $force ? 'Unclaimed. Customer was texted twice.' : null, 'featured' => false];
        };

        // History: busier on weekends, a morning and an after-work rush, and steady growth.
        for ($daysAgo = self::HISTORY_DAYS; $daysAgo >= 0; $daysAgo--) {
            $day = T::addDays($this->today, -$daysAgo);
            $growth = 9 + 7 * ((self::HISTORY_DAYS - $daysAgo) / self::HISTORY_DAYS);
            $weekend = T::weekdayOf($day) >= 5 ? 1.35 : 1;
            $count = Js::round($growth * $weekend * $this->between(0.85, 1.15));
            $times = [];
            for ($n = 0; $n < $count; $n++) {
                $hour = $this->weighted(self::HOUR_WEIGHTS);
                $at = T::instant($day, $hour, (int) floor($this->rand() * 60));
                if ($daysAgo === 0 && ($hour < 10 || $at > $this->nowMs - 15 * self::MINUTE)) {
                    continue;
                }
                $times[] = $at;
            }
            sort($times);
            foreach ($times as $index => $at) {
                $force = $index === 0 && $daysAgo === 34 ? 'unclaimed' : ($index === 0 && $daysAgo === 12 ? 'unclaimed-deposit' : null);
                $planOrder($at, $daysAgo, $force);
            }
        }

        // Write the orders in time order (order numbers and receipts read right).
        usort($plans, fn ($a, $b) => $a['receivedAt'] <=> $b['receivedAt']);
        $sequences = [];
        $receiptSeq = 200;
        $customerNames = array_column($this->rows['customers'], 'full_name', 'id');

        $addPayment = function (array $order, int $amount, string $method, int $by, int|float $at) use (&$receiptSeq): int {
            $receiptSeq++;
            $id = count($this->rows['payments']) + 1;
            $this->rows['payments'][] = [
                'id' => $id,
                'order_id' => $order['id'],
                'payment_method_id' => $method === 'cash' ? 1 : 2,
                'amount_cents' => $amount,
                'reference_number' => $method === 'gcash' ? '5012'.(int) floor(100000000 + $this->rand() * 899999999) : null,
                'receipt_number' => 'OR-'.str_pad((string) $receiptSeq, 6, '0', STR_PAD_LEFT),
                'received_by' => $by,
                'paid_at' => $at,
                'voided_at' => null,
                'voided_by' => null,
                'void_reason' => null,
            ];
            $this->audit($at, $by, 'payment.recorded', 'payment', $id, ['order_number' => $order['order_number'], 'amount_cents' => $amount, 'method' => $method]);

            return $id;
        };

        $voidedDemoDone = false;
        foreach ($plans as $plan) {
            $key = str_replace('-', '', substr(T::day($plan['receivedAt']), 2));
            $sequences[$key] = ($sequences[$key] ?? 0) + 1;
            $id = count($this->rows['orders']) + 1;
            $last = end($plan['steps']) ?: ['status' => 1, 'at' => $plan['receivedAt'], 'by' => $plan['by']];
            $daysAgo = $this->daysAgoOf($plan['receivedAt']);
            $order = [
                'id' => $id,
                'order_number' => "LF-{$key}-".str_pad((string) $sequences[$key], 4, '0', STR_PAD_LEFT),
                'customer_id' => $plan['customer'],
                'current_status_id' => $last['status'],
                'received_by' => $plan['by'],
                'received_at' => $plan['receivedAt'],
                'promised_at' => $plan['promisedAt'],
                'released_at' => $last['status'] === 6 ? $last['at'] : null,
                'notes' => $plan['notes'],
                'created_at' => $plan['receivedAt'],
                'updated_at' => $last['at'],
            ];
            $this->rows['orders'][] = $order;
            $this->audit($plan['receivedAt'], $plan['by'], 'order.created', 'order', $id, ['order_number' => $order['order_number']]);

            $total = 0;
            foreach ($plan['items'] as [$serviceId, $amount]) {
                $service = $services[$serviceId];
                $weight = $service['pricing_type'] === 'per_kg' ? $amount : null;
                $quantity = $service['pricing_type'] === 'per_kg' ? null : $amount;
                $subtotal = Billing::lineSubtotalCents($service + ['weight_kg' => $weight, 'quantity' => $quantity]);
                $total += $subtotal;
                $this->rows['order_items'][] = [
                    'order_id' => $id,
                    'service_id' => $serviceId,
                    'weight_kg' => $weight,
                    'quantity' => $quantity,
                    'unit_price_cents' => $service['rate_cents'],
                    'subtotal_cents' => $subtotal,
                ];
            }

            foreach ($plan['steps'] as $index => $step) {
                $previous = $plan['steps'][$index - 1] ?? null;
                $this->rows['order_status_history'][] = [
                    'order_id' => $id,
                    'from_status_id' => $previous['status'] ?? null,
                    'to_status_id' => $step['status'],
                    'changed_by' => $step['by'],
                    'note' => null,
                    'changed_at' => $step['at'],
                ];
                if ($previous) {
                    $this->audit($step['at'], $step['by'], 'order.status_changed', 'order', $id, [
                        'order_number' => $order['order_number'],
                        'from' => self::STAGES[$previous['status'] - 1],
                        'to' => self::STAGES[$step['status'] - 1],
                    ]);
                }
            }

            // Baskets: one per load, a second one for big loads. Completed orders handed theirs back.
            $kilos = 0;
            foreach ($plan['items'] as [$serviceId, $amount]) {
                if ($serviceId === self::WDF || $serviceId === self::WASH) {
                    $kilos += $amount;
                }
            }
            $done = $last['status'] === 6;
            // Laundry still in the shop takes one basket; a big load that was handed over may have used two.
            $basketCount = $done && ($kilos >= 7 || count($plan['items']) >= 3) ? 2 : 1;
            for ($b = 0; $b < $basketCount; $b++) {
                $basketId = $takeBasket($plan['receivedAt'], $b > 0);
                if ($basketId === null) {
                    break;
                }
                $busyUntil[$basketId] = $done ? $last['at'] : INF;
                $this->rows['order_baskets'][] = [
                    'order_id' => $id,
                    'basket_id' => $basketId,
                    'assigned_at' => $plan['receivedAt'],
                    'assigned_by' => $plan['by'],
                    'released_at' => $done ? $last['at'] : null,
                ];
                if (! $done) {
                    $this->rows['baskets'][$basketId]['status'] = 'in_use';
                }
            }

            // What the customer saw in their account for recent orders.
            if ($daysAgo <= 1) {
                foreach ($plan['steps'] as $index => $step) {
                    $notice = CustomerNotice::for($order['order_number'], self::STAGES[$step['status'] - 1]);
                    $this->rows['notifications'][] = [
                        'recipient_type' => 'customer',
                        'customer_id' => $plan['customer'],
                        'order_id' => $id,
                        'type' => $notice['type'],
                        'channel' => 'in_app',
                        'message' => $notice['message'],
                        'status' => 'recorded',
                        'sent_at' => $step['at'],
                        'read_at' => $index < count($plan['steps']) - 1 ? $step['at'] : null,
                    ];
                }
            }

            if ($plan['featured'] && $last['status'] === 5 && $daysAgo <= 4) {
                $this->rows['notifications'][] = [
                    'recipient_type' => 'staff',
                    'customer_id' => null,
                    'order_id' => $id,
                    'type' => 'ready_for_pickup',
                    'channel' => 'in_app',
                    'message' => "{$order['order_number']} is ready for pickup ({$customerNames[$plan['customer']]}).",
                    'status' => 'recorded',
                    'sent_at' => $last['at'],
                    'read_at' => null,
                ];
            }

            $paid = 0;
            foreach ($plan['payments'] as $payment) {
                $due = $total - $paid;
                $amount = match (true) {
                    $payment['amount'] === 'full', $payment['amount'] === 'rest' => $due,
                    $payment['amount'] === 'deposit' => min($due, max(5000, (int) floor(($total * $this->between(0.3, 0.6)) / 1000) * 1000)),
                    default => min($due, $payment['amount']),
                };
                if ($amount <= 0) {
                    continue;
                }
                $addPayment($order, $amount, $payment['method'], $payment['by'], $payment['at']);
                $paid += $amount;
            }

            // A completed order that had a mistaken payment voided, for the payment history screen.
            if (! $voidedDemoDone && $order['released_at'] !== null && $this->daysAgoOf($plan['receivedAt']) <= 6) {
                foreach ($this->rows['payments'] as $p => $row) {
                    if ($row['order_id'] !== $id) {
                        continue;
                    }
                    $voidedDemoDone = true;
                    $this->rows['payments'][$p]['voided_at'] = $last['at'];
                    $this->rows['payments'][$p]['voided_by'] = self::LIZA;
                    $this->rows['payments'][$p]['void_reason'] = 'Wrong amount keyed in at the counter';
                    $this->audit($last['at'], self::LIZA, 'payment.voided', 'payment', $row['id'], [
                        'order_number' => $order['order_number'],
                        'receipt_number' => $row['receipt_number'],
                        'reason' => 'Wrong amount keyed in at the counter',
                    ]);
                    // The replacement covers what the voided payment had paid.
                    $addPayment($order, $row['amount_cents'], 'cash', self::LIZA, $last['at']);
                    break;
                }
            }
        }

        $this->rows['order_sequences'] = [];
        foreach ($sequences as $key => $last) {
            $this->rows['order_sequences'][] = ['sequence_date' => '20'.substr($key, 0, 2).'-'.substr($key, 2, 2).'-'.substr($key, 4, 2), 'last_number' => $last];
        }
        $this->rows['receipt_last'] = $receiptSeq;

        $this->supplies();

        foreach ([['Detergent powder is critically low (2 kg left).', 40], ['Fabric conditioner is below its reorder level (3.5 L left).', 2 * 1440], ['Plastic laundry bags are below their reorder level (40 pcs left).', 1440]] as [$message, $minutes]) {
            $this->rows['notifications'][] = [
                'recipient_type' => 'staff', 'customer_id' => null, 'order_id' => null, 'type' => 'low_stock',
                'channel' => 'in_app', 'message' => $message, 'status' => 'recorded',
                'sent_at' => $this->nowMs - $minutes * self::MINUTE, 'read_at' => null,
            ];
        }

        $this->audit($this->nowMs - 2 * 24 * self::HOUR, self::LIZA, 'service.updated', 'service', self::IRONING, ['name' => 'Ironing', 'summary' => 'updated rate Ironing ₱12 → ₱15']);
        $this->audit($this->nowMs - 150 * self::MINUTE, self::LIZA, 'auth.login', 'user', self::LIZA, []);
        $this->audit($this->nowMs - 190 * self::MINUTE, self::KEVIN, 'auth.login', 'user', self::KEVIN, []);
        usort($this->rows['audit_logs'], fn ($a, $b) => $a['created_at'] <=> $b['created_at']);
    }

    private function openAccount(int $customerId, string $fullName, int|float $at): void
    {
        $this->rows['customer_accounts'][] = [
            'customer_id' => $customerId,
            'email' => CustomerNotice::demoEmail($fullName),
            'is_active' => true,
            'must_change_password' => false,
            'last_login_at' => null,
            'created_at' => $at,
        ];
    }

    /**
     * Supplies: daily use follows the laundry received, with restocks when an item runs low.
     * Worked backwards from today's levels (the figures in the mockups), so they land exactly.
     */
    private function supplies(): void
    {
        $kg = function (array $lines, int ...$services): float {
            $sum = 0.0;
            foreach ($lines as $line) {
                if (in_array($line['service'], $services, true)) {
                    $sum += $line['amount'];
                }
            }

            return $sum;
        };
        $supplies = [
            [1, fn ($l) => $kg($l, self::WDF, self::WASH) * 0.012, 2, 25, false],
            [2, fn ($l) => $kg($l, self::WDF) * 0.007, 3.5, 12, false],
            [3, fn ($l) => 1, 40, 300, true],
            [4, fn ($l) => $kg($l, self::COMFORTER) * 0.3 + $kg($l, self::WASH) * 0.004, 12, 10, false],
            [5, fn ($l) => $kg($l, self::WDF) * 0.0015, 6, 4, false],
            [6, fn ($l) => $kg($l, self::IRONING) * 0.5, 120, 150, true],
            [7, fn ($l) => 1 / 80, 9, 6, true],
            [8, fn ($l) => 0.3, 310, 500, true],
        ];

        $itemLines = [];
        foreach ($this->rows['order_items'] as $item) {
            $itemLines[$item['order_id']][] = ['service' => $item['service_id'], 'amount' => $item['weight_kg'] ?? $item['quantity'] ?? 0];
        }
        $linesByDay = [];
        foreach ($this->rows['orders'] as $order) {
            $linesByDay[T::day($order['received_at'])][] = $itemLines[$order['id']] ?? [];
        }
        $firstDay = T::addDays($this->today, -self::HISTORY_DAYS);
        $days = T::eachDay(['from' => $firstDay, 'to' => $this->today]);
        $reorders = array_column(ReferenceDataSeeder::INVENTORY_ITEMS, 3, 0);

        $moves = [];
        foreach ($supplies as [$item, $use, $target, $restock, $whole]) {
            $cap = $reorders[$item] + $restock;
            $round = fn (float $value) => $whole ? Js::round($value) : Js::round($value * 10) / 10;
            $usage = [];
            $carry = 0.0;
            foreach ($days as $day) {
                // seed.ts adds the carry after the day's sum; keep that order for identical floats.
                $raw = array_sum(array_map($use, $linesByDay[$day] ?? [])) + $carry;
                $used = $round($raw);
                $carry = $raw - $used;
                $usage[] = max(0, $used);
            }

            $level = $target;
            for ($index = count($days) - 1; $index >= 0; $index--) {
                $day = $days[$index];
                $used = $usage[$index];
                $daysAgo = self::HISTORY_DAYS - $index;
                $closing = $index === count($days) - 1 ? $this->nowMs - 40 * self::MINUTE : T::instant($day, 18, 45);
                if ($used > 0) {
                    $moves[] = ['item' => $item, 'type' => 'out', 'quantity' => $used, 'at' => $closing, 'by' => $this->staffOn($daysAgo), 'remarks' => 'Used today'];
                }
                $level = $round($level + $used);
                // Before this day the level was higher; a delivery explains it once it tops the shelf.
                while ($level > $cap && $index > 0) {
                    $moves[] = ['item' => $item, 'type' => 'in', 'quantity' => $restock, 'at' => T::instant($day, 9, 30), 'by' => self::LIZA, 'remarks' => 'Supplier delivery, Calapan'];
                    $level = $round($level - $restock);
                }
            }
            $moves[] = ['item' => $item, 'type' => 'in', 'quantity' => $level, 'at' => T::instant($firstDay, 7, 30), 'by' => self::LIZA, 'remarks' => 'Opening stock'];
        }

        usort($moves, fn ($a, $b) => ($a['at'] <=> $b['at']) ?: (($a['type'] === 'in' ? 0 : 1) <=> ($b['type'] === 'in' ? 0 : 1)));
        $names = array_column(ReferenceDataSeeder::INVENTORY_ITEMS, 1, 0);
        foreach ($moves as $move) {
            $this->rows['inventory_movements'][] = [
                'item_id' => $move['item'],
                'user_id' => $move['by'],
                'type' => $move['type'],
                'quantity' => $move['quantity'],
                'remarks' => $move['remarks'],
                'moved_at' => $move['at'],
            ];
            $this->audit($move['at'], $move['by'], 'inventory.movement', 'inventory_item', $move['item'], [
                'item_name' => $names[$move['item']],
                'type' => $move['type'],
                'quantity' => $move['quantity'],
                'remarks' => $move['remarks'],
            ]);
        }
    }

    // Writing ----------------------------------------------------------------------------------

    private function write(): void
    {
        $customerPassword = Hash::make('password123');
        $dt = fn ($ms) => $ms === null ? null : $this->dt($ms);

        DB::transaction(function () use ($customerPassword, $dt) {
            $this->insert('customers', array_map(fn ($c) => ['created_at' => $dt($c['created_at']), 'updated_at' => $dt($c['created_at'])] + $c, $this->rows['customers']));
            $this->insert('customer_accounts', array_map(fn ($a) => [
                'password' => $customerPassword,
                'created_at' => $dt($a['created_at']),
                'updated_at' => $dt($a['created_at']),
            ] + $a, $this->rows['customer_accounts']));
            $this->insert('baskets', array_map(fn ($b) => ['created_at' => $dt($b['created_at']), 'updated_at' => $dt($b['created_at'])] + $b, array_values($this->rows['baskets'])));
            $this->insert('orders', array_map(fn ($o) => [
                'received_at' => $dt($o['received_at']),
                'promised_at' => $dt($o['promised_at']),
                'released_at' => $dt($o['released_at']),
                'created_at' => $dt($o['created_at']),
                'updated_at' => $dt($o['updated_at']),
            ] + $o, $this->rows['orders']));
            $this->insert('order_items', $this->rows['order_items']);
            $this->insert('order_status_history', array_map(fn ($h) => ['changed_at' => $dt($h['changed_at'])] + $h, $this->rows['order_status_history']));
            $this->insert('order_baskets', array_map(fn ($b) => ['assigned_at' => $dt($b['assigned_at']), 'released_at' => $dt($b['released_at'])] + $b, $this->rows['order_baskets']));
            $this->insert('payments', array_map(fn ($p) => ['paid_at' => $dt($p['paid_at']), 'voided_at' => $dt($p['voided_at'])] + $p, $this->rows['payments']));
            $this->insert('inventory_movements', array_map(fn ($m) => ['moved_at' => $dt($m['moved_at'])] + $m, $this->rows['inventory_movements']));
            $this->insert('notifications', array_map(fn ($n) => ['sent_at' => $dt($n['sent_at']), 'read_at' => $dt($n['read_at'])] + $n, $this->rows['notifications']));
            $this->insert('audit_logs', array_map(fn ($l) => ['created_at' => $dt($l['created_at'])] + $l, $this->rows['audit_logs']));
            $this->insert('order_sequences', $this->rows['order_sequences']);
            DB::table('receipt_sequences')->where('id', 1)->update(['last_number' => $this->rows['receipt_last']]);
        });
    }

    private function insert(string $table, array $rows): void
    {
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table($table)->insert($chunk);
        }
    }
}
