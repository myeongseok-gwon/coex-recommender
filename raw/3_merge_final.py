import pandas as pd
import numpy as np

# CSV 파일 읽기
merged_df = pd.read_csv('foodweek_booth_info_merged.csv')
foodweek_df = pd.read_csv('foodweek.csv')

print(f"Original merged_df shape: {merged_df.shape}")
print(f"foodweek_df shape: {foodweek_df.shape}")

# id 컬럼을 인덱스로 하는 딕셔너리 생성 (빠른 조회를 위해)
foodweek_dict = foodweek_df.set_index('id').to_dict('index')

# 업데이트가 필요한 행 찾기: id가 빈 값이 아니고 company_description이 빈 값인 경우
# id가 NaN이 아니고, company_description이 NaN이거나 빈 문자열인 경우
condition = (
    merged_df['id'].notna() & 
    (merged_df['company_description'].isna() | (merged_df['company_description'].astype(str).str.strip() == ''))
)

rows_to_update = merged_df[condition]
print(f"\nRows to update: {len(rows_to_update)}")

# 업데이트할 컬럼 리스트
columns_to_update = ['company_name_eng', 'homepage', 'company_description', 'products', 'products_description', 'category']

# 업데이트 수행
update_count = 0
not_found_count = 0

for idx in rows_to_update.index:
    record_id = merged_df.loc[idx, 'id']
    
    # id를 정수로 변환 (필요한 경우)
    try:
        record_id = int(record_id)
    except (ValueError, TypeError):
        print(f"Warning: Could not convert id '{record_id}' to integer at index {idx}")
        not_found_count += 1
        continue
    
    # foodweek.csv에서 해당 id의 데이터 찾기
    if record_id in foodweek_dict:
        foodweek_record = foodweek_dict[record_id]
        
        # 각 컬럼 업데이트
        for col in columns_to_update:
            if col in foodweek_record:
                merged_df.loc[idx, col] = foodweek_record[col]
        
        update_count += 1
    else:
        print(f"Warning: id {record_id} not found in foodweek.csv")
        not_found_count += 1

print(f"\nSuccessfully updated: {update_count} rows")
print(f"Not found in foodweek.csv: {not_found_count} rows")

# 결과를 새 파일로 저장
output_file = 'foodweek_booth_info_final.csv'
merged_df.to_csv(output_file, index=False, encoding='utf-8-sig')
print(f"\nResult saved to {output_file}")

# 샘플 결과 확인
print("\nSample of updated rows:")
sample_updated = merged_df[condition].head(3)
for col in ['부스번호', 'id', 'company_description', 'products']:
    if col in sample_updated.columns:
        print(f"\n{col}:")
        print(sample_updated[col].values)

