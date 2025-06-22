# FridgeMate 🍳

AI 기반 식재료 관리 및 레시피 추천 서비스

## 🚀 주요 기능

- **식재료 관리**: 보유한 식재료 등록 및 관리
- **AI 레시피 추천**: Perplexity AI를 활용한 맞춤형 레시피 생성
- **즉시 레시피 생성**: 보유 식재료로 AI가 즉시 레시피 생성 후 상세페이지 이동
- **레시피 관리**: 수동 레시피 등록 및 관리
- **부족한 재료 확인**: 레시피별 필요한 재료와 보유 재료 비교
- **레시피 상세 보기**: 완전한 조리법과 재료 정보 제공
- **스마트 이미지 검색**: Unsplash API를 통한 관련 음식 이미지 자동 검색

## 🛠 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **AI**: Perplexity AI API
- **UI**: shadcn/ui 컴포넌트
- **이미지**: Unsplash API (무료 이미지 검색)

## 📦 설치 및 실행

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd fridge-mate
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI 서비스 설정
NEXT_PUBLIC_PERPLEXITY_API_KEY=pplx-your-perplexity-api-key

# 이미지 검색 설정 (선택사항)
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

## 🔧 API 설정

### Perplexity AI 설정

1. [Perplexity AI](https://www.perplexity.ai/)에 가입
2. API 섹션에서 API 키 생성
3. API 키는 `pplx-`로 시작해야 함
4. `.env.local` 파일에 추가:
   ```env
   NEXT_PUBLIC_PERPLEXITY_API_KEY=pplx-your-api-key-here
   ```

**사용량**:

- 무료 티어: 월 5회 요청
- 유료 플랜: $5/월부터 (더 많은 요청 가능)

### Unsplash API 설정 (선택사항)

1. [Unsplash Developers](https://unsplash.com/developers)에서 계정 생성
2. 새 애플리케이션 생성하여 Access Key 발급
3. `.env.local` 파일에 추가:
   ```env
   NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
   ```

## 🗄 Supabase 설정

### 1. 프로젝트 생성

1. [Supabase](https://supabase.com/)에서 새 프로젝트 생성
2. 프로젝트 URL과 anon key 복사

### 2. 데이터베이스 테이블 생성

SQL Editor에서 다음 쿼리 실행:

```sql
-- 식재료 테이블
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity TEXT,
  category TEXT,
  expiry_date DATE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 레시피 테이블
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  cooking_time INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  servings INTEGER NOT NULL,
  tags TEXT[],
  nutrition_info JSONB,
  tips TEXT[],
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 임시 정책 (모든 사용자가 모든 데이터에 접근 가능)
CREATE POLICY "Allow all operations for all users" ON ingredients FOR ALL USING (true);
CREATE POLICY "Allow all operations for all users" ON recipes FOR ALL USING (true);
```

### 3. 샘플 데이터 추가

```sql
-- 샘플 식재료 추가
INSERT INTO ingredients (name, quantity, category, user_id) VALUES
('감자', '3개', '채소', '00000000-0000-0000-0000-000000000000'),
('양파', '2개', '채소', '00000000-0000-0000-0000-000000000000'),
('계란', '6개', '단백질', '00000000-0000-0000-0000-000000000000'),
('당근', '2개', '채소', '00000000-0000-0000-0000-000000000000'),
('닭고기', '500g', '육류', '00000000-0000-0000-0000-000000000000');

-- 샘플 레시피 추가
INSERT INTO recipes (name, ingredients, instructions, cooking_time, difficulty, servings, tags, created_by) VALUES
('감자 튀김',
 '[{"name": "감자", "quantity": "3개", "isAvailable": true}, {"name": "식용유", "quantity": "적당량", "isAvailable": false}]',
 '["감자를 깨끗이 씻어 껍질을 벗깁니다.", "감자를 적당한 크기로 썰어줍니다.", "식용유를 180도로 가열합니다.", "감자를 넣어 노릇노릇하게 튀겨줍니다."]',
 30, 'easy', 2, ARRAY['튀김', '간식'], '00000000-0000-0000-0000-000000000000');
```

## 🎯 사용법

### 메인 페이지 (`/`)

- **보유 식재료 확인**: 등록된 식재료 목록 표시
- **AI 레시피 추천**: "AI로 레시피 추천받기" 버튼으로 즉시 레시피 생성
- **추천 레시피 목록**: 기존 레시피들 표시

### AI 레시피 추천 기능

1. **식재료 등록**: `/ingredients`에서 식재료 추가
2. **AI 추천**: 메인 페이지에서 "AI로 레시피 추천받기" 버튼 클릭
3. **자동 생성**: AI가 보유 식재료로 맞춤형 레시피 생성
4. **자동 저장**: 생성된 레시피를 데이터베이스에 자동 저장
5. **상세페이지 이동**: 생성 완료 후 바로 레시피 상세페이지로 이동

### 식재료 관리

- `/ingredients`: 새 식재료 등록
- `/my-ingredients`: 보유 식재료 목록 및 관리

### 레시피 관리

- `/recipe/new`: 수동 레시피 등록
- `/recipe/[id]`: 레시피 상세 보기 (AI 생성 또는 수동 등록)

### API 테스트

- `/api-test`: Perplexity API 연동 상태 확인 및 테스트

## 🤖 AI 기능

### Perplexity AI 특징

- **실시간 레시피 생성**: 식재료 기반 맞춤형 레시피
- **즉시 응답**: 버튼 클릭 후 바로 레시피 생성
- **자동 저장**: 생성된 레시피를 데이터베이스에 자동 저장
- **창의적 레시피**: 기존에 흔하지 않은 독특한 요리 생성
- **상세한 조리법**: 시간, 온도, 순서 등 구체적인 조리 방법 제공
- **한국어 최적화**: 모든 조리 용어와 설명을 한국어로 작성

### AI 기능 특징

- **다양한 난이도**: 쉬움/보통/어려움
- **개인화**: 식이 제한, 선호 요리 종류 반영
- **상세 정보**: 영양 정보, 조리 시간, 팁 포함
- **JSON 응답**: 구조화된 데이터로 안정적 파싱
- **강화된 오류 처리**: JSON 파싱 실패 시 기본 레시피 제공

## 🖼️ 이미지 기능

### Unsplash 이미지 검색

- **스마트 검색**: 레시피 이름과 재료 기반 관련 이미지 검색
- **조리법별 최적화**: 볶음, 구이, 찌개 등 조리법에 따른 검색어 자동 생성
- **적절성 필터링**: 부적절한 이미지 자동 필터링
- **무료 사용**: 저작권 문제 없는 무료 이미지 제공

## 📱 반응형 디자인

- **모바일**: 320px ~ 768px
- **태블릿**: 768px ~ 1024px
- **데스크탑**: 1024px 이상

## 🚀 배포

### Vercel 배포 (권장)

1. [Vercel](https://vercel.com)에 가입
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 배포 완료

### 환경 변수 설정 (배포 시)

Vercel 대시보드에서 다음 환경 변수 설정:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

## 🔮 개발 로드맵

### ✅ 완료된 기능

- [x] Next.js 14 + TypeScript 프로젝트 설정
- [x] Tailwind CSS + shadcn/ui UI 프레임워크
- [x] 반응형 네비게이션
- [x] Supabase 데이터베이스 연동
- [x] Perplexity AI 서비스 구현
- [x] 실제 데이터 연동
- [x] CRUD 기능 완전 구현
- [x] 로딩 상태 및 에러 처리
- [x] 레시피 상세 페이지
- [x] AI 레시피 생성 및 이미지 검색

### 🔄 진행 예정 기능

- [ ] 사용자 인증 시스템
- [ ] 실시간 기능 (Supabase Realtime)
- [ ] 이미지 업로드 기능
- [ ] 검색 및 필터링
- [ ] 다크 모드
- [ ] PWA 지원

## 🐛 문제 해결

### AI 서비스 오류

- API 키가 올바르게 설정되었는지 확인
- 네트워크 연결 상태 확인
- API 사용량 한도 확인

### 데이터베이스 오류

- Supabase 프로젝트 상태 확인
- RLS 정책 설정 확인
- 테이블 구조 확인

### 이미지 검색 오류

- Unsplash API 키 설정 확인
- 네트워크 연결 상태 확인
- 검색어 형식 확인

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**FridgeMate** - 냉장고 속 재료로 맛있는 요리를 만들어보세요! 🍽️
