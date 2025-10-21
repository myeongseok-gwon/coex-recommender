#!/usr/bin/env python3
"""
extracted_booths_final.json 파일을 Supabase에 업로드하는 스크립트
"""

import json
import os
from pathlib import Path

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("❌ supabase 패키지가 설치되지 않았습니다!")
    print("   설치하려면: pip install supabase")
    exit(1)

def upload_booths_to_supabase(booths, supabase_url, supabase_key):
    """Supabase에 booth 위치 데이터를 업로드합니다."""
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print(f"📤 Supabase에 {len(booths)}개의 booth 위치를 업로드 중...")
    
    # 배치로 업로드
    batch_size = 50
    success_count = 0
    error_count = 0
    
    for i in range(0, len(booths), batch_size):
        batch = booths[i:i+batch_size]
        
        try:
            result = supabase.table('booth_positions').upsert(
                batch,
                on_conflict='booth_id'
            ).execute()
            
            success_count += len(batch)
            print(f"  ✅ {i+len(batch)}/{len(booths)} 업로드 완료")
            
        except Exception as e:
            error_count += len(batch)
            print(f"  ❌ 배치 업로드 오류: {e}")
    
    return success_count, error_count

def main():
    # JSON 파일 경로
    json_path = Path(__file__).parent / "extracted_booths_final.json"
    
    if not json_path.exists():
        print(f"❌ JSON 파일을 찾을 수 없습니다: {json_path}")
        print("   먼저 2_extract_and_upload_booths.py를 실행하세요.")
        return
    
    # JSON 파일 로드
    with open(json_path, 'r', encoding='utf-8') as f:
        booths = json.load(f)
    
    print(f"📄 {len(booths)}개의 booth 데이터를 로드했습니다.")
    
    # Supabase 설정
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not supabase_url:
        supabase_url = input("Supabase URL을 입력하세요: ").strip()
    
    if not supabase_key:
        supabase_key = input("Supabase Anon Key를 입력하세요: ").strip()
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase URL과 Key가 필요합니다!")
        return
    
    # 업로드
    try:
        success, error = upload_booths_to_supabase(booths, supabase_url, supabase_key)
        
        print("\n" + "=" * 60)
        print("✅ 업로드 완료!")
        print("=" * 60)
        print(f"  성공: {success}개")
        print(f"  실패: {error}개")
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

