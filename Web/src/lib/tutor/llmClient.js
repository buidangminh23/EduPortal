import { filterPII } from './piiFilter';
import { detectMentalHealthCrisis, getCrisisInterventionMessage } from './crisisDetector';
import { formatFocusedResponse } from './intentFocalizer';

function generateSmartFallbackResponse(cleanQuery) {
  const norm = cleanQuery.toLowerCase().trim();

  // 1. Social Greetings & Friendly Chat
  const greetings = ['hi', 'hello', 'xin chào', 'xinchao', 'chào', 'chào bạn', 'chào gia sư', 'chào em', 'bạn là ai', 'bạn tên gì', 'giúp', 'giúp em', 'hướng dẫn', 'alo', 'chào thầy', 'chào cô'];
  if (greetings.some(g => norm === g || norm.startsWith(g + ' ') || norm.endsWith(' ' + g))) {
    return `### 👋 Chào bạn! Mình là Gia Sư AI EduPortal (GDPT 2018)

Mình rất vui được đồng hành cùng bạn trên con đường học tập! 🌟

**Mình có thể giúp bạn:**
- 🧮 **Toán học & Khoa học:** Giải bài tập số học, đại số, hình học Oxyz, Vật lý, Hóa học, Sinh học...
- 📚 **Ngữ văn & KHXH:** Tóm tắt tác phẩm, phân tích nhân vật, gợi ý dàn bài văn biểu cảm/nghị luận.
- 🇬🇧 **Tiếng Anh:** Giải thích cấu trúc ngữ pháp, từ vựng, bài tập chia thì, đọc hiểu.
- 💡 **Phương pháp học tập:** Bảng tuần hoàn, mẹo ghi nhớ, phương pháp Pomodoro, Active Recall...

Bạn đang muốn giải bài tập hay tìm hiểu kiến thức nào? Hãy nhập đề bài hoặc câu hỏi vào đây nhé! ✨`;
  }

  // 2. Math & Science Queries
  if (norm.includes('phương trình') || norm.includes('pt') || norm.includes('bậc 2') || norm.includes('bậc hai')) {
    return `### 🧮 Phương pháp giải Phương trình bậc hai: $ax^2 + bx + c = 0$ $(a \\neq 0)$

**1. Công thức biệt thức $\\Delta$ (Delta):**
$$\\Delta = b^2 - 4ac$$

**2. Biện luận nghiệm:**
- 🔹 **Nếu $\\Delta > 0$:** Phương trình có 2 nghiệm phân biệt:
  $$x_1 = \\frac{-b + \\sqrt{\\Delta}}{2a}, \\quad x_2 = \\frac{-b - \\sqrt{\\Delta}}{2a}$$
- 🔹 **Nếu $\\Delta = 0$:** Phương trình có nghiệm kép:
  $$x_1 = x_2 = \\frac{-b}{2a}$$
- 🔹 **Nếu $\\Delta < 0$:** Phương trình vô nghiệm trên tập số thực $\\mathbb{R}$.

**3. Định lý Vi-ét (Viet-nam relation):**
$$S = x_1 + x_2 = -\\frac{b}{a}, \\quad P = x_1 \\cdot x_2 = \\frac{c}{a}$$

💡 *Bạn có đề bài cụ thể nào cần tính nghiệm không? Nhập câu hỏi (ví dụ: $2x^2 - 5x + 3 = 0$) để mình giải giúp nhé!*`;
  }

  if (norm.includes('đạo hàm') || norm.includes('dao ham')) {
    return `### 📐 Bảng công thức Đạo hàm cơ bản (Toán THPT)

**1. Các hàm số sơ cấp:**
- $(c)' = 0$ (với $c$ là hằng số)
- $(x^n)' = n \\cdot x^{n-1}$
- $(\\sqrt{x})' = \\frac{1}{2\\sqrt{x}} \\quad (x > 0)$
- $(\\frac{1}{x})' = -\\frac{1}{x^2} \\quad (x \\neq 0)$

**2. Đạo hàm hàm số lượng giác:**
- $(\\sin x)' = \\cos x$
- $(\\cos x)' = -\\sin x$
- $(\\tan x)' = \\frac{1}{\\cos^2 x} = 1 + \\tan^2 x$
- $(\\cot x)' = -\\frac{1}{\\sin^2 x} = -(1 + \\cot^2 x)$

**3. Quy tắc đạo hàm:**
- $(u + v)' = u' + v'$
- $(u \\cdot v)' = u'v + uv'$
- $(\\frac{u}{v})' = \\frac{u'v - uv'}{v^2}$

💡 *Bạn gửi đề bài đạo hàm cần tính để mình hướng dẫn các bước chi tiết nhé!*`;
  }

  if (norm.includes('tích phân') || norm.includes('nguyên hàm')) {
    return `### 📐 Công thức Nguyên hàm & Tích phân trọng tâm

**1. Bảng nguyên hàm cơ bản:**
- $\\int k \\, dx = kx + C$
- $\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)$
- $\\int \\frac{1}{x} \\, dx = \\ln|x| + C$
- $\\int e^x \\, dx = e^x + C$
- $\\int a^x \\, dx = \\frac{a^x}{\\ln a} + C$

**2. Phương pháp đổi biến số & Tích phân từng phần:**
$$\\int u \\, dv = u \\cdot v - \\int v \\, du$$

💡 *Hãy cho mình biết đề bài tích phân của bạn để nhận bài giải chi tiết từng bước nhé!*`;
  }

  if (norm.includes('thì') || norm.includes('tense') || norm.includes('tiếng anh') || norm.includes('english')) {
    return `### 🇬🇧 Tóm tắt 12 Thì trong Tiếng Anh (English Tenses)

**1. Nhóm Hiện tại (Present):**
- 🟢 **Present Simple:** $S + V_{(s/es)}$ (Thói quen, sự thật hiển nhiên)
- 🟢 **Present Continuous:** $S + \\text{am/is/are} + V\\text{-ing}$ (Hành động đang xảy ra)
- 🟢 **Present Perfect:** $S + \\text{have/has} + V_3/ed$ (Hành động vừa hoàn thành, kinh nghiệm)

**2. Nhóm Quá khứ (Past):**
- 🔵 **Past Simple:** $S + V_2/ed$ (Hành động đã chấm dứt trong quá khứ)
- 🔵 **Past Continuous:** $S + \\text{was/were} + V\\text{-ing}$ (Hành động đang xảy ra tại thời điểm quá khứ)
- 🔵 **Past Perfect:** $S + \\text{had} + V_3/ed$ (Hành động xảy ra trước 1 hành động quá khứ khác)

**3. Nhóm Tương lai (Future):**
- 🟣 **Future Simple:** $S + \\text{will} + V_{\\text{nguyên thể}}$
- 🟣 **Be going to:** $S + \\text{am/is/are going to} + V_{\\text{nguyên thể}}$ (Kế hoạch có sẵn)

💡 *Bạn muốn làm bài tập thì nào hay cần giải thích lại cấu trúc nào không?*`;
  }

  if (norm.includes('cảm ơn') || norm.includes('cam on') || norm.includes('thanks') || norm.includes('thank you')) {
    return `### 😊 Không có gì bạn nhé!

Gia sư AI luôn sẵn sàng đồng hành 24/7. Chúc bạn học tập thật tốt và đạt điểm cao trong các bài kiểm tra sắp tới! 🎓✨

Nếu có bài tập mới, cứ nhắn cho mình bất cứ lúc nào nhé!`;
  }

  // 3. General Academic fallback for any other custom question
  return `### 💡 Hướng dẫn từ Gia Sư AI EduPortal

Chào bạn, đối với câu hỏi **"${cleanQuery}"**:

1. **Tóm tắt nội dung chính:**
   Nội dung bạn đang tìm hiểu nằm trong khung chương trình GDPT 2018. Bạn nên áp dụng phương pháp phân tích yêu cầu đề bài, xác định công thức/khái niệm cốt lõi trước khi trình bày lời giải.

2. **Gợi ý các bước thực hiện:**
   - **Bước 1:** Đọc kỹ đề bài, liệt kê các dữ kiện đã biết và ẩn số cần tìm.
   - **Bước 2:** Áp dụng lý thuyết trọng tâm từ sách giáo khoa.
   - **Bước 3:** Kiểm tra lại kết quả và tính hợp lý của đáp số.

3. **Mẹo ghi nhớ:**
   Bạn có thể sử dụng sơ đồ tư duy (Mindmap) hoặc phương pháp ghi nhớ Active Recall để ghi nhớ bài lâu hơn.

💡 *Nếu bạn có đề bài cụ thể hơn (ví dụ: công thức, phương trình, tác phẩm văn học), hãy gửi chi tiết để Gia sư AI giải đáp chính xác nhất nhé!*`;
}

export async function generateScaffoldedResponse({ query, retrievedEntry, presetName = '', tone = '', competencyScore = 7 }) {
  // 1. Check for crisis
  if (detectMentalHealthCrisis(query)) {
    return getCrisisInterventionMessage();
  }

  // 2. Sanitize query PII
  const cleanQuery = filterPII(query);

  // 3. Verify retrieved entry exists - if not, use smart fallback generator instead of warning error
  if (!retrievedEntry) {
    return {
      isCrisis: false,
      message: generateSmartFallbackResponse(cleanQuery)
    };
  }

  // 4. Generate pinpointed focused response with citation
  const focusedOutput = formatFocusedResponse(cleanQuery, retrievedEntry, presetName, tone);

  return {
    isCrisis: false,
    message: focusedOutput
  };
}

