/**
 * Calculate the current financial year
 * Financial year runs from April to March
 * e.g., April 2025 to March 2026 = 2526
 * @returns {string} Financial year in format YYYY (e.g., "2526")
 */
export const getCurrentFinancialYear = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12 (January = 1, December = 12)
  const currentYear = now.getFullYear();
  
  // Financial year format: Last 2 digits of start year + Last 2 digits of end year
  // April 2025 to March 2026 = 2526 (25 from 2025, 26 from 2026)
  // April 2026 to March 2027 = 2627 (26 from 2026, 27 from 2027)
  // January 2026 to March 2026 = 2526 (25 from 2025, 26 from 2026)
  
  if (currentMonth >= 4) {
    // April to December: Financial year is current year to next year
    const nextYear = currentYear + 1;
    const yearPart = currentYear.toString().slice(-2); // Last 2 digits of current year
    const nextYearPart = nextYear.toString().slice(-2); // Last 2 digits of next year
    return `${yearPart}${nextYearPart}`;
  } else {
    // January to March: Financial year is previous year to current year
    const prevYear = currentYear - 1;
    const prevYearPart = prevYear.toString().slice(-2); // Last 2 digits of previous year
    const currentYearPart = currentYear.toString().slice(-2); // Last 2 digits of current year
    return `${prevYearPart}${currentYearPart}`;
  }
};

/**
 * Extract financial year from a document number
 * @param {string} documentNumber - Document number (e.g., "QT25250001")
 * @returns {string|null} Financial year or null if invalid format
 */
export const extractFinancialYear = (documentNumber) => {
  if (!documentNumber || typeof documentNumber !== 'string') return null;
  
  // Match pattern: PREFIX + 4 digits (financial year) + 4 digits (sequence)
  // e.g., QT25250001, PI25260001, INV25260001
  const match = documentNumber.match(/^(QT|PI|INV)(\d{4})(\d{4})$/);
  if (match) {
    return match[2]; // Return the 4-digit financial year
  }
  
  return null;
};

/**
 * Extract sequence number from a document number
 * @param {string} documentNumber - Document number (e.g., "QT25250001")
 * @returns {number|null} Sequence number or null if invalid format
 */
export const extractSequenceNumber = (documentNumber) => {
  if (!documentNumber || typeof documentNumber !== 'string') return null;
  
  const match = documentNumber.match(/^(QT|PI|INV)(\d{4})(\d{4})$/);
  if (match) {
    return parseInt(match[3], 10); // Return the last 4 digits as number
  }
  
  return null;
};

/**
 * Build document number from parts
 * @param {string} prefix - Document prefix (QT, PI, INV)
 * @param {string} financialYear - Financial year (4 digits)
 * @param {number|string} sequence - Sequence number (will be padded to 4 digits)
 * @returns {string} Complete document number
 */
export const buildDocumentNumber = (prefix, financialYear, sequence) => {
  const paddedSequence = String(sequence).padStart(4, '0');
  return `${prefix}${financialYear}${paddedSequence}`;
};

