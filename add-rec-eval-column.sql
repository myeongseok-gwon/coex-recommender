-- rec_eval 컬럼 추가 마이그레이션
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS rec_eval TEXT;

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user' 
ORDER BY ordinal_position;

