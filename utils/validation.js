/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validatePhone(phone) {
  // Basic international phone number format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate cryptocurrency wallet address
 * @param {string} address - Wallet address to validate
 * @param {string} chain - Blockchain (eth, bsc, etc.)
 * @returns {boolean} - True if valid, false otherwise
 */
function validateWalletAddress(address, chain = 'eth') {
  const patterns = {
    eth: /^0x[a-fA-F0-9]{40}$/,
    bsc: /^0x[a-fA-F0-9]{40}$/,
    sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  };

  return patterns[chain] ? patterns[chain].test(address) : false;
}

/**
 * Validate amount
 * @param {number|string} amount - Amount to validate
 * @param {number} min - Minimum allowed amount
 * @param {number} max - Maximum allowed amount
 * @returns {boolean} - True if valid, false otherwise
 */
function validateAmount(amount, min = 0, max = Infinity) {
  const num = Number(amount);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @param {Date} minDate - Minimum allowed date
 * @param {Date} maxDate - Maximum allowed date
 * @returns {boolean} - True if valid, false otherwise
 */
function validateDate(date, minDate = new Date(0), maxDate = new Date(8640000000000000)) {
  const testDate = new Date(date);
  return testDate >= minDate && testDate <= maxDate && !isNaN(testDate.getTime());
}

/**
 * Sanitize input string
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateWalletAddress,
  validateAmount,
  validateDate,
  sanitizeString
}; 