import { useState, type ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';
import { Dialog } from './Dialog';
import { Field } from './Field';
import { Textarea } from './Textarea';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  variant?: ButtonVariant;
  loading?: boolean;
  /** Adds a required text input and passes its value to onConfirm. */
  reasonLabel?: string;
  /** The server's 422 message for the reason, shown under it. */
  reasonError?: string | null;
  onConfirm: (reason: string) => void;
}

/** The API's limit for reasons and notes (max:255). */
const REASON_MAX = 255;

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  variant = 'primary',
  loading,
  reasonLabel,
  reasonError,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const missing = Boolean(reasonLabel) && !reason.trim();

  const close = (next: boolean) => {
    if (!next) {
      setReason('');
      setTouched(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            variant={variant}
            loading={loading}
            onClick={() => {
              setTouched(true);
              if (!missing) onConfirm(reason.trim());
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {reasonLabel ? (
        <Field
          label={reasonLabel}
          required
          error={touched && missing ? 'A reason is required.' : (reasonError ?? undefined)}
        >
          {(control) => (
            <Textarea
              {...control}
              maxLength={REASON_MAX}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          )}
        </Field>
      ) : null}
    </Dialog>
  );
}
