-- Every form send on the site (worker/enquiry.js), listed for the team at /admin/.
-- status: new, replied, not-a-fit, or client (made into a client account: user_id).
-- Kept 12 months unless they became a client (worker/accounts/enquiries.js deletes older ones).

CREATE TABLE enquiries (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  topic TEXT,
  tier TEXT,
  concept TEXT,
  service TEXT,
  via TEXT,
  message TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'not-a-fit', 'client')),
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX enquiries_created ON enquiries (created_at);
