-- Client accounts (docs/superpowers/specs/2026-11-23-client-accounts-design.md).
-- Ids are random UUIDs; times are milliseconds since 1970 (Date.now()).
-- Tokens (setup links, sessions) are stored only as SHA-256 hex hashes.
-- D1 enforces foreign keys itself (the Node tests turn them on in worker/accounts/test-env.js).

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'admin')),
  password_hash TEXT,
  salt TEXT,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE invites (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX invites_user ON invites (user_id);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('business', 'portfolio', 'custom')),
  tier TEXT,
  concept TEXT,
  status TEXT NOT NULL DEFAULT 'brief',
  created_at INTEGER NOT NULL
);
CREATE INDEX projects_user ON projects (user_id);

CREATE TABLE briefs (
  project_id TEXT PRIMARY KEY REFERENCES projects (id) ON DELETE CASCADE,
  answers TEXT NOT NULL DEFAULT '{}',
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'sent')),
  consent_at INTEGER,
  updated_at INTEGER NOT NULL,
  sent_at INTEGER
);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX files_project ON files (project_id);
