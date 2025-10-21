# 🔧 Supabase 테이블 설정 가이드

## ❌ 발생한 문제

```
❌ 배치 업로드 오류: 
'invalid input syntax for type integer: "A8701"'
```

**원인**: `booth_positions` 테이블의 `booth_id`가 **INTEGER** 타입으로 되어 있어서 문자열(A8701, B5678)을 저장할 수 없습니다.

---

## ✅ 해결 방법

### 방법 1: Supabase SQL Editor 사용 (추천) ⭐

1. **Supabase Dashboard 열기**
   - https://app.supabase.com 로그인
   - 프로젝트 선택

2. **SQL Editor로 이동**
   - 왼쪽 메뉴에서 **SQL Editor** 클릭

3. **마이그레이션 SQL 실행**
   - **New Query** 클릭
   - 아래 SQL을 복사/붙여넣기
   - **Run** 클릭

```sql
-- booth_positions 테이블을 VARCHAR 타입으로 재생성

-- 1. 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS booth_positions CASCADE;

-- 2. 새로운 테이블 생성 (booth_id를 VARCHAR로!)
CREATE TABLE booth_positions (
  booth_id VARCHAR(10) PRIMARY KEY,
  x REAL NOT NULL CHECK (x >= 0 AND x <= 1),
  y REAL NOT NULL CHECK (y >= 0 AND y <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX idx_booth_positions_booth_id ON booth_positions(booth_id);

-- 4. RLS 설정
ALTER TABLE booth_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" 
  ON booth_positions FOR ALL USING (true);

-- 5. 트리거 (updated_at 자동 업데이트)
CREATE TRIGGER update_booth_positions_updated_at 
  BEFORE UPDATE ON booth_positions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

4. **성공 확인**
   - "Success. No rows returned" 메시지가 나타나면 성공!

---

### 방법 2: 로컬 SQL 파일 실행

프로젝트 루트에 있는 마이그레이션 파일을 실행하세요:

```bash
# Supabase CLI 사용 (설치되어 있다면)
supabase db push

# 또는 파일 내용을 복사해서 SQL Editor에 붙여넣기
cat migrate-booth-positions-to-varchar.sql
```

---

## 📤 데이터 업로드 (테이블 생성 후)

테이블을 생성한 후, 다시 업로드를 시도하세요:

### Python 스크립트 사용
```bash
cd raw
python3 4_upload_to_supabase.py
```

### 수동 업로드 (GUI)

1. **Table Editor로 이동**
   - Supabase Dashboard → **Table Editor**
   - `booth_positions` 테이블 선택

2. **데이터 Import**
   - **Insert** 버튼 클릭
   - **Insert via spreadsheet** 선택
   - `raw/extracted_booths_final.json` 파일 내용 복사
   - 붙여넣기

3. **또는 SQL로 직접 Insert**
   - SQL Editor에서 아래 예시처럼 실행:

```sql
INSERT INTO booth_positions (booth_id, x, y) VALUES
  ('A8701', 0.63448, 0.614775),
  ('A8206', 0.691583, 0.832032),
  ('A8211', 0.663061, 0.815472)
  -- ... 나머지 데이터
ON CONFLICT (booth_id) DO UPDATE
  SET x = EXCLUDED.x, y = EXCLUDED.y, updated_at = NOW();
```

---

## 🔍 테이블 확인

### 테이블 구조 확인
```sql
-- 테이블 정보 조회
SELECT 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'booth_positions';
```

**예상 결과**:
```
booth_id   | character varying | 10
x          | real              | 
y          | real              |
created_at | timestamp with time zone |
updated_at | timestamp with time zone |
```

### 데이터 확인
```sql
-- 업로드된 데이터 확인
SELECT COUNT(*) FROM booth_positions;  -- 420개 예상
SELECT * FROM booth_positions LIMIT 10;
```

---

## ⚠️ 주의사항

### 기존 데이터가 있는 경우

만약 booth_positions 테이블에 이미 데이터가 있다면 백업 후 진행하세요:

```sql
-- 1. 백업 테이블 생성
CREATE TABLE booth_positions_backup AS 
  SELECT * FROM booth_positions;

-- 2. 데이터 확인
SELECT * FROM booth_positions_backup;

-- 3. 마이그레이션 진행 (위의 DROP TABLE ... 부분 실행)
```

### evaluation 테이블도 수정 필요

`evaluation` 테이블의 `booth_id`도 VARCHAR로 변경해야 합니다:

```sql
-- evaluation 테이블 확인
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'evaluation' AND column_name = 'booth_id';

-- booth_id가 integer라면 변경 필요
-- ⚠️ 데이터가 있다면 반드시 백업!

-- 백업
CREATE TABLE evaluation_backup AS SELECT * FROM evaluation;

-- 타입 변경 (데이터가 없는 경우)
ALTER TABLE evaluation DROP COLUMN booth_id;
ALTER TABLE evaluation ADD COLUMN booth_id VARCHAR(10) NOT NULL;

-- Foreign Key가 있다면 재생성 필요
```

---

## ✅ 완료 체크리스트

- [ ] `booth_positions` 테이블 생성 (booth_id VARCHAR)
- [ ] 420개 booth 데이터 업로드 완료
- [ ] `SELECT COUNT(*) FROM booth_positions` = 420 확인
- [ ] `evaluation` 테이블 booth_id도 VARCHAR 확인
- [ ] MapPage에서 지도와 마커 표시 확인

---

## 🆘 문제 해결

### Q: "relation booth_positions does not exist"
A: 테이블이 아직 생성되지 않았습니다. 위의 SQL을 실행하세요.

### Q: "permission denied for table booth_positions"
A: RLS 정책이 잘못 설정되었습니다. POLICY 부분을 다시 실행하세요.

### Q: 데이터 업로드 후에도 지도에 마커가 안 보여요
A: 브라우저 캐시를 지우고 새로고침하세요 (Cmd+Shift+R).

### Q: 일부 booth만 업로드되었어요
A: 
1. 업로드 로그 확인
2. 에러가 있는 booth ID 확인
3. 해당 booth만 수동으로 관리자 모드에서 입력

---

**작성일**: 2025-10-21  
**버전**: v1.0

