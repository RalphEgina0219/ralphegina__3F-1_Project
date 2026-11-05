import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { useCustomerLogout } from '../api';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { PortalAuthShell } from '../components/PortalAuthShell';
import { useSignedInCustomer } from '../store';

/** After a temporary password from the shop: nothing else opens until the customer picks their own. */
export default function ForcePasswordPage() {
  useDocumentTitle('Choose your password');
  const navigate = useNavigate();
  const customer = useSignedInCustomer();
  const logout = useCustomerLogout();

  return (
    <PortalAuthShell
      title="Choose your own password"
      subtitle={`Welcome, ${customer.full_name}. Replace the temporary password the shop gave you.`}
      footer={
        <Button
          variant="ghost"
          loading={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSettled: () => navigate('/my/login', { replace: true }),
            })
          }
        >
          Sign out
        </Button>
      }
    >
      <ChangePasswordForm
        currentLabel="Temporary password"
        submitLabel="Save my password"
        onDone={() => {
          toast.success('Password saved');
          navigate('/my', { replace: true });
        }}
      />
    </PortalAuthShell>
  );
}
