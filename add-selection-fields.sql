-- 새로운 선택 항목 필드들을 user 테이블에 추가

-- 자녀 관련 필드
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS child_interests TEXT[] DEFAULT '{}';

-- 반려동물 관련 필드
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS has_pets BOOLEAN DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS pet_types TEXT[] DEFAULT '{}';

-- 알러지 관련 필드
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS has_allergies BOOLEAN DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT '';

-- 인덱스 생성 (선택사항)
CREATE INDEX IF NOT EXISTS idx_user_has_children ON "user"(has_children);
CREATE INDEX IF NOT EXISTS idx_user_has_pets ON "user"(has_pets);
CREATE INDEX IF NOT EXISTS idx_user_has_allergies ON "user"(has_allergies);
