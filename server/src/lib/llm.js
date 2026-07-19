// ── Tóm tắt biên bản cuộc họp bằng LLM ──
// Ưu tiên model NỘI BỘ (Qwen2.5 qua Ollama/vLLM) để giữ dữ liệu trong hệ thống.
//   • Ollama:  http://localhost:11434/api/chat  (LLM_MODEL=qwen2.5:14b)
//   • vLLM/OpenAI-compatible: đổi payload cho khớp.
// Chưa cấu hình LLM_URL -> trả bản mô phỏng.

const SYSTEM = [
  'Bạn là trợ lý tóm tắt cuộc họp/lớp học tiếng Việt.',
  'Chỉ trả về JSON hợp lệ với 3 khoá: topics (mảng chuỗi), keyPoints (mảng chuỗi), actions (mảng chuỗi).',
  'Ngắn gọn, súc tích, không thêm chữ ngoài JSON.'
].join(' ');

export async function summarize(transcript) {
  const llmUrl = process.env.LLM_URL;
  const model = process.env.LLM_MODEL || 'qwen2.5:14b';

  if (!llmUrl) {
    return {
      topics: ['Nội dung chính của buổi học'],
      keyPoints: ['Tóm tắt thật do Qwen sinh khi đã cấu hình LLM_URL trỏ tới Ollama/vLLM.'],
      actions: ['Cấu hình LLM_URL + LLM_MODEL trong .env để bật tóm tắt thật.'],
      simulated: true
    };
  }

  // Payload theo chuẩn Ollama /api/chat. Đổi nếu dùng vLLM/OpenAI-compatible.
  const res = await fetch(llmUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Tóm tắt biên bản buổi học sau:\n\n${transcript}` }
      ]
    })
  });
  if (!res.ok) throw new Error(`LLM trả lỗi ${res.status}`);
  const data = await res.json();
  const content = data.message?.content || data.choices?.[0]?.message?.content || '{}';
  return { ...safeParse(content), simulated: false, model };
}

function safeParse(s) {
  try {
    const obj = JSON.parse(s);
    return {
      topics: Array.isArray(obj.topics) ? obj.topics : [],
      keyPoints: Array.isArray(obj.keyPoints) ? obj.keyPoints : [],
      actions: Array.isArray(obj.actions) ? obj.actions : []
    };
  } catch {
    return { topics: [], keyPoints: [String(s).slice(0, 500)], actions: [] };
  }
}
