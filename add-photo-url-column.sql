-- User 테이블에 photo_url 컬럼 추가
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS photo_url TEXT;

