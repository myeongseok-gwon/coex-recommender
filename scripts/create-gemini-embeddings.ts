import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 환경 변수 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const geminiApiKey = process.env.VITE_GEMINI_API_KEY || "";

// 클라이언트 초기화
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface BoothData {
  id: string;
  company_name_kor: string;
  category: string | null;
  company_description: string;
  products: string;
  products_description: string;
}

interface SimilarityResult {
  booth1: string;
  booth2: string;
  similarity: number;
}

// 부스 데이터 로드 함수
async function loadBoothData(): Promise<BoothData[]> {
  try {
    const jsonlPath = path.join(process.cwd(), 'public', 'foodweek_selected.jsonl');
    const fileContent = fs.readFileSync(jsonlPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.error('JSON 파싱 오류:', error, 'Line:', line);
        return null;
      }
    }).filter(item => item !== null);
  } catch (error) {
    console.error('JSONL 파일 로드 오류:', error);
    return [];
  }
}

// Gemini Embedding을 통한 텍스트 임베딩 생성
async function generateGeminiEmbedding(text: string, maxRetries: number = 3): Promise<number[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            parts: [{ text: text }]
          },
          taskType: 'SEMANTIC_SIMILARITY'
        }),
      });

      if (!response.ok) {
        if (response.status === 429 && attempt < maxRetries) {
          // Rate Limit 오류인 경우 더 긴 대기
          const waitTime = attempt * 2000; // 2초, 4초, 6초...
          console.log(`⏳ Rate Limit으로 인한 대기: ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding.values;
    } catch (error: any) {
      console.error(`Gemini 임베딩 생성 오류 (시도 ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 일반적인 오류인 경우 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('최대 재시도 횟수 초과');
}

// 코사인 유사도 계산 함수
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// 부스 정보를 하나의 텍스트로 결합
function combineBoothText(booth: BoothData): string {
  const parts = [
    booth.company_name_kor,
    booth.category || '',
    booth.company_description,
    booth.products,
    booth.products_description
  ].filter(part => part && part.trim());
  
  return parts.join(' ');
}

// 부스 데이터 임베딩 생성 및 저장 (Gemini 기반) - 누락된 부스만 처리
async function createAndStoreGeminiEmbeddings() {
  console.log('🚀 Gemini 기반 부스 데이터 임베딩 생성 시작...');
  
  try {
    // 부스 데이터 로드
    const boothData = await loadBoothData();
    console.log(`📊 총 ${boothData.length}개의 부스 데이터 로드됨`);
    
    // 이미 저장된 부스 ID들 가져오기
    const { data: existingBooths, error: fetchError } = await supabase
      .from('booth_embeddings')
      .select('id');
    
    if (fetchError) {
      console.error('기존 부스 데이터 조회 오류:', fetchError);
      return;
    }
    
    const existingIds = new Set(existingBooths?.map(b => b.id) || []);
    console.log(`✅ 이미 저장된 부스: ${existingIds.size}개`);
    
    // 누락된 부스들만 필터링
    const missingBooths = boothData.filter(booth => !existingIds.has(booth.id));
    console.log(`🔄 처리할 부스: ${missingBooths.length}개`);
    
    if (missingBooths.length === 0) {
      console.log('🎉 모든 부스가 이미 저장되어 있습니다!');
      return;
    }
    
    // 누락된 부스들만 처리
    for (let i = 0; i < missingBooths.length; i++) {
      const booth = missingBooths[i];
      console.log(`📝 처리 중: ${i + 1}/${missingBooths.length} - ${booth.company_name_kor}`);
      
      try {
        // 부스 정보를 텍스트로 결합
        const combinedText = combineBoothText(booth);
        
        // Gemini 임베딩 생성
        const embedding = await generateGeminiEmbedding(combinedText);
        
        // Supabase에 저장
        const { error: insertError } = await supabase
          .from('booth_embeddings')
          .insert({
            id: booth.id,
            company_name_kor: booth.company_name_kor,
            category: booth.category,
            company_description: booth.company_description,
            products: booth.products,
            products_description: booth.products_description,
            embedding: embedding
          });
        
        if (insertError) {
          console.error(`❌ ${booth.company_name_kor} 저장 오류:`, insertError);
        } else {
          console.log(`✅ ${booth.company_name_kor} 저장 완료`);
        }
        
        // API 호출 제한을 위한 지연 (Rate Limit 방지)
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        
      } catch (error) {
        console.error(`❌ ${booth.company_name_kor} 처리 오류:`, error);
        continue;
      }
    }
    
    console.log('🎉 모든 부스 데이터 임베딩 생성 및 저장 완료!');
    console.log('💡 이제 사용자 정보와 부스 임베딩 간의 실시간 유사도 계산이 가능합니다!');
    
  } catch (error) {
    console.error('💥 전체 프로세스 오류:', error);
  }
}

// 스크립트 실행
createAndStoreGeminiEmbeddings();

export { createAndStoreGeminiEmbeddings, generateGeminiEmbedding, cosineSimilarity };
