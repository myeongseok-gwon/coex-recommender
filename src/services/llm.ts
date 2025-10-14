import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'your_gemini_api_key_here';
const genAI = new GoogleGenerativeAI(apiKey);

export const llmService = {
  async getRecommendations(boothData: any[], visitorInfo: string): Promise<any[]> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
전시회 참관객 정보가 주어지면, 전체 중에서 가장 적합성이 높은 부스 20개를 rationale과 함께 등수가 높은 것부터 낮은 순으로 알려주세요.

참관객 정보: ${visitorInfo}

부스 데이터:
${JSON.stringify(boothData, null, 2)}

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
[{"id": 1, "rationale": "이 부스가 적합한 이유를 상세히 설명"}, {"id": 2, "rationale": "이 부스가 적합한 이유를 상세히 설명"}, ...]

중요: 
1. 반드시 20개의 부스를 추천해주세요
2. id는 부스 데이터의 id 필드 값을 사용하세요
3. rationale은 해당 부스가 왜 참관객에게 적합한지 구체적으로 설명해주세요
4. 등수가 높은 것부터 낮은 순으로 정렬해주세요
5. 응답은 오직 JSON 배열 형태로만 제공하고 다른 텍스트는 포함하지 마세요
6. 중복된 부스(id)가 절대 포함되지 않도록 주의하세요. 20개의 id는 모두 달라야 합니다.
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
      
      const recommendations = JSON.parse(jsonText);
      return recommendations;
    } catch (error) {
      console.error('LLM API 호출 오류:', error);
      throw error;
    }
  }
};
