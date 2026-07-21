export function detectIntent(query) {
  if (!query) return 'GENERAL';
  const norm = query.toLowerCase();

  if (norm.includes('cua ai') || norm.includes('tac gia') || norm.includes('ai sang tac') || norm.includes('ai viet') || norm.includes('ai la nhat')) {
    return 'AUTHOR';
  }
  if (norm.includes('cong thuc') || norm.includes('tinh nhu the nao') || norm.includes('cach tinh') || norm.includes('bang bao nhieu')) {
    return 'FORMULA';
  }
  if (norm.includes('y nghia') || norm.includes('noi dung') || norm.includes('gia tri') || norm.includes('chu de')) {
    return 'THEME';
  }
  if (norm.includes('dinh nghia') || norm.includes('la gi') || norm.includes('the nao la')) {
    return 'DEFINITION';
  }
  if (norm.includes('giai') || norm.includes('bai tap') || norm.includes('vi du') || norm.includes('tinh i') || norm.includes('tinh z')) {
    return 'SOLUTION';
  }
  return 'GENERAL';
}

export function formatFocusedResponse(query, entry, presetName = '', tone = '') {
  if (!entry) return null;

  const intent = detectIntent(query);
  let prefix = '';

  // Extract pinpointed author answer
  if (intent === 'AUTHOR') {
    const authorMatch = entry.content.match(/\*\*Tác giả:\*\*\s*([^\n]+)/i);
    if (authorMatch) {
      prefix = `🎯 **Trả lời trực tiếp:** Tác giả là ${authorMatch[1]}\n\n---\n`;
    } else if (entry.topic.includes('(') && entry.topic.includes(')')) {
      const authorInTopic = entry.topic.substring(entry.topic.indexOf('(') + 1, entry.topic.indexOf(')'));
      prefix = `🎯 **Trả lời trực tiếp:** Tác giả của tác phẩm là nhà văn **${authorInTopic}**.\n\n---\n`;
    }
  } 
  // Extract pinpointed formula answer
  else if (intent === 'FORMULA') {
    const formulaMatch = entry.content.match(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/);
    if (formulaMatch) {
      prefix = `🎯 **Công thức trọng tâm:**\n\n${formulaMatch[0]}\n\n---\n`;
    }
  }

  let body = '';
  const solution = entry.solutions?.[0];

  if (presetName === 'Gợi mở từng bước' && solution && solution.steps?.length > 0) {
    const firstStep = solution.steps[0];
    body = `### 📐 Giải đáp: **${entry.topic}** (Phương pháp gợi mở)\n\n${prefix}**Bài toán:** ${solution.problem}\n\n**Bước 1:** ${firstStep.content}\n\n*Câu hỏi gợi ý:* ${firstStep.hint || 'Hãy suy nghĩ tiếp nhé.'}`;
  } else if (presetName === 'Mẫu rồi luyện' && solution) {
    body = `### 📐 Lời giải mẫu: **${entry.topic}**\n\n${prefix}**Bài toán:** ${solution.problem}\n\n${solution.steps.map(s => `- **Bước ${s.n}:** ${s.content}`).join('\n')}\n\n**Đáp số:** $${solution.answer}$`;
  } else if (presetName === 'Ôn thi tốc độ' && solution) {
    body = `### ⚡ Mẹo giải nhanh: **${entry.topic}**\n\n${prefix}**Bài toán:** ${solution.problem}\n\n**Đáp số trắc nghiệm:** $${solution.answer}$`;
  } else {
    body = `### 📖 Kiến thức bộ môn: **${entry.topic}**\n\n${prefix}${entry.content}`;
  }

  if (tone === 'than_mat') {
    body += `\n\n*Cố lên nhé, bạn đang làm rất tốt! Cần mình trợ giúp gì thêm cứ nói nha. ❤️*`;
  } else if (tone === 'nghiem_tuc') {
    body += `\n\n*Đề nghị ghi nhớ kỹ thông tin trước khi chuyển sang chủ đề tiếp theo.*`;
  }

  body += `\n\n---\n*🔖 Nguồn trích dẫn: ${entry.source_ref || 'SGK GDPT 2018 chính thống'}*`;

  return body;
}
