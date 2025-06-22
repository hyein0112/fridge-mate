# 만개의레시피 크롤러

만개의레시피 사이트에서 레시피 데이터를 수집하는 Python 크롤러입니다.

## 설치 및 실행

### 1. 가상환경 설정 (필수)

macOS에서 Python 패키지 설치 시 "externally-managed-environment" 오류가 발생할 수 있습니다. 가상환경을 사용하여 해결합니다:

```bash
# 가상환경 생성
python3 -m venv recipe-crawler-env

# 가상환경 활성화
source recipe-crawler-env/bin/activate

# 패키지 설치
pip install -r requirements.txt
```

### 2. 크롤러 실행

```bash
# 가상환경이 활성화된 상태에서
python main.py
```

### 3. 가상환경 비활성화

```bash
deactivate
```

## 기능

- 만개의레시피에서 인기 레시피 50개 수집
- 레시피 제목, 재료, 조리법, 조리시간, 난이도 등 수집
- JSON 형태로 데이터 저장
- 중복 방지 및 에러 처리

## 수집되는 데이터

- 레시피 제목
- 재료 목록 (이름, 양)
- 조리 단계
- 조리시간
- 난이도
- 인분 수
- 이미지 URL

## 출력 파일

- `recipes.json`: 수집된 레시피 데이터
- `recipes.csv`: CSV 형태의 레시피 데이터

## 수집된 레시피 사용 방법

### 1. FridgeMate 프로젝트에 데이터 추가

수집된 레시피를 FridgeMate 데이터베이스에 추가하는 방법:

#### 방법 1: Supabase SQL 에디터 사용

1. `recipes.json` 파일을 열어서 데이터 확인
2. Supabase 대시보드 → SQL 에디터
3. 각 레시피를 `recipes` 테이블에 INSERT

```sql
-- 예시: 레시피 추가
INSERT INTO recipes (id, title, description, ingredients, instructions, cooking_time, difficulty, servings, image_url, created_by)
VALUES (
  gen_random_uuid(),
  '김치찌개',
  '매콤달콤한 김치찌개',
  '[{"name": "김치", "quantity": "300g"}, {"name": "돼지고기", "quantity": "200g"}]',
  '["김치를 썰어주세요", "돼지고기를 넣고 볶아주세요"]',
  30,
  'easy',
  2,
  'https://example.com/image.jpg',
  '00000000-0000-0000-0000-000000000000'
);
```

#### 방법 2: 데이터 임포트 스크립트 사용

크롤러 폴더에 데이터 임포트 스크립트를 실행:

```bash
# FridgeMate 프로젝트 루트에서
cd recipe-crawler
python import_to_supabase.py
```

### 2. 데이터 형식 변환

수집된 데이터를 FridgeMate 형식에 맞게 변환:

```python
# recipes.json → Supabase 형식 변환
{
  "id": "자동 생성 UUID",
  "title": "레시피 제목",
  "description": "레시피 설명",
  "ingredients": [
    {"name": "재료명", "quantity": "양"}
  ],
  "instructions": ["조리 단계 1", "조리 단계 2"],
  "cooking_time": 30,
  "difficulty": "easy/medium/hard",
  "servings": 2,
  "image_url": "이미지 URL",
  "created_by": "사용자 ID"
}
```

### 3. FridgeMate에서 활용

- **메인 페이지**: 수집된 레시피가 추천 레시피로 표시
- **레시피 검색**: 제목, 재료로 검색 가능
- **AI 레시피 생성**: 기존 레시피를 참고하여 새로운 레시피 생성
- **재료 매칭**: 보유 재료와 레시피 재료 매칭

## 문제 해결

### "externally-managed-environment" 오류

macOS에서 발생하는 경우:

```bash
# 가상환경 사용 (권장)
python3 -m venv recipe-crawler-env
source recipe-crawler-env/bin/activate
pip install -r requirements.txt

# 또는 pipx 사용
brew install pipx
pipx install requests beautifulsoup4

# 또는 Homebrew 사용
brew install python-requests python-beautifulsoup4
```

### 기타 문제

- 인터넷 연결 확인
- Python 3.7 이상 버전 사용
- 필요한 패키지가 모두 설치되었는지 확인
