-- 추천 영향 여부 필드 추가
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS exit_recommendation_impact BOOLEAN,
ADD COLUMN IF NOT EXISTS exit_recommendation_rating_7 INTEGER CHECK (exit_recommendation_rating_7 >= 0 AND exit_recommendation_rating_7 <= 7),
ADD COLUMN IF NOT EXISTS exit_exhibition_rating_7 INTEGER CHECK (exit_exhibition_rating_7 >= 1 AND exit_exhibition_rating_7 <= 7);

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN "user".exit_recommendation_impact IS '부스 방문에 추천이 유의미한 영향을 주었는지 여부 (TRUE/FALSE)';
COMMENT ON COLUMN "user".exit_recommendation_rating_7 IS '퇴장 시 추천 시스템 만족도 (1-7점 Likert scale)';
COMMENT ON COLUMN "user".exit_exhibition_rating_7 IS '퇴장 시 전시회 만족도 (1-7점 Likert scale)';
