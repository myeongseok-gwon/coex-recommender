import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your_supabase_url_here';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface BoothSearchResult {
  id: string;
  company_name_kor: string;
  category: string | null;
  company_description: string;
  products: string;
  products_description: string;
  similarity: number;
  sectors?: string[]; // 이 부스가 어떤 섹터에서 검색되었는지
}

export interface UserProfile {
  age?: number;
  gender?: string;
  visit_purpose?: string;
  interests?: Record<string, string[]>;
  has_companion?: boolean;
  companion_count?: number;
  specific_goal?: string;
  followup_questions?: string;
  followup_answers?: string;
  // 새로운 선택 항목들
  has_children?: boolean;
  child_interests?: string[];
  has_pets?: boolean;
  pet_types?: string[];
  has_allergies?: boolean;
  allergies?: string;
}

// 섹터별 관심사 매핑
const SECTOR_MAPPING = {
  "신선식품": ["과일", "채소", "쌀/잡곡", "견과류", "소", "돼지", "닭", "해산물", "수산가공품"],
  "가공식품": ["냉동/냉장식품", "밀키트", "도시락", "레토르트", "통조림", "인스턴트", "면류", "장류/소스"],
  "베이커리 & 디저트": ["식빵", "페이스트리", "베이글", "제과제빵 재료", "케이크", "아이스크림", "푸딩", "젤리", "초콜릿", "과자", "쿠키"],
  "유제품 & 음료 & 주류": ["우유", "치즈", "요거트", "버터", "크림", "원두", "인스턴트 커피", "차", "주스", "탄산음료", "기능성 음료", "맥주", "와인", "전통주", "위스키"],
  "건강 & 웰빙": ["비타민", "영양제", "프로틴", "건강즙", "홍삼", "고령친화식품", "영양보충식", "저작용이식품", "유기농 인증", "친환경 인증"],
  "식이 스타일": ["매운맛", "짠맛", "단맛", "신맛", "담백한맛", "감칠맛", "구이/로스팅", "찜/삶기", "튀김", "조림", "채식/비건", "저탄수", "저염식", "저당식", "고단백"]
};

// 섹터별 사용자 프로필 텍스트 생성
export function convertUserProfileToTextBySector(userProfile: UserProfile, sector: string): string {
  const parts: string[] = [];
  
  // 디버깅: 사용자 프로필 로그
  console.log(`🔍 ${sector} 섹터 - 사용자 프로필 디버깅:`, {
    has_children: userProfile.has_children,
    has_pets: userProfile.has_pets,
    has_allergies: userProfile.has_allergies,
    pet_types: userProfile.pet_types,
    child_interests: userProfile.child_interests,
    allergies: userProfile.allergies
  });
  
  // 구체적 목표 포함
  if (userProfile.specific_goal) parts.push(`구체적 목표: ${userProfile.specific_goal}`);
  
  // 해당 섹터의 관심사만 필터링
  if (userProfile.interests) {
    const sectorKeywords = SECTOR_MAPPING[sector as keyof typeof SECTOR_MAPPING] || [];
    const relevantInterests: string[] = [];
    
    Object.entries(userProfile.interests).forEach(([category, items]) => {
      const relevantItems = items.filter(item => 
        sectorKeywords.some(keyword => item.includes(keyword) || keyword.includes(item))
      );
      if (relevantItems.length > 0) {
        relevantInterests.push(`${category}: ${relevantItems.join(', ')}`);
      }
    });
    
    if (relevantInterests.length > 0) {
      parts.push(`관심사: ${relevantInterests.join('; ')}`);
    }
  }
  
  // 새로운 선택 항목들 포함 (섹터별로도 관련성 고려)
  const selectionItems = [];
  
  // 자녀 관련 정보
  if (userProfile.has_children) {
    selectionItems.push('자녀가 있어요');
    if (userProfile.child_interests && userProfile.child_interests.length > 0) {
      selectionItems.push(`자녀 관심사: ${userProfile.child_interests.join(', ')}`);
    }
  } else {
    selectionItems.push('자녀 없음');
  }
  
  // 반려동물 관련 정보
  if (userProfile.has_pets) {
    selectionItems.push('반려동물이 있어요');
    if (userProfile.pet_types && userProfile.pet_types.length > 0) {
      selectionItems.push(`반려동물 종류: ${userProfile.pet_types.join(', ')}`);
    }
  } else {
    selectionItems.push('반려동물 없음');
  }
  
  // 알러지 관련 정보
  if (userProfile.has_allergies) {
    selectionItems.push('알러지가 있어요');
    if (userProfile.allergies) {
      selectionItems.push(`알러지 정보: ${userProfile.allergies}`);
    }
  } else {
    selectionItems.push('알러지 없음');
  }
  
  if (selectionItems.length > 0) {
    parts.push(`선택 항목: ${selectionItems.join(', ')}`);
  }

  // Follow-up 질문/답변은 추천 생성에서 제외 (기록용으로만 사용)
  // if (userProfile.followup_questions && userProfile.followup_answers) {
  //   parts.push(`추가 정보: ${userProfile.followup_questions} - ${userProfile.followup_answers}`);
  // }
  
  return parts.join(' ');
}

// 사용자 프로필을 텍스트로 변환 (기존 방식 - 전체 관심사)
export function convertUserProfileToText(userProfile: UserProfile): string {
  const parts: string[] = [];
  
  // 구체적 목표만 포함
  if (userProfile.specific_goal) parts.push(`구체적 목표: ${userProfile.specific_goal}`);
  
  if (userProfile.interests) {
    const interestTexts = Object.entries(userProfile.interests)
      .map(([category, items]) => `${category}: ${items.join(', ')}`)
      .join('; ');
    if (interestTexts) parts.push(`관심사: ${interestTexts}`);
  }
  
  // 새로운 선택 항목들 포함
  const selectionItems = [];
  
  // 자녀 관련 정보
  if (userProfile.has_children) {
    selectionItems.push('자녀가 있어요');
    if (userProfile.child_interests && userProfile.child_interests.length > 0) {
      selectionItems.push(`자녀 관심사: ${userProfile.child_interests.join(', ')}`);
    }
  } else {
    selectionItems.push('자녀 없음');
  }
  
  // 반려동물 관련 정보
  if (userProfile.has_pets) {
    selectionItems.push('반려동물이 있어요');
    if (userProfile.pet_types && userProfile.pet_types.length > 0) {
      selectionItems.push(`반려동물 종류: ${userProfile.pet_types.join(', ')}`);
    }
  } else {
    selectionItems.push('반려동물 없음');
  }
  
  // 알러지 관련 정보
  if (userProfile.has_allergies) {
    selectionItems.push('알러지가 있어요');
    if (userProfile.allergies) {
      selectionItems.push(`알러지 정보: ${userProfile.allergies}`);
    }
  } else {
    selectionItems.push('알러지 없음');
  }
  
  if (selectionItems.length > 0) {
    parts.push(`선택 항목: ${selectionItems.join(', ')}`);
  }

  // Follow-up 질문/답변은 추천 생성에서 제외 (기록용으로만 사용)
  // if (userProfile.followup_questions && userProfile.followup_answers) {
  //   parts.push(`추가 정보: ${userProfile.followup_questions} - ${userProfile.followup_answers}`);
  // }
  
  return parts.join(' ');
}

// Gemini Embedding을 통한 임베딩 생성
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || 'GEMINI_API_KEY';
    
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error('Gemini 임베딩 생성 오류:', error);
    throw error;
  }
}

// 벡터 검색 서비스
export const vectorSearchService = {
  // 사용자 프로필 기반 부스 검색
  async searchBoothsByUserProfile(
    userProfile: UserProfile,
    options: {
      matchThreshold?: number;
      matchCount?: number;
    } = {}
  ): Promise<BoothSearchResult[]> {
    try {
      const { matchThreshold = 0.3, matchCount = 20 } = options;
      
      // 사용자 프로필을 텍스트로 변환
      const userProfileText = convertUserProfileToText(userProfile);
      console.log('🔍 사용자 프로필 텍스트:', userProfileText);
      
      // 사용자 프로필 임베딩 생성
      const queryEmbedding = await generateEmbedding(userProfileText);
      
      // 벡터 검색 실행
      const { data, error } = await supabase.rpc('search_similar_booths', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount
      });
      
      if (error) {
        console.error('벡터 검색 오류:', error);
        throw error;
      }
      
      console.log(`🎯 ${data?.length || 0}개의 유사한 부스 발견`);
      return data || [];
      
    } catch (error) {
      console.error('부스 검색 오류:', error);
      throw error;
    }
  },

  // 텍스트 쿼리 기반 부스 검색
  async searchBoothsByText(
    queryText: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
    } = {}
  ): Promise<BoothSearchResult[]> {
    try {
      const { matchThreshold = 0.3, matchCount = 20 } = options;
      
      console.log('🔍 검색 쿼리:', queryText);
      
      // 쿼리 텍스트 임베딩 생성
      const queryEmbedding = await generateEmbedding(queryText);
      
      // 벡터 검색 실행
      const { data, error } = await supabase.rpc('search_similar_booths', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount
      });
      
      if (error) {
        console.error('벡터 검색 오류:', error);
        throw error;
      }
      
      console.log(`🎯 ${data?.length || 0}개의 유사한 부스 발견`);
      return data || [];
      
    } catch (error) {
      console.error('부스 검색 오류:', error);
      throw error;
    }
  },

  // 하이브리드 검색 (벡터 + 키워드)
  async hybridSearch(
    userProfile: UserProfile,
    keywordQuery?: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
    } = {}
  ): Promise<BoothSearchResult[]> {
    try {
      const { matchThreshold = 0.3, matchCount = 20 } = options;
      
      // 사용자 프로필 기반 검색
      const profileResults = await this.searchBoothsByUserProfile(userProfile, {
        matchThreshold: matchThreshold * 0.7, // 더 관대한 임계값
        matchCount: Math.floor(matchCount * 0.7)
      });
      
      let keywordResults: BoothSearchResult[] = [];
      
      // 키워드 검색이 있는 경우
      if (keywordQuery && keywordQuery.trim()) {
        keywordResults = await this.searchBoothsByText(keywordQuery, {
          matchThreshold: matchThreshold * 0.8,
          matchCount: Math.floor(matchCount * 0.3)
        });
      }
      
      // 결과 병합 및 중복 제거
      const allResults = [...profileResults, ...keywordResults];
      const uniqueResults = new Map<string, BoothSearchResult>();
      
      allResults.forEach(result => {
        const existing = uniqueResults.get(result.id);
        if (!existing || result.similarity > existing.similarity) {
          uniqueResults.set(result.id, result);
        }
      });
      
      // 유사도 순으로 정렬
      const finalResults = Array.from(uniqueResults.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, matchCount);
      
      console.log(`🎯 하이브리드 검색 결과: ${finalResults.length}개`);
      return finalResults;
      
    } catch (error) {
      console.error('하이브리드 검색 오류:', error);
      throw error;
    }
  },

  // 섹터별 후보군 선별 (동적 섹터 수에 따라 조정, LLM에게 후보 제공)
  async sectorBalancedSearch(
    userProfile: UserProfile,
    _keywordQuery?: string,
    options: {
      matchThreshold?: number;
    } = {}
  ): Promise<BoothSearchResult[]> {
    try {
      const { matchThreshold = 0.3 } = options;
      const sectors = Object.keys(SECTOR_MAPPING);
      
      // 사용자가 선택한 섹터 수 계산
      const selectedSectors = sectors.filter(sector => {
        const sectorProfileText = convertUserProfileToTextBySector(userProfile, sector);
        return sectorProfileText.trim() !== '';
      });
      
      // 사용자 관심사 다양성 분석
      const totalInterests = userProfile.interests ? 
        Object.values(userProfile.interests).reduce((sum, items) => sum + items.length, 0) : 0;
      
      // 관심사가 적으면 더 많은 후보를 가져와서 중복을 보완
      let targetTotal = 50;
      if (totalInterests <= 3) {
        targetTotal = 80; // 관심사가 적으면 더 많이 가져오기
      } else if (totalInterests <= 6) {
        targetTotal = 65; // 관심사가 보통이면 중간 정도
      }
      
      // 섹터 수에 따라 동적으로 topPerSector 계산
      const topPerSector = Math.max(1, Math.floor(targetTotal / selectedSectors.length));
      
      console.log('=== 섹터별 후보군 선별 시작 ===');
      console.log('전체 섹터:', sectors);
      console.log('선택된 섹터:', selectedSectors);
      console.log(`사용자 관심사 총 개수: ${totalInterests}개`);
      console.log(`목표 총 후보 수: ${targetTotal}개 (관심사 다양성에 따라 조정)`);
      console.log(`섹터당 후보 수: ${topPerSector}개 (총 ${selectedSectors.length * topPerSector}개 예상)`);
      
      const allResults: BoothSearchResult[] = [];
      const sectorResults: { [sector: string]: BoothSearchResult[] } = {};
      
      // 선택된 섹터별로만 후보 생성
      for (const sector of selectedSectors) {
        console.log(`\n🔍 ${sector} 섹터 후보 선별 중...`);
        
        const sectorProfileText = convertUserProfileToTextBySector(userProfile, sector);
        console.log(`${sector} 프로필 텍스트:`, sectorProfileText);
        
        const sectorEmbedding = await generateEmbedding(sectorProfileText);
        
        const { data, error } = await supabase.rpc('search_similar_booths', {
          query_embedding: sectorEmbedding,
          match_threshold: matchThreshold,
          match_count: topPerSector
        });
        
        if (error) {
          console.error(`${sector} 섹터 검색 오류:`, error);
          continue;
        }
        
        const sectorBooths = data || [];
        sectorResults[sector] = sectorBooths;
        allResults.push(...sectorBooths);
        
        console.log(`${sector} 섹터 결과: ${sectorBooths.length}개`);
        if (sectorBooths.length > 0) {
          console.log(`  Top 3: ${sectorBooths.slice(0, 3).map((b: BoothSearchResult) => `${b.company_name_kor}(${b.similarity.toFixed(3)})`).join(', ')}`);
        }
      }
      
      // 중복 제거 (같은 부스가 여러 섹터에서 나온 경우) - 섹터 정보 보존
      const uniqueResults = new Map<string, BoothSearchResult>();
      allResults.forEach(booth => {
        const existing = uniqueResults.get(booth.id);
        if (!existing) {
          // 새로운 부스 - 첫 번째 섹터로 설정
          const sector = Object.keys(sectorResults).find(s => 
            sectorResults[s]?.some(sb => sb.id === booth.id)
          ) || 'unknown';
          uniqueResults.set(booth.id, { ...booth, sectors: [sector] });
        } else {
          // 기존 부스 - 섹터 추가
          const sector = Object.keys(sectorResults).find(s => 
            sectorResults[s]?.some(sb => sb.id === booth.id)
          );
          if (sector && existing.sectors && !existing.sectors.includes(sector)) {
            existing.sectors.push(sector);
          }
          // 더 높은 유사도로 업데이트
          if (booth.similarity > existing.similarity) {
            Object.assign(existing, booth);
          }
        }
      });
      
      // 유사도 기준으로 정렬
      const sortedResults = Array.from(uniqueResults.values())
        .sort((a, b) => b.similarity - a.similarity);
      
      console.log(`\n📊 전체 후보군: ${sortedResults.length}개 (중복 제거 후)`);
      console.log('섹터별 후보 분포:');
      selectedSectors.forEach(sector => {
        const count = sortedResults.filter(b => 
          sectorResults[sector]?.some(sb => sb.id === b.id)
        ).length;
        console.log(`  ${sector}: ${count}개`);
      });
      
      // LLM에게 모든 후보군 제공 (최종 선별은 LLM이 담당)
      return sortedResults;
      
    } catch (error) {
      console.error('섹터별 균형 검색 오류:', error);
      throw error;
    }
  },

  // 부스 데이터가 임베딩 테이블에 있는지 확인
  async checkEmbeddingsExist(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('booth_embeddings')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('임베딩 테이블 확인 오류:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('임베딩 테이블 확인 오류:', error);
      return false;
    }
  }
};
