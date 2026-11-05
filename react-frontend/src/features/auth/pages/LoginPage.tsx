import { zodResolver } from '@hookform/resolvers/zod';
import { Info, WashingMachine } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, ButtonLink, linkClass } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { applyFieldErrors, errorMessage, safeNext } from '@/lib/api';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { useLogin } from '../api';
import { useAuthStore } from '../store';

export default function LoginPage() {
  useDocumentTitle('Sign in');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', remember: false },
  });

  const next = safeNext(params.get('next'));
  if (status === 'authenticated') return <Navigate to={next} replace />;

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    login.mutate(values, {
      onSuccess: () => navigate(next, { replace: true }),
      onError: (error) => {
        if (!applyFieldErrors(error, setError)) setFormError(errorMessage(error));
      },
    });
  });

  const forgotButton = (
    <button
      type="button"
      className={`${linkClass} -my-3 text-[13px]`}
      onClick={() => setForgotOpen(true)}
    >
      Forgot password?
    </button>
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6 lg:justify-center lg:py-10">
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] lg:text-[28px]">
        <span className="lg:hidden">Staff sign in</span>
        <span className="hidden lg:inline">Sign in</span>
      </h1>
      <p className="mt-0.5 mb-5 hidden text-[15px] text-muted lg:block">
        For shop owner and laundry staff.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4 lg:mt-0">
        {formError && (
          <p
            role="alert"
            className="rounded-control bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
          >
            {formError}
          </p>
        )}
        <Field label="Username" error={errors.username?.message}>
          {(control) => (
            <Input
              {...control}
              {...register('username')}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className="min-h-12"
            />
          )}
        </Field>
        <Field
          label={
            <span className="flex items-center justify-between">
              Password
              <span className="hidden lg:inline">{forgotButton}</span>
            </span>
          }
          error={errors.password?.message}
        >
          {(control) => (
            <Input
              {...control}
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className="min-h-12"
            />
          )}
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <Checkbox {...register('remember')} label="Keep me signed in on this device" />
          <span className="lg:hidden">{forgotButton}</span>
        </div>
        <Button type="submit" size="lg" className="min-h-12 w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-4 flex gap-2 rounded-control border border-flow-line bg-flow-soft p-3 text-[13px]">
          <Info className="mt-0.5 size-4 shrink-0 text-flow" aria-hidden="true" />
          <p>
            <strong>Demo accounts</strong> (development only):{' '}
            <code className="font-mono">liza.ramos</code> (admin),{' '}
            <code className="font-mono">kevin.m</code> or <code className="font-mono">aira.d</code>{' '}
            (staff). Password <code className="font-mono">password123</code>.
          </p>
        </div>
      )}

      {/* Desktop: divider with a button. Phone: a card at the bottom of the screen. */}
      <div className="mt-5 hidden lg:block">
        <div className="flex items-center gap-3 text-[13px] text-muted">
          <span className="h-px flex-1 bg-line" />
          Customer?
          <span className="h-px flex-1 bg-line" />
        </div>
        <ButtonLink
          to="/my/login"
          className="mt-3 w-full"
          icon={<WashingMachine className="size-4" aria-hidden="true" />}
        >
          Customer sign in
        </ButtonLink>
        <p className="mt-3 text-center text-xs text-muted">
          Follow your laundry in your own account. New here?{' '}
          <Link to="/register" className="font-semibold text-flow underline">
            Create an account
          </Link>
        </p>
      </div>
      <div className="mt-auto pt-6 lg:hidden">
        <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
          <WashingMachine className="size-7 shrink-0 text-flow" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Customer?</p>
            <p className="text-[13px] text-muted">Follow your laundry in your own account.</p>
          </div>
          <Link to="/my/login" className={`${linkClass} px-1`}>
            Sign in
          </Link>
        </div>
      </div>

      <Dialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        title="Forgot your password?"
        description="Passwords are managed by the shop owner. Ask the owner to reset yours under Settings, Users & roles. You will get a temporary password to sign in with."
        footer={<Button onClick={() => setForgotOpen(false)}>Got it</Button>}
      />
    </div>
  );
}
