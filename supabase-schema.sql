-- Supabase 데이터베이스 스키마 설정

-- User 테이블 생성
CREATE TABLE IF NOT EXISTS "user" (
  user_id INTEGER PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('many_personal', 'few_personal', 'many_basic', 'few_basic')),
  age INTEGER,
  gender VARCHAR(10),
  company_name VARCHAR(255),
  work_experience INTEGER,
  expo_experience INTEGER,
  details TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  recommended_at TIMESTAMP WITH TIME ZONE,
  rec_result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evaluation 테이블 생성
CREATE TABLE IF NOT EXISTS "evaluation" (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  booth_id INTEGER NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, booth_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_type ON "user"(type);
CREATE INDEX IF NOT EXISTS idx_evaluation_user_id ON "evaluation"(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_booth_id ON "evaluation"(booth_id);

-- RLS (Row Level Security) 설정
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation" ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 설정 (실제 운영에서는 더 엄격한 정책 필요)
CREATE POLICY "Enable all operations for all users" ON "user" FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON "evaluation" FOR ALL USING (true);

-- updated_at 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_updated_at BEFORE UPDATE ON "evaluation" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
