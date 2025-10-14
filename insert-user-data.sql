-- user.csv 데이터를 user 테이블에 삽입하는 SQL
-- Supabase SQL Editor에서 실행하세요

-- 기존 데이터가 있다면 삭제 (선택사항)
-- DELETE FROM "user";

-- user.csv 데이터 삽입
INSERT INTO "user" (user_id, type) VALUES
(1, 'many_many_personal'),
(2, 'many_many_basic'),
(3, 'many_few_personal'),
(4, 'many_few_basic'),
(5, 'few_few_personal'),
(6, 'few_few_basic'),
(7, 'many_many_personal'),
(8, 'many_many_basic'),
(9, 'many_few_personal'),
(10, 'many_few_basic'),
(11, 'few_few_personal'),
(12, 'few_few_basic'),
(13, 'many_many_personal'),
(14, 'many_many_basic'),
(15, 'many_few_personal'),
(16, 'many_few_basic'),
(17, 'few_few_personal'),
(18, 'few_few_basic');

-- 삽입된 데이터 확인
SELECT * FROM "user" ORDER BY user_id;
