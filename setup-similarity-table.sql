-- 부스 간 유사도를 저장할 테이블 생성
CREATE TABLE IF NOT EXISTS booth_similarities (
    id SERIAL PRIMARY KEY,
    booth_id_1 TEXT NOT NULL,
    booth_id_2 TEXT NOT NULL,
    similarity_score FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booth_id_1, booth_id_2)
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_booth_similarities_booth1 ON booth_similarities(booth_id_1);
CREATE INDEX IF NOT EXISTS idx_booth_similarities_booth2 ON booth_similarities(booth_id_2);
CREATE INDEX IF NOT EXISTS idx_booth_similarities_score ON booth_similarities(similarity_score DESC);

-- 특정 부스의 유사한 부스들을 조회하는 함수
CREATE OR REPLACE FUNCTION get_similar_booths(
    target_booth_id TEXT,
    limit_count INT DEFAULT 20,
    min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    booth_id TEXT,
    similarity_score FLOAT,
    company_name_kor TEXT,
    category TEXT,
    products TEXT
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        CASE 
            WHEN bs.booth_id_1 = target_booth_id THEN bs.booth_id_2
            ELSE bs.booth_id_1
        END as booth_id,
        bs.similarity_score,
        be.company_name_kor,
        be.category,
        be.products
    FROM booth_similarities bs
    JOIN booth_embeddings be ON (
        CASE 
            WHEN bs.booth_id_1 = target_booth_id THEN bs.booth_id_2
            ELSE bs.booth_id_1
        END = be.id
    )
    WHERE (bs.booth_id_1 = target_booth_id OR bs.booth_id_2 = target_booth_id)
    AND bs.similarity_score >= min_similarity
    ORDER BY bs.similarity_score DESC
    LIMIT limit_count;
$$;
