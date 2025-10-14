import React, { useState } from 'react';
import { User, UserFormData } from '../types';

interface UserFormPageProps {
  user: User;
  onSubmit: (formData: UserFormData) => void;
  onBack: () => void;
}

const UserFormPage: React.FC<UserFormPageProps> = ({ user, onSubmit, onBack }) => {
  const [formData, setFormData] = useState<UserFormData>({
    age: 0,
    gender: '',
    company_name: '',
    work_experience: 0,
    expo_experience: 0,
    details: ''
  });

  const isManyType = user.type.startsWith('many_');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.age || !formData.gender || !formData.details) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (isManyType && (!formData.company_name || !formData.work_experience || !formData.expo_experience)) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof UserFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
            <option value="기타">기타</option>
          </select>
        </div>

        {isManyType && (
          <>
            <div className="form-group">
              <label htmlFor="company_name" className="form-label">
                회사명 *
              </label>
              <input
                type="text"
                id="company_name"
                className="form-input"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="회사명을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="work_experience" className="form-label">
                총 근무 경력 (년) *
              </label>
              <input
                type="number"
                id="work_experience"
                className="form-input"
                value={formData.work_experience || ''}
                onChange={(e) => handleInputChange('work_experience', parseInt(e.target.value) || 0)}
                placeholder="총 근무 경력을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expo_experience" className="form-label">
                전시회 참관 경험 (회) *
              </label>
              <input
                type="number"
                id="expo_experience"
                className="form-input"
                value={formData.expo_experience || ''}
                onChange={(e) => handleInputChange('expo_experience', parseInt(e.target.value) || 0)}
                placeholder="전시회 참관 경험을 입력하세요"
                required
              />
            </div>
          </>
        )}

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
          />
        </div>

        <button type="submit" className="btn btn-primary">
          추천 받기
        </button>
      </form>
    </div>
  );
};

export default UserFormPage;
