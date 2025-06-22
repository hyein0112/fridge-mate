# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 로그인
2. "New Project" 클릭
3. 프로젝트 이름: `fridge-mate`
4. 데이터베이스 비밀번호 설정
5. 지역 선택 (가까운 지역 선택)
6. "Create new project" 클릭

## 2. 환경 변수 설정

프로젝트가 생성되면 Settings > API에서 다음 정보를 확인:

1. Project URL 복사
2. anon public key 복사

`.env.local` 파일을 생성하고 다음 내용 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. 데이터베이스 테이블 생성

### ingredients 테이블

SQL Editor에서 다음 SQL 실행:

```sql
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity TEXT,
  category TEXT,
  expiry_date DATE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (임시로 모든 사용자가 모든 데이터에 접근 가능)
CREATE POLICY "Allow all operations for all users" ON ingredients
  FOR ALL USING (true);
```

### recipes 테이블

```sql
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  ingredients TEXT NOT NULL, -- JSON string
  instructions TEXT NOT NULL, -- JSON string
  cooking_time INTEGER NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  servings INTEGER NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 정책 생성
CREATE POLICY "Allow all operations for all users" ON recipes
  FOR ALL USING (true);
```

## 4. 테스트 데이터 추가 (선택사항)

### 샘플 식재료 추가

```sql
INSERT INTO ingredients (name, quantity, category, user_id) VALUES
('감자', '3개', '야채', '00000000-0000-0000-0000-000000000000'),
('양파', '2개', '야채', '00000000-0000-0000-0000-000000000000'),
('계란', '6개', '유제품', '00000000-0000-0000-0000-000000000000'),
('돼지고기', '300g', '육류', '00000000-0000-0000-0000-000000000000');
```

### 샘플 레시피 추가

```sql
INSERT INTO recipes (name, image, ingredients, instructions, cooking_time, difficulty, servings, tags, created_by) VALUES
(
  '감자 양파 스크램블 에그',
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop',
  '["감자 2개", "양파 1개", "계란 3개", "버터 1큰술"]',
  '["감자를 깍둑썰기하여 준비합니다.", "양파를 다져서 준비합니다.", "팬에 버터를 녹이고 감자를 볶습니다.", "양파를 추가하여 볶습니다.", "계란을 깨서 넣고 스크램블합니다."]',
  20,
  'easy',
  2,
  ARRAY['한식', '간단', '아침'],
  '00000000-0000-0000-0000-000000000000'
);
```

## 5. 애플리케이션 테스트

1. 개발 서버 재시작: `npm run dev`
2. 브라우저에서 애플리케이션 접속
3. 식재료 추가/삭제 기능 테스트
4. 레시피 등록 기능 테스트

## 6. 다음 단계

- 사용자 인증 시스템 추가
- 실시간 기능 구현
- 이미지 업로드 기능
- AI 레시피 생성 기능 연동
