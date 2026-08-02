/**
 * A complete Toán paper in the current format: 12 nhiều lựa chọn, 4 đúng/sai,
 * 6 trả lời ngắn — 22 questions, 90 phút, 10 điểm.
 *
 * Paper shape follows the format used from kỳ thi 2025 onward. Content follows
 * the lớp 12 syllabus currently in force (Chương trình GDPT 2018, so named for
 * its year of issue): ứng dụng đạo hàm, nguyên hàm và tích phân, toạ độ trong
 * không gian, thống kê cho mẫu ghép nhóm, và xác suất có điều kiện. Số phức is deliberately absent — it belongs to the 2006
 * programme, not this one.
 *
 * Every numeric answer here is re-derived independently in
 * `examPaperMath.test.js` rather than trusted. A mock exam that marks a correct
 * answer wrong teaches the student the wrong thing, so the answers are the part
 * that must not be taken on faith.
 */

/** Điểm mỗi câu theo phần, dùng để đối chiếu với cấu hình đề. */
export const MATH_PAPER_META = {
  subject: 'Math',
  durationMinutes: 90,
  totalPoints: 10
};

export const MATH_PAPER_QUESTIONS = [
  // ── Phần I — Trắc nghiệm nhiều lựa chọn (12 câu × 0,25đ) ─────────────────
  {
    id: 'MP01',
    subject: 'Math',
    question: 'Cho hàm số <i>y</i> = -<i>x</i><sup>3</sup> + 3<i>x</i><sup>2</sup> - 1. Hàm số đồng biến trên khoảng nào dưới đây?',
    options: [
      { key: 'A', text: '(-&infin;; 0)' },
      { key: 'B', text: '(0; 2)' },
      { key: 'C', text: '(2; +&infin;)' },
      { key: 'D', text: '(-&infin;; 2)' }
    ],
    correctKey: 'B',
    explanation: '<i>y</i>\' = -3<i>x</i><sup>2</sup> + 6<i>x</i> = -3<i>x</i>(<i>x</i> - 2).<br/><i>y</i>\' > 0 &hArr; 0 < <i>x</i> < 2. Vậy hàm số đồng biến trên (0; 2).'
  },
  {
    id: 'MP02',
    subject: 'Math',
    question: 'Hàm số <i>y</i> = <i>x</i><sup>4</sup> - 2<i>x</i><sup>2</sup> + 3 có bao nhiêu điểm cực trị?',
    options: [
      { key: 'A', text: '1' },
      { key: 'B', text: '2' },
      { key: 'C', text: '3' },
      { key: 'D', text: '0' }
    ],
    correctKey: 'C',
    explanation: '<i>y</i>\' = 4<i>x</i><sup>3</sup> - 4<i>x</i> = 4<i>x</i>(<i>x</i> - 1)(<i>x</i> + 1).<br/><i>y</i>\' = 0 &hArr; <i>x</i> = -1, <i>x</i> = 0, <i>x</i> = 1. Đạo hàm đổi dấu qua cả ba nghiệm nên hàm số có 3 điểm cực trị.'
  },
  {
    id: 'MP03',
    subject: 'Math',
    question: 'Đường tiệm cận ngang của đồ thị hàm số <i>y</i> = (3<i>x</i> - 2)/(<i>x</i> + 1) là:',
    options: [
      { key: 'A', text: '<i>y</i> = 3' },
      { key: 'B', text: '<i>y</i> = -1' },
      { key: 'C', text: '<i>y</i> = -2' },
      { key: 'D', text: '<i>x</i> = -1' }
    ],
    correctKey: 'A',
    explanation: 'lim<sub><i>x</i>&rarr;&plusmn;&infin;</sub> (3<i>x</i> - 2)/(<i>x</i> + 1) = 3. Vậy tiệm cận ngang là <i>y</i> = 3. Lưu ý <i>x</i> = -1 là tiệm cận đứng, không phải tiệm cận ngang.'
  },
  {
    id: 'MP04',
    subject: 'Math',
    question: 'Giá trị nhỏ nhất của hàm số <i>y</i> = <i>x</i> + 4/<i>x</i> trên khoảng (0; +&infin;) bằng:',
    options: [
      { key: 'A', text: '2' },
      { key: 'B', text: '4' },
      { key: 'C', text: '5' },
      { key: 'D', text: '8' }
    ],
    correctKey: 'B',
    explanation: '<i>y</i>\' = 1 - 4/<i>x</i><sup>2</sup> = 0 &hArr; <i>x</i> = 2 (do <i>x</i> > 0).<br/>Lập bảng biến thiên: <i>y</i> đạt cực tiểu tại <i>x</i> = 2 với <i>y</i>(2) = 2 + 2 = 4.'
  },
  {
    id: 'MP05',
    subject: 'Math',
    question: 'Họ nguyên hàm của hàm số <i>f</i>(<i>x</i>) = 2<i>x</i> + cos<i>x</i> là:',
    options: [
      { key: 'A', text: '<i>x</i><sup>2</sup> + sin<i>x</i> + <i>C</i>' },
      { key: 'B', text: '<i>x</i><sup>2</sup> - sin<i>x</i> + <i>C</i>' },
      { key: 'C', text: '2 - sin<i>x</i> + <i>C</i>' },
      { key: 'D', text: '<i>x</i><sup>2</sup> + cos<i>x</i> + <i>C</i>' }
    ],
    correctKey: 'A',
    explanation: '&int; 2<i>x</i> d<i>x</i> = <i>x</i><sup>2</sup>; &int; cos<i>x</i> d<i>x</i> = sin<i>x</i>.<br/>Vậy &int; <i>f</i>(<i>x</i>) d<i>x</i> = <i>x</i><sup>2</sup> + sin<i>x</i> + <i>C</i>.'
  },
  {
    id: 'MP06',
    subject: 'Math',
    question: 'Tính tích phân <i>I</i> = &int;<sub>0</sub><sup>2</sup> (3<i>x</i><sup>2</sup> - 2<i>x</i>) d<i>x</i>.',
    options: [
      { key: 'A', text: '<i>I</i> = 2' },
      { key: 'B', text: '<i>I</i> = 4' },
      { key: 'C', text: '<i>I</i> = 8' },
      { key: 'D', text: '<i>I</i> = 12' }
    ],
    correctKey: 'B',
    explanation: '<i>I</i> = [<i>x</i><sup>3</sup> - <i>x</i><sup>2</sup>]<sub>0</sub><sup>2</sup> = (8 - 4) - 0 = 4.'
  },
  {
    id: 'MP07',
    subject: 'Math',
    question: 'Diện tích hình phẳng giới hạn bởi đồ thị hàm số <i>y</i> = <i>x</i><sup>2</sup> - 4<i>x</i> + 3 và trục hoành bằng:',
    options: [
      { key: 'A', text: '2/3' },
      { key: 'B', text: '4/3' },
      { key: 'C', text: '8/3' },
      { key: 'D', text: '3' }
    ],
    correctKey: 'B',
    explanation: 'Phương trình <i>x</i><sup>2</sup> - 4<i>x</i> + 3 = 0 có nghiệm <i>x</i> = 1 và <i>x</i> = 3.<br/>Trên (1; 3) đồ thị nằm dưới trục hoành nên <i>S</i> = -&int;<sub>1</sub><sup>3</sup> (<i>x</i><sup>2</sup> - 4<i>x</i> + 3) d<i>x</i> = -[<i>x</i><sup>3</sup>/3 - 2<i>x</i><sup>2</sup> + 3<i>x</i>]<sub>1</sub><sup>3</sup> = -(0 - 4/3) = 4/3.'
  },
  {
    id: 'MP08',
    subject: 'Math',
    question: 'Trong không gian <i>Oxyz</i>, phương trình mặt phẳng đi qua <i>M</i>(2; -1; 3) và nhận <i>n</i>&#8407; = (1; 2; -2) làm vectơ pháp tuyến là:',
    options: [
      { key: 'A', text: '<i>x</i> + 2<i>y</i> - 2<i>z</i> + 6 = 0' },
      { key: 'B', text: '<i>x</i> + 2<i>y</i> - 2<i>z</i> - 6 = 0' },
      { key: 'C', text: '2<i>x</i> - <i>y</i> + 3<i>z</i> - 6 = 0' },
      { key: 'D', text: '<i>x</i> + 2<i>y</i> - 2<i>z</i> = 0' }
    ],
    correctKey: 'A',
    explanation: 'Mặt phẳng có dạng 1(<i>x</i> - 2) + 2(<i>y</i> + 1) - 2(<i>z</i> - 3) = 0<br/>&hArr; <i>x</i> + 2<i>y</i> - 2<i>z</i> + 6 = 0. Thay <i>M</i>: 2 - 2 - 6 + 6 = 0 (thoả mãn).'
  },
  {
    id: 'MP09',
    subject: 'Math',
    question: 'Trong không gian <i>Oxyz</i>, khoảng cách từ điểm <i>A</i>(1; -2; 1) đến mặt phẳng (<i>P</i>): 2<i>x</i> - <i>y</i> + 2<i>z</i> - 3 = 0 bằng:',
    options: [
      { key: 'A', text: '1' },
      { key: 'B', text: '2' },
      { key: 'C', text: '3' },
      { key: 'D', text: '1/3' }
    ],
    correctKey: 'A',
    explanation: '<i>d</i>(<i>A</i>, (<i>P</i>)) = |2&middot;1 - (-2) + 2&middot;1 - 3| / &radic;(2<sup>2</sup> + (-1)<sup>2</sup> + 2<sup>2</sup>) = |3| / 3 = 1.'
  },
  {
    id: 'MP10',
    subject: 'Math',
    question: 'Trong không gian <i>Oxyz</i>, phương trình mặt cầu tâm <i>I</i>(1; -2; 3), bán kính <i>R</i> = 4 là:',
    options: [
      { key: 'A', text: '(<i>x</i> - 1)<sup>2</sup> + (<i>y</i> + 2)<sup>2</sup> + (<i>z</i> - 3)<sup>2</sup> = 16' },
      { key: 'B', text: '(<i>x</i> + 1)<sup>2</sup> + (<i>y</i> - 2)<sup>2</sup> + (<i>z</i> + 3)<sup>2</sup> = 16' },
      { key: 'C', text: '(<i>x</i> - 1)<sup>2</sup> + (<i>y</i> + 2)<sup>2</sup> + (<i>z</i> - 3)<sup>2</sup> = 4' },
      { key: 'D', text: '(<i>x</i> - 1)<sup>2</sup> + (<i>y</i> - 2)<sup>2</sup> + (<i>z</i> - 3)<sup>2</sup> = 16' }
    ],
    correctKey: 'A',
    explanation: 'Mặt cầu tâm <i>I</i>(<i>a</i>; <i>b</i>; <i>c</i>) bán kính <i>R</i> có phương trình (<i>x</i> - <i>a</i>)<sup>2</sup> + (<i>y</i> - <i>b</i>)<sup>2</sup> + (<i>z</i> - <i>c</i>)<sup>2</sup> = <i>R</i><sup>2</sup>.<br/>Với <i>I</i>(1; -2; 3) và <i>R</i> = 4 ta được (<i>x</i> - 1)<sup>2</sup> + (<i>y</i> + 2)<sup>2</sup> + (<i>z</i> - 3)<sup>2</sup> = 16.'
  },
  {
    id: 'MP11',
    subject: 'Math',
    question: 'Thời gian tự học trong ngày (đơn vị: phút) của 20 học sinh được ghi trong bảng ghép nhóm: [0; 30) có 4 học sinh, [30; 60) có 7 học sinh, [60; 90) có 6 học sinh, [90; 120) có 3 học sinh. Khoảng biến thiên của mẫu số liệu ghép nhóm này bằng:',
    options: [
      { key: 'A', text: '90' },
      { key: 'B', text: '120' },
      { key: 'C', text: '30' },
      { key: 'D', text: '60' }
    ],
    correctKey: 'B',
    explanation: 'Với mẫu số liệu ghép nhóm, khoảng biến thiên <i>R</i> = đầu mút phải của nhóm cuối - đầu mút trái của nhóm đầu.<br/><i>R</i> = 120 - 0 = 120.'
  },
  {
    id: 'MP12',
    subject: 'Math',
    question: 'Cho hai biến cố <i>A</i> và <i>B</i> với <i>P</i>(<i>B</i>) = 0,5 và <i>P</i>(<i>A</i> &cap; <i>B</i>) = 0,3. Tính <i>P</i>(<i>A</i> | <i>B</i>).',
    options: [
      { key: 'A', text: '0,15' },
      { key: 'B', text: '0,5' },
      { key: 'C', text: '0,6' },
      { key: 'D', text: '0,8' }
    ],
    correctKey: 'C',
    explanation: '<i>P</i>(<i>A</i> | <i>B</i>) = <i>P</i>(<i>A</i> &cap; <i>B</i>) / <i>P</i>(<i>B</i>) = 0,3 / 0,5 = 0,6.'
  },

  // ── Phần II — Trắc nghiệm đúng/sai (4 câu × 1,0đ) ────────────────────────
  {
    id: 'MP13',
    subject: 'Math',
    type: 'tf',
    question: 'Cho hàm số <i>y</i> = (2<i>x</i> + 1)/(<i>x</i> - 1). Xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: 'Tập xác định của hàm số là <i>D</i> = &#8477; \\ {1}.', correct: true },
      { id: 'b', text: 'Đồ thị hàm số có tiệm cận đứng là đường thẳng <i>x</i> = 1.', correct: true },
      { id: 'c', text: 'Đồ thị hàm số có tiệm cận ngang là đường thẳng <i>y</i> = 2.', correct: true },
      { id: 'd', text: 'Hàm số đồng biến trên từng khoảng xác định của nó.', correct: false }
    ],
    explanation: 'a) Đúng: mẫu <i>x</i> - 1 &ne; 0 &hArr; <i>x</i> &ne; 1.<br/>b) Đúng: lim<sub><i>x</i>&rarr;1</sub> <i>y</i> = &infin; nên <i>x</i> = 1 là tiệm cận đứng.<br/>c) Đúng: lim<sub><i>x</i>&rarr;&infin;</sub> <i>y</i> = 2.<br/>d) Sai: <i>y</i>\' = [2(<i>x</i> - 1) - (2<i>x</i> + 1)] / (<i>x</i> - 1)<sup>2</sup> = -3/(<i>x</i> - 1)<sup>2</sup> < 0, nên hàm số <b>nghịch biến</b> trên từng khoảng xác định.'
  },
  {
    id: 'MP14',
    subject: 'Math',
    type: 'tf',
    question: 'Cho hàm số <i>f</i>(<i>x</i>) = 3<i>x</i><sup>2</sup> - 2<i>x</i> + 1. Xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: '<i>F</i>(<i>x</i>) = <i>x</i><sup>3</sup> - <i>x</i><sup>2</sup> + <i>x</i> là một nguyên hàm của <i>f</i>(<i>x</i>).', correct: true },
      { id: 'b', text: '&int;<sub>0</sub><sup>1</sup> <i>f</i>(<i>x</i>) d<i>x</i> = 1.', correct: true },
      { id: 'c', text: '&int;<sub>0</sub><sup>2</sup> <i>f</i>(<i>x</i>) d<i>x</i> = 6.', correct: true },
      { id: 'd', text: '&int;<sub>1</sub><sup>2</sup> <i>f</i>(<i>x</i>) d<i>x</i> = 4.', correct: false }
    ],
    explanation: 'a) Đúng: <i>F</i>\'(<i>x</i>) = 3<i>x</i><sup>2</sup> - 2<i>x</i> + 1 = <i>f</i>(<i>x</i>).<br/>b) Đúng: <i>F</i>(1) - <i>F</i>(0) = 1 - 0 = 1.<br/>c) Đúng: <i>F</i>(2) - <i>F</i>(0) = (8 - 4 + 2) - 0 = 6.<br/>d) Sai: &int;<sub>1</sub><sup>2</sup> = <i>F</i>(2) - <i>F</i>(1) = 6 - 1 = <b>5</b>, không phải 4.'
  },
  {
    id: 'MP15',
    subject: 'Math',
    type: 'tf',
    question: 'Trong không gian <i>Oxyz</i>, cho ba điểm <i>A</i>(1; 0; 0), <i>B</i>(0; 2; 0), <i>C</i>(0; 0; 3). Xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: '<i>AB</i>&#8407; = (-1; 2; 0).', correct: true },
      { id: 'b', text: '|<i>AB</i>&#8407;| = &radic;5.', correct: true },
      { id: 'c', text: 'Mặt phẳng (<i>ABC</i>) có phương trình 6<i>x</i> + 3<i>y</i> + 2<i>z</i> - 6 = 0.', correct: true },
      { id: 'd', text: 'Tam giác <i>ABC</i> vuông tại <i>A</i>.', correct: false }
    ],
    explanation: 'a) Đúng: <i>AB</i>&#8407; = (0 - 1; 2 - 0; 0 - 0) = (-1; 2; 0).<br/>b) Đúng: |<i>AB</i>&#8407;| = &radic;(1 + 4 + 0) = &radic;5.<br/>c) Đúng: mặt phẳng theo đoạn chắn <i>x</i>/1 + <i>y</i>/2 + <i>z</i>/3 = 1, nhân hai vế với 6 được 6<i>x</i> + 3<i>y</i> + 2<i>z</i> = 6.<br/>d) Sai: <i>AC</i>&#8407; = (-1; 0; 3), <i>AB</i>&#8407; &middot; <i>AC</i>&#8407; = 1 + 0 + 0 = 1 &ne; 0 nên góc <i>A</i> không vuông.'
  },
  {
    id: 'MP16',
    subject: 'Math',
    type: 'tf',
    question: 'Một hộp chứa 5 viên bi đỏ và 3 viên bi xanh, các viên bi cùng kích thước. Lấy ngẫu nhiên đồng thời 2 viên bi. Xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: 'Xác suất lấy được 2 viên bi đỏ bằng 5/14.', correct: true },
      { id: 'b', text: 'Xác suất lấy được 2 viên bi xanh bằng 3/28.', correct: true },
      { id: 'c', text: 'Xác suất lấy được 1 viên đỏ và 1 viên xanh bằng 15/28.', correct: true },
      { id: 'd', text: 'Xác suất lấy được ít nhất 1 viên bi xanh bằng 3/28.', correct: false }
    ],
    explanation: 'Số cách lấy 2 trong 8 viên: <i>C</i><sub>8</sub><sup>2</sup> = 28.<br/>a) Đúng: <i>C</i><sub>5</sub><sup>2</sup>/28 = 10/28 = 5/14.<br/>b) Đúng: <i>C</i><sub>3</sub><sup>2</sup>/28 = 3/28.<br/>c) Đúng: (5 &times; 3)/28 = 15/28.<br/>d) Sai: <i>P</i>(ít nhất 1 xanh) = 1 - 5/14 = 9/14 = 18/28, không phải 3/28.'
  },

  // ── Phần III — Trắc nghiệm trả lời ngắn (6 câu × 0,5đ) ───────────────────
  {
    id: 'MP17',
    subject: 'Math',
    type: 'short',
    question: 'Tính tích phân <i>I</i> = &int;<sub>1</sub><sup>2</sup> (2<i>x</i> + 1) d<i>x</i>. (Nhập đáp số là số nguyên)',
    correctAnswer: '4',
    explanation: '<i>I</i> = [<i>x</i><sup>2</sup> + <i>x</i>]<sub>1</sub><sup>2</sup> = (4 + 2) - (1 + 1) = 6 - 2 = 4.'
  },
  {
    id: 'MP18',
    subject: 'Math',
    type: 'short',
    question: 'Cho hình phẳng giới hạn bởi đồ thị <i>y</i> = &radic;<i>x</i>, trục hoành và hai đường thẳng <i>x</i> = 0, <i>x</i> = 4. Quay hình phẳng đó quanh trục <i>Ox</i> ta được khối tròn xoay có thể tích <i>V</i> = <i>k</i>&pi;. Tìm <i>k</i>. (Nhập đáp số là số nguyên)',
    correctAnswer: '8',
    explanation: '<i>V</i> = &pi; &int;<sub>0</sub><sup>4</sup> (&radic;<i>x</i>)<sup>2</sup> d<i>x</i> = &pi; &int;<sub>0</sub><sup>4</sup> <i>x</i> d<i>x</i> = &pi; &middot; [<i>x</i><sup>2</sup>/2]<sub>0</sub><sup>4</sup> = 8&pi;. Vậy <i>k</i> = 8.'
  },
  {
    id: 'MP19',
    subject: 'Math',
    type: 'short',
    question: 'Tìm giá trị lớn nhất của hàm số <i>f</i>(<i>x</i>) = <i>x</i><sup>3</sup> - 3<i>x</i><sup>2</sup> + 1 trên đoạn [-1; 3]. (Nhập đáp số là số nguyên)',
    correctAnswer: '1',
    explanation: '<i>f</i>\'(<i>x</i>) = 3<i>x</i><sup>2</sup> - 6<i>x</i> = 0 &hArr; <i>x</i> = 0 hoặc <i>x</i> = 2 (đều thuộc đoạn).<br/><i>f</i>(-1) = -3; <i>f</i>(0) = 1; <i>f</i>(2) = -3; <i>f</i>(3) = 1.<br/>Giá trị lớn nhất bằng 1.'
  },
  {
    id: 'MP20',
    subject: 'Math',
    type: 'short',
    question: 'Trong không gian <i>Oxyz</i>, tính khoảng cách giữa hai mặt phẳng song song (<i>P</i>): <i>x</i> + 2<i>y</i> - 2<i>z</i> + 1 = 0 và (<i>Q</i>): <i>x</i> + 2<i>y</i> - 2<i>z</i> - 5 = 0. (Nhập đáp số là số nguyên)',
    correctAnswer: '2',
    explanation: 'Hai mặt phẳng có cùng vectơ pháp tuyến nên song song.<br/><i>d</i> = |1 - (-5)| / &radic;(1 + 4 + 4) = 6/3 = 2.'
  },
  {
    id: 'MP21',
    subject: 'Math',
    type: 'short',
    question: 'Cho hai biến cố <i>A</i>, <i>B</i> với <i>P</i>(<i>B</i>) = 0,4 và <i>P</i>(<i>A</i> &cap; <i>B</i>) = 0,1. Tính <i>P</i>(<i>A</i> | <i>B</i>). (Nhập đáp số dạng số thập phân, ví dụ 0,5)',
    correctAnswer: '0,25',
    explanation: '<i>P</i>(<i>A</i> | <i>B</i>) = <i>P</i>(<i>A</i> &cap; <i>B</i>) / <i>P</i>(<i>B</i>) = 0,1 / 0,4 = 0,25.'
  },
  {
    id: 'MP22',
    subject: 'Math',
    type: 'short',
    question: 'Điểm kiểm tra của 10 học sinh được ghi trong bảng ghép nhóm: [0; 4) có 3 học sinh, [4; 8) có 5 học sinh, [8; 12) có 2 học sinh. Tính số trung bình của mẫu số liệu ghép nhóm này. (Nhập đáp số dạng số thập phân, ví dụ 5,6)',
    correctAnswer: '5,6',
    explanation: 'Giá trị đại diện mỗi nhóm là trung điểm: 2; 6; 10.<br/>Số trung bình = (3&middot;2 + 5&middot;6 + 2&middot;10)/10 = (6 + 30 + 20)/10 = 56/10 = 5,6.'
  }
];
