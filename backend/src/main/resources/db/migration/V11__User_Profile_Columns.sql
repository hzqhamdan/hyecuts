-- DB-003: catch-up migration for the seven users columns that exist in
-- production only because `hibernate.ddl-auto: update` created them. None of
-- V1-V10 ever declared them, so a Flyway-only rebuild (a fresh environment, a
-- restore, or the eventual DB-001 decision to turn ddl-auto off) produced a
-- users table the application could not start against.
--
-- This is deliberately a no-op on any database ddl-auto has already touched:
-- every statement is guarded, and ADD COLUMN IF NOT EXISTS will not alter the
-- type of a column that is already there. Types below mirror what Hibernate
-- generates for these fields so a fresh build matches the existing schema
-- rather than merely resembling it:
--   String, no length     -> varchar(255)
--   @Column(length=1e6)   -> varchar(1000000)

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS hair_type VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS hair_length VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS hair_scalp VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(1000000);

-- User.username is declared @Column(unique = true), so a Flyway-built schema
-- needs the constraint too or it silently permits duplicates the entity
-- forbids.
--
-- Hibernate's `update` mode adds columns but is unreliable about adding
-- constraints to a table that already exists, so production may well have the
-- column and NOT this index. If that is the case and duplicate usernames have
-- accumulated, this statement fails and the deploy stops. That is intentional:
-- failing loudly beats a schema that silently diverges from the entity.
--
-- Check before deploying:
--   SELECT username, COUNT(*) FROM users
--   WHERE username IS NOT NULL GROUP BY username HAVING COUNT(*) > 1;
--
-- NULL is exempt — Postgres permits many NULLs in a unique index, which is
-- what lets OAuth accounts without a chosen username coexist (DB-017).
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users (username);
