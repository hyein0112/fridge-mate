#!/usr/bin/env python3
"""
만개의레시피 크롤링 데이터를 Supabase에 임포트하는 스크립트
"""

import json
import os
import sys
from supabase import create_client, Client
from typing import Dict, List, Any
import uuid

# FridgeMate 프로젝트 루트로 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def load_environment_variables():
    """환경 변수 로드"""
    try:
        from dotenv import load_dotenv
        # 여러 경로에서 .env 파일 찾기
        env_paths = [
            '.env.local',  # FridgeMate 프로젝트 루트
            '../.env.local',  # 상위 디렉토리
            os.path.join(os.path.dirname(__file__), '..', '.env.local'),  # 절대 경로
        ]
        
        loaded = False
        for env_path in env_paths:
            if os.path.exists(env_path):
                load_dotenv(env_path)
                loaded = True
                print(f"✅ 환경변수 파일 로드: {env_path}")
                break
        
        if not loaded:
            print("⚠️  .env.local 파일을 찾을 수 없습니다.")
            print("FridgeMate 프로젝트 루트에 .env.local 파일을 생성해주세요.")
            print("자세한 내용은 ENVIRONMENT_SETUP.md 파일을 참고하세요.")
            
    except ImportError:
        print("⚠️  python-dotenv 패키지가 설치되지 않았습니다.")
        print("pip install python-dotenv 명령으로 설치해주세요.")
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("\n❌ 환경 변수가 설정되지 않았습니다.")
        print("다음 환경변수를 설정해주세요:")
        print("  - NEXT_PUBLIC_SUPABASE_URL")
        print("  - SUPABASE_SERVICE_ROLE_KEY")
        print("\n설정 방법:")
        print("1. FridgeMate 프로젝트 루트에 .env.local 파일 생성")
        print("2. Supabase 대시보드에서 API 키 복사")
        print("3. ENVIRONMENT_SETUP.md 파일 참고")
        return None, None
    
    return supabase_url, supabase_key

def load_recipes_from_json(file_path: str = 'recipes.json') -> List[Dict[str, Any]]:
    """JSON 파일에서 레시피 데이터 로드"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"✅ {len(data)}개의 레시피를 로드했습니다.")
            return data
    except FileNotFoundError:
        print(f"❌ {file_path} 파일을 찾을 수 없습니다.")
        print("먼저 크롤러를 실행하여 데이터를 수집해주세요.")
        return []
    except json.JSONDecodeError:
        print(f"❌ {file_path} 파일 형식이 올바르지 않습니다.")
        return []

def convert_recipe_format(recipe: Dict[str, Any]) -> Dict[str, Any]:
    """크롤링된 레시피 데이터를 Supabase 형식으로 변환"""
    
    # 재료 데이터 변환 - 실제 크롤링된 구조에 맞게 수정
    ingredients = []
    if 'ingredients' in recipe:
        for ing in recipe['ingredients']:
            if isinstance(ing, dict):
                # "구매" 텍스트 제거하고 깔끔하게 정리
                ingredient_name = ing.get('name', '').replace('구매', '').strip()
                if ingredient_name:  # 빈 문자열이 아닌 경우만 추가
                    ingredients.append({
                        "name": ingredient_name,
                        "quantity": ing.get('quantity', ''),
                        "isAvailable": ing.get('isAvailable', False)
                    })
            elif isinstance(ing, str):
                # 문자열 형태의 재료를 파싱
                clean_name = ing.replace('구매', '').strip()
                if clean_name:
                    ingredients.append({
                        "name": clean_name,
                        "quantity": "",
                        "isAvailable": False
                    })
    
    # 조리법 데이터 변환
    instructions = []
    if 'instructions' in recipe:
        if isinstance(recipe['instructions'], list):
            instructions = recipe['instructions']
        elif isinstance(recipe['instructions'], str):
            instructions = [recipe['instructions']]
    
    # 조리시간 변환 (분 단위)
    cooking_time = 30  # 기본값
    if 'cookingTime' in recipe:
        cooking_time = int(recipe['cookingTime'])
    elif 'cooking_time' in recipe:
        time_str = str(recipe['cooking_time'])
        if '분' in time_str:
            cooking_time = int(time_str.replace('분', ''))
        elif time_str.isdigit():
            cooking_time = int(time_str)
    
    # 난이도 변환
    difficulty = 'medium'  # 기본값
    if 'difficulty' in recipe:
        diff = str(recipe['difficulty']).lower()
        if '초급' in diff or 'easy' in diff:
            difficulty = 'easy'
        elif '중급' in diff or 'medium' in diff:
            difficulty = 'medium'
        elif '고급' in diff or 'hard' in diff:
            difficulty = 'hard'
    
    # 인분 수 변환
    servings = 2  # 기본값
    if 'servings' in recipe:
        servings_str = str(recipe['servings'])
        if '인분' in servings_str:
            servings = int(servings_str.replace('인분', ''))
        elif servings_str.isdigit():
            servings = int(servings_str)
    
    return {
        "id": str(uuid.uuid4()),
        "name": recipe.get('name', '제목 없음'),  # 실제 크롤링된 데이터는 'name' 필드 사용
        "image": recipe.get('image', ''),  # 실제 크롤링된 데이터는 'image' 필드 사용
        "ingredients": json.dumps(ingredients),  # JSON 문자열로 변환
        "instructions": json.dumps(instructions),  # JSON 문자열로 변환
        "cooking_time": cooking_time,
        "difficulty": difficulty,
        "servings": servings,
        "tags": recipe.get('tags', []),  # 실제 태그 사용
        "created_by": "00000000-0000-0000-0000-000000000000"  # 임시 사용자 ID
    }

def import_recipes_to_supabase(supabase: Client, recipes: List[Dict[str, Any]]):
    """레시피를 Supabase에 임포트"""
    
    print(f"🔄 {len(recipes)}개의 레시피를 Supabase에 임포트 중...")
    
    success_count = 0
    error_count = 0
    
    for i, recipe in enumerate(recipes, 1):
        try:
            # 데이터 형식 변환
            converted_recipe = convert_recipe_format(recipe)
            
            # Supabase에 삽입
            result = supabase.table('recipes').insert(converted_recipe).execute()
            
            if result.data:
                success_count += 1
                print(f"✅ [{i}/{len(recipes)}] {converted_recipe['name']} - 성공")
            else:
                error_count += 1
                print(f"❌ [{i}/{len(recipes)}] {converted_recipe['name']} - 실패")
                
        except Exception as e:
            error_count += 1
            print(f"❌ [{i}/{len(recipes)}] {recipe.get('name', '제목 없음')} - 오류: {str(e)}")
        
        # API 요청 제한 방지
        import time
        time.sleep(0.1)
    
    print(f"\n📊 임포트 완료:")
    print(f"   성공: {success_count}개")
    print(f"   실패: {error_count}개")

def main():
    """메인 함수"""
    print("🚀 만개의레시피 데이터 Supabase 임포트 시작")
    print("=" * 50)
    
    # 환경 변수 로드
    supabase_url, supabase_key = load_environment_variables()
    if not supabase_url or not supabase_key:
        return
    
    # Supabase 클라이언트 생성
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Supabase 연결 성공")
    except Exception as e:
        print(f"❌ Supabase 연결 실패: {str(e)}")
        return
    
    # 레시피 데이터 로드
    recipes = load_recipes_from_json()
    if not recipes:
        return
    
    # 사용자 확인
    print(f"\n총 {len(recipes)}개의 레시피를 임포트합니다.")
    confirm = input("계속하시겠습니까? (y/N): ")
    if confirm.lower() != 'y':
        print("❌ 임포트가 취소되었습니다.")
        return
    
    # 레시피 임포트
    import_recipes_to_supabase(supabase, recipes)
    
    print("\n🎉 임포트가 완료되었습니다!")
    print("FridgeMate 앱에서 새로운 레시피들을 확인해보세요.")

if __name__ == "__main__":
    main() 