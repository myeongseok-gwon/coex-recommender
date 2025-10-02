// JSONL 파일을 fetch로 읽어서 사용
let boothDataCache: any[] | null = null;

export const loadBoothData = async (): Promise<any[]> => {
  if (boothDataCache) {
    return boothDataCache;
  }

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}foodweek_selected.jsonl`);
    const text = await response.text();
    
    const lines = text.split('\n').filter(line => line.trim());
    boothDataCache = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.error('JSON 파싱 오류:', error, 'Line:', line);
        return null;
      }
    }).filter(item => item !== null);
    
    return boothDataCache;
  } catch (error) {
    console.error('JSONL 파일 로드 오류:', error);
    return [];
  }
};

export const loadUserData = (): any[] => {
  // user.csv 데이터를 하드코딩 (실제로는 CSV 파싱 라이브러리 사용)
  return [
    { user_id: 1, type: 'many_personal' },
    { user_id: 2, type: 'many_basic' },
    { user_id: 3, type: 'few_personal' },
    { user_id: 4, type: 'few_basic' },
    { user_id: 5, type: 'many_personal' },
    { user_id: 6, type: 'many_basic' },
    { user_id: 7, type: 'few_personal' },
    { user_id: 8, type: 'few_basic' },
    { user_id: 9, type: 'many_personal' },
    { user_id: 10, type: 'many_basic' },
    { user_id: 11, type: 'few_personal' },
    { user_id: 12, type: 'few_basic' },
    { user_id: 13, type: 'many_personal' },
    { user_id: 14, type: 'many_basic' },
    { user_id: 15, type: 'few_personal' },
    { user_id: 16, type: 'few_basic' }
  ];
};