-- Add visit_purpose column to user table

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS visit_purpose VARCHAR(50);

-- Add comment to describe the column
COMMENT ON COLUMN "user".visit_purpose IS '전시회 방문 목적: 명확한 목표 또는 탐색 및 둘러보기';

