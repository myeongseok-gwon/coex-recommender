#!/usr/bin/env python3
"""
PDF에서 텍스트와 좌표를 추출하는 테스트 스크립트
PyMuPDF를 사용하여 booth ID를 찾고 위치를 추출합니다.
"""

import fitz  # PyMuPDF
import re
import json
from pathlib import Path

def test_pdf_extraction(pdf_path):
    """PDF에서 텍스트와 좌표를 추출하여 booth ID를 찾습니다."""
    
    print(f"📄 PDF 파일 분석 중: {pdf_path}")
    
    # PDF 열기
    doc = fitz.open(pdf_path)
    
    # Booth ID 패턴: A1234, B5678, S0901 등
    booth_pattern = re.compile(r'^[ABS]\d{4}$')
    
    booths_found = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # 페이지 크기
        page_rect = page.rect
        page_width = page_rect.width
        page_height = page_rect.height
        
        print(f"\n📄 페이지 {page_num + 1}")
        print(f"  크기: {page_width:.1f} x {page_height:.1f}")
        
        # 텍스트와 위치 추출
        text_instances = page.get_text("dict")
        
        for block in text_instances["blocks"]:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        text = span["text"].strip()
                        
                        # Booth ID 패턴 매칭
                        if booth_pattern.match(text):
                            # 바운딩 박스 좌표
                            bbox = span["bbox"]
                            x0, y0, x1, y1 = bbox
                            
                            # 중심점 계산
                            center_x = (x0 + x1) / 2
                            center_y = (y0 + y1) / 2
                            
                            # 정규화된 좌표 (0~1)
                            norm_x = center_x / page_width
                            norm_y = center_y / page_height
                            
                            booth_info = {
                                "id": text,
                                "x": norm_x,
                                "y": norm_y,
                                "bbox": bbox,
                                "font_size": span["size"],
                                "page": page_num + 1
                            }
                            
                            booths_found.append(booth_info)
        
        print(f"  찾은 booth 수: {len([b for b in booths_found if b['page'] == page_num + 1])}")
    
    doc.close()
    
    return booths_found, page_width, page_height

def main():
    # PDF 파일 경로
    pdf_path = Path(__file__).parent / "2025_map.pdf"
    
    if not pdf_path.exists():
        print(f"❌ PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return
    
    # 추출 실행
    booths, width, height = test_pdf_extraction(pdf_path)
    
    print(f"\n✅ 총 {len(booths)}개의 booth ID를 찾았습니다!")
    
    # 샘플 출력
    print("\n📋 처음 10개 샘플:")
    for booth in booths[:10]:
        print(f"  {booth['id']}: ({booth['x']:.4f}, {booth['y']:.4f})")
    
    # JSON 파일로 저장
    output_path = Path(__file__).parent / "extracted_booths_test.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            "pdf_size": {"width": width, "height": height},
            "booths": booths
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 결과를 저장했습니다: {output_path}")
    
    # 통계
    print("\n📊 통계:")
    a_booths = [b for b in booths if b['id'].startswith('A')]
    b_booths = [b for b in booths if b['id'].startswith('B')]
    s_booths = [b for b in booths if b['id'].startswith('S')]
    
    print(f"  A홀: {len(a_booths)}개")
    print(f"  B홀: {len(b_booths)}개")
    print(f"  S홀: {len(s_booths)}개")

if __name__ == "__main__":
    try:
        main()
    except ImportError as e:
        print(f"❌ 필요한 패키지가 설치되지 않았습니다: {e}")
        print("\n다음 명령어로 설치하세요:")
        print("  pip install PyMuPDF")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

