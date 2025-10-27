import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 환경 변수 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ijglbateodrxlmkytypi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZ2xiYXRlb2RyeGxta3l0eXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODYyMTQsImV4cCI6MjA3NDk2MjIxNH0.5G3NsIrWOR4NPFMmM8gtMYfDLleezR4y2eLNeuPPvo0';

// 클라이언트 초기화 (Edge Function 사용)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface BoothData {
  id: string;
  company_name_kor: string;
  category: string | null;
  company_description: string;
  products: string;
  products_description: string;
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

// Edge Function을 통한 텍스트 임베딩 생성
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text },
    });

    if (error) {
      console.error('Edge Function 오류:', error);
      throw error;
    }

    return data.embedding;
  } catch (error) {
    console.error('임베딩 생성 오류:', error);
    throw error;
  }
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

// 부스 데이터 임베딩 생성 및 저장
async function createAndStoreEmbeddings() {
  console.log('🚀 부스 데이터 임베딩 생성 시작...');
  
  try {
    // 부스 데이터 로드
    const boothData = await loadBoothData();
    console.log(`📊 총 ${boothData.length}개의 부스 데이터 로드됨`);
    
    // 기존 임베딩 데이터 삭제 (선택사항)
    const { error: deleteError } = await supabase
      .from('booth_embeddings')
      .delete()
      .neq('id', '');
    
    if (deleteError) {
      console.error('기존 데이터 삭제 오류:', deleteError);
    } else {
      console.log('🗑️ 기존 임베딩 데이터 삭제 완료');
    }
    
    // 각 부스에 대해 임베딩 생성 및 저장
    for (let i = 0; i < boothData.length; i++) {
      const booth = boothData[i];
      console.log(`📝 처리 중: ${i + 1}/${boothData.length} - ${booth.company_name_kor}`);
      
      try {
        // 부스 정보를 텍스트로 결합
        const combinedText = combineBoothText(booth);
        
        // 임베딩 생성
        const embedding = await generateEmbedding(combinedText);
        
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
        
        // API 호출 제한을 위한 지연
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ ${booth.company_name_kor} 처리 오류:`, error);
        continue;
      }
    }
    
    console.log('🎉 모든 부스 데이터 임베딩 생성 및 저장 완료!');
    
  } catch (error) {
    console.error('💥 전체 프로세스 오류:', error);
  }
}

// 스크립트 실행
createAndStoreEmbeddings();

export { createAndStoreEmbeddings, generateEmbedding, combineBoothText };
