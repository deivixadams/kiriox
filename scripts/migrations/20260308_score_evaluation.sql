-- Score evaluation draft results + evidence storage
-- Schema: score

CREATE TABLE IF NOT EXISTS score.score_test_result_draft (
  run_id uuid NOT NULL,
  control_id uuid NOT NULL,
  dimension text NOT NULL,
  test_id uuid NOT NULL,
  score numeric(6, 4),
  passed boolean,
  assessment_method text,
  evaluator_notes text,
  reasons jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT score_test_result_draft_pkey PRIMARY KEY (run_id, control_id, dimension, test_id)
);

CREATE INDEX IF NOT EXISTS idx_score_test_result_draft_run
  ON score.score_test_result_draft (run_id);
CREATE INDEX IF NOT EXISTS idx_score_test_result_draft_control
  ON score.score_test_result_draft (control_id);
CREATE INDEX IF NOT EXISTS idx_score_test_result_draft_test
  ON score.score_test_result_draft (test_id);

CREATE TABLE IF NOT EXISTS score.score_test_result (
  run_id uuid NOT NULL,
  control_id uuid NOT NULL,
  dimension text NOT NULL,
  test_id uuid NOT NULL,
  score numeric(6, 4),
  passed boolean,
  assessment_method text,
  evaluator_notes text,
  reasons jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT score_test_result_pkey PRIMARY KEY (run_id, control_id, dimension, test_id)
);

CREATE INDEX IF NOT EXISTS idx_score_test_result_run
  ON score.score_test_result (run_id);
CREATE INDEX IF NOT EXISTS idx_score_test_result_control
  ON score.score_test_result (control_id);
CREATE INDEX IF NOT EXISTS idx_score_test_result_test
  ON score.score_test_result (test_id);

CREATE TABLE IF NOT EXISTS score.evidence_score_draft (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  control_id uuid NOT NULL,
  dimension text NOT NULL,
  test_id uuid NOT NULL,
  storage_provider_code text NOT NULL,
  bucket text,
  object_key text NOT NULL,
  logical_path text,
  sha256 text NOT NULL,
  file_name_original text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid,
  caption text,
  is_sealed boolean NOT NULL DEFAULT false,
  CONSTRAINT evidence_score_draft_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_score_draft_run
  ON score.evidence_score_draft (run_id);
CREATE INDEX IF NOT EXISTS idx_evidence_score_draft_control
  ON score.evidence_score_draft (control_id);
CREATE INDEX IF NOT EXISTS idx_evidence_score_draft_test
  ON score.evidence_score_draft (test_id);

CREATE TABLE IF NOT EXISTS score.evidence_score (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  control_id uuid NOT NULL,
  dimension text NOT NULL,
  test_id uuid NOT NULL,
  storage_provider_code text NOT NULL,
  bucket text,
  object_key text NOT NULL,
  logical_path text,
  sha256 text NOT NULL,
  file_name_original text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid,
  caption text,
  is_sealed boolean NOT NULL DEFAULT false,
  CONSTRAINT evidence_score_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_score_run
  ON score.evidence_score (run_id);
CREATE INDEX IF NOT EXISTS idx_evidence_score_control
  ON score.evidence_score (control_id);
CREATE INDEX IF NOT EXISTS idx_evidence_score_test
  ON score.evidence_score (test_id);

CREATE TABLE IF NOT EXISTS score.run_result (
  run_id uuid NOT NULL,
  engine_version text NOT NULL,
  score_total numeric(10, 4),
  score_band text,
  e_base numeric(14, 6),
  e_conc numeric(14, 6),
  e_sys numeric(14, 6),
  e_final numeric(14, 6),
  result_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT score_run_result_pkey PRIMARY KEY (run_id),
  CONSTRAINT score_run_result_run_id_fkey
    FOREIGN KEY (run_id)
    REFERENCES score.run (id)
    ON DELETE CASCADE
);
