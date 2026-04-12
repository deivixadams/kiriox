"use client";

import styles from "./CrudModelActionBar.module.css";

type CrudModelActionBarProps = {
  onFirst?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onLast?: () => void;
  onClose?: () => void;
  onDelete?: () => void;
  onNew?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  disableFirst?: boolean;
  disablePrevious?: boolean;
  disableNext?: boolean;
  disableLast?: boolean;
  disableClose?: boolean;
  disableDelete?: boolean;
  disableNew?: boolean;
  disableCancel?: boolean;
  disableSave?: boolean;
  showNew?: boolean;
  showDelete?: boolean;
  firstLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  lastLabel?: string;
  closeLabel?: string;
  deleteLabel?: string;
  newLabel?: string;
  deletingLabel?: string;
  cancelLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
  deleting?: boolean;
  saving?: boolean;
  showNavigation?: boolean;
  showCancel?: boolean;
  showClose?: boolean;
  showSave?: boolean;
  center?: boolean;
};

export function CrudModelActionBar({
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onClose,
  onDelete,
  onNew,
  onCancel,
  onSave,
  disableFirst = false,
  disablePrevious = false,
  disableNext = false,
  disableLast = false,
  disableClose = false,
  disableDelete = false,
  disableNew = false,
  disableCancel = false,
  disableSave = false,
  showDelete = true,
  showNew = false,
  firstLabel = "Primero",
  previousLabel = "Anterior",
  nextLabel = "Siguiente",
  lastLabel = "Final",
  closeLabel = "Cerrar",
  deleteLabel = "Eliminar",
  newLabel = "Nuevo",
  deletingLabel = "Eliminando...",
  cancelLabel = "Cancelar",
  saveLabel = "Guardar",
  savingLabel = "Guardando...",
  deleting = false,
  saving = false,
  showNavigation = true,
  showCancel = true,
  showClose = true,
  showSave = true,
  center = false,
}: CrudModelActionBarProps) {
  return (
    <div className={styles.bar} style={center ? { justifyContent: 'center' } : {}}>
      {showNavigation && (
        <div className={styles.group}>
          <button type="button" className={styles.button} onClick={onFirst} disabled={disableFirst}>
            {firstLabel}
          </button>
          <button type="button" className={styles.button} onClick={onPrevious} disabled={disablePrevious}>
            {previousLabel}
          </button>
          <button type="button" className={styles.button} onClick={onNext} disabled={disableNext}>
            {nextLabel}
          </button>
          <button type="button" className={styles.button} onClick={onLast} disabled={disableLast}>
            {lastLabel}
          </button>
        </div>
      )}

      <div className={styles.group}>
        {showClose && (
          <button type="button" className={`${styles.button} ${styles.close}`} onClick={onClose} disabled={disableClose}>
            {closeLabel}
          </button>
        )}
        {showNew ? (
          <button type="button" className={`${styles.button} ${styles.new}`} onClick={onNew} disabled={disableNew}>
            {newLabel}
          </button>
        ) : null}
        {showDelete ? (
          <button type="button" className={`${styles.button} ${styles.delete}`} onClick={onDelete} disabled={disableDelete}>
            {deleting ? deletingLabel : deleteLabel}
          </button>
        ) : null}
        {showCancel && (
          <button type="button" className={styles.button} onClick={onCancel} disabled={disableCancel}>
            {cancelLabel}
          </button>
        )}
        {showSave && (
          <button type="button" className={`${styles.button} ${styles.save}`} onClick={onSave} disabled={disableSave}>
            {saving ? savingLabel : saveLabel}
          </button>
        )}
      </div>
    </div>
  );
}
