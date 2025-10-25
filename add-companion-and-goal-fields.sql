-- 사용자 테이블에 동행 정보와 목적 관련 필드 추가
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS has_companion BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS companion_count INTEGER,
ADD COLUMN IF NOT EXISTS specific_goal TEXT;

-- 기존 데이터에 대한 기본값 설정
UPDATE "user" 
SET has_companion = FALSE 
WHERE has_companion IS NULL;

-- 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_user_has_companion ON "user"(has_companion);
CREATE INDEX IF NOT EXISTS idx_user_companion_count ON "user"(companion_count);
