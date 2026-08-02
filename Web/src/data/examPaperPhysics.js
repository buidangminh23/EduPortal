/**
 * A complete Vật lí paper: 18 nhiều lựa chọn, 4 đúng/sai, 6 trả lời ngắn —
 * 28 questions, 50 phút, 10 điểm.
 *
 * Paper shape follows the format used from kỳ thi 2025 onward. Content follows
 * the four strands of lớp 12 Vật lí in the programme currently in force: vật lí
 * nhiệt, khí lí tưởng, từ trường, and vật lí hạt nhân. Dao động and sóng are
 * absent on purpose — they sit in lớp 11 under this programme, not lớp 12.
 *
 * Every numeric answer is re-derived from the question's own data in
 * `examPaperPhysics.test.js`, including unit conversions, rather than trusted.
 */

/** Hằng số dùng trong đề, đặt tên để bài kiểm chứng dùng đúng cùng giá trị. */
export const PHYSICS_CONSTANTS = {
  /** Nhiệt dung riêng của nước, J/(kg·K). */
  WATER_SPECIFIC_HEAT: 4200,
  /** Nhiệt nóng chảy riêng của nước đá, J/kg. */
  ICE_FUSION_HEAT: 3.4e5,
  /** Điện tích nguyên tố, C. */
  ELEMENTARY_CHARGE: 1.6e-19,
  /** 1u tính theo MeV/c². */
  U_IN_MEV: 931.5
};

export const PHYSICS_PAPER_META = {
  subject: 'Physics',
  durationMinutes: 50,
  totalPoints: 10
};

export const PHYSICS_PAPER_QUESTIONS = [
  // ── Phần I — Trắc nghiệm nhiều lựa chọn (18 câu × 0,25đ) ─────────────────
  {
    id: 'PP01',
    subject: 'Physics',
    question: 'Nội năng của một vật là:',
    options: [
      { key: 'A', text: 'tổng động năng và thế năng của các phân tử cấu tạo nên vật' },
      { key: 'B', text: 'tổng động năng của vật trong chuyển động' },
      { key: 'C', text: 'nhiệt lượng vật nhận được từ môi trường' },
      { key: 'D', text: 'thế năng của vật trong trọng trường' }
    ],
    correctKey: 'A',
    explanation: 'Nội năng là tổng động năng chuyển động nhiệt của các phân tử và thế năng tương tác giữa chúng. Nó không phụ thuộc chuyển động hay vị trí của cả vật.'
  },
  {
    id: 'PP02',
    subject: 'Physics',
    question: 'Cần cung cấp nhiệt lượng bao nhiêu để làm nóng 2 kg nước từ 20&deg;C lên 30&deg;C? Cho nhiệt dung riêng của nước <i>c</i> = 4200 J/(kg&middot;K).',
    options: [
      { key: 'A', text: '42 kJ' },
      { key: 'B', text: '84 kJ' },
      { key: 'C', text: '8,4 kJ' },
      { key: 'D', text: '252 kJ' }
    ],
    correctKey: 'B',
    explanation: '<i>Q</i> = <i>mc</i>&Delta;<i>t</i> = 2 &middot; 4200 &middot; (30 - 20) = 84000 J = 84 kJ.'
  },
  {
    id: 'PP03',
    subject: 'Physics',
    question: 'Nhiệt lượng cần để làm nóng chảy hoàn toàn 0,5 kg nước đá ở 0&deg;C là bao nhiêu? Cho nhiệt nóng chảy riêng của nước đá &lambda; = 3,4&middot;10<sup>5</sup> J/kg.',
    options: [
      { key: 'A', text: '1,7&middot;10<sup>5</sup> J' },
      { key: 'B', text: '3,4&middot;10<sup>5</sup> J' },
      { key: 'C', text: '6,8&middot;10<sup>5</sup> J' },
      { key: 'D', text: '0,85&middot;10<sup>5</sup> J' }
    ],
    correctKey: 'A',
    explanation: '<i>Q</i> = &lambda;<i>m</i> = 3,4&middot;10<sup>5</sup> &middot; 0,5 = 1,7&middot;10<sup>5</sup> J. Nhiệt độ không đổi trong suốt quá trình nóng chảy.'
  },
  {
    id: 'PP04',
    subject: 'Physics',
    question: 'Một khối khí nhận nhiệt lượng 100 J và thực hiện công 70 J lên môi trường ngoài. Độ biến thiên nội năng của khối khí bằng:',
    options: [
      { key: 'A', text: '170 J' },
      { key: 'B', text: '-30 J' },
      { key: 'C', text: '30 J' },
      { key: 'D', text: '-170 J' }
    ],
    correctKey: 'C',
    explanation: 'Định luật I nhiệt động lực học: &Delta;<i>U</i> = <i>Q</i> + <i>A</i>, với <i>A</i> là công khối khí <b>nhận</b>.<br/>Khí thực hiện công 70 J nên <i>A</i> = -70 J.<br/>&Delta;<i>U</i> = 100 + (-70) = 30 J.'
  },
  {
    id: 'PP05',
    subject: 'Physics',
    question: 'Nhiệt độ 27&deg;C ứng với bao nhiêu kelvin?',
    options: [
      { key: 'A', text: '246 K' },
      { key: 'B', text: '273 K' },
      { key: 'C', text: '327 K' },
      { key: 'D', text: '300 K' }
    ],
    correctKey: 'D',
    explanation: '<i>T</i>(K) = <i>t</i>(&deg;C) + 273 = 27 + 273 = 300 K.'
  },
  {
    id: 'PP06',
    subject: 'Physics',
    question: 'Nén đẳng nhiệt một lượng khí lí tưởng từ thể tích 5 lít xuống 2 lít. Nếu áp suất ban đầu là 4&middot;10<sup>4</sup> Pa thì áp suất sau khi nén bằng:',
    options: [
      { key: 'A', text: '10<sup>5</sup> Pa' },
      { key: 'B', text: '1,6&middot;10<sup>4</sup> Pa' },
      { key: 'C', text: '8&middot;10<sup>4</sup> Pa' },
      { key: 'D', text: '2&middot;10<sup>4</sup> Pa' }
    ],
    correctKey: 'A',
    explanation: 'Định luật Boyle: <i>p</i><sub>1</sub><i>V</i><sub>1</sub> = <i>p</i><sub>2</sub><i>V</i><sub>2</sub>.<br/><i>p</i><sub>2</sub> = 4&middot;10<sup>4</sup> &middot; 5 / 2 = 10<sup>5</sup> Pa.'
  },
  {
    id: 'PP07',
    subject: 'Physics',
    question: 'Đun nóng đẳng áp một lượng khí lí tưởng từ 300 K lên 400 K. Nếu thể tích ban đầu là 3 lít thì thể tích sau khi đun bằng:',
    options: [
      { key: 'A', text: '2,25 lít' },
      { key: 'B', text: '3,5 lít' },
      { key: 'C', text: '4 lít' },
      { key: 'D', text: '4,5 lít' }
    ],
    correctKey: 'C',
    explanation: 'Quá trình đẳng áp: <i>V</i><sub>1</sub>/<i>T</i><sub>1</sub> = <i>V</i><sub>2</sub>/<i>T</i><sub>2</sub>.<br/><i>V</i><sub>2</sub> = 3 &middot; 400/300 = 4 lít.'
  },
  {
    id: 'PP08',
    subject: 'Physics',
    question: 'Làm nóng đẳng tích một lượng khí lí tưởng từ 300 K lên 450 K. Nếu áp suất ban đầu là 2&middot;10<sup>5</sup> Pa thì áp suất sau đó bằng:',
    options: [
      { key: 'A', text: '1,33&middot;10<sup>5</sup> Pa' },
      { key: 'B', text: '2,5&middot;10<sup>5</sup> Pa' },
      { key: 'C', text: '3&middot;10<sup>5</sup> Pa' },
      { key: 'D', text: '4,5&middot;10<sup>5</sup> Pa' }
    ],
    correctKey: 'C',
    explanation: 'Quá trình đẳng tích: <i>p</i><sub>1</sub>/<i>T</i><sub>1</sub> = <i>p</i><sub>2</sub>/<i>T</i><sub>2</sub>.<br/><i>p</i><sub>2</sub> = 2&middot;10<sup>5</sup> &middot; 450/300 = 3&middot;10<sup>5</sup> Pa.'
  },
  {
    id: 'PP09',
    subject: 'Physics',
    question: 'Theo mô hình động học phân tử, áp suất chất khí tác dụng lên thành bình được gây ra bởi:',
    options: [
      { key: 'A', text: 'trọng lượng của các phân tử khí' },
      { key: 'B', text: 'va chạm của các phân tử khí vào thành bình' },
      { key: 'C', text: 'lực hút giữa các phân tử khí' },
      { key: 'D', text: 'sự nở vì nhiệt của thành bình' }
    ],
    correctKey: 'B',
    explanation: 'Các phân tử khí chuyển động hỗn loạn không ngừng, va chạm vào thành bình và truyền động lượng cho thành bình. Tổng lực do vô số va chạm đó trên một đơn vị diện tích chính là áp suất.'
  },
  {
    id: 'PP10',
    subject: 'Physics',
    question: 'Một đoạn dây dẫn thẳng dài 0,2 m mang dòng điện 2 A đặt vuông góc với các đường sức của từ trường đều có cảm ứng từ <i>B</i> = 0,5 T. Lực từ tác dụng lên đoạn dây bằng:',
    options: [
      { key: 'A', text: '0,1 N' },
      { key: 'B', text: '0,2 N' },
      { key: 'C', text: '0,5 N' },
      { key: 'D', text: '2 N' }
    ],
    correctKey: 'B',
    explanation: '<i>F</i> = <i>BIl</i>sin&alpha; với &alpha; = 90&deg;.<br/><i>F</i> = 0,5 &middot; 2 &middot; 0,2 &middot; 1 = 0,2 N.'
  },
  {
    id: 'PP11',
    subject: 'Physics',
    question: 'Một hạt mang điện tích <i>q</i> = 1,6&middot;10<sup>-19</sup> C bay với tốc độ 10<sup>6</sup> m/s theo phương vuông góc với từ trường đều <i>B</i> = 0,1 T. Độ lớn lực Lorentz tác dụng lên hạt bằng:',
    options: [
      { key: 'A', text: '1,6&middot;10<sup>-13</sup> N' },
      { key: 'B', text: '1,6&middot;10<sup>-14</sup> N' },
      { key: 'C', text: '1,6&middot;10<sup>-15</sup> N' },
      { key: 'D', text: '1,6&middot;10<sup>-12</sup> N' }
    ],
    correctKey: 'B',
    explanation: '<i>f</i> = |<i>q</i>|<i>vB</i>sin&alpha; = 1,6&middot;10<sup>-19</sup> &middot; 10<sup>6</sup> &middot; 0,1 &middot; 1 = 1,6&middot;10<sup>-14</sup> N.'
  },
  {
    id: 'PP12',
    subject: 'Physics',
    question: 'Một khung dây phẳng diện tích 0,1 m<sup>2</sup> đặt trong từ trường đều <i>B</i> = 0,2 T sao cho mặt phẳng khung vuông góc với các đường sức. Từ thông qua khung bằng:',
    options: [
      { key: 'A', text: '0,002 Wb' },
      { key: 'B', text: '0,2 Wb' },
      { key: 'C', text: '0,02 Wb' },
      { key: 'D', text: '2 Wb' }
    ],
    correctKey: 'C',
    explanation: '&Phi; = <i>BS</i>cos&alpha;. Mặt phẳng khung vuông góc với đường sức nên pháp tuyến song song với <i>B</i>, &alpha; = 0.<br/>&Phi; = 0,2 &middot; 0,1 &middot; 1 = 0,02 Wb.'
  },
  {
    id: 'PP13',
    subject: 'Physics',
    question: 'Từ thông qua một vòng dây biến thiên đều đặn một lượng 0,04 Wb trong khoảng thời gian 0,1 s. Độ lớn suất điện động cảm ứng xuất hiện trong vòng dây bằng:',
    options: [
      { key: 'A', text: '0,04 V' },
      { key: 'B', text: '0,004 V' },
      { key: 'C', text: '4 V' },
      { key: 'D', text: '0,4 V' }
    ],
    correctKey: 'D',
    explanation: '|<i>e</i>| = |&Delta;&Phi; / &Delta;<i>t</i>| = 0,04 / 0,1 = 0,4 V.'
  },
  {
    id: 'PP14',
    subject: 'Physics',
    question: 'Dòng điện cảm ứng xuất hiện trong mạch kín có chiều sao cho:',
    options: [
      { key: 'A', text: 'từ trường của nó cùng chiều với từ trường ngoài' },
      { key: 'B', text: 'từ trường của nó chống lại sự biến thiên của từ thông qua mạch' },
      { key: 'C', text: 'cường độ dòng điện trong mạch luôn tăng' },
      { key: 'D', text: 'từ thông qua mạch luôn bằng không' }
    ],
    correctKey: 'B',
    explanation: 'Định luật Lenz: dòng điện cảm ứng có chiều sao cho từ trường do nó sinh ra chống lại nguyên nhân đã sinh ra nó, tức là chống lại sự biến thiên của từ thông qua mạch.'
  },
  {
    id: 'PP15',
    subject: 'Physics',
    question: 'Hạt nhân <sup>235</sup><sub>92</sub>U có bao nhiêu neutron?',
    options: [
      { key: 'A', text: '92' },
      { key: 'B', text: '143' },
      { key: 'C', text: '235' },
      { key: 'D', text: '327' }
    ],
    correctKey: 'B',
    explanation: 'Số neutron <i>N</i> = <i>A</i> - <i>Z</i> = 235 - 92 = 143.'
  },
  {
    id: 'PP16',
    subject: 'Physics',
    question: 'Độ hụt khối của một hạt nhân được xác định bằng:',
    options: [
      { key: 'A', text: 'hiệu giữa tổng khối lượng các nucleon riêng rẽ và khối lượng hạt nhân' },
      { key: 'B', text: 'tổng khối lượng của các proton trong hạt nhân' },
      { key: 'C', text: 'hiệu giữa khối lượng hạt nhân và khối lượng nguyên tử' },
      { key: 'D', text: 'tích của số khối với khối lượng một nucleon' }
    ],
    correctKey: 'A',
    explanation: '&Delta;<i>m</i> = <i>Zm</i><sub>p</sub> + (<i>A</i> - <i>Z</i>)<i>m</i><sub>n</sub> - <i>m</i><sub>hạt nhân</sub>. Phần khối lượng hụt đi đã chuyển thành năng lượng liên kết giữ các nucleon lại với nhau.'
  },
  {
    id: 'PP17',
    subject: 'Physics',
    question: 'Một hạt nhân có độ hụt khối &Delta;<i>m</i> = 0,03u. Năng lượng liên kết của hạt nhân đó xấp xỉ bằng bao nhiêu? Cho 1u = 931,5 MeV/<i>c</i><sup>2</sup>.',
    options: [
      { key: 'A', text: '2,79 MeV' },
      { key: 'B', text: '27,9 MeV' },
      { key: 'C', text: '279 MeV' },
      { key: 'D', text: '931,5 MeV' }
    ],
    correctKey: 'B',
    explanation: '<i>W</i><sub>lk</sub> = &Delta;<i>m</i>&middot;<i>c</i><sup>2</sup> = 0,03 &middot; 931,5 = 27,945 &asymp; 27,9 MeV.'
  },
  {
    id: 'PP18',
    subject: 'Physics',
    question: 'Một chất phóng xạ có chu kì bán rã <i>T</i>. Sau khoảng thời gian <i>t</i> = 2<i>T</i>, phần trăm số hạt nhân còn lại so với ban đầu là:',
    options: [
      { key: 'A', text: '50%' },
      { key: 'B', text: '75%' },
      { key: 'C', text: '12,5%' },
      { key: 'D', text: '25%' }
    ],
    correctKey: 'D',
    explanation: '<i>N</i> = <i>N</i><sub>0</sub>&middot;2<sup>-<i>t</i>/<i>T</i></sup> = <i>N</i><sub>0</sub>&middot;2<sup>-2</sup> = <i>N</i><sub>0</sub>/4 = 25% <i>N</i><sub>0</sub>.'
  },

  // ── Phần II — Trắc nghiệm đúng/sai (4 câu × 1,0đ) ────────────────────────
  {
    id: 'PP19',
    subject: 'Physics',
    type: 'tf',
    question: 'Cung cấp nhiệt lượng để đun 1 kg nước từ 20&deg;C. Cho nhiệt dung riêng của nước <i>c</i> = 4200 J/(kg&middot;K). Xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: 'Để nước tăng thêm 1&deg;C cần cung cấp 4200 J.', correct: true },
      { id: 'b', text: 'Để đun nước lên 100&deg;C cần cung cấp 336 kJ.', correct: true },
      { id: 'c', text: 'Trong quá trình nước sôi ở 100&deg;C, nhiệt độ của nước không đổi dù vẫn tiếp tục cung cấp nhiệt.', correct: true },
      { id: 'd', text: 'Nếu tăng khối lượng nước lên gấp đôi thì nhiệt lượng cần cung cấp để tăng cùng một độ giảm đi một nửa.', correct: false }
    ],
    explanation: 'a) Đúng: <i>Q</i> = 1 &middot; 4200 &middot; 1 = 4200 J.<br/>b) Đúng: <i>Q</i> = 1 &middot; 4200 &middot; 80 = 336000 J = 336 kJ.<br/>c) Đúng: nhiệt cung cấp khi sôi dùng để hoá hơi, nhiệt độ giữ nguyên.<br/>d) Sai: <i>Q</i> tỉ lệ <b>thuận</b> với <i>m</i>, nên khối lượng gấp đôi thì nhiệt lượng cũng gấp đôi.'
  },
  {
    id: 'PP20',
    subject: 'Physics',
    type: 'tf',
    question: 'Một lượng khí lí tưởng ở trạng thái 1 có <i>p</i><sub>1</sub> = 10<sup>5</sup> Pa, <i>V</i><sub>1</sub> = 4 lít, <i>T</i><sub>1</sub> = 300 K. Xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: 'Nếu nén đẳng nhiệt tới <i>V</i><sub>2</sub> = 2 lít thì <i>p</i><sub>2</sub> = 2&middot;10<sup>5</sup> Pa.', correct: true },
      { id: 'b', text: 'Nếu làm nóng đẳng tích tới <i>T</i><sub>2</sub> = 600 K thì <i>p</i><sub>2</sub> = 2&middot;10<sup>5</sup> Pa.', correct: true },
      { id: 'c', text: 'Nếu giãn đẳng áp tới <i>V</i><sub>2</sub> = 6 lít thì <i>T</i><sub>2</sub> = 450 K.', correct: true },
      { id: 'd', text: 'Trong quá trình đẳng nhiệt, áp suất tỉ lệ thuận với thể tích.', correct: false }
    ],
    explanation: 'a) Đúng: <i>p</i><sub>2</sub> = 10<sup>5</sup>&middot;4/2 = 2&middot;10<sup>5</sup> Pa.<br/>b) Đúng: <i>p</i><sub>2</sub> = 10<sup>5</sup>&middot;600/300 = 2&middot;10<sup>5</sup> Pa.<br/>c) Đúng: <i>T</i><sub>2</sub> = 300&middot;6/4 = 450 K.<br/>d) Sai: đẳng nhiệt thì <i>pV</i> = hằng số, tức áp suất tỉ lệ <b>nghịch</b> với thể tích.'
  },
  {
    id: 'PP21',
    subject: 'Physics',
    type: 'tf',
    question: 'Một khung dây phẳng gồm 1 vòng, diện tích <i>S</i> = 0,2 m<sup>2</sup>, đặt trong từ trường đều <i>B</i> = 0,1 T với pháp tuyến song song với <i>B</i>. Xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: 'Từ thông qua khung bằng 0,02 Wb.', correct: true },
      { id: 'b', text: 'Nếu quay khung để pháp tuyến vuông góc với <i>B</i> thì từ thông qua khung bằng 0.', correct: true },
      { id: 'c', text: 'Nếu từ thông giảm đều về 0 trong 0,05 s thì suất điện động cảm ứng có độ lớn 0,4 V.', correct: true },
      { id: 'd', text: 'Khi từ thông qua khung không đổi theo thời gian, trong khung vẫn xuất hiện dòng điện cảm ứng.', correct: false }
    ],
    explanation: 'a) Đúng: &Phi; = <i>BS</i>cos0&deg; = 0,1&middot;0,2 = 0,02 Wb.<br/>b) Đúng: cos90&deg; = 0 nên &Phi; = 0.<br/>c) Đúng: |<i>e</i>| = 0,02/0,05 = 0,4 V.<br/>d) Sai: dòng điện cảm ứng chỉ xuất hiện khi từ thông <b>biến thiên</b>.'
  },
  {
    id: 'PP22',
    subject: 'Physics',
    type: 'tf',
    question: 'Một mẫu chất phóng xạ có chu kì bán rã <i>T</i> = 8 ngày, số hạt nhân ban đầu là <i>N</i><sub>0</sub>. Xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: 'Sau 8 ngày, số hạt nhân còn lại bằng <i>N</i><sub>0</sub>/2.', correct: true },
      { id: 'b', text: 'Sau 24 ngày, số hạt nhân còn lại bằng <i>N</i><sub>0</sub>/8.', correct: true },
      { id: 'c', text: 'Sau 16 ngày, số hạt nhân đã bị phân rã bằng 3<i>N</i><sub>0</sub>/4.', correct: true },
      { id: 'd', text: 'Sau 16 ngày, toàn bộ mẫu chất đã phân rã hết.', correct: false }
    ],
    explanation: 'a) Đúng: <i>t</i> = <i>T</i> nên <i>N</i> = <i>N</i><sub>0</sub>/2.<br/>b) Đúng: <i>t</i> = 3<i>T</i> nên <i>N</i> = <i>N</i><sub>0</sub>/2<sup>3</sup> = <i>N</i><sub>0</sub>/8.<br/>c) Đúng: <i>t</i> = 2<i>T</i> nên còn <i>N</i><sub>0</sub>/4, đã phân rã <i>N</i><sub>0</sub> - <i>N</i><sub>0</sub>/4 = 3<i>N</i><sub>0</sub>/4.<br/>d) Sai: sau 16 ngày vẫn còn <i>N</i><sub>0</sub>/4. Phân rã là quá trình không bao giờ kết thúc hoàn toàn.'
  },

  // ── Phần III — Trắc nghiệm trả lời ngắn (6 câu × 0,25đ) ──────────────────
  {
    id: 'PP23',
    subject: 'Physics',
    type: 'short',
    question: 'Cần cung cấp bao nhiêu kJ nhiệt lượng để làm nóng 3 kg nước từ 25&deg;C lên 45&deg;C? Cho <i>c</i> = 4200 J/(kg&middot;K). (Nhập đáp số là số nguyên, đơn vị kJ)',
    correctAnswer: '252',
    explanation: '<i>Q</i> = <i>mc</i>&Delta;<i>t</i> = 3 &middot; 4200 &middot; 20 = 252000 J = 252 kJ.'
  },
  {
    id: 'PP24',
    subject: 'Physics',
    type: 'short',
    question: 'Nén đẳng nhiệt một lượng khí lí tưởng từ 6 lít xuống 2 lít. Áp suất sau khi nén gấp bao nhiêu lần áp suất ban đầu? (Nhập đáp số là số nguyên)',
    correctAnswer: '3',
    explanation: '<i>p</i><sub>1</sub><i>V</i><sub>1</sub> = <i>p</i><sub>2</sub><i>V</i><sub>2</sub> &rArr; <i>p</i><sub>2</sub>/<i>p</i><sub>1</sub> = <i>V</i><sub>1</sub>/<i>V</i><sub>2</sub> = 6/2 = 3.'
  },
  {
    id: 'PP25',
    subject: 'Physics',
    type: 'short',
    question: 'Một đoạn dây dẫn dài 0,5 m mang dòng điện 4 A đặt vuông góc với từ trường đều <i>B</i> = 0,3 T. Tính độ lớn lực từ tác dụng lên đoạn dây, đơn vị niutơn. (Nhập đáp số dạng số thập phân, ví dụ 0,6)',
    correctAnswer: '0,6',
    explanation: '<i>F</i> = <i>BIl</i>sin90&deg; = 0,3 &middot; 4 &middot; 0,5 = 0,6 N.'
  },
  {
    id: 'PP26',
    subject: 'Physics',
    type: 'short',
    question: 'Từ thông qua một vòng dây giảm đều từ 0,06 Wb về 0 trong 0,2 s. Tính độ lớn suất điện động cảm ứng, đơn vị vôn. (Nhập đáp số dạng số thập phân, ví dụ 0,3)',
    correctAnswer: '0,3',
    explanation: '|<i>e</i>| = |&Delta;&Phi;/&Delta;<i>t</i>| = 0,06/0,2 = 0,3 V.'
  },
  {
    id: 'PP27',
    subject: 'Physics',
    type: 'short',
    question: 'Một chất phóng xạ có chu kì bán rã <i>T</i>. Sau thời gian <i>t</i> = 4<i>T</i>, số hạt nhân ban đầu giảm đi bao nhiêu lần? (Nhập đáp số là số nguyên)',
    correctAnswer: '16',
    explanation: '<i>N</i> = <i>N</i><sub>0</sub>&middot;2<sup>-4</sup> = <i>N</i><sub>0</sub>/16, tức số hạt nhân giảm đi 16 lần.'
  },
  {
    id: 'PP28',
    subject: 'Physics',
    type: 'short',
    question: 'Hạt nhân <sup>4</sup><sub>2</sub>He có năng lượng liên kết 28,4 MeV. Tính năng lượng liên kết riêng của hạt nhân này, đơn vị MeV/nucleon. (Nhập đáp số dạng số thập phân, ví dụ 7,1)',
    correctAnswer: '7,1',
    explanation: 'Năng lượng liên kết riêng = <i>W</i><sub>lk</sub>/<i>A</i> = 28,4/4 = 7,1 MeV/nucleon.'
  }
];
