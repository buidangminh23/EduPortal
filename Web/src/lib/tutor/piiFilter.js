export function filterPII(text) {
  if (!text) return '';

  return text
    // Replace emails
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    // Replace phone numbers (Vietnamese 10-digit format)
    .replace(/(?:0|\+84)[3|5|7|8|9][0-9]{8}/g, '[PHONE_REDACTED]')
    // Replace student IDs (e.g. HS001)
    .replace(/\bHS\d{3,4}\b/gi, '[STUDENT_ID]')
    // Replace class IDs (e.g. 12A1)
    .replace(/\b(10|11|12)[A-Z]\d?\b/g, '[CLASS_REDACTED]');
}
