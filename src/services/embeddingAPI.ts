// 백엔드 API 엔드포인트를 통한 임베딩 생성
export async function generateEmbeddingViaAPI(text: string): Promise<number[]> {
  try {
    const response = await fetch('/api/generate-embedding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('API를 통한 임베딩 생성 오류:', error);
    throw error;
  }
}
