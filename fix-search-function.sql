-- 벡터 검색 함수 생성 (재생성)
CREATE OR REPLACE FUNCTION search_similar_booths(
    query_embedding VECTOR(3072),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 20
)
RETURNS TABLE (
    id TEXT,
    company_name_kor TEXT,
    category TEXT,
    company_description TEXT,
    products TEXT,
    products_description TEXT,
    similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        booth_embeddings.id,
        booth_embeddings.company_name_kor,
        booth_embeddings.category,
        booth_embeddings.company_description,
        booth_embeddings.products,
        booth_embeddings.products_description,
        1 - (booth_embeddings.embedding <=> query_embedding) AS similarity
    FROM booth_embeddings
    WHERE 1 - (booth_embeddings.embedding <=> query_embedding) > match_threshold
    ORDER BY booth_embeddings.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- 함수 실행 권한 부여 (anon 권한)
GRANT EXECUTE ON FUNCTION search_similar_booths(VECTOR(3072), FLOAT, INT) TO anon;
GRANT EXECUTE ON FUNCTION search_similar_booths(VECTOR(3072), FLOAT, INT) TO authenticated;

-- 함수가 성공적으로 생성되었는지 확인
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prorettype::regtype as return_type
FROM pg_proc
WHERE proname = 'search_similar_booths';

