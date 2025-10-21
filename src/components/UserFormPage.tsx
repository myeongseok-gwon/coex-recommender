import React, { useState } from 'react';
import { User, UserFormData } from '../types';

interface UserFormPageProps {
  user: User;
  onSubmit: (formData: UserFormData) => void;
  onNext: (formData: UserFormData) => void;
  onBack: () => void;
}

// 관심사 데이터 구조

// 관심사 데이터 구조
const INTEREST_CATEGORIES = {
  "신선식품": {
    icon: "🥬",
    subcategories: {
      "과일/채소/곡물": ["과일", "채소", "쌀/잡곡", "견과류"],
      "육류/수산물": ["소", "돼지", "닭", "해산물", "수산가공품"],
    }
  },
  "가공식품": {
    icon: "🍱",
    subcategories: {
      "간편식/HMR": ["냉동식품", "냉장식품", "도시락", "레토르트"],
      "포장식품": ["통조림", "인스턴트", "면류", "장류"],
    }
  },
  "베이커리 & 디저트": {
    icon: "🍰",
    subcategories: {
      "빵": ["식빵", "페이스트리", "베이글", "제과제빵 재료"],
      "디저트": ["케이크", "아이스크림", "푸딩", "젤리", "초콜릿"],
      "스낵": ["과자", "쿠키"]
    }
  },
  "유제품 & 음료": {
    icon: "🥛",
    subcategories: {
      "유제품": ["우유", "치즈", "요거트", "버터", "크림"],
      "커피/차": ["원두", "인스턴트 커피", "차"],
      "음료": ["주스", "탄산음료", "기능성 음료"],
    }
  },
  "주류": {
      icon: "🍷",
      subcategories: {
        "주류": ["맥주", "와인", "전통주", "위스키"]
      }
    },

  "건강 & 웰빙": {
    icon: "🌿",
    subcategories: {
      "건강기능식품": ["비타민", "영양제", "프로틴", "건강즙", "홍삼"],
      "시니어케어": ["고령친화식품", "연하식", "영양보충식", "저작용이식품"],
      "유기농/친환경": ["유기농 인증", "친환경 인증"]
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
      "식이 스타일": ["채식/비건", "저탄수", "저염식", "저당식", "고단백"],
      "관심 키워드": ["다이어트 ⚖️", "운동 💪", "홈쿡/요리 👨‍🍳", "캠핑 🏕️", "와인 🍷", "디저트/카페 ☕", "키즈/이유식 👶", "반려동물 🐾", "밀프렙/도시락 🍱", "제과제빵 🧁", "고메/스페셜티 ⭐"],
    }
  }
};

const UserFormPage: React.FC<UserFormPageProps> = ({ user, onSubmit, onNext, onBack }) => {
  const [formData, setFormData] = useState<UserFormData>({
    age: 0,
    gender: '',
    interests: {}
  });

  // Type A는 simplified form (less questions)
  // Type B, C는 full form (many questions)
  const isTypeA = user.type === 'A';

  // 이모지 제거 함수
  const removeEmojis = (text: string): string => {
    return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{1F1E0}-\u{1F1FF}]|[\u{E0020}-\u{E007F}]|[\u{20D0}-\u{20FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]|[\u{25FD}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}-\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B1B}-\u{2B1C}]/gu, '').trim();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.age || !formData.gender) {
      alert('나이와 성별을 입력해주세요.');
      return;
    }

    // 관심사 검증 (항상 필수)
    const hasInterests = formData.interests && Object.keys(formData.interests).length > 0;
    if (!hasInterests) {
      alert('관심사를 선택해주세요.');
      return;
    }

    // 이모지 제거한 formData 생성
    const cleanedInterests: { [key: string]: string[] } = {};
    if (formData.interests) {
      Object.keys(formData.interests).forEach(subcategory => {
        cleanedInterests[subcategory] = formData.interests![subcategory].map(item => 
          removeEmojis(item)
        );
      });
    }

    const cleanedFormData: UserFormData = {
      ...formData,
      interests: cleanedInterests
    };

    // Type A는 바로 추천, Type B/C는 다음 페이지로
    if (isTypeA) {
      onSubmit(cleanedFormData);
    } else {
      onNext(cleanedFormData);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      <div className="top-nav-bar">
        <div className="nav-left" onClick={onBack}>
          ← 뒤로가기
        </div>
      </div>

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
            {Object.entries(INTEREST_CATEGORIES)
              .map(([category, data]) => (
              <div key={category} className="interest-category">
                <div className="category-header">
                  <span className="category-icon">{data.icon}</span>
                  <span className="category-name">{category}</span>
                </div>
                
                <div className="subcategories">
                  {Object.entries(data.subcategories).map(([subcategory, items]) => (
                    <div key={subcategory} className="subcategory">
                      <div className="subcategory-title">{subcategory}</div>
                      <div className="items-flex">
                        {items.map((item) => {
                          const selected = isItemSelected(subcategory, item);
                          return (
                            <button
                              key={item}
                              type="button"
                              className={`chip ${selected ? 'selected' : ''}`}
                              aria-pressed={selected}
                              onClick={() => handleInterestToggle(subcategory, item)}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          {isTypeA ? '추천 받기' : '다음'}
        </button>
      </form>

      <style>{`
        .top-nav-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1976d2;
          color: white;
          padding: 16px 24px;
          margin: 0 0 20px 0;
          border-bottom: 3px solid #1565c0;
        }

        .nav-left {
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .nav-left:hover {
          opacity: 0.8;
        }

        .nav-right {
          font-size: 16px;
          font-weight: 600;
        }

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
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
        }

        .category-icon {
          font-size: 1.2rem;
        }

        .category-name {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .subcategories {
          padding: 16px;
          background: #fff;
        }

        .subcategory {
          margin-bottom: 16px;
        }

        .subcategory:last-child {
          margin-bottom: 0;
        }

        .subcategory-title {
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
          font-size: 0.85rem;
        }

        .items-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #d0d7de;
          background: #fff;
          color: #24292f;
          font-size: 0.8rem;
          line-height: 1.2;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 0 rgba(27, 31, 36, 0.04);
          white-space: nowrap;
        }

        .chip:hover {
          background: #f6f8fa;
          border-color: #1976d2;
        }

        .chip.selected {
          background: #e3f2fd;
          border-color: #1976d2;
          color: #0d47a1;
          font-weight: 600;
        }

        .chip:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.3);
        }
      `}</style>
    </div>
  );
};

export default UserFormPage;
