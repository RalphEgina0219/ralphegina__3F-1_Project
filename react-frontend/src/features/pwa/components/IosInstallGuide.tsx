import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useBranding } from '@/features/branding/BrandingProvider';

/** Safari's Share icon: a box with an arrow leaving it. */
function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
      <path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" />
    </svg>
  );
}

/** The Add to Home Screen icon: a plus in a rounded square. */
function AddIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

/** iPhone and iPad have no install prompt: this sheet shows the taps instead. */
export function IosInstallGuide({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const branding = useBranding();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Install ${branding.system_name}`}
      description="Tap Share, then Add to Home Screen."
      footer={<Button onClick={() => onOpenChange(false)}>Got it</Button>}
    >
      <ol className="space-y-3">
        <li className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-flow-soft text-flow-text">
            <ShareIcon />
          </span>
          <span className="text-[15px]">
            Tap <strong>Share</strong> in Safari&apos;s toolbar.
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-flow-soft text-flow-text">
            <AddIcon />
          </span>
          <span className="text-[15px]">
            Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
          </span>
        </li>
      </ol>
      <p className="mt-4 text-[13px] text-muted">
        {branding.system_name} then opens from its own icon, full screen, like any other app.
      </p>
    </Dialog>
  );
}
