import styles from './ObjectiveRegistryPage.module.css';

export default function ObjectiveRegistryPage() {
  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Registro de Objetivos</h1>
        <p className={styles.subtitle}>Define objetivos de negocio y su trazabilidad hacia procesos.</p>
      </div>
      <div className={styles.card}>Configuración pendiente de conexión.</div>
    </div>
  );
}
