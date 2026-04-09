import type { NavigationItem } from './navigation.types';

export const NAVIGATION_CONFIG: NavigationItem[] = [
  {
    key: 'risk',
    label: 'Riesgo',
    href: '/dashboard/riesgo',
    icon: 'ShieldAlert',
    module: 'core',
    order: 10,
  },
  {
    key: 'alerts',
    label: 'Alertas de riesgo',
    href: '/score/alertas',
    icon: 'Bell',
    module: 'alerts',
    permission: 'alerts.read',
    order: 40,
  },
  {
    key: 'audit',
    label: 'Auditoría',
    href: '/validacion/riesgo-lineal',
    icon: 'ClipboardCheck',
    module: 'audit',
    permission: 'audit.read',
    order: 20,
    disabled: true,
  },
  {
    key: 'simulation',
    label: 'Simulación',
    href: '/dashboard/simulacion',
    icon: 'FlaskConical',
    module: 'simulation',
    permission: 'simulation.read',
    order: 30,
  },
  {
    key: 'governance',
    label: 'Gobierno',
    href: '/dashboard/gobierno',
    icon: 'Scale',
    module: 'governance',
    order: 50,
  },
];
