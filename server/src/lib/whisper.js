// ── Phiên âm giọng nói → văn bản (Whisper) ──
// Chạy nội bộ để dữ liệu học sinh không rời hệ thống:
//   • faster-whisper-server (khuyến nghị, có GPU): https://github.com/fedirz/faster-whisper-server
//   • hoặc whisper.cpp server
// Dựng xong đặt WHISPER_URL trong .env. Chưa cấu hình -> trả bản mô phỏng để endpoint vẫn chạy.

export async function transcribe(audioBuffer, { language = 'vi' } = {}) {
  const url = process.env.WHISPER_URL;

  if (!url) {
    return {
      text: '[mô phỏng] Bản phiên âm sẽ hiện ở đây khi đã nối Whisper nội bộ (đặt WHISPER_URL).',
      simulated: true
    };
  }
  if (!audioBuffer || !audioBuffer.length) {
    throw new Error('Thiếu dữ liệu âm thanh để phiên âm.');
  }

  // TODO: chỉnh cho khớp API của Whisper server bạn dùng (đa số nhận multipart 'file').
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-Language': language },
    body: audioBuffer
  });
  if (!res.ok) throw new Error(`Whisper trả lỗi ${res.status}`);
  const data = await res.json();
  return { text: data.text || '', simulated: false };
}
