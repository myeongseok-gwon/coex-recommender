-- Remove details column from user table
-- This column is no longer used in the application

ALTER TABLE "user" 
DROP COLUMN IF EXISTS details;

-- Comment: details field has been removed as it's no longer part of the user input flow
-- Interest categories and followup answers are now the primary sources of user preferences

