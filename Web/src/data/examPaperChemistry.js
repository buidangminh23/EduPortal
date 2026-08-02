/**
 * A complete Hoá học paper: 18 nhiều lựa chọn, 4 đúng/sai, 6 trả lời ngắn —
 * 28 questions, 50 phút, 10 điểm.
 *
 * Paper shape follows the format used from kỳ thi 2025 onward. Content follows
 * the lớp 12 Hoá học strands in the programme currently in force: ester–lipid,
 * carbohydrate, hợp chất chứa nitrogen, polymer, pin điện và điện phân, đại
 * cương kim loại, and nguyên tố nhóm IA–IIA. Pin điện và điện phân is one of
 * the strands this programme added, so it is not optional decoration here.
 *
 * Every molar mass and numeric result is re-derived in
 * `examPaperChemistry.test.js` — molecular formulas are recomputed atom by atom
 * from ATOMIC_MASSES rather than trusted, because a molar mass that is one unit
 * out looks entirely plausible on the page.
 */

/** Nguyên tử khối dùng trong đề, làm nguồn duy nhất cho cả bài kiểm chứng. */
export const ATOMIC_MASSES = {
  H: 1,
  C: 12,
  N: 14,
  O: 16,
  Na: 23,
  Mg: 24,
  Al: 27,
  Cl: 35.5,
  Ca: 40,
  Fe: 56,
  Cu: 64,
  Zn: 65,
  Ag: 108
};

/** Thế điện cực chuẩn (V) của các cặp dùng trong đề. */
export const STANDARD_POTENTIALS = {
  'Zn2+/Zn': -0.76,
  'Cu2+/Cu': 0.34
};

/** Hằng số Faraday, C/mol electron. */
export const FARADAY = 96500;

export const CHEMISTRY_PAPER_META = {
  subject: 'Chemistry',
  durationMinutes: 50,
  totalPoints: 10
};

export const CHEMISTRY_PAPER_QUESTIONS = [
  // ── Phần I — Trắc nghiệm nhiều lựa chọn (18 câu × 0,25đ) ─────────────────
  {
    id: 'CP01',
    subject: 'Chemistry',
    question: 'Ethyl acetate có công thức cấu tạo CH<sub>3</sub>COOC<sub>2</sub>H<sub>5</sub>. Phân tử khối của ester này bằng:',
    options: [
      { key: 'A', text: '74' },
      { key: 'B', text: '88' },
      { key: 'C', text: '102' },
      { key: 'D', text: '60' }
    ],
    correctKey: 'B',
    explanation: 'Công thức phân tử là C<sub>4</sub>H<sub>8</sub>O<sub>2</sub>.<br/><i>M</i> = 4&middot;12 + 8&middot;1 + 2&middot;16 = 48 + 8 + 32 = 88.'
  },
  {
    id: 'CP02',
    subject: 'Chemistry',
    question: 'Đun nóng ester với dung dịch NaOH thu được sản phẩm là:',
    options: [
      { key: 'A', text: 'muối của acid carboxylic và alcohol' },
      { key: 'B', text: 'acid carboxylic và alcohol' },
      { key: 'C', text: 'aldehyde và alcohol' },
      { key: 'D', text: 'hai muối của acid carboxylic' }
    ],
    correctKey: 'A',
    explanation: 'Phản ứng xà phòng hoá: RCOOR\' + NaOH &rarr; RCOONa + R\'OH. Đây là phản ứng một chiều, khác với thuỷ phân trong môi trường acid vốn thuận nghịch.'
  },
  {
    id: 'CP03',
    subject: 'Chemistry',
    question: 'Chất béo là:',
    options: [
      { key: 'A', text: 'monoester của glycerol với acid béo' },
      { key: 'B', text: 'diester của glycerol với acid béo' },
      { key: 'C', text: 'triester của glycerol với acid béo' },
      { key: 'D', text: 'ester của ethylene glycol với acid béo' }
    ],
    correctKey: 'C',
    explanation: 'Glycerol có 3 nhóm -OH, mỗi nhóm ester hoá với một phân tử acid béo, tạo thành triester (triglyceride).'
  },
  {
    id: 'CP04',
    subject: 'Chemistry',
    question: 'Phân tử khối của glucose C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> bằng:',
    options: [
      { key: 'A', text: '162' },
      { key: 'B', text: '342' },
      { key: 'C', text: '180' },
      { key: 'D', text: '150' }
    ],
    correctKey: 'C',
    explanation: '<i>M</i> = 6&middot;12 + 12&middot;1 + 6&middot;16 = 72 + 12 + 96 = 180.'
  },
  {
    id: 'CP05',
    subject: 'Chemistry',
    question: 'Thuỷ phân hoàn toàn saccharose trong môi trường acid thu được:',
    options: [
      { key: 'A', text: 'chỉ glucose' },
      { key: 'B', text: 'glucose và fructose' },
      { key: 'C', text: 'chỉ fructose' },
      { key: 'D', text: 'glucose và galactose' }
    ],
    correctKey: 'B',
    explanation: 'Saccharose là disaccharide tạo bởi một gốc &alpha;-glucose và một gốc &beta;-fructose, nên thuỷ phân cho hỗn hợp glucose và fructose theo tỉ lệ mol 1 : 1.'
  },
  {
    id: 'CP06',
    subject: 'Chemistry',
    question: 'Tinh bột và cellulose đều có công thức chung là:',
    options: [
      { key: 'A', text: '(C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>)<sub>n</sub>' },
      { key: 'B', text: 'C<sub>12</sub>H<sub>22</sub>O<sub>11</sub>' },
      { key: 'C', text: '(C<sub>6</sub>H<sub>10</sub>O<sub>5</sub>)<sub>n</sub>' },
      { key: 'D', text: '(C<sub>5</sub>H<sub>10</sub>O<sub>5</sub>)<sub>n</sub>' }
    ],
    correctKey: 'C',
    explanation: 'Cả hai đều là polysaccharide tạo từ các mắt xích glucose nối với nhau, mỗi mắt xích ứng với C<sub>6</sub>H<sub>10</sub>O<sub>5</sub> (đã tách một phân tử nước khi tạo liên kết glycoside).'
  },
  {
    id: 'CP07',
    subject: 'Chemistry',
    question: 'Phân tử khối của methylamine CH<sub>3</sub>NH<sub>2</sub> bằng:',
    options: [
      { key: 'A', text: '45' },
      { key: 'B', text: '17' },
      { key: 'C', text: '29' },
      { key: 'D', text: '31' }
    ],
    correctKey: 'D',
    explanation: 'Công thức phân tử là CH<sub>5</sub>N.<br/><i>M</i> = 12 + 5&middot;1 + 14 = 31.'
  },
  {
    id: 'CP08',
    subject: 'Chemistry',
    question: 'Amino acid có tính lưỡng tính vì trong phân tử:',
    options: [
      { key: 'A', text: 'chứa đồng thời nhóm -NH<sub>2</sub> và nhóm -COOH' },
      { key: 'B', text: 'chỉ chứa nhóm -COOH' },
      { key: 'C', text: 'chỉ chứa nhóm -NH<sub>2</sub>' },
      { key: 'D', text: 'chứa liên kết peptide' }
    ],
    correctKey: 'A',
    explanation: 'Nhóm -COOH cho proton nên thể hiện tính acid, nhóm -NH<sub>2</sub> nhận proton nên thể hiện tính base. Có cả hai nên amino acid vừa tác dụng với acid vừa tác dụng với base.'
  },
  {
    id: 'CP09',
    subject: 'Chemistry',
    question: 'Liên kết peptide là liên kết giữa:',
    options: [
      { key: 'A', text: 'hai nhóm -COOH của hai amino acid' },
      { key: 'B', text: 'nhóm -CO- và nhóm -NH- của hai đơn vị &alpha;-amino acid' },
      { key: 'C', text: 'hai nhóm -NH<sub>2</sub> của hai amino acid' },
      { key: 'D', text: 'nhóm -OH và nhóm -NH<sub>2</sub>' }
    ],
    correctKey: 'B',
    explanation: 'Liên kết peptide -CO-NH- hình thành khi nhóm -COOH của amino acid này phản ứng với nhóm -NH<sub>2</sub> của amino acid kia, giải phóng một phân tử nước.'
  },
  {
    id: 'CP10',
    subject: 'Chemistry',
    question: 'Polyethylene (PE) được điều chế từ monomer nào bằng phản ứng trùng hợp?',
    options: [
      { key: 'A', text: 'CH<sub>2</sub>=CH<sub>2</sub>' },
      { key: 'B', text: 'CH<sub>2</sub>=CH-CH<sub>3</sub>' },
      { key: 'C', text: 'CH<sub>2</sub>=CHCl' },
      { key: 'D', text: 'CH&equiv;CH' }
    ],
    correctKey: 'A',
    explanation: 'PE là sản phẩm trùng hợp ethylene: <i>n</i>CH<sub>2</sub>=CH<sub>2</sub> &rarr; (-CH<sub>2</sub>-CH<sub>2</sub>-)<sub><i>n</i></sub>.'
  },
  {
    id: 'CP11',
    subject: 'Chemistry',
    question: 'Phản ứng trùng ngưng khác phản ứng trùng hợp ở chỗ:',
    options: [
      { key: 'A', text: 'không tạo ra polymer' },
      { key: 'B', text: 'chỉ xảy ra với hydrocarbon' },
      { key: 'C', text: 'có giải phóng phân tử nhỏ như H<sub>2</sub>O' },
      { key: 'D', text: 'không cần xúc tác' }
    ],
    correctKey: 'C',
    explanation: 'Trùng hợp cộng hợp các monomer chứa liên kết bội mà không tách gì ra. Trùng ngưng nối các monomer có ít nhất hai nhóm chức và đồng thời tách ra phân tử nhỏ, thường là H<sub>2</sub>O.'
  },
  {
    id: 'CP12',
    subject: 'Chemistry',
    question: 'Trong pin Galvani Zn-Cu hoạt động, điện cực kẽm đóng vai trò:',
    options: [
      { key: 'A', text: 'cathode, tại đó xảy ra sự khử' },
      { key: 'B', text: 'anode, tại đó xảy ra sự oxi hoá' },
      { key: 'C', text: 'cathode, tại đó xảy ra sự oxi hoá' },
      { key: 'D', text: 'anode, tại đó xảy ra sự khử' }
    ],
    correctKey: 'B',
    explanation: 'Zn có thế điện cực chuẩn nhỏ hơn Cu nên bị oxi hoá: Zn &rarr; Zn<sup>2+</sup> + 2e. Điện cực xảy ra sự oxi hoá là anode, và trong pin Galvani anode là cực âm.'
  },
  {
    id: 'CP13',
    subject: 'Chemistry',
    question: 'Cho <i>E</i>&deg;(Zn<sup>2+</sup>/Zn) = -0,76 V và <i>E</i>&deg;(Cu<sup>2+</sup>/Cu) = +0,34 V. Sức điện động chuẩn của pin Galvani Zn-Cu bằng:',
    options: [
      { key: 'A', text: '0,42 V' },
      { key: 'B', text: '-1,10 V' },
      { key: 'C', text: '1,10 V' },
      { key: 'D', text: '-0,42 V' }
    ],
    correctKey: 'C',
    explanation: '<i>E</i>&deg;<sub>pin</sub> = <i>E</i>&deg;<sub>cathode</sub> - <i>E</i>&deg;<sub>anode</sub> = 0,34 - (-0,76) = 1,10 V. Giá trị dương xác nhận phản ứng tự xảy ra.'
  },
  {
    id: 'CP14',
    subject: 'Chemistry',
    question: 'Điện phân dung dịch NaCl bão hoà có màng ngăn xốp thu được:',
    options: [
      { key: 'A', text: 'Na và Cl<sub>2</sub>' },
      { key: 'B', text: 'NaOH, H<sub>2</sub> và Cl<sub>2</sub>' },
      { key: 'C', text: 'NaClO và H<sub>2</sub>' },
      { key: 'D', text: 'Na<sub>2</sub>O và Cl<sub>2</sub>' }
    ],
    correctKey: 'B',
    explanation: 'Ở cathode nước bị khử cho H<sub>2</sub> và OH<sup>-</sup> (Na<sup>+</sup> không bị khử trong dung dịch nước), ở anode Cl<sup>-</sup> bị oxi hoá cho Cl<sub>2</sub>. Màng ngăn giữ Cl<sub>2</sub> không phản ứng với NaOH tạo thành.'
  },
  {
    id: 'CP15',
    subject: 'Chemistry',
    question: 'Tính dẫn điện, dẫn nhiệt và ánh kim của kim loại được giải thích bằng:',
    options: [
      { key: 'A', text: 'độ âm điện lớn của nguyên tử kim loại' },
      { key: 'B', text: 'liên kết cộng hoá trị giữa các nguyên tử' },
      { key: 'C', text: 'khối lượng riêng lớn của kim loại' },
      { key: 'D', text: 'các electron tự do trong mạng tinh thể kim loại' }
    ],
    correctKey: 'D',
    explanation: 'Trong tinh thể kim loại, các electron hoá trị tách khỏi nguyên tử và chuyển động tự do. Chính chúng truyền dòng điện, truyền nhiệt và phản xạ ánh sáng tạo ánh kim.'
  },
  {
    id: 'CP16',
    subject: 'Chemistry',
    question: 'Điều kiện để xảy ra ăn mòn điện hoá học là:',
    options: [
      { key: 'A', text: 'hai điện cực khác bản chất, tiếp xúc nhau và cùng tiếp xúc dung dịch chất điện li' },
      { key: 'B', text: 'kim loại tiếp xúc với khí oxygen khô' },
      { key: 'C', text: 'kim loại được nung nóng ở nhiệt độ cao' },
      { key: 'D', text: 'hai điện cực cùng bản chất đặt trong dung dịch' }
    ],
    correctKey: 'A',
    explanation: 'Ăn mòn điện hoá cần đủ ba điều kiện: hai điện cực khác bản chất, chúng tiếp xúc trực tiếp hoặc qua dây dẫn, và cùng nhúng trong một dung dịch chất điện li.'
  },
  {
    id: 'CP17',
    subject: 'Chemistry',
    question: 'Nước cứng là nước chứa nhiều ion:',
    options: [
      { key: 'A', text: 'Na<sup>+</sup> và K<sup>+</sup>' },
      { key: 'B', text: 'Ca<sup>2+</sup> và Mg<sup>2+</sup>' },
      { key: 'C', text: 'Fe<sup>2+</sup> và Zn<sup>2+</sup>' },
      { key: 'D', text: 'Cl<sup>-</sup> và SO<sub>4</sub><sup>2-</sup>' }
    ],
    correctKey: 'B',
    explanation: 'Nước cứng được định nghĩa theo hàm lượng cation Ca<sup>2+</sup> và Mg<sup>2+</sup>. Chúng tạo kết tủa với xà phòng và đóng cặn trong nồi hơi.'
  },
  {
    id: 'CP18',
    subject: 'Chemistry',
    question: 'Nguyên tử của các kim loại nhóm IA có cấu hình electron lớp ngoài cùng là:',
    options: [
      { key: 'A', text: '<i>ns</i><sup>2</sup>' },
      { key: 'B', text: '<i>ns</i><sup>2</sup><i>np</i><sup>1</sup>' },
      { key: 'C', text: '<i>ns</i><sup>1</sup>' },
      { key: 'D', text: '<i>ns</i><sup>2</sup><i>np</i><sup>2</sup>' }
    ],
    correctKey: 'C',
    explanation: 'Kim loại kiềm ở nhóm IA có 1 electron ở lớp ngoài cùng, cấu hình <i>ns</i><sup>1</sup>. Chúng dễ nhường electron đó để đạt cấu hình khí hiếm nên có tính khử rất mạnh.'
  },

  // ── Phần II — Trắc nghiệm đúng/sai (4 câu × 1,0đ) ────────────────────────
  {
    id: 'CP19',
    subject: 'Chemistry',
    type: 'tf',
    question: 'Cho ester X có công thức cấu tạo CH<sub>3</sub>COOC<sub>2</sub>H<sub>5</sub>. Xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: 'Công thức phân tử của X là C<sub>4</sub>H<sub>8</sub>O<sub>2</sub>.', correct: true },
      { id: 'b', text: 'Phân tử khối của X bằng 88.', correct: true },
      { id: 'c', text: 'Thuỷ phân X trong dung dịch NaOH thu được CH<sub>3</sub>COONa và C<sub>2</sub>H<sub>5</sub>OH.', correct: true },
      { id: 'd', text: 'X được điều chế bằng phản ứng trùng ngưng.', correct: false }
    ],
    explanation: 'a) Đúng: đếm nguyên tử được C<sub>4</sub>H<sub>8</sub>O<sub>2</sub>.<br/>b) Đúng: <i>M</i> = 48 + 8 + 32 = 88.<br/>c) Đúng: xà phòng hoá cho muối và alcohol tương ứng.<br/>d) Sai: X là ester đơn giản, điều chế bằng phản ứng <b>ester hoá</b> giữa acid và alcohol, không phải trùng ngưng.'
  },
  {
    id: 'CP20',
    subject: 'Chemistry',
    type: 'tf',
    question: 'Về glucose, xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: 'Glucose có công thức phân tử C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>, phân tử khối 180.', correct: true },
      { id: 'b', text: 'Glucose thuộc loại monosaccharide.', correct: true },
      { id: 'c', text: 'Glucose tham gia phản ứng tráng bạc do trong phân tử có nhóm -CHO.', correct: true },
      { id: 'd', text: 'Glucose bị thuỷ phân trong môi trường acid tạo ra hai monosaccharide.', correct: false }
    ],
    explanation: 'a) Đúng: <i>M</i> = 72 + 12 + 96 = 180.<br/>b) Đúng: glucose là đường đơn.<br/>c) Đúng: dạng mạch hở có nhóm aldehyde nên khử được [Ag(NH<sub>3</sub>)<sub>2</sub>]OH.<br/>d) Sai: là monosaccharide nên glucose <b>không</b> bị thuỷ phân; saccharose mới thuỷ phân cho hai đường đơn.'
  },
  {
    id: 'CP21',
    subject: 'Chemistry',
    type: 'tf',
    question: 'Cho pin Galvani Zn-Cu với <i>E</i>&deg;(Zn<sup>2+</sup>/Zn) = -0,76 V, <i>E</i>&deg;(Cu<sup>2+</sup>/Cu) = +0,34 V. Xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: 'Điện cực Zn là anode và bị ăn mòn dần trong quá trình pin hoạt động.', correct: true },
      { id: 'b', text: 'Sức điện động chuẩn của pin bằng 1,10 V.', correct: true },
      { id: 'c', text: 'Dòng electron ở mạch ngoài đi từ điện cực Zn sang điện cực Cu.', correct: true },
      { id: 'd', text: 'Khối lượng điện cực Cu giảm dần trong quá trình pin hoạt động.', correct: false }
    ],
    explanation: 'a) Đúng: Zn bị oxi hoá thành Zn<sup>2+</sup> tan vào dung dịch nên điện cực mòn đi.<br/>b) Đúng: 0,34 - (-0,76) = 1,10 V.<br/>c) Đúng: electron rời anode Zn đi tới cathode Cu.<br/>d) Sai: tại cathode Cu<sup>2+</sup> bị khử bám vào điện cực nên khối lượng điện cực Cu <b>tăng</b>.'
  },
  {
    id: 'CP22',
    subject: 'Chemistry',
    type: 'tf',
    question: 'Về nước cứng và cách làm mềm nước, xét tính Đúng hoặc Sai của các mệnh đề sau:',
    statements: [
      { id: 'a', text: 'Nước cứng chứa nhiều ion Ca<sup>2+</sup> và Mg<sup>2+</sup>.', correct: true },
      { id: 'b', text: 'Đun sôi làm mềm được nước cứng tạm thời.', correct: true },
      { id: 'c', text: 'Dùng Na<sub>2</sub>CO<sub>3</sub> làm mềm được cả nước cứng tạm thời và vĩnh cửu.', correct: true },
      { id: 'd', text: 'Đun sôi làm mềm được nước cứng vĩnh cửu.', correct: false }
    ],
    explanation: 'a) Đúng: đó là định nghĩa của nước cứng.<br/>b) Đúng: đun sôi phân huỷ hydrogencarbonate thành carbonate kết tủa.<br/>c) Đúng: CO<sub>3</sub><sup>2-</sup> kết tủa cả Ca<sup>2+</sup> lẫn Mg<sup>2+</sup> bất kể anion đi kèm.<br/>d) Sai: nước cứng vĩnh cửu chứa muối chloride, sulfate bền với nhiệt nên đun sôi <b>không</b> làm mềm được.'
  },

  // ── Phần III — Trắc nghiệm trả lời ngắn (6 câu × 0,25đ) ──────────────────
  {
    id: 'CP23',
    subject: 'Chemistry',
    type: 'short',
    question: 'Tính phân tử khối của glycine H<sub>2</sub>N-CH<sub>2</sub>-COOH. (Nhập đáp số là số nguyên)',
    correctAnswer: '75',
    explanation: 'Công thức phân tử C<sub>2</sub>H<sub>5</sub>NO<sub>2</sub>.<br/><i>M</i> = 2&middot;12 + 5&middot;1 + 14 + 2&middot;16 = 24 + 5 + 14 + 32 = 75.'
  },
  {
    id: 'CP24',
    subject: 'Chemistry',
    type: 'short',
    question: 'Xà phòng hoá hoàn toàn 8,8 gam CH<sub>3</sub>COOC<sub>2</sub>H<sub>5</sub> bằng dung dịch NaOH dư. Tính khối lượng muối CH<sub>3</sub>COONa thu được, đơn vị gam. (Nhập đáp số dạng số thập phân, ví dụ 8,2)',
    correctAnswer: '8,2',
    explanation: '<i>n</i><sub>ester</sub> = 8,8/88 = 0,1 mol.<br/>CH<sub>3</sub>COOC<sub>2</sub>H<sub>5</sub> + NaOH &rarr; CH<sub>3</sub>COONa + C<sub>2</sub>H<sub>5</sub>OH, tỉ lệ mol 1 : 1.<br/><i>M</i>(CH<sub>3</sub>COONa) = 82 &rArr; <i>m</i> = 0,1 &middot; 82 = 8,2 gam.'
  },
  {
    id: 'CP25',
    subject: 'Chemistry',
    type: 'short',
    question: 'Cho <i>E</i>&deg;(Zn<sup>2+</sup>/Zn) = -0,76 V và <i>E</i>&deg;(Cu<sup>2+</sup>/Cu) = +0,34 V. Tính sức điện động chuẩn của pin Galvani Zn-Cu, đơn vị vôn. (Nhập đáp số dạng số thập phân, ví dụ 1,10)',
    correctAnswer: '1,1',
    explanation: '<i>E</i>&deg;<sub>pin</sub> = <i>E</i>&deg;<sub>cathode</sub> - <i>E</i>&deg;<sub>anode</sub> = 0,34 - (-0,76) = 1,1 V.'
  },
  {
    id: 'CP26',
    subject: 'Chemistry',
    type: 'short',
    question: 'Điện phân dung dịch CuSO<sub>4</sub> với điện cực trơ, cường độ dòng điện 5 A trong 1930 giây. Tính khối lượng Cu bám vào cathode, đơn vị gam. Cho <i>F</i> = 96500 C/mol. (Nhập đáp số dạng số thập phân, ví dụ 3,2)',
    correctAnswer: '3,2',
    explanation: 'Định luật Faraday: <i>m</i> = <i>AIt</i>/(<i>nF</i>).<br/><i>m</i> = 64 &middot; 5 &middot; 1930 / (2 &middot; 96500) = 617600 / 193000 = 3,2 gam.'
  },
  {
    id: 'CP27',
    subject: 'Chemistry',
    type: 'short',
    question: 'Một đoạn mạch polyethylene có phân tử khối 56000. Tính số mắt xích -CH<sub>2</sub>-CH<sub>2</sub>- trong đoạn mạch đó. (Nhập đáp số là số nguyên)',
    correctAnswer: '2000',
    explanation: 'Mắt xích -CH<sub>2</sub>-CH<sub>2</sub>- ứng với C<sub>2</sub>H<sub>4</sub>, <i>M</i> = 2&middot;12 + 4&middot;1 = 28.<br/>Số mắt xích = 56000/28 = 2000.'
  },
  {
    id: 'CP28',
    subject: 'Chemistry',
    type: 'short',
    question: 'Thuỷ phân hoàn toàn 162 gam tinh bột (C<sub>6</sub>H<sub>10</sub>O<sub>5</sub>)<sub>n</sub> thu được glucose. Tính khối lượng glucose thu được, đơn vị gam, giả thiết hiệu suất 100%. (Nhập đáp số là số nguyên)',
    correctAnswer: '180',
    explanation: 'Mắt xích C<sub>6</sub>H<sub>10</sub>O<sub>5</sub> có <i>M</i> = 162 &rArr; <i>n</i> = 162/162 = 1 mol mắt xích.<br/>Mỗi mắt xích cộng một phân tử nước cho một phân tử glucose (<i>M</i> = 180).<br/><i>m</i> = 1 &middot; 180 = 180 gam.'
  }
];
