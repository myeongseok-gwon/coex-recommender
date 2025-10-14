export interface User {
  user_id: number;
  type: 'many_personal' | 'few_personal' | 'many_basic' | 'few_basic';
  age?: number;
  gender?: string;
  interests?: Record<string, string[]>;
  details?: string;
  started_at?: string;
  ended_at?: string;
  recommended_at?: string;
  rec_result?: string;
  rec_eval?: string;
  evaluation_finished_at?: string;
  survey_finished_at?: string;
  final_rating?: number;
  final_pros?: string;
  final_cons?: string;
}

export interface Evaluation {
  user_id: number;
  booth_id: number;
  booth_rating?: number;
  rec_rating?: number;
  started_at?: string;
  ended_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  is_irrelevant?: boolean;
  is_booth_wrong_info?: boolean;
  is_correct?: boolean;
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
  interests?: Record<string, string[]>;
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
