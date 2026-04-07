import MonteCarloHeader from '@/modules/monte-carlo/ui/components/MonteCarloHeader';
import MonteCarloKpis from '@/modules/monte-carlo/ui/components/MonteCarloKpis';
import MonteCarloGraphView from '@/modules/monte-carlo/ui/components/MonteCarloGraphView';
import MonteCarloProfilePanel from '@/modules/monte-carlo/ui/components/MonteCarloProfilePanel';
import MonteCarloNodeInspector from '@/modules/monte-carlo/ui/components/MonteCarloNodeInspector';
import styles from './MonteCarloPage.module.css';

export const metadata = {
  title: 'KIRIOX | Monte Carlo Simulation',
  description: 'Advanced structural risk and fragility analysis with probabilistic simulations.',
};

export default function MonteCarloPage() {
  return (
    <main className={styles.container}>
      <MonteCarloHeader />
      
      <MonteCarloKpis />

      <div className={styles.mainLayout}>
        <div className={styles.leftColumn}>
          <MonteCarloGraphView />
          <MonteCarloProfilePanel />
        </div>

        <aside className={styles.sidePanel}>
          <MonteCarloNodeInspector />
          
          <div className={`glass-card ${styles.notePanel}`}>
            <p><strong>Nota:</strong> Los resultados de Monte Carlo V1 son indicativos de fragilidad estructural y no reemplazan los scores determinísticos oficiales de cumplimiento.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
