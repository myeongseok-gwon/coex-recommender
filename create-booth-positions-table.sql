-- booth_positions 테이블 생성
CREATE TABLE IF NOT EXISTS booth_positions (
  booth_id INTEGER PRIMARY KEY,
  x DECIMAL(10, 8) NOT NULL,
  y DECIMAL(10, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_booth_positions_booth_id ON booth_positions(booth_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE booth_positions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 생성
CREATE POLICY "Enable read access for all users" ON booth_positions
  FOR SELECT
  USING (true);

-- 모든 사용자가 삽입/업데이트/삭제할 수 있도록 정책 생성 (admin 체크는 앱 레벨에서)
CREATE POLICY "Enable insert access for all users" ON booth_positions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON booth_positions
  FOR UPDATE
  USING (true);

CREATE POLICY "Enable delete access for all users" ON booth_positions
  FOR DELETE
  USING (true);

