-- evaluation 테이블의 booth_id를 INTEGER에서 VARCHAR로 마이그레이션
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요

-- 1. 기존 테이블 백업 (선택사항, 안전을 위해)
-- CREATE TABLE evaluation_backup AS SELECT * FROM evaluation;

-- 2. booth_id 컬럼을 VARCHAR로 변경
-- PostgreSQL에서는 데이터가 있을 때 타입 변경이 제한적이므로
-- 새 컬럼을 만들고 데이터를 복사한 후 기존 컬럼을 삭제하는 방식 사용

-- Step 2-1: 새로운 booth_id_new 컬럼 추가 (VARCHAR)
ALTER TABLE evaluation ADD COLUMN IF NOT EXISTS booth_id_new VARCHAR(10);

-- Step 2-2: 기존 INTEGER 데이터를 VARCHAR로 변환하여 복사
-- (만약 기존 데이터가 있다면)
UPDATE evaluation SET booth_id_new = booth_id::VARCHAR WHERE booth_id_new IS NULL;

-- Step 2-3: 기존 booth_id 컬럼 삭제 전에 제약조건 및 인덱스 확인
-- UNIQUE 제약조건 삭제
ALTER TABLE evaluation DROP CONSTRAINT IF EXISTS evaluation_user_id_booth_id_key;

-- 기존 인덱스 삭제
DROP INDEX IF EXISTS idx_evaluation_booth_id;

-- Step 2-4: 기존 booth_id 컬럼 삭제
ALTER TABLE evaluation DROP COLUMN IF EXISTS booth_id;

-- Step 2-5: 새 컬럼을 booth_id로 이름 변경
ALTER TABLE evaluation RENAME COLUMN booth_id_new TO booth_id;

-- Step 2-6: NOT NULL 제약조건 추가
ALTER TABLE evaluation ALTER COLUMN booth_id SET NOT NULL;

-- Step 2-7: UNIQUE 제약조건 재생성
ALTER TABLE evaluation ADD CONSTRAINT evaluation_user_id_booth_id_key UNIQUE(user_id, booth_id);

-- Step 2-8: 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_evaluation_booth_id ON evaluation(booth_id);

-- 3. 컬럼 설명 추가
COMMENT ON COLUMN evaluation.booth_id IS '부스 ID - 문자열 형식 (예: A1234, B5678, S0901)';

-- 4. 마이그레이션 완료 확인
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'evaluation' AND column_name = 'booth_id';

