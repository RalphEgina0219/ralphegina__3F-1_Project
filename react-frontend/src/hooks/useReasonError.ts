import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { errorMessage, fieldError } from '@/lib/api';

/**
 * For a ConfirmDialog with a reason: a 422 on the reason (or a status move's note) appears under
 * the field; any other failure is a toast with the API's message.
 */
export function useReasonError() {
  const [reasonError, setReasonError] = useState<string | null>(null);
  const onError = useCallback((error: unknown) => {
    const message = fieldError(error, ['reason', 'note']);
    if (message) setReasonError(message);
    else toast.error(errorMessage(error));
  }, []);
  const clear = useCallback(() => setReasonError(null), []);
  return { reasonError, onError, clear };
}
