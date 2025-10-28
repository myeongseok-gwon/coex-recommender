-- Add column to track recommendation modal clicks by booth
-- This stores a JSON object with booth_id as keys and click counts as values
-- Example: {"A1234": 3, "B5678": 1, "A9999": 2}
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS recommendation_modal_clicks JSONB DEFAULT '{}';

-- Add comment to explain the field
COMMENT ON COLUMN "user".recommendation_modal_clicks IS 'JSON object tracking clicks per booth_id on recommendation modal (booth_id -> click count)';

