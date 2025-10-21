import pandas as pd
import re

def preprocess_company_name(name):
    # Handle NaN values
    if pd.isna(name):
        return ''
    name = str(name)
    
    # 1. Remove newlines and carriage returns
    name = name.replace('\n', '').replace('\r', '')
    
    # 2. Remove '(주)', '㈜', '주식회사' from both sides iteratively
    patterns = [r'^\(주\)', r'^㈜', r'^주식회사', r'\(주\)$', r'㈜$', r'주식회사$']
    prev_name = None
    while prev_name != name:
        prev_name = name
        for pat in patterns:
            name = re.sub(pat, '', name)
        name = name.strip()  # Remove spaces after each iteration
    
    # 3. Remove all spaces
    name = name.replace(' ', '')
    
    return name

# Load booth info
booth_df = pd.read_csv('foodweek_booth_info.csv', encoding='utf-8-sig')

# Load foodweek info
foodweek_df = pd.read_csv('foodweek.csv', encoding='utf-8-sig')

# '업체명'과 'company_name_kor' 전처리: 공백, '(주)', '㈜', '주식회사' 양쪽에서 제거
booth_df['업체명_cleaned'] = booth_df['업체명'].apply(preprocess_company_name)
foodweek_df['company_name_kor_cleaned'] = foodweek_df['company_name_kor'].apply(preprocess_company_name)

# 디버깅: "주식회사"가 포함된 업체명 확인
print("\n=== 디버깅: '주식회사' 포함된 업체명 전처리 결과 ===")
debug_booth = booth_df[booth_df['업체명'].str.contains('주식회사', na=False)][['업체명', '업체명_cleaned']].head(10)
print("Booth 데이터:")
print(debug_booth)
print("\nFoodweek 데이터:")
debug_foodweek = foodweek_df[foodweek_df['company_name_kor'].str.contains('주식회사', na=False)][['company_name_kor', 'company_name_kor_cleaned']].head(10)
print(debug_foodweek)
print("=" * 60)

# company_name_kor_cleaned 중복 제거
foodweek_unique = foodweek_df.drop_duplicates(subset=['company_name_kor_cleaned'])

# Step 1: Exact match on 전처리된 업체명
merged_df = pd.merge(
    booth_df,
    foodweek_unique,
    left_on='업체명_cleaned',
    right_on='company_name_kor_cleaned',
    how='left',
    suffixes=('', '_foodweek')
)

# Step 2: 포함 관계 매칭 (매칭 안된 경우에만)
print("\n=== 포함 관계 매칭 시도 ===")
# 'id' 컬럼으로 매칭 여부 확인
if 'id' in merged_df.columns:
    unmatched_mask = merged_df['id'].isna()
else:
    # id 컬럼이 없으면 다른 방법으로 매칭 여부 확인
    unmatched_mask = merged_df[[col for col in merged_df.columns if col in foodweek_unique.columns and col not in booth_df.columns]].isna().all(axis=1)

unmatched_count_before = unmatched_mask.sum()
print(f"정확 매칭 후 미매칭: {unmatched_count_before}개")

# 매칭 안된 booth 항목들의 인덱스
unmatched_indices = merged_df[unmatched_mask].index

additional_matches = 0
for idx in unmatched_indices:
    booth_name = booth_df.loc[idx, '업체명_cleaned']
    
    if not booth_name:  # 빈 문자열은 스킵
        continue
    
    # 포함 관계 찾기: booth_name이 foodweek_name에 포함되거나 그 반대
    matches = foodweek_unique[
        (foodweek_unique['company_name_kor_cleaned'].str.contains(booth_name, na=False, regex=False)) |
        (booth_name in foodweek_unique['company_name_kor_cleaned'].values) |
        (foodweek_unique['company_name_kor_cleaned'].apply(lambda x: x in booth_name if x else False))
    ]
    
    # 정확히 1개의 매칭만 있는 경우
    if len(matches) == 1:
        # 해당 foodweek 데이터로 업데이트
        for col in matches.columns:
            if col not in booth_df.columns:
                merged_df.at[idx, col] = matches.iloc[0][col]
        additional_matches += 1

print(f"포함 관계로 추가 매칭: {additional_matches}개")

# 불필요한 중간 컬럼 제거
merged_df = merged_df.drop(
    columns=[
        'company_name_kor',
        '업체명_cleaned',
        'company_name_kor_cleaned'
    ],
    errors='ignore'
)

# 최종 매칭 안된 부스 row 수 및 비율 계산
total_rows = len(merged_df)
if 'id' in merged_df.columns:
    unmatched_rows = merged_df['id'].isna().sum()
else:
    unmatched_rows = merged_df.isna().all(axis=1).sum()
unmatched_ratio = unmatched_rows / total_rows * 100

print(f"\n=== 최종 결과 ===")
print(f"부스 정보 총 {total_rows}개 중 매칭 안된 개수: {unmatched_rows}개 ({unmatched_ratio:.2f}%)")

# Save the merged CSV
merged_df.to_csv('foodweek_booth_info_merged.csv', index=False, encoding='utf-8-sig')
