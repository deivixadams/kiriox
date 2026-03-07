-- SCORE schema and run tables
CREATE SCHEMA IF NOT EXISTS score;

CREATE TABLE IF NOT EXISTS score.run_draft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  framework_version_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  mode text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_score_run_draft_company FOREIGN KEY (company_id) REFERENCES corpus.company(id),
  CONSTRAINT fk_score_run_draft_fv FOREIGN KEY (framework_version_id) REFERENCES corpus.framework_version(id)
);

CREATE INDEX IF NOT EXISTS idx_score_run_draft_company ON score.run_draft(company_id);
CREATE INDEX IF NOT EXISTS idx_score_run_draft_fv ON score.run_draft(framework_version_id);

CREATE TABLE IF NOT EXISTS score.run (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  framework_version_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  mode text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_score_run_company FOREIGN KEY (company_id) REFERENCES corpus.company(id),
  CONSTRAINT fk_score_run_fv FOREIGN KEY (framework_version_id) REFERENCES corpus.framework_version(id)
);

CREATE INDEX IF NOT EXISTS idx_score_run_company ON score.run(company_id);
CREATE INDEX IF NOT EXISTS idx_score_run_fv ON score.run(framework_version_id);

CREATE TABLE IF NOT EXISTS score.run_obligation_draft (
  run_id uuid NOT NULL,
  obligation_id uuid NOT NULL,
  score numeric(10,6),
  rank int,
  reasons jsonb,
  PRIMARY KEY (run_id, obligation_id),
  CONSTRAINT fk_score_run_draft_obligation_run FOREIGN KEY (run_id) REFERENCES score.run_draft(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_run_draft_obligation_obl FOREIGN KEY (obligation_id) REFERENCES corpus.obligation(id)
);
CREATE INDEX IF NOT EXISTS idx_score_run_draft_obligation ON score.run_obligation_draft(obligation_id);

CREATE TABLE IF NOT EXISTS score.run_risk_draft (
  run_id uuid NOT NULL,
  risk_id uuid NOT NULL,
  score numeric(10,6),
  rank int,
  reasons jsonb,
  PRIMARY KEY (run_id, risk_id),
  CONSTRAINT fk_score_run_draft_risk_run FOREIGN KEY (run_id) REFERENCES score.run_draft(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_run_draft_risk_risk FOREIGN KEY (risk_id) REFERENCES corpus.risk(id)
);
CREATE INDEX IF NOT EXISTS idx_score_run_draft_risk ON score.run_risk_draft(risk_id);

CREATE TABLE IF NOT EXISTS score.run_control_draft (
  run_id uuid NOT NULL,
  control_id uuid NOT NULL,
  score numeric(10,6),
  rank int,
  reasons jsonb,
  PRIMARY KEY (run_id, control_id),
  CONSTRAINT fk_score_run_draft_control_run FOREIGN KEY (run_id) REFERENCES score.run_draft(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_run_draft_control_control FOREIGN KEY (control_id) REFERENCES corpus.control(id)
);
CREATE INDEX IF NOT EXISTS idx_score_run_draft_control ON score.run_control_draft(control_id);

CREATE TABLE IF NOT EXISTS score.run_test_draft (
  run_id uuid NOT NULL,
  test_id uuid NOT NULL,
  score numeric(10,6),
  rank int,
  reasons jsonb,
  PRIMARY KEY (run_id, test_id),
  CONSTRAINT fk_score_run_draft_test_run FOREIGN KEY (run_id) REFERENCES score.run_draft(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_run_draft_test_test FOREIGN KEY (test_id) REFERENCES corpus."__old-corpus_test"(id)
);
CREATE INDEX IF NOT EXISTS idx_score_run_draft_test ON score.run_test_draft(test_id);

CREATE TABLE IF NOT EXISTS score.run_obligation (
  run_id uuid NOT NULL,
  obligation_id uuid NOT NULL,
  score numeric(10,6),
  rank int,
  reasons jsonb,
  PRIMARY KEY (run_id, obligation_id),
  CONSTRAINT fk_score_run_obligation_run FOREIGN KEY (run_id) REFERENCES score.run(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_run_obligation_obl FOREIGN KEY (obligation_id) REFERENCES corpus.obligation(id)
);
CREATE INDEX IF NOT EXISTS idx_score_run_obligation ON score.run_obligation(obligation_id);

CREATE TABLE IF NOT EXISTS score.run_risk (
  run_id uuid NOT NULL,
  risk_id uuid NOT NULL,
  score numeric(10,6),
  rank int,
  reasons jsonb,
  PRIMARY KEY (run_id, risk_id),
  CONSTRAINT fk_score_run_risk_run FOREIGN KEY (run_id) REFERENCES score.run(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_run_risk_risk FOREIGN KEY (risk_id) REFERENCES corpus.risk(id)
);
CREATE INDEX IF NOT EXISTS idx_score_run_risk ON score.run_risk(risk_id);

CREATE TABLE IF NOT EXISTS score.run_control (
  run_id uuid NOT NULL,
  control_id uuid NOT NULL,
  score numeric(10,6),
  rank int,
  reasons jsonb,
  PRIMARY KEY (run_id, control_id),
  CONSTRAINT fk_score_run_control_run FOREIGN KEY (run_id) REFERENCES score.run(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_run_control_control FOREIGN KEY (control_id) REFERENCES corpus.control(id)
);
CREATE INDEX IF NOT EXISTS idx_score_run_control ON score.run_control(control_id);

CREATE TABLE IF NOT EXISTS score.run_test (
  run_id uuid NOT NULL,
  test_id uuid NOT NULL,
  score numeric(10,6),
  rank int,
  reasons jsonb,
  PRIMARY KEY (run_id, test_id),
  CONSTRAINT fk_score_run_test_run FOREIGN KEY (run_id) REFERENCES score.run(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_run_test_test FOREIGN KEY (test_id) REFERENCES corpus."__old-corpus_test"(id)
);
CREATE INDEX IF NOT EXISTS idx_score_run_test ON score.run_test(test_id);
