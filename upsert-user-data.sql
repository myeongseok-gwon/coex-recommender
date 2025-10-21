-- user.csv 데이터를 user 테이블에 UPSERT하는 SQL (더 안전한 방법)
-- 기존 데이터가 있으면 업데이트, 없으면 삽입
-- Supabase SQL Editor에서 실행하세요

-- Type A: Less questions, feed all to LLM (few_few)
-- Type B: Many questions, feed limited to LLM (many_few)
-- Type C: Many questions, feed all to LLM (many_many)

INSERT INTO "user" (user_id, type) VALUES
(1, 'A'),
(2, 'B'),
(3, 'C'),
(4, 'A'),
(5, 'B'),
(6, 'C'),
(7, 'A'),
(8, 'B'),
(9, 'C'),
(10, 'A'),
(11, 'B'),
(12, 'C'),
(13, 'A'),
(14, 'B'),
(15, 'C'),
(16, 'A'),
(17, 'B'),
(18, 'C')
ON CONFLICT (user_id) 
DO UPDATE SET 
  type = EXCLUDED.type,
  updated_at = NOW();

-- 삽입/업데이트된 데이터 확인
SELECT user_id, type, created_at, updated_at FROM "user" ORDER BY user_id;
