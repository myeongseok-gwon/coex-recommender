# 환경 변수 설정 가이드

## .env 파일 생성
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gemini (기존 추천 시스템용)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Supabase Edge Function 환경 변수 설정
Supabase 프로젝트의 Edge Functions에서 다음 환경 변수를 설정하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## 설정 방법

### 1. Supabase 프로젝트 설정
1. Supabase 대시보드 → Settings → API
2. Project URL과 anon public key 복사
3. `.env` 파일에 추가

### 2. Supabase Edge Function 배포
1. Supabase CLI 설치: `npm install -g supabase`
2. 프로젝트 로그인: `supabase login`
3. 프로젝트 링크: `supabase link --project-ref your-project-id`
4. Edge Function 배포: `supabase functions deploy generate-embedding`
5. 환경 변수 설정: `supabase secrets set OPENAI_API_KEY=your_openai_api_key`

### 3. Vector 확장 활성화
1. Supabase 대시보드 → Database → Extensions
2. "vector" 확장 검색 후 활성화
3. `setup-vector-search.sql` 스크립트 실행

### 4. 임베딩 생성
```bash
npm run create-embeddings
```

## 보안 주의사항
- OpenAI API 키는 절대 브라우저에 노출되지 않도록 Supabase Edge Function에서만 사용
- `.env` 파일은 `.gitignore`에 포함되어 있어야 함
- 프로덕션 환경에서는 Supabase의 Row Level Security (RLS) 활성화 권장
