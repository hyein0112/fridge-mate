# FridgeMate 🍳

냉장고 속 식재료로 AI가 맞춤 레시피를 추천해주는 올인원 요리 서비스

---

## 📝 소개

FridgeMate는 보유한 식재료를 등록하면, AI가 즉시 만들 수 있는 레시피를 추천해주고, 직접 레시피를 관리할 수 있는 서비스입니다. 관리자 기능을 통해 유저/레시피/활동도 한눈에 파악할 수 있습니다.

---

## 🚀 주요 기능

- **식재료 관리**: 내 식재료 등록/수정/삭제, 유통기한 관리
- **AI 레시피 추천**: Perplexity AI 기반, 내 재료로 만들 수 있는 요리 자동 추천
- **레시피 관리**: 직접 레시피 등록/수정/삭제, 상세 조리법/재료/팁 제공
- **이미지 자동 검색**: Unsplash API로 요리 이미지 자동 매칭
- **검색/필터**: 레시피명, 태그, 재료로 빠른 검색
- **관리자 대시보드**: 유저/레시피/활동 내역/통계 관리

---

## 🗂️ 전체 서비스 흐름

1. **회원가입/로그인**
2. **식재료 등록** (내 냉장고 관리)
3. **AI 레시피 추천** (내 재료로 만들 수 있는 요리 제안)
4. **레시피 상세/저장/수정/삭제**
5. **레시피/재료 검색**
6. **관리자**: 유저/레시피/통계/활동 관리

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Perplexity AI API
- **이미지**: Unsplash API
- **기타**: Vercel, PWA, 반응형 디자인

---

## 📁 폴더 구조 (주요)

```
fridge-mate/
  ├─ src/
  │   ├─ app/           # Next.js app router
  │   ├─ components/    # UI/공통 컴포넌트
  │   ├─ lib/           # DB, AI, Auth, 유틸
  │   ├─ types/         # 타입 정의
  │   └─ hooks/         # 커스텀 훅
  ├─ public/            # 정적 파일, 파비콘 등
  ├─ recipe-crawler/    # (크롤러/데이터 이관)
  ├─ README.md, ROADMAP.md
```

---

## ⚡ 설치 및 실행

1. **프로젝트 클론**
   ```bash
   git clone <repository-url>
   cd fridge-mate
   ```
2. **의존성 설치**
   ```bash
   npm install
   ```
3. **환경 변수 설정**
   `.env.local` 파일 생성 후 아래 항목 입력
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key
   NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
   ```
4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

---

## 🗄️ DB/환경 변수/초기 세팅

- Supabase에서 프로젝트 생성 후, [README 상단 user/ingredients/recipes 테이블 생성 SQL] 실행
- Perplexity/Unsplash API 키 발급 및 환경변수 등록

---

## 🖥️ 주요 화면/사용법

- **메인**: 내 식재료, AI 추천, 추천 레시피
- **식재료 관리**: `/ingredients`, `/my-ingredients`
- **레시피 관리**: `/recipe/new`, `/recipe/[id]`
- **검색**: `/search` (레시피명/재료/태그)
- **관리자**: `/admin` (유저/레시피/통계/활동)

---

## 🛡️ 관리자/운영 기능

- **user 테이블 기반 유저 관리**: 회원가입/로그인 시 자동 upsert, 관리자에서 목록/상세/통계 확인
- **레시피/검색/활동 추적**: (확장 가능)
- **Supabase 무료 플랜 호환**: Admin API 미사용, 자체 user 테이블로 모든 기능 구현

---

**FridgeMate** - 냉장고 속 재료로 맛있는 요리를 만들어보세요! 🍽️
