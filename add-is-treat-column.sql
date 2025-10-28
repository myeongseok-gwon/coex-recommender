-- Add is_treat column to user table and backfill to TRUE
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_treat BOOLEAN DEFAULT TRUE;

-- Backfill existing rows
UPDATE "user" SET is_treat = TRUE WHERE is_treat IS NULL;

