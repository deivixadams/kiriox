import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Download,
  Info,
  Sparkles,
  Users,
  Wand2
} from 'lucide-react';
import styles from './ActaStep.module.css';

type Option = { id: string; name: string };
type UserOption = { id: string; label: string; email?: string };

type ActaData = {
  entidad_nombre: string;
  periodo_inicio: string;
  periodo_fin: string;
  objetivo: string;
  alcance: string;
  marco_normativo: string;
  metodologia: string;
  lider_equipo: string;
  lider_equipo_id?: string;
  auditores: string;
  auditores_ids?: string[];
  cronograma: { hito: string; fecha: string }[];
};

type ContextState = {
  companyId: string;
};

type ActaStepProps = {
  acta: ActaData;
  context: ContextState;
  companies: Option[];
  teamUsers: UserOption[];
  onChangeActa: (next: ActaData) => void;
  onChangeContext: (next: Partial<ContextState>) => void;
  onAI: (field: string, promptCode: string) => void;
  aiLoadingFields: Record<string, boolean>;
  onSave: () => void;
  onGenerateActa: () => void;
  onNext: () => void;
};

export default function ActaStep({
  acta,
  context,
  companies,
  teamUsers,
  onChangeActa,
  onChangeContext,
  onAI,
  aiLoadingFields,
  onSave,
  onGenerateActa,
  onNext
}: ActaStepProps) {
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [leaderQuery, setLeaderQuery] = useState('');
  const [auditorOpen, setAuditorOpen] = useState(false);
  const [auditorQuery, setAuditorQuery] = useState('');
  const teamDisabled = !context.companyId;

  const leaderOptions = useMemo(() => {
    const query = leaderQuery.trim().toLowerCase();
    if (!query) return teamUsers;
    return teamUsers.filter((u) => u.label.toLowerCase().includes(query));
  }, [teamUsers, leaderQuery]);

  const auditorOptions = useMemo(() => {
    const query = auditorQuery.trim().toLowerCase();
    if (!query) return teamUsers;
    return teamUsers.filter((u) => u.label.toLowerCase().includes(query));
  }, [teamUsers, auditorQuery]);

  const selectedLeader = useMemo(
    () => teamUsers.find((u) => u.id === acta.lider_equipo_id),
    [teamUsers, acta.lider_equipo_id]
  );

  const selectedAuditorIds = acta.auditores_ids || [];
  const selectedAuditors = useMemo(
    () => teamUsers.filter((u) => selectedAuditorIds.includes(u.id)),
    [teamUsers, selectedAuditorIds]
  );

  const applyLeader = (user: UserOption | null) => {
    onChangeActa({
      ...acta,
      lider_equipo_id: user?.id || '',
      lider_equipo: user?.label || ''
    });
    setLeaderOpen(false);
    setLeaderQuery('');
  };

  const toggleAuditor = (user: UserOption) => {
    const exists = selectedAuditorIds.includes(user.id);
    const nextIds = exists
      ? selectedAuditorIds.filter((id) => id !== user.id)
      : [...selectedAuditorIds, user.id];
    const names = teamUsers
      .filter((u) => nextIds.includes(u.id))
      .map((u) => u.label)
      .join(', ');
    onChangeActa({
      ...acta,
      auditores_ids: nextIds,
      auditores: names
    });
  };

  const removeAuditor = (id: string) => {
    const nextIds = selectedAuditorIds.filter((auditorId) => auditorId !== id);
    const names = teamUsers
      .filter((u) => nextIds.includes(u.id))
      .map((u) => u.label)
      .join(', ');
    onChangeActa({
      ...acta,
      auditores_ids: nextIds,
      auditores: names
    });
  };
  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <div className={styles.card}>
          <div className={styles.formStack}>
            <FormField label="Empresa" icon={Info}>
              <select
                value={context.companyId}
                onChange={(e) => onChangeContext({ companyId: e.target.value })}
                className={styles.select}
              >
                <option value="">Seleccione...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className={styles.divider} />

          <div className={styles.gridTwo}>
            <FormField label="Entidad a Auditar" icon={Info}>
              <input
                type="text"
                value={acta.entidad_nombre}
                onChange={(e) => onChangeActa({ ...acta, entidad_nombre: e.target.value })}
                className={styles.input}
              />
            </FormField>
            <FormField label="Periodo de Auditoria (Anual)" icon={Calendar}>
              <div className={styles.dateRow}>
                <input
                  type="date"
                  value={acta.periodo_inicio}
                  onChange={(e) => onChangeActa({ ...acta, periodo_inicio: e.target.value })}
                  className={styles.input}
                />
                <div className={styles.dateDivider} />
                <input
                  type="date"
                  value={acta.periodo_fin}
                  onChange={(e) => onChangeActa({ ...acta, periodo_fin: e.target.value })}
                  className={styles.input}
                />
              </div>
            </FormField>
          </div>

          <FormField label="Marco Normativo" icon={Info}>
            <input
              type="text"
              value={acta.marco_normativo}
              onChange={(e) => onChangeActa({ ...acta, marco_normativo: e.target.value })}
              className={styles.input}
            />
          </FormField>

          <div className={styles.divider} />

          <div className={styles.gridThree}>
            <TextSection
              title="Objetivo General"
              description="Define la meta principal de la revision (AML/CFT)."
              value={acta.objetivo}
              onChange={(val: string) => onChangeActa({ ...acta, objetivo: val })}
              onAI={() => onAI('objetivo', 'AUDIT_OBJETIVO_GEN')}
              isLoading={!!aiLoadingFields.objetivo}
              placeholder="Describa el objetivo principal..."
              icon={Users}
            />

            <TextSection
              title="Alcance de la Auditoria"
              description="Detalla los procesos, areas y periodos especificos."
              value={acta.alcance}
              onChange={(val: string) => onChangeActa({ ...acta, alcance: val })}
              onAI={() => onAI('alcance', 'AUDIT_ALCANCE')}
              isLoading={!!aiLoadingFields.alcance}
              placeholder="Especifique el alcance tecnico..."
              icon={Info}
            />

            <TextSection
              title="Metodologia de Trabajo"
              description="Tecnicas de muestreo y ejecucion basadas en riesgos."
              value={acta.metodologia}
              onChange={(val: string) => onChangeActa({ ...acta, metodologia: val })}
              onAI={() => onAI('metodologia', 'AUDIT_METODOLOGIA')}
              isLoading={!!aiLoadingFields.metodologia}
              placeholder="Explique la metodologia aplicada..."
              icon={Wand2}
            />
          </div>

          <div className={styles.divider} />

          <div className={styles.gridTwoWide}>
            <div>
              <h3 className={styles.sectionTitle}>
                <Users className={styles.sectionIcon} />
                Equipo Auditor
              </h3>
              <div className={styles.fieldStack}>
                <FormField label="Lider de Proyecto">
                  <div className={styles.combo}>
                    <button
                      type="button"
                      className={`${styles.comboButton} ${teamDisabled ? styles.comboButtonDisabled : ''}`}
                      onClick={() => {
                        if (teamDisabled) return;
                        setLeaderOpen((prev) => {
                          const next = !prev;
                          if (next) setLeaderQuery('');
                          return next;
                        });
                        setAuditorOpen(false);
                      }}
                      disabled={teamDisabled}
                    >
                      <span className={selectedLeader ? styles.comboValue : styles.comboPlaceholder}>
                        {selectedLeader?.label || (teamDisabled ? 'Seleccione empresa primero' : 'Seleccione un usuario')}
                      </span>
                      <span className={styles.comboCaret}>▾</span>
                    </button>
                    {leaderOpen && (
                      <div className={styles.comboMenu}>
                        <input
                          className={styles.comboSearch}
                          placeholder="Buscar usuario..."
                          value={leaderQuery}
                          onChange={(e) => setLeaderQuery(e.target.value)}
                        />
                        <div className={styles.comboOptions}>
                          {leaderOptions.length === 0 && (
                            <div className={styles.comboEmpty}>Sin resultados</div>
                          )}
                          {leaderOptions.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              className={styles.comboOption}
                              onClick={() => applyLeader(user)}
                            >
                              {user.label}
                            </button>
                          ))}
                          {selectedLeader && (
                            <button
                              type="button"
                              className={styles.comboOptionMuted}
                              onClick={() => applyLeader(null)}
                            >
                              Quitar seleccion
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </FormField>
                <FormField label="Auditores Asignados">
                  <div className={styles.combo}>
                    <button
                      type="button"
                      className={`${styles.comboButton} ${teamDisabled ? styles.comboButtonDisabled : ''}`}
                      onClick={() => {
                        if (teamDisabled) return;
                        setAuditorOpen((prev) => {
                          const next = !prev;
                          if (next) setAuditorQuery('');
                          return next;
                        });
                        setLeaderOpen(false);
                      }}
                      disabled={teamDisabled}
                    >
                      <div className={styles.comboTags}>
                        {selectedAuditors.length === 0 && (
                          <span className={styles.comboPlaceholder}>
                            {teamDisabled ? 'Seleccione empresa primero' : 'Seleccione usuarios'}
                          </span>
                        )}
                        {selectedAuditors.map((auditor) => (
                          <span key={auditor.id} className={styles.comboTag}>
                            {auditor.label}
                            <span
                              role="button"
                              tabIndex={0}
                              className={styles.comboTagRemove}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAuditor(auditor.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeAuditor(auditor.id);
                                }
                              }}
                            >
                              ?
                            </span>
                          </span>
                        ))}
                      </div>
                      <span className={styles.comboCaret}>▾</span>
                    </button>
                    {auditorOpen && (
                      <div className={`${styles.comboMenu} ${styles.comboMenuUp}`}>
                        <input
                          className={styles.comboSearch}
                          placeholder="Buscar usuario..."
                          value={auditorQuery}
                          onChange={(e) => setAuditorQuery(e.target.value)}
                        />
                        <div className={styles.comboOptions}>
                          {auditorOptions.length === 0 && (
                            <div className={styles.comboEmpty}>Sin resultados</div>
                          )}
                          {auditorOptions.map((user) => {
                            const active = selectedAuditorIds.includes(user.id);
                            return (
                              <button
                                key={user.id}
                                type="button"
                                className={active ? styles.comboOptionActive : styles.comboOption}
                                onClick={() => toggleAuditor(user)}
                              >
                                {active ? '✓ ' : ''}{user.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </FormField>
              </div>
            </div>
            <div>
              <h3 className={styles.sectionTitle}>
                <Clock className={styles.sectionIcon} />
                Cronograma Estimado
              </h3>
              <div className={styles.timeline}>
                {acta.cronograma.map((item, idx) => (
                  <div key={idx} className={styles.timelineItem}>
                    <span className={styles.timelineLabel}>{item.hito}</span>
                    <input
                      type="date"
                      value={item.fecha}
                      onChange={(e) => {
                        const updated = [...acta.cronograma];
                        updated[idx] = { ...updated[idx], fecha: e.target.value };
                        onChangeActa({ ...acta, cronograma: updated });
                      }}
                      className={styles.timelineDate}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerActions}>
            <button className={styles.ghostButton} onClick={onSave}>
              Guardar Borrador
            </button>
            <button
              onClick={onGenerateActa}
              className={styles.primaryButton}
            >
              <Download className={styles.buttonIcon} />
              Generar Acta
            </button>
            <button
              onClick={onNext}
              className={styles.secondaryButton}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {Icon && <Icon className={styles.fieldIcon} />}
        {label}
      </label>
      {children}
    </div>
  );
}

function TextSection({ title, description, value, onChange, onAI, isLoading, placeholder, icon: Icon }: any) {
  return (
    <div className={styles.textSection}>
      <div className={styles.textHeader}>
        <div>
          <h3 className={styles.textTitle}>
            <Icon className={styles.textIcon} />
            {title}
          </h3>
          <p className={styles.textDescription}>{description}</p>
        </div>
        <button
          onClick={onAI}
          disabled={isLoading}
          className={styles.aiButton}
        >
          {isLoading ? (
            <div className={styles.spinner} />
          ) : (
            <Sparkles className={styles.aiIcon} />
          )}
          IA
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.textarea}
      />
    </div>
  );
}
