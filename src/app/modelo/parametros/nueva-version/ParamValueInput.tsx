'use client';

import React, { useRef } from 'react';
import styles from './NuevaVersion.module.css';

type Props = {
  name: string;
  defaultValue: number | null;
  min?: number;
  max?: number;
  required?: boolean;
};

export default function ParamValueInput({ name, defaultValue, min, max, required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (!inputRef.current) return;
    if (defaultValue === null || Number.isNaN(defaultValue)) return;
    inputRef.current.value = String(defaultValue);
  };

  return (
    <div className={styles.valueInputWrap}>
      <input
        ref={inputRef}
        className={styles.valueInput}
        name={name}
        type="number"
        step="0.0001"
        min={min}
        max={max}
        defaultValue={defaultValue ?? undefined}
        required={required}
      />
      <button type="button" className={styles.defaultButton} onClick={handleReset}>
        Default
      </button>
    </div>
  );
}
