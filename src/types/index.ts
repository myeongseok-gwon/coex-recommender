export interface User {
  user_id: number;
  type: 'many_personal' | 'few_personal' | 'many_basic' | 'few_basic';
  age?: number;
  gender?: string;
  company_name?: string;
  work_experience?: number;
  expo_experience?: number;
  details?: string;
  started_at?: string;
  ended_at?: string;
  recommended_at?: string;
  rec_result?: string;
}

export interface Evaluation {
  user_id: number;
  booth_id: number;
  rating?: number;
  started_at?: string;
  ended_at?: string;
}

export interface Booth {
  id: number;
  company_name_kor: string;
  category: string | null;
  company_description: string;
  products: string;
  products_description: string;
}

export interface Recommendation {
  id: number;
  rationale: string;
}

export interface UserFormData {
  age: number;
  gender: string;
  company_name?: string;
  work_experience?: number;
  expo_experience?: number;
  details: string;
}

export interface AppState {
  currentUser: User | null;
  currentPage: 'landing' | 'form' | 'loading' | 'recommendations' | 'detail';
  recommendations: Recommendation[];
  selectedBooth: Booth | null;
  boothData: Booth[];
  evaluation: Evaluation | null;
}
