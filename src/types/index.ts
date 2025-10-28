export interface User {
  user_id: string;
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
  child_interests?: string[]; // 분유, 이유식 등
  has_pets?: boolean;
  pet_types?: string[]; // 강아지, 고양이, 그 외
  has_allergies?: boolean;
  allergies?: string; // 자유 입력
  initial_form_started_at?: string;
  initial_form_submitted_at?: string;
  skipped_at?: string;
  additional_form_submitted_at?: string;
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
  exit_recommendation_rating?: number;
  exit_exhibition_rating?: number;
  exit_ratings_submitted_at?: string;
  recommendation_modal_clicks?: Record<string, number>; // booth_id -> click count
}

export interface Evaluation {
  user_id: string;
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
  similarity?: number; // 벡터 유사도 점수 (0-1)
}

export interface UserFormData {
  age: number;
  gender: string;
  visitPurpose?: string;
  interests?: Record<string, string[]>;
  hasCompanion?: boolean;
  companionCount?: number;
  specificGoal?: string;
  // 새로운 선택 항목들
  hasChildren?: boolean;
  childInterests?: string[]; // 분유, 이유식 등
  hasPets?: boolean;
  petTypes?: string[]; // 강아지, 고양이, 그 외
  hasAllergies?: boolean;
  allergies?: string; // 자유 입력
}

export interface BoothPosition {
  booth_id: string; // A1234, B5678 등의 문자열 형식
  x: number; // 0-1 사이의 상대적 x 좌표
  y: number; // 0-1 사이의 상대적 y 좌표
  created_at?: string;
  updated_at?: string;
}

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface GpsTracking {
  id?: number;
  user_id: string;
  total_points?: number;
  total_distance?: number;
  duration?: string;
  locations: GpsLocation[];
  created_at?: string;
  updated_at?: string;
}

export interface AppState {
  currentUser: User | null;
  currentPage: 'landing' | 'form' | 'followup' | 'loading' | 'recommendations' | 'detail' | 'map' | 'survey' | 'complete' | 'thankyou';
  recommendations: Recommendation[];
  selectedBooth: Booth | null;
  boothData: Booth[];
  evaluation: Evaluation | null;
  userFormData: UserFormData | null;
}

// Window 객체 확장
declare global {
  interface Window {
    gpsService?: any;
  }
}
