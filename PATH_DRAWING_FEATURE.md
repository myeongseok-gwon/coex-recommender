# 이동 경로 그리기 기능 구현 완료

## 개요
사용자가 지도에서 이동 경로를 손으로 그리고, 그린 경로를 이미지로 저장하는 기능이 추가되었습니다.

## 주요 기능

### 1. 경로 그리기
- 지도 페이지에서 "✏️ 이동 경로 그리기" 버튼 클릭
- 마우스 드래그 또는 터치로 경로 그리기
- 여러 획(stroke)을 그릴 수 있음

### 2. 뒤로가기 (Undo)
- "↶ 뒤로가기" 버튼으로 최근 획 하나씩 삭제
- 현재 저장된 획 개수 표시

### 3. 저장하기
- "💾 저장하기" 버튼으로 경로 이미지 저장
- **2개의 이미지 생성**:
  1. **합성 이미지**: 지도 + 경로 (rgba(255, 82, 82, 0.5))
  2. **경로 이미지**: 투명 배경 + 경로만 (rgba(255, 82, 82, 0.8))
- 선 두께: 24px
- Supabase Storage에 자동 업로드
- 두 이미지 모두 user 테이블에 URL 저장

### 4. UI 개선
- 그리는 동안 부스 위치 마커는 투명도 0.3으로 흐리게 표시
- 저장된 경로가 있는 경우 "🔄 경로 다시 그리기" 버튼 표시
- 저장된 경로 이미지가 있으면 자동으로 표시

## 데이터베이스 변경사항

### 새 컬럼 추가
```sql
-- user 테이블에 경로 이미지 URL 컬럼 추가
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS path_image_url TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS path_drawing_url TEXT;
```

### 마이그레이션 실행
```bash
# Supabase SQL Editor에서 실행
psql -h your-db-host -U postgres -d postgres -f add-path-image-column.sql
```

또는 Supabase 대시보드의 SQL Editor에서 `add-path-image-column.sql` 파일의 내용을 직접 실행하세요.

## 코드 변경사항

### 1. TypeScript 타입 (`src/types/index.ts`)
```typescript
export interface User {
  // ... 기존 필드
  path_image_url?: string;  // 추가됨
}
```

### 2. Supabase 서비스 (`src/services/supabase.ts`)
```typescript
// uploadPathImages 함수 추가 (2개 이미지 업로드)
async uploadPathImages(
  userId: number, 
  compositeBlob: Blob, 
  drawingBlob: Blob
): Promise<{ compositeUrl: string; drawingUrl: string }>
```

### 3. MapPage 컴포넌트 (`src/components/MapPage.tsx`)
- 경로 그리기 상태 관리 (paths, currentPath, isDrawingMode)
- Canvas 기반 그리기 구현
- 마우스 및 터치 이벤트 핸들러
- 이미지 합성 및 업로드 로직

## 기술 스택

### Canvas API
- 두 개의 Canvas 레이어 사용:
  1. `canvasRef`: 저장된 경로들을 그림
  2. `drawingCanvasRef`: 현재 그리고 있는 경로를 실시간으로 그림

### 좌표 시스템
- 상대 좌표 (0-1 범위) 사용
- 이미지 크기가 변경되어도 경로가 정확히 표시됨

### 이미지 저장
1. **합성 이미지 생성**:
   - 지도 이미지 (naturalWidth/Height 크기)로 Canvas 생성
   - 지도 이미지를 Canvas에 그림
   - 경로를 Canvas에 오버레이로 그림 (rgba(255, 82, 82, 0.5), 24px)
   - Canvas를 PNG Blob으로 변환

2. **경로 이미지 생성**:
   - 투명 배경의 Canvas 생성 (같은 크기)
   - 경로만 Canvas에 그림 (rgba(255, 82, 82, 0.8), 24px)
   - Canvas를 PNG Blob으로 변환

3. **업로드**:
   - Supabase Storage에 두 이미지 업로드
   - user 테이블의 path_image_url, path_drawing_url 업데이트

## 사용자 워크플로우

1. 사용자가 지도 페이지 방문
2. "이동 경로 그리기" 버튼 클릭
3. 지도에 손가락/마우스로 경로 그리기
4. 실수한 획은 "뒤로가기" 버튼으로 삭제
5. 완료되면 "저장하기" 클릭
6. 저장 완료 후 경로가 포함된 지도 이미지 표시
7. 이후 지도 방문 시 저장된 경로 자동 표시

## 저장 위치

### Supabase Storage
- Bucket: `user-photos`
- Paths:
  1. `path-images/path_composite_user_{userId}_{timestamp}.png` (합성 이미지)
  2. `path-images/path_drawing_user_{userId}_{timestamp}.png` (경로 이미지)

### 데이터베이스
- Table: `user`
- Columns:
  1. `path_image_url` (TEXT): 지도+경로 합성 이미지 URL
  2. `path_drawing_url` (TEXT): 경로만 있는 이미지 URL

## 주의사항

1. **Storage Bucket 설정**: `user-photos` 버킷이 Supabase에 존재해야 합니다.
2. **Public Access**: 업로드된 이미지는 public URL로 접근 가능해야 합니다.
3. **RLS 정책**: 필요에 따라 Row Level Security 정책을 조정하세요.
4. **모바일 지원**: 터치 이벤트를 완전히 지원합니다.
5. **관리자 모드**: 관리자 모드에서는 경로 그리기 기능이 표시되지 않습니다.

## 테스트 체크리스트

- [ ] 경로 그리기 버튼이 표시되는지 확인
- [ ] 마우스로 경로를 그릴 수 있는지 확인
- [ ] 터치로 경로를 그릴 수 있는지 확인 (모바일)
- [ ] 뒤로가기 버튼이 작동하는지 확인
- [ ] 저장하기 버튼이 작동하는지 확인
- [ ] 저장된 이미지가 Supabase에 업로드되는지 확인
- [ ] 저장된 경로가 다시 방문 시 표시되는지 확인
- [ ] 그리는 동안 부스 마커가 흐리게 표시되는지 확인
- [ ] 경로 다시 그리기가 작동하는지 확인

## 터치 제스처 지원

- **한 손가락**: 경로 그리기 (패닝 차단)
- **두 손가락**: 핀치 줌으로 확대/축소
- 확대한 상태에서도 한 손가락으로 정확하게 그릴 수 있음
- `touch-action: pinch-zoom` 설정으로 핀치 줌만 허용

## 향후 개선 사항 (선택사항)

1. 경로 색상 선택 기능
2. 선 두께 조절 기능
3. 지우개 기능
4. 여러 경로 저장 및 관리
5. 경로 공유 기능
6. 경로 이미지를 별도로 다운로드하는 기능

