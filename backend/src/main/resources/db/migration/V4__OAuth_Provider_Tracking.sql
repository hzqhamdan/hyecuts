-- Tracks which accounts were created via OAuth vs local password registration,
-- so OAuth login can refuse to auto-link into an account it doesn't own
-- (previously any account could be hijacked by registering its email locally
-- before the real owner ever signed in with Google).
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20);
