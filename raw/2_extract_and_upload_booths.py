#!/usr/bin/env python3
"""
PDF에서 booth ID와 좌표를 추출하여 Supabase에 업로드하는 메인 스크립트
"""

import fitz  # PyMuPDF
import re
import json
import os
from pathlib import Path

# Supabase는 선택적으로 import (없어도 동작)
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️  supabase 패키지가 설치되지 않았습니다. JSON 파일로만 저장됩니다.")

def extract_booths_from_pdf(pdf_path):
    """PDF에서 booth ID와 정규화된 좌표를 추출합니다."""
    
    print(f"📄 PDF 파일 분석 중: {pdf_path}")
    
    doc = fitz.open(pdf_path)
    
    # Booth ID 패턴: A1234, B5678, S0901 등
    booth_pattern = re.compile(r'^[ABS]\d{4}$')
    
    booths_dict = {}  # booth_id를 키로 사용하여 중복 제거
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        page_rect = page.rect
        page_width = page_rect.width
        page_height = page_rect.height
        
        text_instances = page.get_text("dict")
        
        for block in text_instances["blocks"]:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        text = span["text"].strip()
                        
                        if booth_pattern.match(text):
                            bbox = span["bbox"]
                            x0, y0, x1, y1 = bbox
                            
                            center_x = (x0 + x1) / 2
                            center_y = (y0 + y1) / 2
                            
                            norm_x = center_x / page_width
                            norm_y = center_y / page_height
                            
                            # 중복 체크: 동일한 booth_id가 이미 있으면 건너뛰기
                            if text not in booths_dict:
                                booths_dict[text] = {
                                    "booth_id": text,
                                    "x": round(norm_x, 6),
                                    "y": round(norm_y, 6)
                                }
    
    doc.close()
    
    return list(booths_dict.values())

def load_jsonl_booth_ids(jsonl_path):
    """JSONL 파일에서 모든 booth ID를 로드합니다."""
    
    booth_ids = set()
    
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                data = json.loads(line)
                booth_ids.add(data['id'])
    
    return booth_ids

def upload_to_supabase(booths, supabase):
    """Supabase에 booth 위치 데이터를 업로드합니다."""
    
    print(f"\n📤 Supabase에 {len(booths)}개의 booth 위치를 업로드 중...")
    
    # 배치로 업로드 (한 번에 너무 많이 보내지 않도록)
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
    # 파일 경로
    script_dir = Path(__file__).parent
    pdf_path = script_dir / "2025 푸드위크 코리아_A,B홀_부스배치도_memo.pdf"
    jsonl_path = script_dir.parent / "public" / "foodweek_selected.jsonl"
    
    # PDF 존재 확인
    if not pdf_path.exists():
        print(f"❌ PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return
    
    # JSONL 존재 확인
    if not jsonl_path.exists():
        print(f"❌ JSONL 파일을 찾을 수 없습니다: {jsonl_path}")
        return
    
    # 1. PDF에서 booth 정보 추출
    print("=" * 60)
    print("1️⃣  PDF에서 booth ID와 좌표 추출")
    print("=" * 60)
    
    extracted_booths = extract_booths_from_pdf(pdf_path)
    print(f"✅ {len(extracted_booths)}개의 booth를 추출했습니다!")
    
    # 2. JSONL 파일의 booth ID 로드
    print("\n" + "=" * 60)
    print("2️⃣  JSONL 파일의 booth ID 확인")
    print("=" * 60)
    
    jsonl_booth_ids = load_jsonl_booth_ids(jsonl_path)
    print(f"✅ JSONL에 {len(jsonl_booth_ids)}개의 booth가 있습니다!")
    
    # 3. 매칭 확인
    print("\n" + "=" * 60)
    print("3️⃣  매칭 확인")
    print("=" * 60)
    
    extracted_ids = set(b['booth_id'] for b in extracted_booths)
    
    matched = extracted_ids & jsonl_booth_ids
    only_in_pdf = extracted_ids - jsonl_booth_ids
    only_in_jsonl = jsonl_booth_ids - extracted_ids
    
    print(f"✅ 매칭됨: {len(matched)}개")
    print(f"⚠️  PDF에만 있음: {len(only_in_pdf)}개")
    print(f"⚠️  JSONL에만 있음: {len(only_in_jsonl)}개")
    
    if only_in_jsonl:
        print(f"\n📋 JSONL에만 있는 booth ID (처음 20개):")
        for bid in sorted(only_in_jsonl)[:20]:
            print(f"  - {bid}")
        if len(only_in_jsonl) > 20:
            print(f"  ... 외 {len(only_in_jsonl) - 20}개")
    
    # 4. Supabase에 업로드
    print("\n" + "=" * 60)
    print("4️⃣  Supabase에 업로드")
    print("=" * 60)
    
    # Supabase 설정 확인
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not SUPABASE_AVAILABLE:
        print("❌ Supabase 패키지가 설치되지 않았습니다!")
        print("   설치하려면: pip install supabase")
        print("\n📄 추출된 데이터를 JSON 파일로 저장합니다...")
        
        output_path = script_dir / "extracted_booths_final.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(extracted_booths, f, indent=2, ensure_ascii=False)
        
        print(f"💾 저장 완료: {output_path}")
        
    elif not supabase_url or not supabase_key:
        print("❌ Supabase 환경 변수가 설정되지 않았습니다!")
        print("   다음 환경 변수를 설정하세요:")
        print("   - SUPABASE_URL")
        print("   - SUPABASE_KEY")
        print("\n💡 또는 아래 명령어를 사용하세요:")
        print("   export SUPABASE_URL='your-url'")
        print("   export SUPABASE_KEY='your-key'")
        print("\n📄 추출된 데이터를 JSON 파일로 저장합니다...")
        
        output_path = script_dir / "extracted_booths_final.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(extracted_booths, f, indent=2, ensure_ascii=False)
        
        print(f"💾 저장 완료: {output_path}")
        print("\n🔧 수동으로 Supabase에 업로드하려면:")
        print("   1. Supabase Dashboard에서 booth_positions 테이블 열기")
        print("   2. 'Insert' > 'Insert from JSON' 선택")
        print(f"   3. {output_path} 파일 내용 복사/붙여넣기")
        return
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        success, error = upload_to_supabase(extracted_booths, supabase)
        
        print(f"\n✅ 업로드 완료!")
        print(f"  성공: {success}개")
        print(f"  실패: {error}개")
        
    except Exception as e:
        print(f"❌ Supabase 연결 오류: {e}")
        print("\n📄 추출된 데이터를 JSON 파일로 저장합니다...")
        
        output_path = script_dir / "extracted_booths_final.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(extracted_booths, f, indent=2, ensure_ascii=False)
        
        print(f"💾 저장 완료: {output_path}")
    
    # 5. 통계 출력
    print("\n" + "=" * 60)
    print("📊 최종 통계")
    print("=" * 60)
    
    a_booths = [b for b in extracted_booths if b['booth_id'].startswith('A')]
    b_booths = [b for b in extracted_booths if b['booth_id'].startswith('B')]
    s_booths = [b for b in extracted_booths if b['booth_id'].startswith('S')]
    
    print(f"A홀: {len(a_booths)}개")
    print(f"B홀: {len(b_booths)}개")
    print(f"S홀: {len(s_booths)}개")
    print(f"총: {len(extracted_booths)}개")

if __name__ == "__main__":
    try:
        main()
    except ImportError as e:
        print(f"❌ 필요한 패키지가 설치되지 않았습니다: {e}")
        print("\n다음 명령어로 설치하세요:")
        print("  pip install PyMuPDF supabase")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

