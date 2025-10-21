import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'your_gemini_api_key_here';
const genAI = new GoogleGenerativeAI(apiKey);

export const llmService = {
  async getRecommendations(boothData: any[], visitorInfo: string): Promise<any[]> {
    console.log('=== getRecommendations 시작 ===');
    console.log('부스 데이터 개수:', boothData.length);
    console.log('참관객 정보:', visitorInfo);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
전시회 참관객 정보가 주어지면, 전체 중에서 가장 적합성이 높은 부스 20개를 rationale과 함께 등수가 높은 것부터 낮은 순으로 알려주세요.

참관객 정보: ${visitorInfo}

부스 데이터:
${JSON.stringify(boothData, null, 2)}

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
[{"id": B2404, "rationale": "이 부스가 적합한 이유를 상세히 설명"}, {"id": A2101, "rationale": "이 부스가 적합한 이유를 상세히 설명"}, ...]

중요: 
1. 반드시 20개의 부스를 추천해주세요
2. id는 부스 데이터의 id 필드 값을 사용하세요
3. rationale은 해당 부스가 왜 참관객에게 적합한지 구체적으로 설명해주세요
4. 등수가 높은 것부터 낮은 순으로 정렬해주세요
5. 응답은 오직 JSON 배열 형태로만 제공하고 다른 텍스트는 포함하지 마세요
6. 중복된 부스(id)가 절대 포함되지 않도록 주의하세요. 20개의 id는 모두 달라야 합니다.
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

  async generateFollowUpQuestions(visitorInfo: string): Promise<{ summary: string; questions: string[] }> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
당신은 전시회 부스 추천 전문가입니다. 아래 참관객의 정보를 분석하여:
1. 참관객의 관심사를 3-4문장으로 요약해주세요
2. 더욱 정교한 부스 추천을 위해 참관객에게 추가로 물어봐야 할 질문 3-5개를 생성해주세요

참관객 정보:
${visitorInfo}

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
{
  "summary": "참관객의 관심사에 대한 요약 (3-4문장)",
  "questions": [
    "추가 질문 1 (구체적이고 답변이 추천에 도움이 되는 질문)",
    "추가 질문 2",
    "추가 질문 3"
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
