-- 지도 기능 도움 정도 (7점 척도) 컬럼 추가
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS exit_map_helpfulness_7 INTEGER CHECK (exit_map_helpfulness_7 >= 1 AND exit_map_helpfulness_7 <= 7);

COMMENT ON COLUMN "user".exit_map_helpfulness_7 IS '퇴장 시 지도 기능 도움 정도 (1-7점 Likert scale)';


