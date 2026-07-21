export const GDPT2018_BASE_KNOWLEDGE = [
  // ─── TOÁN HỌC ─────────────────────────────────────────────────────────────
  {
    id: 'base-math-01',
    layer: 'base',
    subject: 'Toán học',
    topic: 'Tích phân và Nguyên hàm',
    triggers: ['tich phan', 'nguyen ham', 'tich phan x', 'nguyen ham x', 'tich phan la gi'],
    content: 'Công thức nguyên hàm cơ bản:\n\n$$\\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)$$\n\n$$\\int \\frac{1}{x} dx = \\ln|x| + C$$\n\nCông thức Tích phân từng phần:\n\n$$\\int u dv = uv - \\int v du$$\n\n*Mẹo nhớ đặt u:* "Nhất lô (log), nhì đa (đa thức), tam lượng (lượng giác), tứ mũ".',
    source_ref: 'SGK Toán 12 - Chương III (Cánh Diều / Kết Nối Tri Thức / Chân Trời Sáng Tạo)',
    status: 'published',
    solutions: [
      {
        problem: 'Tính tích phân $I = \\int_1^2 x dx$',
        steps: [
          { n: 1, content: 'Tìm nguyên hàm của $x$: $F(x) = \\frac{x^2}{2}$', hint: 'Áp dụng công thức lũy thừa với $n=1$.' },
          { n: 2, content: 'Thế cận từ 1 đến 2: $I = F(2) - F(1) = \\frac{2^2}{2} - \\frac{1^2}{2} = 2 - 0.5 = 1.5$', hint: 'Lấy $F(b) - F(a)$.' }
        ],
        answer: '1.5',
        answer_locked: true
      }
    ]
  },
  {
    id: 'base-math-02',
    layer: 'base',
    subject: 'Toán học',
    topic: 'Đạo hàm và Cực trị Hàm số',
    triggers: ['dao ham', 'cuc tri', 'cuc dai', 'cuc tiểu', 'dao ham la gi'],
    content: 'Công thức đạo hàm hàm số lũy thừa và hợp:\n\n$$(x^n)\' = n \\cdot x^{n-1}$$\n\n$$(u^n)\' = n \\cdot u^{n-1} \\cdot u\'$$\n\nĐiều kiện xét cực trị hàm số $y = f(x)$:\n\n- Nếu $f\'(x_0) = 0$ và $f\'\'(x_0) < 0 \\Rightarrow x_0$ là điểm cực đại.\n- Nếu $f\'(x_0) = 0$ và $f\'\'(x_0) > 0 \\Rightarrow x_0$ là điểm cực tiểu.',
    source_ref: 'SGK Toán 12 - Chương I',
    status: 'published',
    solutions: [
      {
        problem: 'Tìm đạo hàm của hàm số $y = x^3 - 3x + 2$',
        steps: [
          { n: 1, content: 'Tính đạo hàm từng số hạng: $(x^3)\' = 3x^2, (-3x)\' = -3, (2)\' = 0$', hint: 'Áp dụng công thức đạo hàm lũy thừa.' },
          { n: 2, content: 'Tổng hợp đạo hàm: $y\' = 3x^2 - 3$', hint: 'Rút gọn biểu thức.' }
        ],
        answer: '3x^2 - 3',
        answer_locked: true
      }
    ]
  },
  {
    id: 'base-math-03',
    layer: 'base',
    subject: 'Toán học',
    topic: 'Hình học Không gian Oxyz',
    triggers: ['oxyz', 'mat phong', 'toa do', 'khoang cach', 'vecto phap tuyen'],
    content: 'Phương trình tổng quát của Mặt phẳng $(\\alpha)$ trong không gian Oxyz:\n\n$$Ax + By + Cz + D = 0$$\n\nTrong đó Vectơ pháp tuyến là $\\vec{n} = (A; B; C)$.\n\nCông thức tính khoảng cách từ điểm $M(x_0; y_0; z_0)$ đến mặt phẳng $(\\alpha)$:\n\n$$d(M, \\alpha) = \\frac{|Ax_0 + By_0 + Cz_0 + D|}{\\sqrt{A^2 + B^2 + C^2}}$$',
    source_ref: 'SGK Toán 12 - Chương IV',
    status: 'published',
    solutions: [
      {
        problem: 'Tính khoảng cách từ điểm $M(1, 2, 3)$ đến mặt phẳng $(P): 2x - 2y + z + 5 = 0$',
        steps: [
          { n: 1, content: 'Thay tọa độ điểm M vào tử số: $|2(1) - 2(2) + 1(3) + 5| = |2 - 4 + 3 + 5| = 6$', hint: 'Thay $x_0, y_0, z_0$ vào $Ax+By+Cz+D$.' },
          { n: 2, content: 'Tính độ dài vectơ pháp tuyến ở mẫu số: $\\sqrt{2^2 + (-2)^2 + 1^2} = \\sqrt{4 + 4 + 1} = 3$', hint: 'Tính $\\sqrt{A^2+B^2+C^2}$.' },
          { n: 3, content: 'Tính khoảng cách $d = \\frac{6}{3} = 2$', hint: 'Lấy tử chia mẫu.' }
        ],
        answer: '2',
        answer_locked: true
      }
    ]
  },

  // ─── VẬT LÝ ───────────────────────────────────────────────────────────────
  {
    id: 'base-physics-01',
    layer: 'base',
    subject: 'Vật lý',
    topic: 'Dòng điện xoay chiều RLC',
    triggers: ['dong dien xoay chieu', 'rlc', 'tong tro', 'cong huong dien', 'cam khang', 'dung khang'],
    content: 'Công thức Tổng trở mạch RLC nối tiếp:\n\n$$Z = \\sqrt{R^2 + (Z_L - Z_C)^2}$$\n\nTrong đó Cảm kháng $Z_L = \\omega L$, Dung kháng $Z_C = \\frac{1}{\\omega C}$.\n\nKhi xảy ra hiện tượng Cộng hưởng điện ($Z_L = Z_C$):\n\n- Tổng trở đạt cực tiểu: $Z_{min} = R$\n- Cường độ dòng điện cực đại: $I_{max} = \\frac{U}{R}$',
    source_ref: 'SGK Vật lý 12 - Chương III',
    status: 'published',
    solutions: [
      {
        problem: 'Cho $R = 30\\Omega$, $Z_L = 80\\Omega$, $Z_C = 40\\Omega$. Tính tổng trở $Z$.',
        steps: [
          { n: 1, content: 'Tính hiệu cảm kháng và dung kháng: $Z_L - Z_C = 80 - 40 = 40\\Omega$', hint: 'Lấy $Z_L$ trừ $Z_C$.' },
          { n: 2, content: 'Áp dụng công thức tổng trở: $Z = \\sqrt{30^2 + 40^2} = \\sqrt{900 + 1600} = 50\\Omega$', hint: 'Bộ ba Pythagore 30-40-50.' }
        ],
        answer: '50',
        answer_locked: true
      }
    ]
  },
  {
    id: 'base-physics-02',
    layer: 'base',
    subject: 'Vật lý',
    topic: 'Giao thoa Sóng cơ',
    triggers: ['giao thoa song', 'buc song', 'cuc dai giao thoa', 'cuc tieu giao thoa'],
    content: 'Công thức liên hệ Bước sóng $\\lambda$, Vận tốc $v$, Chu kỳ $T$ và Tần số $f$:\n\n$$\\lambda = v \\cdot T = \\frac{v}{f}$$\n\nĐiều kiện vị trí các điểm giao thoa (2 nguồn cùng pha):\n\n- Vị trí Cực đại giao thoa: $$d_2 - d_1 = k\\lambda \\quad (k \\in \\mathbb{Z})$$\n- Vị trí Cực tiểu giao thoa: $$d_2 - d_1 = (k + 0.5)\\lambda \\quad (k \\in \\mathbb{Z})$$',
    source_ref: 'SGK Vật lý 12 - Chương II',
    status: 'published',
    solutions: []
  },

  // ─── HÓA HỌC ──────────────────────────────────────────────────────────────
  {
    id: 'base-chem-01',
    layer: 'base',
    subject: 'Hóa học',
    topic: 'Kim loại kiềm và Kim loại kiềm thổ',
    triggers: ['kim loai kiem', 'tac dung voi nuoc', 'phat hien ket tua', 'kiem tho'],
    content: 'Phản ứng của kim loại kiềm (M) tác dụng với nước ở điều kiện thường:\n\n$$2\\text{M} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{MOH} + \\text{H}_2\\uparrow$$\n\nHiện tượng: Kim loại tan nhanh, sủi bọt khí $\\text{H}_2$, dung dịch thu được làm quỳ tím hóa xanh và phenolphtalein chuyển màu hồng.',
    source_ref: 'SGK Hóa học 12 - Chương VI',
    status: 'published',
    solutions: [
      {
        problem: 'Cho 2.3 gam Natri (Na) tác dụng hoàn toàn với nước dư. Tính thể tích khí H2 sinh ra ở ĐKTC (M_Na = 23).',
        steps: [
          { n: 1, content: 'Tính số mol Na: $n_{Na} = \\frac{2.3}{23} = 0.1 \\text{ mol}$', hint: 'Lấy khối lượng chia M.' },
          { n: 2, content: 'Theo phương trình $2\\text{Na} \\rightarrow \\text{H}_2$: $n_{H_2} = 0.05 \\text{ mol}$', hint: 'Số mol H2 bằng nửa số mol Na.' },
          { n: 3, content: 'Tính thể tích $V = 0.05 \\times 22.4 = 1.12 \\text{ lít}$', hint: 'Nhân với 22.4.' }
        ],
        answer: '1.12 lít',
        answer_locked: true
      }
    ]
  },

  // ─── TIẾNG ANH ────────────────────────────────────────────────────────────
  {
    id: 'base-eng-01',
    layer: 'base',
    subject: 'Tiếng Anh',
    topic: 'Thì Hiện tại Hoàn thành (Present Perfect Tense)',
    triggers: ['hien tai hoan thanh', 'present perfect', 'since', 'for', 'already', 'yet'],
    content: 'Công thức Thì Hiện tại Hoàn thành:\n\n- Khẳng định: $$S + \\text{have/has} + V_3/ed$$\n- Phủ định: $$S + \\text{have/has} + \\text{not} + V_3/ed$$\n- Nghi vấn: $$\\text{Have/Has} + S + V_3/ed?$$\n\nDấu hiệu nhận biết trọng tâm: *since (+ mốc thời gian), for (+ khoảng thời gian), already, yet, just, ever, never, so far.*',
    source_ref: 'SGK Tiếng Anh 12 - Unit 1 Grammar',
    status: 'published',
    solutions: []
  },
  {
    id: 'base-eng-02',
    layer: 'base',
    subject: 'Tiếng Anh',
    topic: 'Câu Bị động (Passive Voice)',
    triggers: ['cau bi dong', 'passive voice', 'by someone'],
    content: 'Công thức chung của Câu Bị động:\n\n$$\\text{Chủ ngữ (O cũ)} + \\text{to be} + V_3/ed + (\\text{by } S_{\\text{cũ}})$$\n\n*Ví dụ:*\n- Chủ động: *The teacher grades the assignment.*\n- Bị động: *The assignment is graded by the teacher.*',
    source_ref: 'SGK Tiếng Anh 12 - Grammar Reference',
    status: 'published',
    solutions: []
  },

  // ─── NGỮ VĂN ──────────────────────────────────────────────────────────────
  {
    id: 'base-lit-01',
    layer: 'base',
    subject: 'Ngữ văn',
    topic: 'Tác phẩm Vợ chồng A Phủ (Tô Hoài)',
    triggers: ['vo chong a phu', 'nhan vat mi', 'to hoai', 'mi va a phu'],
    content: 'Phân tích trọng tâm tác phẩm **"Vợ chồng A Phủ"** (Tô Hoài):\n\n- **Giá trị hiện thực:** Phơi bày số phận đau khổ, kiếp sống nô lệ của Mị và A Phủ dưới ách áp bức của giai cấp chúa đất phong kiến miền núi (cường quyền Pá Tra) và hủ tục cúng trình ma.\n\n- **Giá trị nhân đạo:** Khám phá, ngợi ca sức sống tiềm tàng mãnh liệt và khát vọng tự do của Mị. Đỉnh cao là hành động Mị cởi trói cho A Phủ trong đêm đông và cùng chạy trốn đến Hồng Ngài.',
    source_ref: 'SGK Ngữ văn 12 - Tập 2',
    status: 'published',
    solutions: []
  },
  {
    id: 'base-lit-02',
    layer: 'base',
    subject: 'Ngữ văn',
    topic: 'Tác phẩm Vợ Nhặt (Kim Lân)',
    triggers: ['vo nhat', 'kim lan', 'trang nhat vo', 'nan doi 1945'],
    content: 'Phân tích trọng tâm tác phẩm **"Vợ Nhặt"** (Kim Lân):\n\n- Bối cảnh: Nạn đói thảm khốc năm 1945.\n\n- Ý nghĩa tư tưởng: Trong ranh giới mong manh giữa sự sống và cái chết, những người lao động nghèo khổ không hề mất đi tình thương yêu gia đình và niềm tin bất diệt vào tương lai.',
    source_ref: 'SGK Ngữ văn 12 - Tập 2',
    status: 'published',
    solutions: []
  },
  {
    id: 'base-lit-03',
    layer: 'base',
    subject: 'Ngữ văn',
    topic: 'Tác phẩm Những Ngôi Sao Xa Xôi (Lê Minh Khuê)',
    triggers: ['nhung ngoi sao xa xoi', 'le minh khue', 'phuong dinh', 'thao va nho'],
    content: 'Phân tích trọng tâm truyện ngắn **"Những ngôi sao xa xôi"** (Lê Minh Khuê):\n\n- **Tác giả:** Nhà văn Lê Minh Khuê (sinh năm 1949 tại Thanh Hóa), từng là nữ thanh niên xung phong trên tuyến đường Trường Sơn khốc liệt thời chống Mỹ.\n\n- **Vẻ đẹp thế hệ trẻ:** Khắc họa tinh thần dũng cảm, lạc quan, tình đồng đội gắn bó và tâm hồn trong sáng, mộng mơ của ba nữ thanh niên xung phong (Phương Định, Nho, chị Thao) trên tuyến đường Trường Sơn.',
    source_ref: 'SGK Ngữ văn 9 & Ngữ văn THPT',
    status: 'published',
    solutions: []
  }
];
