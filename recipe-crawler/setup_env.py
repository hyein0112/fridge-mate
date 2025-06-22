#!/usr/bin/env python3
"""
환경변수 설정 도우미 스크립트
"""

import os
import sys

def create_env_file():
    """환경변수 파일 생성"""
    
    print("🚀 FridgeMate 환경변수 설정 도우미")
    print("=" * 50)
    
    # FridgeMate 프로젝트 루트 경로 찾기
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    env_file_path = os.path.join(project_root, '.env.local')
    
    print(f"프로젝트 루트: {project_root}")
    print(f"환경변수 파일: {env_file_path}")
    
    # 파일이 이미 존재하는지 확인
    if os.path.exists(env_file_path):
        print(f"\n⚠️  {env_file_path} 파일이 이미 존재합니다.")
        overwrite = input("덮어쓰시겠습니까? (y/N): ")
        if overwrite.lower() != 'y':
            print("❌ 설정이 취소되었습니다.")
            return
    
    print("\n📝 Supabase 설정 정보를 입력해주세요.")
    print("(Supabase 대시보드 → Settings → API에서 확인 가능)")
    
    # 사용자 입력 받기
    supabase_url = input("\n1. Project URL (예: https://your-project.supabase.co): ").strip()
    if not supabase_url:
        print("❌ Project URL을 입력해주세요.")
        return
    
    supabase_anon_key = input("\n2. anon public key: ").strip()
    if not supabase_anon_key:
        print("❌ anon public key를 입력해주세요.")
        return
    
    supabase_service_key = input("\n3. service_role secret key: ").strip()
    if not supabase_service_key:
        print("❌ service_role secret key를 입력해주세요.")
        return
    
    # AI API 키 (선택사항)
    print("\n🤖 AI API 키 설정 (선택사항)")
    perplexity_key = input("Perplexity API Key (Enter로 건너뛰기): ").strip()
    openai_key = input("OpenAI API Key (Enter로 건너뛰기): ").strip()
    
    # 환경변수 파일 생성
    env_content = f"""# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL={supabase_url}
NEXT_PUBLIC_SUPABASE_ANON_KEY={supabase_anon_key}
SUPABASE_SERVICE_ROLE_KEY={supabase_service_key}

# AI Configuration (선택사항)
"""
    
    if perplexity_key:
        env_content += f"PERPLEXITY_API_KEY={perplexity_key}\n"
    
    if openai_key:
        env_content += f"OPENAI_API_KEY={openai_key}\n"
    
    try:
        with open(env_file_path, 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print(f"\n✅ 환경변수 파일이 생성되었습니다: {env_file_path}")
        print("\n📋 다음 단계:")
        print("1. 크롤러 실행: python main.py")
        print("2. 데이터 임포트: python import_to_supabase.py")
        
    except Exception as e:
        print(f"❌ 파일 생성 실패: {str(e)}")

def show_help():
    """도움말 표시"""
    print("""
🔧 환경변수 설정 도우미

사용법:
  python setup_env.py          # 환경변수 파일 생성
  python setup_env.py --help   # 도움말 표시

Supabase 키 찾는 방법:
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. Settings → API 메뉴
4. Project URL, anon public, service_role secret 복사

주의사항:
- .env.local 파일은 Git에 커밋하지 마세요
- API 키는 안전하게 보관하세요
""")

def main():
    """메인 함수"""
    if len(sys.argv) > 1 and sys.argv[1] in ['--help', '-h']:
        show_help()
        return
    
    create_env_file()

if __name__ == "__main__":
    main() 