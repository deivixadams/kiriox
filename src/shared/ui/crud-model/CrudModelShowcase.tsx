"use client";

import { useState } from "react";
import { CrudModelActionBar } from "./CrudModelActionBar";
import styles from "./CrudModelShowcase.module.css";

const SAMPLE_ROWS = ["Empresa 1", "Empresa 2", "Empresa 3", "Empresa 4"];

export function CrudModelShowcase() {
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function move(position: "first" | "previous" | "next" | "last") {
    setIndex((prev) => {
      if (position === "first") return 0;
      if (position === "previous") return Math.max(0, prev - 1);
      if (position === "next") return Math.min(SAMPLE_ROWS.length - 1, prev + 1);
      return SAMPLE_ROWS.length - 1;
    });
  }

  async function simulateSave() {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 550));
    setSaving(false);
  }

  async function simulateDelete() {
    setDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 550));
    setDeleting(false);
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Plantilla</p>
        <h1 className={styles.title}>CRUD Model</h1>
        <p className={styles.subtitle}>
          Base reusable Glassmorphism para pantallas CRUD. Usa esta estructura y el action bar para mantener
          consistencia visual y de interacción.
        </p>
      </header>

      <article className={styles.card}>
        <label className={styles.field}>
          <span>Registro activo</span>
          <input className={styles.input} readOnly value={SAMPLE_ROWS[index]} />
        </label>
        <p className={styles.hint}>
          Registro {index + 1} de {SAMPLE_ROWS.length}
        </p>

        <CrudModelActionBar
          onFirst={() => move("first")}
          onPrevious={() => move("previous")}
          onNext={() => move("next")}
          onLast={() => move("last")}
          onClose={() => window.history.back()}
          onDelete={() => void simulateDelete()}
          onCancel={() => move("first")}
          onSave={() => void simulateSave()}
          disableFirst={index <= 0 || saving || deleting}
          disablePrevious={index <= 0 || saving || deleting}
          disableNext={index >= SAMPLE_ROWS.length - 1 || saving || deleting}
          disableLast={index >= SAMPLE_ROWS.length - 1 || saving || deleting}
          disableClose={saving || deleting}
          disableDelete={saving || deleting}
          disableCancel={saving || deleting}
          disableSave={saving || deleting}
          deleting={deleting}
          saving={saving}
        />
      </article>
    </section>
  );
}

