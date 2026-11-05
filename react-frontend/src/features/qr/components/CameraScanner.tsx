import { Scanner, type IScannerHandle, type IScannerError } from '@yudiel/react-qr-scanner';
import { Camera, CameraOff, Lock, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { CameraState } from '../types';

/**
 * The library's defaults demand a height of at least 640 px, which rejects 480p webcams outright.
 * Asking for an "ideal" size lets any camera work, and the rear camera is preferred, not required.
 */
const CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

interface TorchTrack extends MediaStreamTrack {
  getCapabilities(): MediaTrackCapabilities & { torch?: boolean };
}

function Bracket({ className }: { className: string }) {
  return (
    <span aria-hidden="true" className={cn('absolute size-12 border-aqua md:size-10', className)} />
  );
}

function Message({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center text-on-ink">
      <span className="mb-3 text-aqua">{icon}</span>
      <p className="font-bold">{title}</p>
      {children && <div className="mt-1 max-w-xs text-[13px] text-on-ink-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface CameraScannerProps {
  onDetected: (text: string) => void;
  paused: boolean;
  /** Reports the torch controls so that the phone header can show them. */
  onTorchChange?: (torch: { supported: boolean; on: boolean; toggle: () => void }) => void;
  /** Start the camera without the extra "Turn on camera" tap, for when the user already asked to scan. */
  autoStart?: boolean;
}

export function CameraScanner({
  onDetected,
  paused,
  onTorchChange,
  autoStart = false,
}: CameraScannerProps) {
  const [state, setState] = useState<CameraState>('idle');
  const handle = useRef<IScannerHandle>(null);
  const torchOn = useRef(false);

  const reportTorch = useCallback(() => {
    const track = handle.current?.getStream()?.getVideoTracks()[0] as TorchTrack | undefined;
    const supported = Boolean(track?.getCapabilities?.().torch);
    onTorchChange?.({
      supported,
      on: torchOn.current,
      toggle: () => {
        const next = !torchOn.current;
        void track
          ?.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
          .then(() => {
            torchOn.current = next;
            reportTorch();
          });
      },
    });
  }, [onTorchChange]);

  // Start straight away only when the browser has already been given camera access.
  useEffect(() => {
    if (!window.isSecureContext) {
      setState('insecure');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('no-camera');
      return;
    }
    // A blocked camera still ends in the "denied" message, through the scanner's error callback.
    if (autoStart) {
      setState('starting');
      return;
    }
    let cancelled = false;
    navigator.permissions
      ?.query({ name: 'camera' as PermissionName })
      .then((status) => {
        if (cancelled) return;
        if (status.state === 'granted') setState('starting');
        if (status.state === 'denied') setState('denied');
      })
      .catch(() => {
        // Some browsers cannot query camera permission: the Turn on camera button still works.
      });
    return () => {
      cancelled = true;
    };
  }, [autoStart]);

  // The library has no "started" callback, so watch for the stream to appear.
  useEffect(() => {
    if (state !== 'starting') return;
    const timer = window.setInterval(() => {
      if (handle.current?.getStream()) {
        setState('on');
        reportTorch();
      }
    }, 300);
    return () => window.clearInterval(timer);
  }, [state, reportTorch]);

  const onError = (error: IScannerError) => {
    if (error.kind === 'permission-denied') setState('denied');
    else if (error.kind === 'no-camera' || error.kind === 'unsupported') setState('no-camera');
    else if (error.kind === 'insecure-context') setState('insecure');
    else setState('error');
  };

  const live = state === 'starting' || state === 'on';

  return (
    <div className="relative aspect-square overflow-hidden rounded-card bg-ink md:aspect-4/3">
      {live && (
        <Scanner
          ref={handle}
          onScan={(codes) => {
            const text = codes[0]?.rawValue;
            if (text) onDetected(text);
          }}

          onError={onError}
          paused={paused}
          formats={['qr_code']}
          constraints={CONSTRAINTS}
          sound={false}
          startTimeoutMs={10000}
          components={{ finder: false, torch: false, onOff: false, zoom: false }}
          styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
        />
      )}

      {state === 'idle' && (
        <Message
          icon={<Camera className="size-9" aria-hidden="true" />}
          title="Scan the QR on a basket label"
          action={
            <Button size="lg" onClick={() => setState('starting')}>
              Turn on camera
            </Button>
          }
        >
          Your browser will ask for permission to use the camera.
        </Message>
      )}
      {state === 'denied' && (
        <Message
          icon={<Lock className="size-9" aria-hidden="true" />}
          title="Camera access is blocked"
        >
          Open your browser&apos;s site settings (the icon beside the address bar), allow the
          camera, then reload this page. You can also type the order number.
        </Message>
      )}
      {state === 'no-camera' && (
        <Message icon={<CameraOff className="size-9" aria-hidden="true" />} title="No camera found">
          This device has no camera the browser can use. Type the order number instead.
        </Message>
      )}
      {state === 'insecure' && (
        <Message
          icon={<Lock className="size-9" aria-hidden="true" />}
          title="The camera needs a secure connection"
        >
          Browsers only allow the camera on HTTPS or localhost. Type the order number instead.
        </Message>
      )}
      {state === 'error' && (
        <Message
          icon={<TriangleAlert className="size-9" aria-hidden="true" />}
          title="The camera could not start"
          action={
            <Button variant="secondary" onClick={() => setState('starting')}>
              Try again
            </Button>
          }
        >
          It may be in use by another app. Close that app and try again.
        </Message>
      )}

      {live && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <span
            className="absolute top-3 left-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-aqua"
            aria-live="polite"
          >
            {state === 'on' ? 'Camera on · Rear' : 'Starting camera…'}
          </span>
          <div className="absolute inset-x-[16%] top-[12%] bottom-[16%]">
            <Bracket className="top-0 left-0 rounded-tl-xl border-t-4 border-l-4" />
            <Bracket className="top-0 right-0 rounded-tr-xl border-t-4 border-r-4" />
            <Bracket className="bottom-0 left-0 rounded-bl-xl border-b-4 border-l-4" />
            <Bracket className="right-0 bottom-0 rounded-br-xl border-r-4 border-b-4" />
            {!paused && (
              <span className="scan-line absolute inset-x-[8%] h-0.5 animate-scan-line rounded-full bg-aqua shadow-[0_0_14px_var(--color-aqua)]" />
            )}
          </div>
          <p className="absolute inset-x-0 bottom-2.5 text-center text-[13px] text-on-ink">
            Point the camera at the QR on the basket label
          </p>
        </div>
      )}
    </div>
  );
}
