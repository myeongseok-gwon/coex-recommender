-- user.csv 데이터를 user 테이블에 삽입하는 SQL
-- Supabase SQL Editor에서 실행하세요

-- 기존 데이터가 있다면 삭제 (선택사항)
-- DELETE FROM "user";

-- user.csv 데이터 삽입
-- Type A: Less questions, feed all to LLM (few_few)
-- Type B: Many questions, feed limited to LLM (many_few)
-- Type C: Many questions, feed all to LLM (many_many)
INSERT INTO "user" (user_id, type) VALUES
('1', 'A'),
('2', 'B'),
('3', 'C'),
('4', 'A'),
('5', 'B'),
('6', 'C'),
('7', 'A'),
('8', 'B'),
('9', 'C'),
('10', 'A'),
('11', 'B'),
('12', 'C'),
('13', 'A'),
('14', 'B'),
('15', 'C'),
('16', 'A'),
('17', 'B'),
('18', 'C');

-- 삽입된 데이터 확인
SELECT * FROM "user" ORDER BY user_id;
