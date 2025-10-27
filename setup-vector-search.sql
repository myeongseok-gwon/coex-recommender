-- Supabase Vector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 부스 임베딩을 저장할 테이블 생성
CREATE TABLE IF NOT EXISTS booth_embeddings (
    id TEXT PRIMARY KEY,
    company_name_kor TEXT NOT NULL,
    category TEXT,
    company_description TEXT,
    products TEXT,
    products_description TEXT,
    embedding VECTOR(3072), -- Gemini gemini-embedding-001 차원
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 벡터 검색을 위한 인덱스 생성 (3072 차원은 인덱스 없이 사용)
-- pgvector는 최대 2000 차원까지만 인덱스 지원
-- 3072 차원은 순차 검색으로 처리 (374개 부스는 충분히 빠름)
-- CREATE INDEX IF NOT EXISTS booth_embeddings_embedding_idx 
-- ON booth_embeddings 
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- 업데이트 시간 자동 갱신을 위한 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booth_embeddings_updated_at 
    BEFORE UPDATE ON booth_embeddings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 벡터 검색 함수 생성
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
