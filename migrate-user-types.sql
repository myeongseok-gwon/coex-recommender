-- Migration script to update user types from old system to new A/B/C system
-- Run this script on your Supabase database after updating the schema

-- First, temporarily remove the type constraint to allow migration
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_type_check;

-- Update user types according to the new system:
-- Old few_few_* types -> Type A (less questions, feed all to LLM)
-- Old many_few_* types -> Type B (many questions, feed limited to LLM)
-- Old many_many_* types -> Type C (many questions, feed all to LLM)

UPDATE "user" SET type = 'A' WHERE type IN ('few_few_personal', 'few_few_basic');
UPDATE "user" SET type = 'B' WHERE type IN ('many_few_personal', 'many_few_basic');
UPDATE "user" SET type = 'C' WHERE type IN ('many_many_personal', 'many_many_basic');

-- Add back the constraint with new valid types
ALTER TABLE "user" ADD CONSTRAINT user_type_check CHECK (type IN ('A', 'B', 'C'));

-- Verify the migration
SELECT type, COUNT(*) as count FROM "user" GROUP BY type;

