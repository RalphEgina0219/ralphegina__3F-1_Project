<?php

namespace App\Console\Commands;

use App\Models\ShopSetting;
use App\Support\Branding;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

/**
 * First-time setup of a shop's own LaundryFlow (docs/NEW_SHOP_SETUP.md): its system name and shop
 * name, and the reminder to finish the branding in Settings > Branding & Appearance. One shop is one
 * deployment: its own domain, database and admin. Safe to run again: it only changes the two names.
 */
#[Signature('laundryflow:install {--system-name= : The name shown in the sidebar, the login page and the browser tab} {--shop-name= : The shop\'s own name, printed on order summaries and labels}')]
#[Description('Name this shop\'s LaundryFlow (system name and shop name) and link the public storage folder')]
class InstallShop extends Command
{
    public function handle(): int
    {
        $settings = ShopSetting::query()->find(1);
        if (! $settings) {
            $this->error('There is no shop profile yet. Run: php artisan db:seed --class=ReferenceDataSeeder --force (on a new, empty database only).');

            return self::FAILURE;
        }

        $system = trim((string) ($this->option('system-name') ?: $this->ask('System name (shown in the sidebar, login page and browser tab)', $settings->system_name)));
        $shop = trim((string) ($this->option('shop-name') ?: $this->ask('Shop name (printed on order summaries and basket labels)', $settings->name)));
        if ($system === '' || mb_strlen($system) > 60 || $shop === '' || mb_strlen($shop) > 255) {
            $this->error('Both names are needed (the system name is at most 60 characters).');

            return self::FAILURE;
        }

        $settings->update([
            'system_name' => $system,
            // The home-screen label is at most 12 characters.
            'short_name' => mb_substr($system, 0, 12),
            'name' => $shop,
        ]);
        Branding::flush();

        try {
            Artisan::call('storage:link');
            $this->line(trim(Artisan::output()));
        } catch (\Throwable $e) {
            $this->warn('Could not link the storage folder ('.$e->getMessage().'). Logos are still served by Laravel itself.');
        }

        $this->info("Done: \"{$system}\" for {$shop}.");
        $this->line('Next, sign in as the owner and finish in Settings > Branding & Appearance: logo, colors, shop details, labels and payment methods.');

        return self::SUCCESS;
    }
}
