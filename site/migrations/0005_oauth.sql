-- Sign in with Google or Microsoft (worker/accounts/oauth.js): which provider account belongs to
-- which user. Matched by the provider's own stable id (subject), never by email alone.
CREATE TABLE oauth_identities (
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  email TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (provider, subject)
);

CREATE INDEX oauth_identities_user ON oauth_identities (user_id);
