# 환경 변수 설정 가이드

## Supabase 설정
1. Supabase 프로젝트에서 Vector 확장 활성화
2. `setup-vector-search.sql` 스크립트 실행
3. Service Role Key 생성

## OpenAI 설정
1. OpenAI API 키 생성
2. 환경 변수에 추가

## 환경 변수 파일 (.env)
```
# Supabase
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Gemini (기존)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 설치 및 실행
1. 패키지 설치: `npm install`
2. 임베딩 생성: `npm run create-embeddings`
3. 개발 서버 실행: `npm run dev`
