-- Migrate user_id from INTEGER to VARCHAR
-- This migration updates the user_id column in both user and evaluation tables
-- Execute this in Supabase SQL Editor

-- Step 1: Drop the foreign key constraint on evaluation table
ALTER TABLE "evaluation" 
DROP CONSTRAINT IF EXISTS evaluation_user_id_fkey;

-- Step 2: Change user_id type in user table from INTEGER to VARCHAR(50)
ALTER TABLE "user" 
ALTER COLUMN user_id TYPE VARCHAR(50);

-- Step 3: Change user_id type in evaluation table from INTEGER to VARCHAR(50)
ALTER TABLE "evaluation" 
ALTER COLUMN user_id TYPE VARCHAR(50);

-- Step 4: Re-add the foreign key constraint
ALTER TABLE "evaluation" 
ADD CONSTRAINT evaluation_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE;

-- Comments for documentation
COMMENT ON COLUMN "user".user_id IS 'User identifier - changed from INTEGER to VARCHAR(50) to support string-based IDs';
COMMENT ON COLUMN "evaluation".user_id IS 'Reference to user.user_id - changed to VARCHAR(50) to match user table';

-- Verify changes
SELECT 
    t.table_name, 
    c.column_name, 
    c.data_type, 
    c.character_maximum_length,
    c.is_nullable 
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name
WHERE c.table_name IN ('user', 'evaluation') 
  AND c.column_name = 'user_id'
ORDER BY t.table_name, c.ordinal_position;

