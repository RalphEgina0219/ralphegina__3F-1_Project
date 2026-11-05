import { Copy } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Mono } from './Mono';

export interface TemporaryPassword {
  name: string;
  password: string;
  /** Extra guidance under the password, such as where the person signs in. */
  note?: ReactNode;
}

/** Shows a temporary password once, with a copy button. Only its hash is kept on the server. */
export function TemporaryPasswordDialog({
  value,
  onClose,
}: {
  value: TemporaryPassword | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={Boolean(value)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Temporary password"
      description={`Give this to ${value?.name}. It is shown only once.`}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="flex items-center justify-between gap-3 rounded-control bg-foam p-3">
        <Mono className="text-lg break-all">{value?.password}</Mono>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Copy password"
          onClick={() => {
            void navigator.clipboard
              .writeText(value?.password ?? '')
              .then(() => toast.success('Copied'))
              .catch(() => toast.error('Could not copy on this browser'));
          }}
        >
          <Copy className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {value?.note && <div className="mt-3 text-sm text-muted">{value.note}</div>}
    </Dialog>
  );
}
