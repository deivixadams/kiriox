import styles from './MacroprocessRegistryPage.module.css';

export default function MacroprocessRegistryPage() {
  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Registro de Macroprocesos</h1>
        <p className={styles.subtitle}>Define los macroprocesos y su alcance operacional.</p>
      </div>
      <div className={styles.card}>Configuración pendiente de conexión.</div>
    </div>
  );
}
