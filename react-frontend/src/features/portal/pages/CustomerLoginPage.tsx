import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, linkClass } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { InstallAppButton } from '@/features/pwa/components/InstallAppButton';
import { applyFieldErrors, errorMessage, errorStatus, safeNext } from '@/lib/api';
import { customerLoginSchema, type CustomerLoginForm } from '@/schemas/portal';
import { useCustomerLogin } from '../api';
import { PortalAuthShell } from '../components/PortalAuthShell';
import { bootstrapCustomer, useCustomerAuth } from '../store';

/** /my/login. Its own page and its own session: nothing here touches the staff /login. */
export default function CustomerLoginPage() {
  useDocumentTitle('Sign in to follow your laundry');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const customer = useCustomerAuth((state) => state.customer);
  const login = useCustomerLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CustomerLoginForm>({
    resolver: zodResolver(customerLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    void bootstrapCustomer();
  }, []);

  const next = safeNext(params.get('next'), '/my');
  if (customer && !login.isPending) return <Navigate to={next} replace />;

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    login.mutate(values, {
      // A temporary password leads to the change-password page first (RequireCustomer).
      onSuccess: () => navigate(next, { replace: true }),
      onError: (error) => {
        if (errorStatus(error) === 429) setFormError(errorMessage(error));
        else if (!applyFieldErrors(error, setError)) setFormError(errorMessage(error));
      },
    });
  });

  return (
    <PortalAuthShell
      title="Follow your laundry"
      subtitle="Sign in to see your orders, their status and your order summaries."
      footer={
        <>
          <p>
            New customer?{' '}
            <Link to="/register" className={linkClass}>
              Create an account
            </Link>
          </p>
          <p className="text-[13px] text-muted">
            Shop staff?{' '}
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center font-semibold text-flow-text underline"
            >
              Staff sign in
            </Link>
          </p>
          <InstallAppButton variant="link" />
        </>
      }
    >
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
        {formError && (
          <p
            role="alert"
            className="rounded-control bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
          >
            {formError}
          </p>
        )}
        <Field label="Email" error={errors.email?.message}>
          {(field) => (
            <Input
              {...field}
              {...register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              className="min-h-12"
            />
          )}
        </Field>
        <Field label="Password" error={errors.password?.message}>
          {(field) => (
            <Input
              {...field}
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className="min-h-12"
            />
          )}
        </Field>
        <div className="-mt-2 text-right">
          <button
            type="button"
            className={`${linkClass} text-[13px]`}
            onClick={() => setForgotOpen(true)}
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" size="lg" className="min-h-12 w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>

      {import.meta.env.DEV && (
        <p className="mt-4 rounded-control border border-flow-line bg-flow-soft p-3 text-[13px]">
          <strong>Demo</strong> (development only):{' '}
          <code className="font-mono">maria.santos@example.com</code>, password{' '}
          <code className="font-mono">password123</code>.
        </p>
      )}

      <Dialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        title="Forgot your password?"
        description="Ask the shop to reset your password. They will give you a temporary one, and you choose a new password when you sign in with it."
        footer={<Button onClick={() => setForgotOpen(false)}>Got it</Button>}
      />
    </PortalAuthShell>
  );
}
