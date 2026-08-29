CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY,
    actor_id UUID,
    actor_email VARCHAR(255) NOT NULL,
    target_user_id UUID NOT NULL,
    target_email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log (created_at DESC);
