-- 퇴장 시 별점 수집을 위한 컬럼 추가
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS exit_recommendation_rating INTEGER CHECK (exit_recommendation_rating >= 1 AND exit_recommendation_rating <= 5),
ADD COLUMN IF NOT EXISTS exit_exhibition_rating INTEGER CHECK (exit_exhibition_rating >= 1 AND exit_exhibition_rating <= 5),
ADD COLUMN IF NOT EXISTS exit_ratings_submitted_at TIMESTAMP WITH TIME ZONE;

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN "user".exit_recommendation_rating IS '퇴장 시 추천 시스템 만족도 (1-5점)';
COMMENT ON COLUMN "user".exit_exhibition_rating IS '퇴장 시 전시회 만족도 (1-5점)';
COMMENT ON COLUMN "user".exit_ratings_submitted_at IS '퇴장 별점 제출 시점';
