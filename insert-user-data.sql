-- user.csv 데이터를 user 테이블에 삽입하는 SQL
-- Supabase SQL Editor에서 실행하세요

-- 기존 데이터가 있다면 삭제 (선택사항)
-- DELETE FROM "user";

-- user.csv 데이터 삽입
-- Type A: Less questions, feed all to LLM (few_few)
-- Type B: Many questions, feed limited to LLM (many_few)
-- Type C: Many questions, feed all to LLM (many_many)
INSERT INTO "user" (user_id, type) VALUES
('THA1', 'A'),
('THB1', 'B'),
('THC1', 'C'),
('THA2', 'A'),
('THB2', 'B'),
('THC2', 'C'),
('THA3', 'A'),
('THB3', 'B'),
('THC3', 'C'),
('THA4', 'A'),
('THB4', 'B'),
('THC4', 'C'),
('THA5', 'A'),
('THB5', 'B'),
('THC5', 'C'),
('THA6', 'A'),
('THB6', 'B'),
('THC6', 'C'),
('THA7', 'A'),
('THB7', 'B'),
('THC7', 'C'),
('THA8', 'A'),
('THB8', 'B'),
('THC8', 'C'),
('THA9', 'A'),
('THB9', 'B'),
('THC9', 'C'),
('THA10', 'A'),
('THB10', 'B'),
('THC10', 'C');
('THA11', 'A'),
('THB11', 'B'),
('THC11', 'C'),
('THA12', 'A'),
('THB12', 'B'),
('THC12', 'C'),
('THA13', 'A'),
('THB13', 'B'),
('THC13', 'C'),
('THA14', 'A'),
('THB14', 'B'),
('THC14', 'C'),
('THA15', 'A'),
('THB15', 'B'),
('THC15', 'C'),
('THA16', 'A'),
('THB16', 'B'),
('THC16', 'C');

-- 삽입된 데이터 확인
SELECT * FROM "user" ORDER BY user_id;
