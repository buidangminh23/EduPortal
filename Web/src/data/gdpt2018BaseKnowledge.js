export const GDPT2018_BASE_KNOWLEDGE = [
  {
    id: 'base-math-01',
    layer: 'base',
    subject: 'Toán học',
    topic: 'Tích phân và Nguyên hàm',
    triggers: ['tich phan', 'nguyen ham', 'tich phan x', 'nguyen ham x'],
    content: 'Công thức nguyên hàm cơ bản:\n\n$$\\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)$$\n\n$$\\int \\frac{1}{x} dx = \\ln|x| + C$$\n\nCông thức Tích phân từng phần:\n\n$$\\int u dv = uv - \\int v du$$',
    source_ref: 'SGK Toán 12 - Chương III (Cánh Diều / Kết Nối Tri Thức / Chân Trời Sáng Tạo)',
    status: 'published',
    solutions: [
      {
        problem: 'Tính $I = \\int_1^2 x dx$',
        steps: [
          { n: 1, content: 'Tìm nguyên hàm của x: $F(x) = \\frac{x^2}{2}$', hint: 'Áp dụng công thức nguyên hàm hàm số lũy thừa.' },
          { n: 2, content: 'Thế cận từ 1 đến 2: $I = F(2) - F(1) = 2 - 0.5 = 1.5$', hint: 'Lấy F(b) trừ F(a).' }
        ],
        answer: '1.5',
        answer_locked: true
      }
    ]
  },
  {
    id: 'base-physics-01',
    layer: 'base',
    subject: 'Vật lý',
    topic: 'Dòng điện xoay chiều RLC',
    triggers: ['dong dien xoay chieu', 'rlc', 'tong tro', 'cong huong dien'],
    content: 'Tổng trở mạch RLC nối tiếp:\n\n$$Z = \\sqrt{R^2 + (Z_L - Z_C)^2}$$\n\nTrong đó $Z_L = \\omega L$, $Z_C = \\frac{1}{\\omega C}$.\n\nKhi $Z_L = Z_C$, mạch xảy ra cộng hưởng điện: $Z_{min} = R$.',
    source_ref: 'SGK Vật lý 12 - Chương III',
    status: 'published',
    solutions: [
      {
        problem: 'Cho $R = 30\\Omega$, $Z_L = 80\\Omega$, $Z_C = 40\\Omega$. Tính tổng trở $Z$.',
        steps: [
          { n: 1, content: 'Tính $(Z_L - Z_C)$: $80 - 40 = 40\\Omega$', hint: 'Lấy cảm kháng trừ dung kháng.' },
          { n: 2, content: 'Áp dụng công thức tổng trở: $Z = \\sqrt{30^2 + 40^2} = 50\\Omega$', hint: 'Bộ ba Pythagore 30-40-50.' }
        ],
        answer: '50',
        answer_locked: true
      }
    ]
  },
  {
    id: 'base-chem-01',
    layer: 'base',
    subject: 'Hóa học',
    topic: 'Kim loại kiềm và Kim loại kiềm thổ',
    triggers: ['kim loai kiem', 'tac dung voi nuoc', 'phat hien ket tua'],
    content: 'Phản ứng của kim loại kiềm (M) với nước:\n\n$$2\\text{M} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{MOH} + \\text{H}_2\\uparrow$$\n\nDung dịch có tính bazơ mạnh (phèn phenolphtalein chuyển hồng).',
    source_ref: 'SGK Hóa học 12 - Chương VI',
    status: 'published',
    solutions: []
  },
  {
    id: 'base-eng-01',
    layer: 'base',
    subject: 'Tiếng Anh',
    topic: 'Thì Hiện tại Hoàn thành (Present Perfect)',
    triggers: ['hien tai hoan thanh', 'present perfect', 'since', 'for'],
    content: 'Công thức:\n\n$$S + \\text{have/has} + V_3/ed$$\n\nDấu hiệu nhận biết: since, for, already, yet, just, ever, never, so far.',
    source_ref: 'SGK Tiếng Anh 12 - Unit 1',
    status: 'published',
    solutions: []
  },
  {
    id: 'base-lit-01',
    layer: 'base',
    subject: 'Ngữ văn',
    topic: 'Vợ chồng A Phủ (Tô Hoài)',
    triggers: ['vo chong a phu', 'tac pham mi', 'to hoai'],
    content: 'Tác phẩm phơi bày số phận đau khổ của người lao động vùng cao dưới ách phong kiến chúa đất Pá Tra, đồng thời ngợi ca sức sống tiềm tàng và khát vọng tự do của Mị và A Phủ.',
    source_ref: 'SGK Ngữ văn 12 - Tập 2',
    status: 'published',
    solutions: []
  }
];
