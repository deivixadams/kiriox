import Link from 'next/link';
import { X } from 'lucide-react';
import styles from './GovernanceCloseButton.module.css';

type GovernanceCloseButtonProps = {
  href?: string;
  ariaLabel?: string;
  variant?: 'default' | 'icon';
};

export function GovernanceCloseButton({
  href = '/score/dashboard',
  ariaLabel = 'Cerrar y volver al dashboard',
  variant = 'default',
}: GovernanceCloseButtonProps) {
  const className = variant === 'icon' ? `${styles.closeButton} ${styles.closeButtonIcon}` : styles.closeButton;

  return (
    <div className={styles.closeRow}>
      <Link href={href} className={className} aria-label={ariaLabel} title="Cerrar">
        <X size={variant === 'icon' ? 22 : 16} />
        {variant !== 'icon' && <span>Cerrar</span>}
      </Link>
    </div>
  );
}
