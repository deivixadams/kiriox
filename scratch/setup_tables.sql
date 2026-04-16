SET search_path TO core;

CREATE TABLE IF NOT EXISTS risk_treatment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES core.risk(id),
  title VARCHAR(255) NOT NULL,
  treatment_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  justification TEXT,
  description TEXT,
  decision_date DATE,
  planned_start_date DATE,
  planned_end_date DATE,
  next_review_date DATE,
  residual_risk_expected VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ(6) DEFAULT now(),
  updated_at TIMESTAMPTZ(6) DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_treatment_action (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES core.risk_treatment(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ(6) DEFAULT now(),
  updated_at TIMESTAMPTZ(6) DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_treatment_responsible (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID REFERENCES core.risk_treatment(id) ON DELETE CASCADE,
  action_id UUID REFERENCES core.risk_treatment_action(id) ON DELETE CASCADE,
  responsible_id UUID NOT NULL REFERENCES security.security_users(id),
  responsible_name VARCHAR(255) NOT NULL,
  responsible_email VARCHAR(255) NOT NULL,
  responsible_area VARCHAR(100),
  responsible_role VARCHAR(100),
  assigned_at TIMESTAMPTZ(6) DEFAULT now(),
  due_date DATE,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ(6) DEFAULT now(),
  updated_at TIMESTAMPTZ(6) DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_treatment_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID REFERENCES core.risk_treatment(id) ON DELETE CASCADE,
  action_id UUID REFERENCES core.risk_treatment_action(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMPTZ(6) DEFAULT now(),
  created_at TIMESTAMPTZ(6) DEFAULT now(),
  updated_at TIMESTAMPTZ(6) DEFAULT now()
);
