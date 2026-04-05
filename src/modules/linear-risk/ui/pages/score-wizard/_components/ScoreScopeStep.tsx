
import React, { useMemo } from 'react';
import { CheckSquare, FilterX } from 'lucide-react';
import styles from './ScoreScopeStep.module.css';

type SelectionItem = {
  id: string;
  code: string;
  title?: string;
  name?: string;
  description?: string;
  score: number;
  rank: number;
  reasons: string[];
};

type SelectionPayload = {
  obligations: SelectionItem[];
  risks: SelectionItem[];
  controls: SelectionItem[];
  tests: SelectionItem[];
};

type Props = {
  selection: SelectionPayload | null;
  selectionLoading: boolean;
  selectionError: string | null;
  scopeMode: 'top20' | 'all' | null;
  onSelectTop20: () => void;
  onSelectAll: () => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

export default function ScoreScopeStep({
  selection,
  selectionLoading,
  selectionError,
  scopeMode,
  onSelectTop20,
  onSelectAll,
  onBack,
  onNext,
  onSave,
}: Props) {
  const counts = useMemo(() => ({
    obligations: selection?.obligations.length ?? 0,
    risks: selection?.risks.length ?? 0,
    controls: selection?.controls.length ?? 0,
    tests: selection?.tests.length ?? 0,
  }), [selection]);

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.cardTitleSimple}>Seleccion critica</div>
        <div className={styles.helperText}>
          Aplicamos pareto al grafo para escoger el top 20 que representan entre el 80% y 90% de los aspectos de riesgo clave.
        </div>
        <div className={styles.tableActions}>
          <button type="button" className={styles.primaryButton} onClick={onSelectTop20} disabled={selectionLoading}>
            Evaluar núcleo crítico
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionGhost}`}
            onClick={onSelectAll}
            disabled={selectionLoading}
          >
            <CheckSquare size={14} /> Evaluar Todo
          </button>
          <span className={styles.countPill}>{scopeMode === 'all' ? 'TOTAL' : 'TOP 20'}</span>
        </div>
        {selectionLoading && (
          <div className={styles.helperText}>Calculando seleccion...</div>
        )}
        {selectionError && (
          <div className={styles.helperText}>{selectionError}</div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleSimple}>Obligaciones</div>
            <span className={styles.countPill}>{counts.obligations} total</span>
          </div>
          <div className={styles.scrollList}>
            {!selection && <div className={styles.helperText}>Sin obligaciones seleccionadas.</div>}
            {selection?.obligations.map((item) => (
              <label key={item.id} className={styles.optionRow}>
                <input type="checkbox" checked readOnly disabled />
                {item.title || item.code}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleSimple}>Controles</div>
            <span className={styles.countPill}>{counts.controls} total</span>
          </div>
          <div className={styles.scrollList}>
            {!selection && <div className={styles.helperText}>Sin controles seleccionados.</div>}
            {selection?.controls.map((item) => (
              <label key={item.id} className={styles.optionRow}>
                <input type="checkbox" checked readOnly disabled />
                <span>
                  <div className={styles.riskTitle}>{item.name || item.title || item.code}</div>
                  <div className={styles.riskSubtitle}>{item.description || '—'}</div>
                </span>
              </label>
            ))}
          </div>
        </div>

      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <div className={styles.tableTitle}>Riesgos</div>
            <div className={styles.tableSubtitle}>Riesgos aplicables por obligaciones seleccionadas.</div>
          </div>
          <div className={styles.tableActions}>
            <span className={styles.countPill}>{counts.risks} total</span>
            <button className={styles.actionButton} disabled>
              <CheckSquare size={14} /> Seleccionar todo
            </button>
            <button className={`${styles.actionButton} ${styles.actionGhost}`} disabled>
              <FilterX size={14} /> Limpiar seleccion
            </button>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>
                  <input type="checkbox" checked readOnly className={styles.checkbox} />
                </th>
                <th className={styles.th}>Codigo</th>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Descripcion</th>
                <th className={styles.th}>Score</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {selectionLoading && (
                <tr className={styles.emptyRow}>
                  <td colSpan={5}>Calculando seleccion...</td>
                </tr>
              )}
              {!selection && !selectionLoading && (
                <tr className={styles.emptyRow}>
                  <td colSpan={5}>Ejecuta la seleccion para cargar resultados.</td>
                </tr>
              )}
              {selection && selection.risks.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={5}>Sin riesgos seleccionados.</td>
                </tr>
              )}
              {selection?.risks.map((risk) => (
                <tr key={risk.id} className={styles.trSelected}>
                  <td className={styles.td}>
                    <input type="checkbox" checked readOnly className={styles.checkbox} />
                  </td>
                  <td className={styles.tdMuted}>{risk.code}</td>
                  <td className={styles.td}>
                    <div className={styles.riskTitle}>{risk.name || risk.title || risk.code}</div>
                  </td>
                  <td className={styles.tdMuted}>{risk.description || '—'}</td>
                  <td className={styles.td}>
                    {typeof risk.score === 'number' ? risk.score.toFixed(2) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
          <button className={styles.questionnaireButton} onClick={onNext} disabled>Cuestionario</button>
          <button className={styles.primaryButton} onClick={onNext}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
