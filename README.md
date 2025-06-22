# FridgeMate 🍳

보유한 식재료로 만들 수 있는 레시피를 추천받고, AI와 함께 새로운 요리를 만들어보는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **식재료 관리**: 보유한 식재료를 등록하고 유통기한 관리
- **레시피 추천**: 보유 식재료 기반 레시피 추천
- **AI 레시피 생성**: AI를 활용한 맞춤형 레시피 생성
- **모바일 반응형**: 모든 디바이스에서 최적화된 사용자 경험
- **실시간 데이터**: Supabase를 통한 실시간 데이터 동기화

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Vercel (권장)

## 📦 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd fridge-mate
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 Supabase 설정을 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Supabase 설정

자세한 설정 방법은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참조하세요.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

## 🗄️ 데이터베이스 구조

### ingredients 테이블

- `id`: UUID (Primary Key)
- `name`: 식재료명 (TEXT)
- `quantity`: 수량 (TEXT)
- `category`: 카테고리 (TEXT)
- `expiry_date`: 유통기한 (DATE)
- `user_id`: 사용자 ID (UUID)
- `created_at`: 생성일시 (TIMESTAMP)

### recipes 테이블

- `id`: UUID (Primary Key)
- `name`: 레시피명 (TEXT)
- `image`: 이미지 URL (TEXT)
- `ingredients`: 재료 목록 (JSON)
- `instructions`: 조리법 (JSON)
- `cooking_time`: 조리시간 (INTEGER)
- `difficulty`: 난이도 (easy/medium/hard)
- `servings`: 인분수 (INTEGER)
- `tags`: 태그 (TEXT[])
- `created_by`: 작성자 ID (UUID)
- `created_at`: 생성일시 (TIMESTAMP)

## 🎨 주요 페이지

- **메인 페이지** (`/`): 식재료 요약 및 추천 레시피
- **식재료 등록** (`/ingredients`): 새로운 식재료 추가
- **내 식재료** (`/my-ingredients`): 보유 식재료 관리
- **레시피 등록** (`/recipe/new`): 새 레시피 추가 및 AI 생성

## 🤖 AI 기능

### 현재 지원하는 AI 서비스

- **Hugging Face Inference API** (무료)
- **OpenAI GPT** (유료)
- **Claude API** (유료)

### AI 레시피 생성 설정

`src/services/ai.ts` 파일에서 AI 서비스 설정:

```typescript
// 환경 변수에 API 키 추가
OPENAI_API_KEY = your_openai_api_key;
HUGGINGFACE_API_KEY = your_huggingface_api_key;
ANTHROPIC_API_KEY = your_anthropic_api_key;
```

## 📱 반응형 디자인

- **모바일**: 320px ~ 768px
- **태블릿**: 768px ~ 1024px
- **데스크탑**: 1024px 이상

## 🚀 배포

### Vercel 배포 (권장)

1. [Vercel](https://vercel.com)에 가입
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포

### 수동 배포

```bash
npm run build
npm start
```

## 🔧 개발 가이드

### 새로운 기능 추가

1. `src/types/index.ts`에 타입 정의
2. `src/lib/database.ts`에 데이터베이스 함수 추가
3. `src/components/`에 UI 컴포넌트 생성
4. `src/app/`에 페이지 추가

### 스타일 가이드

- Tailwind CSS 클래스 사용
- shadcn/ui 컴포넌트 활용
- 일관된 색상 팔레트 (orange-500, gray-900 등)

---

**FridgeMate** - 냉장고 속 재료로 맛있는 요리를 만들어보세요! 🍽️
