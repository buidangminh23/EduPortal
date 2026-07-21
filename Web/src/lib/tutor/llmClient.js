import { filterPII } from './piiFilter';
import { detectMentalHealthCrisis, getCrisisInterventionMessage } from './crisisDetector';
import { formatFocusedResponse } from './intentFocalizer';

export async function generateScaffoldedResponse({ query, retrievedEntry, presetName = '', tone = '', competencyScore = 7 }) {
  // 1. Check for crisis
  if (detectMentalHealthCrisis(query)) {
    return getCrisisInterventionMessage();
  }

  // 2. Sanitize query PII
  const cleanQuery = filterPII(query);

  // 3. Verify retrieved entry exists (Guardrail: no knowledge = no answer)
  if (!retrievedEntry) {
    return {
      isCrisis: false,
      message: `### ⚠️ Thông báo từ Gia sư AI\n\nHệ thống chưa ghi nhận tài liệu đã xuất bản cho câu hỏi: "${cleanQuery}".\n\nCâu hỏi này đã được tự động chuyển vào hàng đợi duyệt để thầy/cô bổ sung.`
    };
  }

  // 4. Generate pinpointed focused response with citation
  const focusedOutput = formatFocusedResponse(cleanQuery, retrievedEntry, presetName, tone);

  return {
    isCrisis: false,
    message: focusedOutput
  };
}
