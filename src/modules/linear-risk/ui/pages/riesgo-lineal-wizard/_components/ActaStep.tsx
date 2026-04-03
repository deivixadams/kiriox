import React from 'react';
import {
  Clock,
  Info,
  Sparkles,
  Users,
  Wand2
} from 'lucide-react';
import styles from './ActaStep.module.css';

type Option = { id: string; name: string; code?: string };

type ActaData = {
  title: string;
  assessment_period_label: string;
  scope_description: string;
  business_context: string;
  model_of_business: string;
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
  onChangeActa: (next: ActaData) => void;
  onChangeContext: (next: Partial<Pick<ContextState, 'companyId'>>) => void;
  onAI: (field: string, promptCode: string) => void;
  aiLoadingFields: Record<string, boolean>;
  onSave: () => void;
  onNext: () => void;
};

export default function ActaStep({
  acta,
  context,
  companies,
  onChangeActa,
  onChangeContext,
  onAI,
  aiLoadingFields,
  onSave,
  onNext
}: ActaStepProps) {
  const getCronoDate = (hito: string) => acta.cronograma.find((item) => item.hito === hito)?.fecha || '';
  const updateCronoDate = (hito: string, fecha: string) => {
    const updated = acta.cronograma.map((item) => (
      item.hito === hito ? { ...item, fecha } : item
    ));
    onChangeActa({ ...acta, cronograma: updated });
  };
  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <div className={styles.card}>
          <div className={styles.gridTwo}>
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
            <FormField label="Título de evaluación" icon={Info}>
              <input
                type="text"
                value={acta.title}
                onChange={(e) => onChangeActa({ ...acta, title: e.target.value })}
                className={styles.input}
                placeholder="Ej: Evaluación integral de riesgo 2026"
              />
            </FormField>
          </div>

          <div className={styles.divider} />

          <div className={styles.gridTwo}>
            <TextSection
              title="Modelo de negocio"
              description="Describe el modelo operativo de la organización."
              value={acta.model_of_business}
              onChange={(val: string) => onChangeActa({
                ...acta,
                model_of_business: val,
                entidad_nombre: val
              })}
              onAI={() => onAI('model_of_business', 'AUDIT_MODELO_NEGOCIO')}
              isLoading={!!aiLoadingFields.model_of_business}
              placeholder="Describe el modelo de negocio en al menos dos oraciones."
              icon={Info}
              minHeight={130}
            />

            <TextSection
              title="Contexto de negocio"
              description="Contexto de negocio que enmarca la evaluación."
              value={acta.business_context}
              onChange={(val: string) => onChangeActa({ ...acta, business_context: val, objetivo: val })}
              onAI={() => onAI('business_context', 'AUDIT_OBJETIVO_GEN')}
              isLoading={!!aiLoadingFields.business_context}
              placeholder="Describa el contexto de negocio..."
              icon={Users}
              minHeight={130}
            />
          </div>

          <div className={styles.gridTwo}>
            <TextSection
              title="Descripción del alcance"
              description="Alcance detallado de procesos, áreas y límites."
              value={acta.scope_description}
              onChange={(val: string) => onChangeActa({ ...acta, scope_description: val, alcance: val })}
              onAI={() => onAI('scope_description', 'AUDIT_ALCANCE')}
              isLoading={!!aiLoadingFields.scope_description}
              placeholder="Especifique el alcance..."
              icon={Info}
            />

            <TextSection
              title="Versión metodológica"
              description="Versión/metodología de trabajo aplicada."
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
                <Clock className={styles.sectionIcon} />
                Cronograma Estimado
              </h3>
              <div className={styles.fieldStack}>
                <FormField label="Informe Preliminar">
                  <input
                    type="date"
                    value={getCronoDate('Informe Preliminar')}
                    onChange={(e) => updateCronoDate('Informe Preliminar', e.target.value)}
                    className={styles.input}
                  />
                </FormField>
                <FormField label="Cierre Formal">
                  <input
                    type="date"
                    value={getCronoDate('Cierre Formal')}
                    onChange={(e) => updateCronoDate('Cierre Formal', e.target.value)}
                    className={styles.input}
                  />
                </FormField>
              </div>
            </div>
            <div>
              <h3 className={styles.sectionTitle}>
                <Clock className={styles.sectionIcon} />
                Hitos Iniciales
              </h3>
              <div className={styles.fieldStack}>
                <FormField label="Inicio de evaluación">
                  <input
                    type="date"
                    value={getCronoDate('Inicio Auditoria')}
                    onChange={(e) => updateCronoDate('Inicio Auditoria', e.target.value)}
                    className={styles.input}
                  />
                </FormField>
                <FormField label="Trabajo de Campo">
                  <input
                    type="date"
                    value={getCronoDate('Trabajo de Campo')}
                    onChange={(e) => updateCronoDate('Trabajo de Campo', e.target.value)}
                    className={styles.input}
                  />
                </FormField>
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
              onClick={onNext}
              className={styles.primaryButton}
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

function TextSection({ title, description, value, onChange, onAI, isLoading, placeholder, icon: Icon, minHeight }: any) {
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
        {typeof onAI === 'function' ? (
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
        ) : null}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.textarea}
        style={minHeight ? { minHeight } : undefined}
      />
    </div>
  );
}
