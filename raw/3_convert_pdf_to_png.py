#!/usr/bin/env python3
"""
PDF를 고해상도 PNG 이미지로 변환하는 스크립트
"""

import fitz  # PyMuPDF
from pathlib import Path

def convert_pdf_to_png(pdf_path, output_path, dpi=300):
    """
    PDF를 PNG 이미지로 변환합니다.
    
    Args:
        pdf_path: 입력 PDF 파일 경로
        output_path: 출력 PNG 파일 경로
        dpi: 해상도 (기본값: 300)
    """
    
    print(f"📄 PDF 파일 변환 중: {pdf_path}")
    print(f"   해상도: {dpi} DPI")
    
    # PDF 열기
    doc = fitz.open(pdf_path)
    
    # 첫 번째 페이지만 변환 (지도는 보통 1페이지)
    page = doc[0]
    
    # 확대 비율 계산 (DPI에 따라)
    # 기본 72 DPI를 기준으로 확대
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    
    # 페이지를 이미지로 렌더링
    pix = page.get_pixmap(matrix=mat, alpha=False)
    
    # PNG로 저장
    pix.save(output_path)
    
    doc.close()
    
    print(f"✅ 변환 완료!")
    print(f"   출력: {output_path}")
    print(f"   크기: {pix.width} x {pix.height} pixels")
    
    return pix.width, pix.height

def main():
    # 파일 경로
    script_dir = Path(__file__).parent
    pdf_path = script_dir / "2025_map.pdf"
    
    # 출력 경로 (public 폴더와 dist 폴더 모두)
    public_path = script_dir.parent / "public" / "2025_map.png"
    dist_path = script_dir.parent / "dist" / "2025_map.png"
    
    # PDF 존재 확인
    if not pdf_path.exists():
        print(f"❌ PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return
    
    # 변환 실행
    print("=" * 60)
    print("PDF → PNG 변환")
    print("=" * 60)
    
    # public 폴더에 저장
    width, height = convert_pdf_to_png(pdf_path, public_path, dpi=300)
    
    # dist 폴더에도 복사 (빌드된 버전)
    if dist_path.parent.exists():
        print(f"\n📋 dist 폴더에도 복사 중...")
        convert_pdf_to_png(pdf_path, dist_path, dpi=300)
        print(f"✅ 복사 완료: {dist_path}")
    
    print("\n" + "=" * 60)
    print("✅ 모든 변환 완료!")
    print("=" * 60)
    print(f"\n📊 이미지 정보:")
    print(f"   크기: {width} x {height} pixels")
    print(f"   파일: {public_path.name}")

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

