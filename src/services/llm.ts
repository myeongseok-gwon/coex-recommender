import { GoogleGenerativeAI } from '@google/generative-ai';
import { vectorSearchService, UserProfile } from './vectorSearch';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'your_gemini_api_key_here';
const genAI = new GoogleGenerativeAI(apiKey);

export const llmService = {
  // 기존 방식 (fallback)
  async getRecommendations(boothData: any[], visitorInfo: string): Promise<any[]> {
    console.log('=== getRecommendations 시작 (기존 방식) ===');
    console.log('부스 데이터 개수:', boothData.length);
    console.log('참관객 정보:', visitorInfo);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    const prompt = `
전시회 참관객 정보가 주어지면, 전체 중에서 가장 적합성이 높은 부스 20개를 rationale과 함께 등수가 높은 것부터 낮은 순으로 알려주세요.

참관객 정보: ${visitorInfo}

부스 데이터:
${JSON.stringify(boothData, null, 2)}

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
[{"id": B2404, "rationale": "이 부스가 적합한 이유를 상세히 설명"}, {"id": A2101, "rationale": "이 부스가 적합한 이유를 상세히 설명"}, ...]

중요: 
1. 반드시 20개의 부스를 추천해주세요.
2. id는 부스 데이터의 id 필드 값을 사용하세요.
3. 해당 부스가 왜 적합한지 참관객에게 전달할 이유를 rationale에 자연스럽게 작성하세요.
4. 등수가 높은 것부터 낮은 순으로 정렬해주세요.
5. 응답은 오직 JSON 배열 형태로만 제공하고 다른 텍스트는 포함하지 마세요.
6. 중복된 부스(id)가 절대 포함되지 않도록 주의하세요. 20개의 id는 모두 달라야 합니다.
7. 다른 부스의 내용을 언급하지 마세요.
`;

    try {
      console.log('LLM API 호출 시작...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('LLM 응답 원본 (첫 500자):', text.substring(0, 500));
      console.log('LLM 응답 전체 길이:', text.length);
      
      // JSON 파싱 시도
      let jsonText = text.trim();
      
      // 응답이 ```json으로 감싸져 있을 수 있으므로 처리
      if (jsonText.includes('```json')) {
        const startIdx = jsonText.indexOf('```json') + 7;
        const endIdx = jsonText.indexOf('```', startIdx);
        jsonText = jsonText.substring(startIdx, endIdx).trim();
        console.log('```json 블록에서 추출');
      } else if (jsonText.includes('```')) {
        const startIdx = jsonText.indexOf('```') + 3;
        const endIdx = jsonText.indexOf('```', startIdx);
        jsonText = jsonText.substring(startIdx, endIdx).trim();
        console.log('``` 블록에서 추출');
      }
      
      console.log('파싱할 JSON 텍스트 (첫 500자):', jsonText.substring(0, 500));
      
      const recommendations = JSON.parse(jsonText);
      console.log('파싱된 추천 개수:', recommendations.length);
      console.log('파싱된 추천 첫 3개:', recommendations.slice(0, 3));
      console.log('=== getRecommendations 완료 ===');
      
      return recommendations;
    } catch (error) {
      console.error('=== LLM API 호출 오류 ===');
      console.error('오류 타입:', error instanceof Error ? error.name : typeof error);
      console.error('오류 메시지:', error instanceof Error ? error.message : String(error));
      console.error('전체 오류 객체:', error);
      throw error;
    }
  },

  // 하이브리드 RAG+LLM 추천 방식 (RAG로 후보군 선별 → LLM으로 최종 선별)
  async getRecommendationsWithRAG(userProfile: UserProfile, keywordQuery?: string): Promise<any[]> {
    console.log('=== getRecommendationsWithRAG 시작 ===');
    console.log('사용자 프로필:', userProfile);
    console.log('키워드 쿼리:', keywordQuery);
    
    try {
      // 섹터별 균형 추천으로 관련 부스 검색
      const searchResults = await vectorSearchService.sectorBalancedSearch(
        userProfile,
        keywordQuery,
        {
          matchThreshold: 0.3
        }
      );
      
      if (searchResults.length === 0) {
        console.log('벡터 검색 결과가 없습니다. 기본 추천으로 fallback');
        // fallback 로직 (기존 방식 사용)
        return [];
      }
      
      console.log(`벡터 검색으로 ${searchResults.length}개의 관련 부스 발견`);
      
      // Top 20 유사도 콘솔 출력
      console.log('\n🏆 RAG 후보군 (유사도 순):');
      console.log('='.repeat(80));
      searchResults.forEach((booth, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. [ID: ${booth.id}] ${booth.company_name_kor} (유사도: ${booth.similarity.toFixed(4)})`);
      });
      console.log(`총 ${searchResults.length}개 후보 → LLM이 최종 20개 선별 예정`);
      console.log('='.repeat(80));
      
      // 검색된 부스들을 LLM에 전달하여 최종 추천 생성
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      
      const userProfileText = Object.entries(userProfile)
        .filter(([key, value]) => 
          value !== undefined && 
          value !== null && 
          value !== '' && 
          key !== 'visit_purpose' && // 방문 목적 제외
          key !== 'has_companion' && // 동행 여부 제외
          key !== 'companion_count' // 동반자 수 제외
        )
        .map(([key, value]) => {
          // interests 객체를 적절히 변환
          if (key === 'interests' && typeof value === 'object' && value !== null) {
            const interestEntries = Object.entries(value as Record<string, string[]>)
              .map(([category, items]) => `${category}: ${items.join(', ')}`)
              .join('; ');
            return `interests: ${interestEntries}`;
          }
          return `${key}: ${value}`;
        })
        .join(', ');
      
      const prompt = `
당신은 전시회 부스 추천 전문가입니다. 벡터 검색으로 선별된 후보 부스들 중에서 사용자에게 가장 적합한 20개를 선택하고 각각의 추천 이유를 생성해주세요.

사용자 프로필: ${userProfileText}
${keywordQuery ? `추가 검색 키워드: ${keywordQuery}` : ''}

주의: 사용자 프로필에 포함된 "followup_questions"와 "followup_answers"는 시스템이 사용자의 관심사를 파악하기 위해 생성한 추가 질문과 그에 대한 사용자의 답변입니다. 이는 사용자가 직접 질문한 것이 아니라, 추천 시스템이 사용자의 선호도를 더 정확히 파악하기 위한 정보입니다.

후보 부스들 (유사도 순):
${searchResults.map((booth, index) => `
${index + 1}. [ID: ${booth.id}] ${booth.company_name_kor}
   - 카테고리: ${booth.category || 'N/A'}
   - 제품: ${booth.products || 'N/A'}
   - 설명: ${booth.company_description || 'N/A'}
`).join('\n')}

위 후보 부스들 중에서 사용자에게 가장 적합한 20개를 선택하여 추천해주세요.

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
[{"id": "B2404", "rationale": "이 부스가 적합한 이유를 상세히 설명"}, {"id": "A2101", "rationale": "이 부스가 적합한 이유를 상세히 설명"}, ...]

중요: 
1. 반드시 20개의 부스를 선택해주세요.
2. 사용자 프로필과 부스 정보를 종합적으로 고려하여 가장 적합한 부스들을 선택하세요.
3. 각 부스에 대해 구체적이고 설득력 있는 추천 이유를 rationale에 작성해주세요.
4. 유사도 점수를 참고하되, 사용자의 세부적인 관심사와 부스의 특성을 더 중요하게 고려하세요.
5. 응답은 오직 JSON 배열 형태로만 제공하고 다른 텍스트는 포함하지 마세요.
6. 각 부스의 특징과 사용자의 관심사/요구사항을 연결하여 개인화된 이유를 작성해주세요.
7. 다른 부스의 내용을 언급하지 마세요.
`;

      console.log('LLM API 호출 시작 (RAG 방식)...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('LLM 응답 원본 (첫 500자):', text.substring(0, 500));
      
      // JSON 파싱 시도
      let jsonText = text.trim();
      
      // 응답이 ```json으로 감싸져 있을 수 있으므로 처리
      if (jsonText.includes('```json')) {
        const startIdx = jsonText.indexOf('```json') + 7;
        const endIdx = jsonText.indexOf('```', startIdx);
        jsonText = jsonText.substring(startIdx, endIdx).trim();
        console.log('```json 블록에서 추출');
      } else if (jsonText.includes('```')) {
        const startIdx = jsonText.indexOf('```') + 3;
        const endIdx = jsonText.indexOf('```', startIdx);
        jsonText = jsonText.substring(startIdx, endIdx).trim();
        console.log('``` 블록에서 추출');
      }
      
      const recommendations = JSON.parse(jsonText);
      console.log('파싱된 추천 개수:', recommendations.length);
      console.log('파싱된 추천 첫 3개:', recommendations.slice(0, 3));
      
      // 유사도 정보를 추천에 추가
      const recommendationsWithSimilarity = recommendations.map((rec: any) => {
        const searchResult = searchResults.find(sr => sr.id === rec.id);
        return {
          ...rec,
          similarity: searchResult?.similarity || 0
        };
      });
      
      console.log('유사도가 추가된 추천 첫 3개:', recommendationsWithSimilarity.slice(0, 3));
      console.log('하이브리드 RAG+LLM 추천 생성 완료:', recommendationsWithSimilarity.length, '개');
      console.log('  - RAG로 후보군 선별:', searchResults.length, '개');
      console.log('  - LLM으로 최종 선별:', recommendationsWithSimilarity.length, '개');
      console.log('=== getRecommendationsWithRAG 완료 ===');
      
      return recommendationsWithSimilarity;
      
    } catch (error) {
      console.error('=== RAG 기반 추천 오류 ===');
      console.error('오류 타입:', error instanceof Error ? error.name : typeof error);
      console.error('오류 메시지:', error instanceof Error ? error.message : String(error));
      console.error('전체 오류 객체:', error);
      
      // 오류 발생 시 기존 방식으로 fallback
      console.log('RAG 방식 실패, 기존 방식으로 fallback');
      throw error;
    }
  },

  async generateFollowUpQuestions(visitorInfo: string): Promise<{ summary: string; questions: string[] }> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    const prompt = `
당신은 전시회 부스 추천 전문가입니다. 아래 참관객의 정보를 분석하여:
1. 참관객의 관심사를 3-4문장으로 요약해주세요
2. 더욱 정교한 부스 추천을 위해 참관객에게 추가로 물어봐야 할 질문 4개를 생성해주세요

참관객 정보:
${visitorInfo}

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
{
  "summary": "참관객의 관심사에 대한 요약 (3-4문장)",
  "questions": [
    "추가 질문 1 (구체적이고 답변이 추천에 도움이 되는 질문)",
    "추가 질문 2",
    "추가 질문 3",
    "추가 질문 4"
  ]
}

중요:
1. summary는 참관객의 주요 관심사와 선호도를 명확하게 요약해주세요
2. questions는 참관객의 구체적인 선호도, 목적, 우선순위 등을 파악할 수 있는 질문이어야 합니다
3. 질문은 개방형이어야 하며, 참관객이 자유롭게 답변할 수 있어야 합니다
4. 응답은 오직 JSON 형태로만 제공하고 다른 텍스트는 포함하지 마세요
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSON 파싱 시도
      let jsonText = text.trim();
      
      // 응답이 ```json으로 감싸져 있을 수 있으므로 처리
      if (jsonText.includes('```json')) {
        const startIdx = jsonText.indexOf('```json') + 7;
        const endIdx = jsonText.indexOf('```', startIdx);
        jsonText = jsonText.substring(startIdx, endIdx).trim();
      } else if (jsonText.includes('```')) {
        const startIdx = jsonText.indexOf('```') + 3;
        const endIdx = jsonText.indexOf('```', startIdx);
        jsonText = jsonText.substring(startIdx, endIdx).trim();
      }
      
      const result_data = JSON.parse(jsonText);
      return result_data;
    } catch (error) {
      console.error('LLM API 호출 오류 (추가 질문 생성):', error);
      throw error;
    }
  }
};
