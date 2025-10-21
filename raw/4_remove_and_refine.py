import pandas as pd
import numpy as np
import json

# CSV 파일 읽기
df = pd.read_csv('foodweek_booth_info_final.csv')

print(f"원본 DataFrame shape: {df.shape}")
print(f"컬럼 목록: {df.columns.tolist()}")
print(f"중복 컬럼 확인: {df.columns.duplicated().any()}")

# 기존 'id' 컬럼을 'company_id'로 변경하고, '부스번호'를 'id'로 변경
df = df.rename(columns={
    'id': 'company_id',
    '부스번호': 'id',
    '업체명': 'company_name_kor'
})

# 필요한 컬럼만 추출 (존재하는 경우만)
required_columns = ['id', 'company_name_kor', 'category', 'company_description', 'products', 'products_description']
exists = [col for col in required_columns if col in df.columns]
df = df[exists]

# company_description, products, products_description 중 하나라도 있으면 값이 있는지 확인
def has_essential_info(row):
    for col in ['company_description', 'products', 'products_description']:
        # 컬럼이 없으면 None 취급
        if col in row and pd.notna(row[col]) and str(row[col]).strip() != '':
            return True
    return False

filtered_df = df[df.apply(has_essential_info, axis=1)]

print(f"필터링 후 DataFrame shape: {filtered_df.shape}")

# to_dict('records')를 사용하여 각 행을 딕셔너리로 변환
records = filtered_df.to_dict('records')

# jsonl로 저장
with open('foodweek_selected.jsonl', 'w', encoding='utf-8') as f:
    for record in records:
        row_dict = {}
        for col in exists:
            val = record.get(col)
            # None 또는 NaN 체크
            if val is None or (isinstance(val, float) and np.isnan(val)):
                row_dict[col] = None
            elif isinstance(val, str):
                row_dict[col] = val.strip()
            else:
                row_dict[col] = val
        
        json.dump(row_dict, f, ensure_ascii=False)
        f.write('\n')

print(f"완료: {len(records)}개 레코드를 foodweek_selected.jsonl에 저장했습니다.")
