import { filterPII } from './piiFilter';
import { detectMentalHealthCrisis, getCrisisInterventionMessage } from './crisisDetector';

export async function generateScaffoldedResponse({ query, retrievedEntry, competencyScore = 7 }) {
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

  // 4. Adapt Scaffolding level based on competencyScore (0-10)
  // Low competency (< 5): Show full worked solution model
  // Medium competency (5-8): Fill-in-the-blank steps
  // High competency (> 8): Socratic hints only
  const solution = retrievedEntry.solutions?.[0];

  let output = `### 📖 Giải đáp: **${retrievedEntry.topic}**\n\n`;

  if (competencyScore < 5) {
    // Scaffold Level 1: Full Worked Model
    output += `*Chế độ hỗ trợ củng cố nền tảng (Mẫu đầy đủ):*\n\n`;
    output += `${retrievedEntry.content}\n\n`;
    if (solution) {
      output += `**Bài giải mẫu:** ${solution.problem}\n\n`;
      output += solution.steps.map(s => `- **Bước ${s.n}:** ${s.content}`).join('\n');
      output += `\n\n**Đáp số:** $${solution.answer}$`;
    }
  } else if (competencyScore <= 8) {
    // Scaffold Level 2: Step-by-step fill-in
    output += `*Chế độ rèn luyện tư duy (Hướng dẫn từng bước):*\n\n`;
    if (solution && solution.steps?.length > 0) {
      const step1 = solution.steps[0];
      output += `**Bài toán:** ${solution.problem}\n\n`;
      output += `**Bước 1:** ${step1.content}\n\n*Gợi ý:* ${step1.hint || 'Bạn hãy tính toán tiếp nhé.'}`;
    } else {
      output += `${retrievedEntry.content}`;
    }
  } else {
    // Scaffold Level 3: High Competency Socratic
    output += `*Chế độ nâng cao (Tự lực suy luận):*\n\n`;
    output += `Hãy áp dụng nguyên lý sau để tự tìm ra câu trả lời:\n> ${retrievedEntry.content.substring(0, 100)}...`;
  }

  // 5. Verify Citation
  const sourceTag = `\n\n---\n*🔖 Nguồn trích dẫn: ${retrievedEntry.source_ref || 'Giáo án đã duyệt'}*`;
  output += sourceTag;

  return {
    isCrisis: false,
    message: output
  };
}
