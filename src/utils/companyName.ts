/**
 * Check if a company name contains keywords that typically indicate it should use a smaller font size
 */
export const hasLongCompanyName = (companyName: string): boolean => {
  if (!companyName) return false;
  
  const keywords = [
    '주식회사',
    '농업회사법인',
    '(주)',
    '한국농수산식품유통공사',
    '농업법인'
  ];
  
  return keywords.some(keyword => companyName.includes(keyword));
};

