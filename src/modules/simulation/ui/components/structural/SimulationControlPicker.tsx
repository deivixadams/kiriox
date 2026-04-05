'use client';

import React, { useState } from 'react';
import styles from './SimulationControlPicker.module.css';
import { Search, Check, X } from 'lucide-react';

interface SimulationControlPickerProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MOCK_CONTROLS = [
  { id: 'C-001', name: 'Monitor de Transacciones Inusuales', domain: 'Vigilancia' },
  { id: 'C-002', name: 'Know Your Customer (KYC)', domain: 'Identificación' },
  { id: 'C-003', name: 'Segmentación de Clientes', domain: 'Riesgo' },
  { id: 'C-004', name: 'Debida Diligencia Intensificada', domain: 'Compliance' },
  { id: 'C-005', name: 'Reporte de Operaciones Sospechosas', domain: 'Regulatorio' },
  { id: 'C-006', name: 'Listas de Sanciones Internas', domain: 'Listas' },
  { id: 'C-007', name: 'Capacitación Anual AML', domain: 'Gobierno' },
  { id: 'C-008', name: 'Auditoría Externa Independiente', domain: 'Control' },
];

export default function SimulationControlPicker({ selected, onChange }: SimulationControlPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const toggleControl = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(i => i !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const filtered = MOCK_CONTROLS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <Search size={14} className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Buscar control por código o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {filtered.map(control => {
          const isSelected = selected.includes(control.id);
          return (
            <div 
              key={control.id} 
              className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
              onClick={() => toggleControl(control.id)}
            >
              <div className={styles.check}>
                {isSelected && <Check size={12} />}
              </div>
              <div className={styles.info}>
                <span className={styles.code}>{control.id}</span>
                <span className={styles.name}>{control.name}</span>
              </div>
              {isSelected && <div className={styles.indicator} />}
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className={styles.footer}>
          <span>{selected.length} controles seleccionados</span>
          <button className={styles.clearBtn} onClick={() => onChange([])}>Limpiar</button>
        </div>
      )}
    </div>
  );
}
