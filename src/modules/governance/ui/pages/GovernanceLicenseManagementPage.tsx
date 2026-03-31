import { getAuthContext } from '@/lib/auth-server';
import { LicenseManagementPanel } from '@/modules/governance/ui/components/LicenseManagementPanel';

const ADMIN_ROLE_CODES = new Set(['ADMIN', 'company_admin', 'COMPANY_ADMIN']);

export default async function GovernanceLicenseManagementPage() {
  const auth = await getAuthContext();

  if (!auth || !ADMIN_ROLE_CODES.has(auth.roleCode)) {
    return (
      <section style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '12px' }}>
        <h1 style={{ marginTop: 0 }}>Acceso restringido</h1>
        <p style={{ marginBottom: 0 }}>
          Esta pantalla de License Management está disponible únicamente para usuarios administradores.
        </p>
      </section>
    );
  }

  return <LicenseManagementPanel />;
}
