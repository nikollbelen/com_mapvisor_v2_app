PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lots (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo_propiedad TEXT NOT NULL CHECK (tipo_propiedad IN ('departamento', 'casa', 'lote')),
  operacion TEXT NOT NULL CHECK (operacion IN ('venta', 'alquiler')),
  estado TEXT NOT NULL DEFAULT 'disponible'
    CHECK (estado IN ('disponible', 'reservado', 'negociacion', 'vendido')),
  precio REAL,
  area REAL,
  ciudad TEXT,
  distrito TEXT,
  dormitorios INTEGER,
  banos REAL,
  etapa TEXT,
  manzana TEXT,
  lote TEXT,
  coordenadas TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lot_media (
  id TEXT PRIMARY KEY,
  lot_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'youtube')),
  url TEXT NOT NULL,
  r2_key TEXT,
  name TEXT,
  size_bytes INTEGER,
  mime_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_lots_public_search
  ON lots(visibility, deleted_at, estado, tipo_propiedad, operacion, ciudad, distrito);
CREATE INDEX IF NOT EXISTS idx_lots_owner ON lots(owner_user_id, deleted_at, created_at);
CREATE INDEX IF NOT EXISTS idx_lot_media_lot_id ON lot_media(lot_id);
