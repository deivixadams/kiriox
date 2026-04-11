"use client";

import styles from "./CrudModelActionBar.module.css";

type CrudModelActionBarProps = {
  onFirst?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onLast?: () => void;
  onClose?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  disableFirst?: boolean;
  disablePrevious?: boolean;
  disableNext?: boolean;
  disableLast?: boolean;
  disableClose?: boolean;
  disableDelete?: boolean;
  disableCancel?: boolean;
  disableSave?: boolean;
  showDelete?: boolean;
  firstLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  lastLabel?: string;
  closeLabel?: string;
  deleteLabel?: string;
  deletingLabel?: string;
  cancelLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
  deleting?: boolean;
  saving?: boolean;
};

export function CrudModelActionBar({
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onClose,
  onDelete,
  onCancel,
  onSave,
  disableFirst = false,
  disablePrevious = false,
  disableNext = false,
  disableLast = false,
  disableClose = false,
  disableDelete = false,
  disableCancel = false,
  disableSave = false,
  showDelete = true,
  firstLabel = "Primero",
  previousLabel = "Anterior",
  nextLabel = "Siguiente",
  lastLabel = "Final",
  closeLabel = "Cerrar",
  deleteLabel = "Eliminar",
  deletingLabel = "Eliminando...",
  cancelLabel = "Cancelar",
  saveLabel = "Guardar",
  savingLabel = "Guardando...",
  deleting = false,
  saving = false,
}: CrudModelActionBarProps) {
  return (
    <div className={styles.bar}>
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

      <div className={styles.group}>
        <button type="button" className={`${styles.button} ${styles.close}`} onClick={onClose} disabled={disableClose}>
          {closeLabel}
        </button>
        {showDelete ? (
          <button type="button" className={`${styles.button} ${styles.delete}`} onClick={onDelete} disabled={disableDelete}>
            {deleting ? deletingLabel : deleteLabel}
          </button>
        ) : null}
        <button type="button" className={styles.button} onClick={onCancel} disabled={disableCancel}>
          {cancelLabel}
        </button>
        <button type="button" className={`${styles.button} ${styles.save}`} onClick={onSave} disabled={disableSave}>
          {saving ? savingLabel : saveLabel}
        </button>
      </div>
    </div>
  );
}

