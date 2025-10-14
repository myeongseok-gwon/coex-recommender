# 🚀 배포 가이드

## 자동 배포 설정

### Option 1: Vercel (추천)

#### 1. GitHub 저장소 설정
1. GitHub에 저장소 생성
2. 코드 푸시:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/coex-recommender.git
git push -u origin main
```

3. GitHub Secrets 설정 (Settings → Secrets and variables → Actions):
   - `VITE_GEMINI_API_KEY`: Google Gemini API 키
   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anon 키
   - `VERCEL_TOKEN`: Vercel 계정 토큰
   - `VERCEL_ORG_ID`: Vercel 조직 ID
   - `VERCEL_PROJECT_ID`: Vercel 프로젝트 ID

#### 2. Vercel 설정
1. [Vercel](https://vercel.com/) 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭
4. GitHub 저장소 선택
5. 프로젝트 설정:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Environment Variables 설정:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

#### 3. Vercel 정보 확인
1. 프로젝트 Settings → General
2. Organization ID와 Project ID 복사
3. GitHub Secrets에 추가

### Option 2: GitHub Pages

#### 1. GitHub 저장소 설정
1. GitHub에 저장소 생성 및 코드 푸시
2. GitHub Secrets 설정:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

#### 2. GitHub Pages 활성화
1. 저장소 Settings → Pages
2. Source: GitHub Actions 선택
3. `deploy-github-pages.yml` 워크플로우 활성화

## 수동 배포

### Vercel CLI 사용
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 배포
vercel

# 환경 변수 설정
vercel env add VITE_GEMINI_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# 프로덕션 배포
vercel --prod
```

### 로컬 빌드 테스트
```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 미리보기
npm run preview
```

## Supabase 설정

### 1. 데이터베이스 스키마
Supabase SQL Editor에서 다음 스크립트를 순서대로 실행:

1. `supabase-schema.sql` - 테이블 생성
2. `add-photo-url-column.sql` - user 테이블에 photo_url 컬럼 추가
3. `add-evaluation-photo-url-column.sql` - evaluation 테이블에 photo_url 컬럼 추가
4. `insert-user-data.sql` 또는 `upsert-user-data.sql` - 사용자 데이터 삽입

### 2. Storage 버킷 생성
Supabase Dashboard → Storage에서:

1. 새 버킷 생성:
   - 이름: `user-photos`
   - Public 버킷으로 설정
   
2. 버킷 정책 설정 (Storage → Policies):
   ```sql
   -- 모든 사용자가 업로드 가능
   CREATE POLICY "Enable upload for all users"
   ON storage.objects FOR INSERT
   TO public
   WITH CHECK (bucket_id = 'user-photos');
   
   -- 모든 사용자가 읽기 가능
   CREATE POLICY "Enable read for all users"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'user-photos');
   ```

## 환경 변수 설정

### 로컬 개발
`.env` 파일 생성:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Vercel
Dashboard → Project → Settings → Environment Variables

### GitHub Actions
Repository → Settings → Secrets and variables → Actions

## 트러블슈팅

### 빌드 실패
1. 환경 변수 확인
2. Node.js 버전 확인 (18.x)
3. 의존성 설치 확인

### 배포 실패
1. Vercel 토큰 확인
2. GitHub Secrets 확인
3. 워크플로우 로그 확인

### 환경 변수 문제
1. `VITE_` 접두사 확인
2. 값에 특수문자 이스케이프
3. 따옴표 제거 확인
