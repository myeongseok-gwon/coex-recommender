import React, { useState } from 'react';
import { User, UserFormData } from '../types';

interface UserFormPageProps {
  user: User;
  onSubmit: (formData: UserFormData) => void;
  onBack: () => void;
}

// 관심사 데이터 구조
const INTEREST_CATEGORIES = {
  "신선식품": {
    icon: "🥬",
    subcategories: {
      "과일/채소/곡물": ["과일", "채소", "쌀/잡곡", "견과류"],
      "육류/수산물": ["소고기", "돼지고기", "닭고기", "해산물", "수산가공품"],
      "유기농/친환경": ["유기농 인증", "무농약", "로컬푸드", "친환경 인증"]
    }
  },
  "가공식품": {
    icon: "🍱",
    subcategories: {
      "간편식/HMR": ["냉동식품", "냉장식품", "즉석밥", "도시락", "레토르트"],
      "포장식품": ["통조림", "인스턴트", "면류", "장류"],
      "조미료/소스": ["양념", "드레싱", "식용유", "소스", "향신료"]
    }
  },
  "베이커리 & 디저트": {
    icon: "🍰",
    subcategories: {
      "빵/베이커리": ["식빵", "페이스트리", "건강빵", "베이글", "제과제빵 재료"],
      "케이크/디저트": ["케이크", "아이스크림", "푸딩", "젤리", "초콜릿"],
      "과자/스낵": ["과자", "쿠키", "스낵", "캔디", "견과류 스낵"]
    }
  },
  "유제품 & 음료": {
    icon: "🥛",
    subcategories: {
      "유제품": ["우유", "치즈", "요거트", "버터", "크림"],
      "커피/차": ["원두", "인스턴트 커피", "녹차", "홍차", "허브티", "전통차"],
      "음료": ["주스", "탄산음료", "기능성 음료", "생수", "두유"],
      "주류/와인": ["와인", "맥주", "전통주", "위스키", "칵테일"]
    }
  },
  "건강 & 웰빙": {
    icon: "🌿",
    subcategories: {
      "건강기능식품": ["비타민", "영양제", "프로틴", "건강즙", "홍삼"],
      "이너뷰티": ["콜라겐", "발효식품", "효소", "저분자", "뷰티푸드"],
      "시니어케어": ["고령친화식품", "연하식", "영양보충식", "저작용이식품"],
      "특수식이": ["저염식", "저당식", "글루텐프리", "비건", "다이어트식품"]
    }
  },
  "프리미엄 & 특수식품": {
    icon: "⭐",
    subcategories: {
      "고메/스페셜티": ["특급 식재료", "장인 제품", "한정판", "시그니처"],
      "수입식품": ["유럽", "미국", "일본", "동남아", "중남미", "호주"],
      "프리미엄 식재료": ["트러플", "캐비아", "한우", "특산품", "명품 농산물"]
    }
  },
  "주방 & 리빙": {
    icon: "🍳",
    subcategories: {
      "스마트 주방가전": ["에어프라이어", "블렌더", "커피머신", "전기밥솥", "IoT 가전"],
      "조리도구/용품": ["냄비/팬", "칼/도마", "보관용기", "식기", "조리도구"],
      "푸드 라이프스타일": ["테이블웨어", "인테리어", "캠핑용품", "파티용품"]
    }
  },
  "맛 선호도": {
    icon: "😋",
    subcategories: {
      "맛 강도": ["매운맛 🌶️", "짠맛 🧂", "단맛 🍯", "신맛 🍋", "담백한맛 🥬", "감칠맛 🍄"],
      "식감": ["바삭한 식감 🥖", "부드러운 식감 🍮", "쫄깃한 식감 🍝", "아삭한 식감 🥗", "크리미한 🍨"],
      "조리법": ["구이/로스팅 🔥", "찜/삶기 ♨️", "튀김 🍤", "생식/샐러드 🥗", "조림/볶음 🍲"]
    }
  },
  "라이프스타일": {
    icon: "🏃",
    subcategories: {
      "식이 스타일": ["채식주의", "비건", "키토제닉/저탄수", "저염식", "저당식", "고단백", "할랄", "코셔"],
      "알레르기 대응": ["글루텐 프리", "유제품 프리", "견과류 프리", "계란 프리", "콩 프리", "해산물 프리"],
      "관심 키워드": ["다이어트/체중관리 ⚖️", "운동/피트니스 💪", "홈쿡/요리 👨‍🍳", "캠핑/아웃도어 🏕️", "와인/페어링 🍷", "디저트/카페 ☕", "키즈/이유식 👶", "반려동물 식품 🐾", "밀프렙/도시락 🍱", "베이킹/제과제빵 🧁"],
      "원산지 선호": ["국내산", "로컬푸드", "유럽산", "미국산", "일본산", "동남아산", "호주/뉴질랜드"]
    }
  }
};

const UserFormPage: React.FC<UserFormPageProps> = ({ user, onSubmit, onBack }) => {
  const [formData, setFormData] = useState<UserFormData>({
    age: 0,
    gender: '',
    interests: {},
    details: ''
  });

  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const isManyType = user.type.startsWith('many_');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.age || !formData.gender) {
      alert('나이와 성별을 입력해주세요.');
      return;
    }

    if (isManyType) {
      // many 타입은 관심사 선택 필수
      const hasInterests = formData.interests && Object.keys(formData.interests).length > 0;
      if (!hasInterests && !formData.details) {
        alert('관심사를 선택하거나 기대사항을 입력해주세요.');
        return;
      }
    } else {
      // few 타입은 텍스트 입력 필수
      if (!formData.details) {
        alert('기대사항을 입력해주세요.');
        return;
      }
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof UserFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleCategory = (category: string) => {
    const newSet = new Set(openCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setOpenCategories(newSet);
  };

  const handleInterestToggle = (subcategory: string, item: string) => {
    setFormData(prev => {
      const newInterests = prev.interests ? { ...prev.interests } : {};
      
      if (!newInterests[subcategory]) {
        newInterests[subcategory] = [];
      }
      
      const itemIndex = newInterests[subcategory].indexOf(item);
      if (itemIndex > -1) {
        // 이미 선택된 항목이면 제거
        newInterests[subcategory] = newInterests[subcategory].filter(i => i !== item);
        // 빈 배열이면 카테고리 자체를 삭제
        if (newInterests[subcategory].length === 0) {
          delete newInterests[subcategory];
        }
      } else {
        // 선택되지 않은 항목이면 추가 (불변성 유지를 위해 새 배열 생성)
        newInterests[subcategory] = [...newInterests[subcategory], item];
      }
      
      return {
        ...prev,
        interests: newInterests
      };
    });
  };

  const isItemSelected = (subcategory: string, item: string): boolean => {
    return formData.interests?.[subcategory]?.includes(item) || false;
  };

  return (
    <div className="container">
      <button className="back-button" onClick={onBack}>
        ← 뒤로가기
      </button>

      <div className="header">
        <h1>사용자 정보 입력</h1>
        <p>맞춤형 추천을 위해 정보를 입력해주세요</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="age" className="form-label">
            나이 *
          </label>
          <input
            type="number"
            id="age"
            className="form-input"
            value={formData.age || ''}
            onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
            placeholder="나이를 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender" className="form-label">
            성별 *
          </label>
          <select
            id="gender"
            className="form-select"
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            required
          >
            <option value="">성별을 선택하세요</option>
            <option value="남성">남성</option>
            <option value="여성">여성</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            관심사 선택 *
          </label>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            관심있는 분야를 선택해주세요 (여러 개 선택 가능)
          </p>
          
          <div className="interests-container">
            {Object.entries(INTEREST_CATEGORIES).map(([category, data]) => (
              <div key={category} className="interest-category">
                <button
                  type="button"
                  className={`category-header ${openCategories.has(category) ? 'open' : ''}`}
                  onClick={() => toggleCategory(category)}
                >
                  <span className="category-icon">{data.icon}</span>
                  <span className="category-name">{category}</span>
                  <span className="category-arrow">{openCategories.has(category) ? '▼' : '▶'}</span>
                </button>
                
                {openCategories.has(category) && (
                  <div className="subcategories">
                    {Object.entries(data.subcategories).map(([subcategory, items]) => (
                      <div key={subcategory} className="subcategory">
                        <div className="subcategory-title">{subcategory}</div>
                        <div className="items-grid">
                          {items.map((item) => (
                            <label key={item} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={isItemSelected(subcategory, item)}
                                onChange={() => handleInterestToggle(subcategory, item)}
                              />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {isManyType && (
          <div className="form-group">
            <label htmlFor="details" className="form-label">
              오늘 전시회에 대한 기대사항과 선호도 *
            </label>
            <textarea
              id="details"
              className="form-textarea"
              value={formData.details}
              onChange={(e) => handleInputChange('details', e.target.value)}
              placeholder="오늘 전시회에서 무엇을 기대하시나요? 어떤 분야에 관심이 있으신가요?"
              required
              rows={6}
            />
          </div>
        )}

        <button type="submit" className="btn btn-primary">
          추천 받기
        </button>
      </form>

      <style>{`
        .interests-container {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }

        .interest-category {
          border-bottom: 1px solid #e0e0e0;
        }

        .interest-category:last-child {
          border-bottom: none;
        }

        .category-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
          font-size: 1rem;
        }

        .category-header:hover {
          background: #e9ecef;
        }

        .category-header.open {
          background: #e3f2fd;
        }

        .category-icon {
          font-size: 1.5rem;
        }

        .category-name {
          flex: 1;
          font-weight: 600;
        }

        .category-arrow {
          color: #666;
          font-size: 0.8rem;
        }

        .subcategories {
          padding: 16px;
          background: #fff;
        }

        .subcategory {
          margin-bottom: 20px;
        }

        .subcategory:last-child {
          margin-bottom: 0;
        }

        .subcategory-title {
          font-weight: 600;
          margin-bottom: 12px;
          color: #333;
          font-size: 0.95rem;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 8px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }

        .checkbox-item:hover {
          background: #f5f5f5;
          border-color: #1976d2;
        }

        .checkbox-item input[type="checkbox"] {
          cursor: pointer;
        }

        .checkbox-item input[type="checkbox"]:checked + span {
          color: #1976d2;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default UserFormPage;
