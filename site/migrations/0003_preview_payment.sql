-- Preview and payment (docs/superpowers/specs/2026-11-23-preview-and-payment-design.md).
-- Money in whole pence. preview_version names the R2 folder preview/<project>/<version>/ on show.

ALTER TABLE projects ADD COLUMN quote_pence INTEGER;
ALTER TABLE projects ADD COLUMN deposit_pence INTEGER;
ALTER TABLE projects ADD COLUMN deposit_paid_at INTEGER;
ALTER TABLE projects ADD COLUMN preview_version TEXT;
ALTER TABLE projects ADD COLUMN preview_at INTEGER;
ALTER TABLE projects ADD COLUMN paid_pence INTEGER;
ALTER TABLE projects ADD COLUMN paid_at INTEGER;
ALTER TABLE projects ADD COLUMN payment_ref TEXT;
ALTER TABLE projects ADD COLUMN live_url TEXT;
ALTER TABLE projects ADD COLUMN live_at INTEGER;
