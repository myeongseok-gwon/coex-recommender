export interface User {
  user_id: number;
  type: 'A' | 'B' | 'C';
  age?: number;
  gender?: string;
  interests?: Record<string, string[]>;
  details?: string;
  followup_questions?: string;
  followup_answers?: string;
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
  path_image_url?: string;
  path_drawing_url?: string;
}

export interface Evaluation {
  user_id: number;
  booth_id: string; // A1234, B5678 등의 문자열 형식
  photo_url?: string;
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
  id: string; // A1234, B5678 등의 문자열 형식
  company_name_kor: string;
  category: string | null;
  company_description: string;
  products: string;
  products_description: string;
}

export interface Recommendation {
  id: string; // A1234, B5678 등의 문자열 형식
  rationale: string;
}

export interface UserFormData {
  age: number;
  gender: string;
  interests?: Record<string, string[]>;
}

export interface BoothPosition {
  booth_id: string; // A1234, B5678 등의 문자열 형식
  x: number; // 0-1 사이의 상대적 x 좌표
  y: number; // 0-1 사이의 상대적 y 좌표
  created_at?: string;
  updated_at?: string;
}

export interface AppState {
  currentUser: User | null;
  currentPage: 'landing' | 'form' | 'followup' | 'loading' | 'recommendations' | 'detail' | 'map' | 'survey' | 'complete';
  recommendations: Recommendation[];
  selectedBooth: Booth | null;
  boothData: Booth[];
  evaluation: Evaluation | null;
  userFormData?: UserFormData;
}
