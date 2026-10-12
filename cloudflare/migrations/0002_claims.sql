CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  document TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  guardian TEXT,
  service TEXT NOT NULL CHECK (service IN ('publicacion', 'busqueda', 'otro')),
  type TEXT NOT NULL CHECK (type IN ('reclamo', 'queja')),
  amount REAL CHECK (amount IS NULL OR amount >= 0),
  detail TEXT NOT NULL,
  consumer_request TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  response TEXT,
  responded_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_claims_status_created ON claims(status, created_at);
