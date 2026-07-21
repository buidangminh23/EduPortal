const CRISIS_KEYWORDS = [
  'tự tử', 'chết đi', 'bế tắc quá', 'muốn chết', 'áp lực quá không chịu nổi',
  'trầm cảm', 'tự hại', 'không muốn sống'
];

export function detectMentalHealthCrisis(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

export function getCrisisInterventionMessage() {
  return {
    isCrisis: true,
    message: `### ❤️ Lắng nghe & Chia sẻ cùng bạn\n\nMình cảm nhận được bạn đang phải trải qua những cảm xúc vô cùng áp lực. Đừng đối mặt với nó một mình nhé.\n\nNhà trường luôn có thầy cô tư vấn tâm lý sẵn sàng lắng nghe bạn bất cứ lúc nào. Bạn có thể mở ngay mục **Góc Tâm Lý & Wellness** trên trang web hoặc liên hệ Hotline hỗ trợ tâm lý học đường: **1800 1567** (miễn phí 24/7).\n\nHãy dành cho bản thân một phút nghỉ ngơi và chia sẻ với người bạn tin tưởng nhé!`
  };
}
