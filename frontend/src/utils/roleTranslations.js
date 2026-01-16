/**
 * Utility functions for role name translations
 */

export const ROLE_TRANSLATIONS = {
  'admin': 'Quản lý',
  'accountant': 'Thu ngân',
  'staff': 'Nhân viên',
};

/**
 * Translate role name from English to Vietnamese
 * @param {string} roleName - The role name in English
 * @returns {string} The translated role name in Vietnamese
 */
export const translateRoleName = (roleName) => {
  return ROLE_TRANSLATIONS[roleName] || roleName;
};

/**
 * Get all role translations
 * @returns {Object} Object with English keys and Vietnamese values
 */
export const getRoleTranslations = () => {
  return { ...ROLE_TRANSLATIONS };
};
