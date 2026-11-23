-- Self-serve portfolios (docs/superpowers/specs/2026-11-23-self-serve-portfolios-design.md).
-- Public sign-up needs a verified email; codes are stored as SHA-256 hashes, five tries each.

ALTER TABLE users ADD COLUMN email_verified_at INTEGER;
ALTER TABLE users ADD COLUMN last_login_at INTEGER;
-- Everyone who set a password through an emailed setup link has proved their email already.
UPDATE users SET email_verified_at = created_at WHERE password_hash IS NOT NULL;

CREATE TABLE email_codes (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  tries INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE projects ADD COLUMN kind TEXT NOT NULL DEFAULT 'brief';
ALTER TABLE projects ADD COLUMN route TEXT;
ALTER TABLE projects ADD COLUMN site_slug TEXT;
ALTER TABLE projects ADD COLUMN custom_domain TEXT;
ALTER TABLE projects ADD COLUMN custom_domain_id TEXT;
ALTER TABLE projects ADD COLUMN custom_domain_status TEXT;
ALTER TABLE projects ADD COLUMN cancel_waiver_at INTEGER;
CREATE UNIQUE INDEX projects_site_slug ON projects (site_slug) WHERE site_slug IS NOT NULL;
CREATE UNIQUE INDEX projects_custom_domain ON projects (custom_domain) WHERE custom_domain IS NOT NULL;
