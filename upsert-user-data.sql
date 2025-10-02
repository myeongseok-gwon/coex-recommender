-- user.csv 데이터를 user 테이블에 UPSERT하는 SQL (더 안전한 방법)
-- 기존 데이터가 있으면 업데이트, 없으면 삽입
-- Supabase SQL Editor에서 실행하세요

INSERT INTO "user" (user_id, type) VALUES
(1, 'many_personal'),
(2, 'many_basic'),
(3, 'few_personal'),
(4, 'few_basic'),
(5, 'many_personal'),
(6, 'many_basic'),
(7, 'few_personal'),
(8, 'few_basic'),
(9, 'many_personal'),
(10, 'many_basic'),
(11, 'few_personal'),
(12, 'few_basic'),
(13, 'many_personal'),
(14, 'many_basic'),
(15, 'few_personal'),
(16, 'few_basic')
ON CONFLICT (user_id) 
DO UPDATE SET 
  type = EXCLUDED.type,
  updated_at = NOW();

-- 삽입/업데이트된 데이터 확인
SELECT user_id, type, created_at, updated_at FROM "user" ORDER BY user_id;
