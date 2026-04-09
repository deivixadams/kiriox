import styles from './ProcessRegistryPage.module.css';

export default function ProcessRegistryPage() {
  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Registro de Procesos</h1>
        <p className={styles.subtitle}>Gestiona procesos clave y responsables por operación.</p>
      </div>
      <div className={styles.card}>Configuración pendiente de conexión.</div>
    </div>
  );
}
