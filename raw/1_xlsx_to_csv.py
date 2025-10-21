import pandas as pd

# foodweek.xlsx 파일을 읽어옵니다.
df = pd.read_excel('foodweek.xlsx')

# category로 통합하지 않을 컬럼명 리스트
base_cols = [
    'index',
    'company_name_kor',
    'company_name_eng',
    'homepage',
    'company_description',
    'products',
    'products_description'
]

# category로 통합할 컬럼명 리스트 추출
category_cols = [col for col in df.columns if col not in base_cols]

# 각 row별로 one-hot 인코딩된 category 컬럼을 category명 리스트로 변환
def extract_categories(row):
    categories = []
    for col in category_cols:
        val = row[col]
        # 값이 'O' 또는 1 또는 True 등으로 체크된 경우만 카테고리로 인정
        if (isinstance(val, str) and val.strip().upper() == 'O') or (isinstance(val, (int, float)) and val == 1) or (val is True):
            categories.append(col)
    return ','.join(categories)

df['category'] = df.apply(extract_categories, axis=1)

# base_cols + ['category'] 만 남기고 저장
final_cols = base_cols + ['category']
df_final = df[final_cols]

# csv로 저장
df_final.to_csv('foodweek.csv', index=False, encoding='utf-8-sig')