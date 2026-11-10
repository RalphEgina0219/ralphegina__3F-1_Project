import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { PasswordForm } from '@/features/portal/components/ChangePasswordForm';
import { PortalAuthShell } from '@/features/portal/components/PortalAuthShell';
import { useChangeStaffPassword, useLogout } from '../api';
import { useCurrentUser } from '../store';

/**
 * The staff counterpart of the customer's forced password page, built from the same frame and form.
 * After the owner resets a password, RequireAuth sends every route here until a new one is saved;
 * otherwise it is the voluntary "Change password" page from the account menu.
 */
export default function StaffPasswordPage() {
  const user = useCurrentUser();
  const forced = user.must_change_password;
  useDocumentTitle(forced ? 'Choose your password' : 'Change password');
  const navigate = useNavigate();
  const change = useChangeStaffPassword();
  const logout = useLogout();

  return (
    <PortalAuthShell
      homeTo="/"
      tagline="Staff"
      title={forced ? 'Choose your own password' : 'Change password'}
      subtitle={
        forced
          ? `Welcome, ${user.name}. The shop owner reset your password. Replace the temporary one to continue.`
          : `Signed in as ${user.name} (${user.username}).`
      }
      footer={
        <>
          {!forced && (
            <ButtonLink to="/" variant="ghost">
              Back to the app
            </ButtonLink>
          )}
          <Button
            variant="ghost"
            loading={logout.isPending}
            needsNetwork={false}
            onClick={() =>
              logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })
            }
          >
            Sign out
          </Button>
        </>
      }
    >
      <PasswordForm
        change={change}
        currentLabel={forced ? 'Temporary password' : 'Current password'}
        submitLabel={forced ? 'Save my password' : 'Change password'}
        onDone={() => {
          toast.success(forced ? 'Password saved' : 'Password changed');
          navigate('/', { replace: true });
        }}
      />
    </PortalAuthShell>
  );
}
