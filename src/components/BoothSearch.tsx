import React, { useState } from 'react';
import { Booth } from '../types';

interface BoothSearchProps {
  boothData: Booth[];
  onBoothSelect: (booth: Booth) => void;
  onClose: () => void;
}

const BoothSearch: React.FC<BoothSearchProps> = ({
  boothData,
  onBoothSelect,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Booth[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const results = boothData.filter(booth => {
      // 제목(회사명)을 우선적으로 검색
      const titleMatch = booth.company_name_kor?.toLowerCase().includes(searchTermLower) || false;
      const categoryMatch = booth.category?.toLowerCase().includes(searchTermLower) || false;
      const productsMatch = booth.products?.toLowerCase().includes(searchTermLower) || false;
      
      return titleMatch || categoryMatch || productsMatch;
    });

    // 제목 매치를 우선으로 정렬
    results.sort((a, b) => {
      const aTitleMatch = a.company_name_kor?.toLowerCase().includes(searchTermLower) || false;
      const bTitleMatch = b.company_name_kor?.toLowerCase().includes(searchTermLower) || false;
      
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      return 0;
    });

    setSearchResults(results);
    setHasSearched(true);
  };

  const handleBoothClick = (booth: Booth) => {
    onBoothSelect(booth);
  };

  return (
    <div className="booth-search-overlay">
      <div className="booth-search-modal">
        <div className="search-header">
          <h2>부스 검색</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="search-input-section">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="부스명(제목)을 기준으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <button className="search-btn" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>

        <div className="search-results">
          {hasSearched && (
            <>
              {searchResults.length > 0 ? (
                <div className="results-list">
                  {searchResults.map((booth, index) => (
                    <div
                      key={`${booth.id}-${index}`}
                      className="result-item"
                      onClick={() => handleBoothClick(booth)}
                    >
                      <div className="booth-info">
                        <h3>{booth.company_name_kor}</h3>
                        <p className="booth-category">{booth.category}</p>
                        <p className="booth-products">{booth.products}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <p>검색 결과가 없습니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .booth-search-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .booth-search-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .search-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
          background: #f8f9fa;
        }

        .search-header h2 {
          margin: 0;
          color: #1976d2;
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e0e0e0;
          color: #333;
        }

        .search-input-section {
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .search-input-wrapper {
          display: flex;
          gap: 12px;
        }

        .search-input-wrapper input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .search-input-wrapper input:focus {
          border-color: #1976d2;
        }

        .search-btn {
          padding: 12px 24px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .search-btn:hover {
          background: #1565c0;
        }

        .search-results {
          max-height: 400px;
          overflow-y: auto;
          padding: 0 24px 24px;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .result-item {
          padding: 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .result-item:hover {
          border-color: #1976d2;
          background: #f8f9fa;
        }

        .booth-info h3 {
          margin: 0 0 8px 0;
          color: #1976d2;
          font-size: 1.1rem;
        }

        .booth-category {
          margin: 0 0 4px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .booth-products {
          margin: 0;
          color: #333;
          font-size: 0.9rem;
        }

        .no-results {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default BoothSearch;
