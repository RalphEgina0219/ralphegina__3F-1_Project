import { toast } from 'sonner';
import { create } from 'zustand';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { isIos } from '@/lib/platform';
import { brandName } from '@/features/branding/branding';

/** Chrome, Edge and Samsung Internet hand the page this event when the app can be installed. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
}

interface InstallState {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
}

export const useInstallStore = create<InstallState>(() => ({ deferred: null, installed: false }));

let listening = false;

/**
 * Called once from main.tsx before anything renders: the event can fire very early, and a
 * component that mounts later would miss it.
 */
export function listenForInstallPrompt() {
  if (listening) return;
  listening = true;
  window.addEventListener('beforeinstallprompt', (event) => {
    // Our own "Install app" button replaces the browser's mini bar.
    event.preventDefault();
    useInstallStore.setState({ deferred: event as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => {
    useInstallStore.setState({ deferred: null, installed: true });
    toast.success(`${brandName()} is installed`, {
      description: 'Open it from your home screen or app list.',
    });
  });
}

export interface InstallPrompt {
  /** The browser offered installation: promptInstall() opens its dialog. */
  canInstall: boolean;
  /** iPhone or iPad, not installed yet: show the Share › Add to Home Screen guide. */
  needsIosGuide: boolean;
  /** Either of the two: an "Install app" entry is worth showing. */
  available: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

export function useInstallPrompt(): InstallPrompt {
  const { standalone } = useDisplayMode();
  const deferred = useInstallStore((state) => state.deferred);
  const installed = useInstallStore((state) => state.installed);
  const canInstall = !standalone && !installed && deferred !== null;
  const needsIosGuide = !standalone && !installed && !canInstall && isIos();

  const promptInstall = async () => {
    if (!deferred) return 'unavailable' as const;
    // The event works once: forget it whatever the person chooses.
    useInstallStore.setState({ deferred: null });
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    return outcome;
  };

  return { canInstall, needsIosGuide, available: canInstall || needsIosGuide, promptInstall };
}
