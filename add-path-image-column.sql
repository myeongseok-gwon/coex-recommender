-- User 테이블에 경로 이미지 URL 컬럼 추가
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS path_image_url TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS path_drawing_url TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN "user".path_image_url IS '지도와 경로가 합성된 이미지 URL';
COMMENT ON COLUMN "user".path_drawing_url IS '경로만 있는 이미지 URL (투명 배경)';

