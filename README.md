# COEX 추천 시스템

모바일 기기용 전시회 부스 추천 웹 애플리케이션입니다.

## 기능

1. **사용자 인증**: 미리 정의된 사용자 ID로 로그인
2. **사용자 정보 입력**: 사용자 타입에 따른 차별화된 폼
3. **AI 추천**: Google Gemini API를 활용한 맞춤형 부스 추천
4. **부스 평가**: 부스 방문 및 만족도 평가 시스템

## 기술 스택

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Styling**: CSS (모바일 최적화)

## 설치 및 실행

1. 의존성 설치
```bash
npm install
```

2. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 입력하세요:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. Supabase 데이터베이스 설정
`supabase-schema.sql` 파일의 내용을 Supabase SQL 에디터에서 실행하세요.

4. 개발 서버 실행
```bash
npm run dev
```

## 사용자 타입

- **many_personal**: 상세한 개인 정보 + rationale 기반 추천
- **few_personal**: 기본 개인 정보 + rationale 기반 추천
- **many_basic**: 상세한 개인 정보 + company_description 기반 추천
- **few_basic**: 기본 개인 정보 + company_description 기반 추천

## 데이터베이스 스키마

### User 테이블
- `user_id`: 사용자 ID (Primary Key)
- `type`: 사용자 타입
- `age`: 나이
- `gender`: 성별
- `company_name`: 회사명 (many_ 타입만)
- `work_experience`: 근무 경력 (many_ 타입만)
- `expo_experience`: 전시회 경험 (many_ 타입만)
- `details`: 기대사항 및 선호도
- `started_at`: 시작 시간
- `ended_at`: 종료 시간
- `recommended_at`: 추천 완료 시간
- `rec_result`: 추천 결과 (JSON)

### Evaluation 테이블
- `id`: 평가 ID (Primary Key)
- `user_id`: 사용자 ID (Foreign Key)
- `booth_id`: 부스 ID
- `rating`: 평점 (1-5)
- `started_at`: 평가 시작 시간
- `ended_at`: 평가 종료 시간

## 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── LandingPage.tsx
│   ├── UserFormPage.tsx
│   ├── LoadingPage.tsx
│   ├── RecommendationsPage.tsx
│   └── BoothDetailPage.tsx
├── services/           # API 서비스
│   ├── supabase.ts
│   └── llm.ts
├── types/              # TypeScript 타입 정의
│   └── index.ts
├── utils/              # 유틸리티 함수
│   └── dataLoader.ts
├── data/               # 정적 데이터
│   └── boothData.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 주요 기능 설명

### 1. 랜딩 페이지
- 유효한 사용자 ID (1-16) 입력
- 사용자 검증 후 started_at 업데이트

### 2. 사용자 정보 입력
- 사용자 타입에 따른 차별화된 폼
- many_ 타입: 추가 정보 (회사명, 경력, 전시회 경험) 입력
- few_ 타입: 기본 정보만 입력

### 3. AI 추천
- Google Gemini API를 사용한 부스 추천
- 사용자 정보를 기반으로 한 맞춤형 추천
- 추천 결과를 데이터베이스에 저장

### 4. 추천 결과
- personal 타입: rationale 기반 설명
- basic 타입: company_description 기반 설명

### 5. 부스 상세 및 평가
- 부스 상세 정보 표시
- 방문 시작/종료 기능
- 5점 만점 평가 시스템

## 모바일 최적화

- 반응형 디자인 (최대 너비 400px)
- 터치 친화적 UI
- 로딩 스피너 및 사용자 피드백
- 모달 및 팝업 최적화
