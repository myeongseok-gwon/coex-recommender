-- GPS Locations 테이블 추가 (실시간 위치 데이터)
CREATE TABLE IF NOT EXISTS "gps_locations" (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy FLOAT,
  timestamp BIGINT NOT NULL,
  altitude FLOAT,
  speed FLOAT,
  heading FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_gps_locations_user_id ON "gps_locations"(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_locations_timestamp ON "gps_locations"(timestamp);
CREATE INDEX IF NOT EXISTS idx_gps_locations_created_at ON "gps_locations"(created_at);

-- RLS (Row Level Security) 설정
ALTER TABLE "gps_locations" ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 설정
CREATE POLICY "Enable all operations for all users" ON "gps_locations" FOR ALL USING (true);
