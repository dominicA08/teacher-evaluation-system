/**
 * Validates the AISAT student email format: aisat.[id_number][name]@gmail.com
 * Example: aisat.202410123juandelacruz@gmail.com
 * 
 * @param {string} email 
 * @returns {{isValid: boolean, studentId: string | null, studentName: string | null, error: string | null}}
 */
export function validateAisatEmail(email) {
  if (!email) {
    return { isValid: false, studentId: null, studentName: null, error: 'Email is required' };
  }

  // Regex breakdown:
  // ^aisat\.          - starts with "aisat."
  // ([a-zA-Z.]+)      - student name (one or more letters and optional dots)
  // (\d{6})           - student ID (exactly 6 digits)
  // @gmail\.com$      - ends with "@gmail.com"
  const regex = /^aisat\.([a-zA-Z.]+)(\d{6})@gmail\.com$/;
  const match = email.toLowerCase().trim().match(regex);

  if (!match) {
    return {
      isValid: false,
      studentId: null,
      studentName: null,
      error: 'Email must follow the pattern: aisat.johndoe[6-digit ID]@gmail.com'
    };
  }

  return {
    isValid: true,
    studentId: match[2],
    studentName: match[1],
    error: null
  };
}
