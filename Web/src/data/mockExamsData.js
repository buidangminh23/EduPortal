export const BLOCKS = {
  A00: { name: 'Khối A00', subjects: ['Math', 'Physics', 'Chemistry'] },
  A01: { name: 'Khối A01', subjects: ['Math', 'Physics', 'English'] },
  B00: { name: 'Khối B00', subjects: ['Math', 'Chemistry', 'Biology'] },
  C00: { name: 'Khối C00', subjects: ['Literature', 'History', 'Geography'] },
  D01: { name: 'Khối D01', subjects: ['Math', 'Literature', 'English'] },
};

export const SUBJECT_NAMES = {
  Math: 'Toán học',
  Physics: 'Vật lý',
  Chemistry: 'Hóa học',
  Biology: 'Sinh học',
  English: 'Tiếng Anh',
  History: 'Lịch sử',
  Geography: 'Địa lý',
  Literature: 'Ngữ văn',
};

// High-fidelity subject questions shared across blocks
const QUESTIONS = {
  Math: [
    {
      id: 'QM1',
      subject: 'Math',
      question: 'Tìm họ nguyên hàm của hàm số <i>f</i>(<i>x</i>) = 3<i>x</i><sup>2</sup> + 2<i>x</i> + 1.',
      options: [
        { key: 'A', text: '<i>F</i>(<i>x</i>) = <i>x</i><sup>3</sup> + <i>x</i><sup>2</sup> + <i>x</i> + <i>C</i>' },
        { key: 'B', text: '<i>F</i>(<i>x</i>) = 6<i>x</i> + 2 + <i>C</i>' },
        { key: 'C', text: '<i>F</i>(<i>x</i>) = 3<i>x</i><sup>3</sup> + 2<i>x</i><sup>2</sup> + <i>x</i> + <i>C</i>' },
        { key: 'D', text: '<i>F</i>(<i>x</i>) = <i>x</i><sup>3</sup> + <i>x</i><sup>2</sup> + <i>C</i>' }
      ],
      correctKey: 'A',
      explanation: 'Ta áp dụng công thức nguyên hàm cơ bản:<br/>&int; 3<i>x</i><sup>2</sup> d<i>x</i> = 3 &middot; (<i>x</i><sup>3</sup>/3) = <i>x</i><sup>3</sup><br/>&int; 2<i>x</i> d<i>x</i> = 2 &middot; (<i>x</i><sup>2</sup>/2) = <i>x</i><sup>2</sup><br/>&int; 1 d<i>x</i> = <i>x</i><br/>Suy ra: <i>F</i>(<i>x</i>) = &int; (3<i>x</i><sup>2</sup> + 2<i>x</i> + 1)d<i>x</i> = <i>x</i><sup>3</sup> + <i>x</i><sup>2</sup> + <i>x</i> + <i>C</i>. Do đó, đáp án đúng là A.'
    },
    {
      id: 'QM2',
      subject: 'Math',
      question: 'Cho số phức <i>z</i> = 3 - 4<i>i</i>. Tính môđun |<i>z</i>| của số phức đã cho.',
      options: [
        { key: 'A', text: '|<i>z</i>| = 7' },
        { key: 'B', text: '|<i>z</i>| = 5' },
        { key: 'C', text: '|<i>z</i>| = 25' },
        { key: 'D', text: '|<i>z</i>| = &radic;7' }
      ],
      correctKey: 'B',
      explanation: 'Môđun của số phức <i>z</i> = <i>a</i> + <i>bi</i> được tính bằng công thức: |<i>z</i>| = &radic;(<i>a</i><sup>2</sup> + <i>b</i><sup>2</sup>).<br/>Với <i>z</i> = 3 - 4<i>i</i>, ta có:<br/>|<i>z</i>| = &radic;(3<sup>2</sup> + (-4)<sup>2</sup>) = &radic;(9 + 16) = &radic;25 = 5. Do đó chọn B.'
    },
    {
      id: 'QM3',
      subject: 'Math',
      question: 'Trong không gian <i>Oxyz</i>, phương trình mặt phẳng đi qua điểm <i>M</i>(1, -2, 3) và nhận vectơ pháp tuyến <i>n</i>&#8407; = (2, 1, -1) là:',
      options: [
        { key: 'A', text: '2<i>x</i> + <i>y</i> - <i>z</i> + 3 = 0' },
        { key: 'B', text: '2<i>x</i> + <i>y</i> - <i>z</i> - 3 = 0' },
        { key: 'C', text: '2<i>x</i> + <i>y</i> - <i>z</i> - 1 = 0' },
        { key: 'D', text: '<i>x</i> - 2<i>y</i> + 3<i>z</i> - 3 = 0' }
      ],
      correctKey: 'A',
      explanation: 'Phương trình mặt phẳng đi qua điểm <i>M</i>(<i>x</i><sub>0</sub>, <i>y</i><sub>0</sub>, <i>z</i><sub>0</sub>) có vectơ pháp tuyến <i>n</i>&#8407; = (<i>A</i>, <i>B</i>, <i>C</i>) được viết dưới dạng:<br/><i>A</i>(<i>x</i> - <i>x</i><sub>0</sub>) + <i>B</i>(<i>y</i> - <i>y</i><sub>0</sub>) + <i>C</i>(<i>z</i> - <i>z</i><sub>0</sub>) = 0.<br/>Thay tọa độ điểm <i>M</i>(1, -2, 3) và vectơ pháp tuyến <i>n</i>&#8407; = (2, 1, -1), ta được:<br/>2(<i>x</i> - 1) + 1(<i>y</i> - (-2)) - 1(<i>z</i> - 3) = 0<br/>&hArr; 2<i>x</i> - 2 + <i>y</i> + 2 - <i>z</i> + 3 = 0<br/>&hArr; 2<i>x</i> + <i>y</i> - <i>z</i> + 3 = 0. Do đó chọn A.'
    },
    {
      id: 'QM4',
      subject: 'Math',
      question: 'Tìm giá trị lớn nhất <i>M</i> của hàm số <i>y</i> = <i>x</i><sup>3</sup> - 3<i>x</i> trên đoạn [0, 2].',
      options: [
        { key: 'A', text: '<i>M</i> = 2' },
        { key: 'B', text: '<i>M</i> = 0' },
        { key: 'C', text: '<i>M</i> = -2' },
        { key: 'D', text: '<i>M</i> = 4' }
      ],
      correctKey: 'A',
      explanation: 'Xét hàm số <i>y</i> = <i>x</i><sup>3</sup> - 3<i>x</i> trên [0, 2]:<br/>Đạo hàm: <i>y</i>\' = 3<i>x</i><sup>2</sup> - 3.<br/>Cho <i>y</i>\' = 0 &hArr; 3<i>x</i><sup>2</sup> = 3 &hArr; <i>x</i> = &plusmn;1.<br/>Vì xét trên đoạn [0, 2], ta chỉ nhận giá trị <i>x</i> = 1.<br/>Tính giá trị của hàm số tại các điểm cực trị và biên đoạn:<br/>- <i>y</i>(0) = 0<br/>- <i>y</i>(1) = 1<sup>3</sup> - 3(1) = -2<br/>- <i>y</i>(2) = 2<sup>3</sup> - 3(2) = 8 - 6 = 2.<br/>So sánh các giá trị trên, ta thấy giá trị lớn nhất <i>M</i> = 2 tại <i>x</i> = 2. Chọn A.'
    },
    {
      id: 'QM5',
      subject: 'Math',
      question: 'Từ một hộp chứa 6 quả bóng đỏ và 4 quả bóng xanh, lấy ngẫu nhiên đồng thời 2 quả bóng. Tính xác suất <i>P</i> để lấy được 2 quả bóng cùng màu.',
      options: [
        { key: 'A', text: '<i>P</i> = 7/15' },
        { key: 'B', text: '<i>P</i> = 8/15' },
        { key: 'C', text: '<i>P</i> = 1/3' },
        { key: 'D', text: '<i>P</i> = 2/15' }
      ],
      correctKey: 'A',
      explanation: 'Không gian mẫu là số cách chọn 2 quả bóng bất kỳ từ 10 quả: <i>n</i>(&Omega;) = <i>C</i><sub>10</sub><sup>2</sup> = 45.<br/>Gọi biến cố <i>X</i> là "lấy được 2 quả cùng màu" (hoặc cùng đỏ hoặc cùng xanh).<br/>- Số cách lấy 2 bóng đỏ: <i>C</i><sub>6</sub><sup>2</sup> = 15.<br/>- Số cách lấy 2 bóng xanh: <i>C</i><sub>4</sub><sup>2</sup> = 6.<br/>Số kết quả thuận lợi cho biến cố <i>X</i> là: <i>n</i>(<i>X</i>) = 15 + 6 = 21.<br/>Xác suất cần tìm là: <i>P</i>(<i>X</i>) = 21/45 = 7/15. Chọn A.'
    }
  ],
  Physics: [
    {
      id: 'QP1',
      subject: 'Physics',
      question: 'Một con lắc lò xo gồm lò xo nhẹ có độ cứng <i>k</i> = 100 N/m và vật nhỏ có khối lượng <i>m</i> = 250g. Chu kỳ dao động riêng của con lắc lò xo là (lấy &pi;<sup>2</sup> = 10):',
      options: [
        { key: 'A', text: '<i>T</i> = 0,314 s' },
        { key: 'B', text: '<i>T</i> = 0,628 s' },
        { key: 'C', text: '<i>T</i> = 0,1 s' },
        { key: 'D', text: '<i>T</i> = 0,2 s' }
      ],
      correctKey: 'A',
      explanation: 'Chu kỳ dao động của con lắc lò xo: <i>T</i> = 2&pi; &radic;(<i>m</i>/<i>k</i>).<br/>Đổi <i>m</i> = 250g = 0,25kg.<br/>Thay số: <i>T</i> = 2&pi; &radic;(0,25/100) = 2&pi; &radic;(1/400) = 2&pi; / 20 = &pi; / 10.<br/>Với &pi;<sup>2</sup> = 10 &rArr; &pi; = &radic;10 &asymp; 3,1416.<br/>Suy ra <i>T</i> = 3,14 / 10 = 0,314 s. Chọn A.'
    },
    {
      id: 'QP2',
      subject: 'Physics',
      question: 'Một nguồn âm phát sóng cơ học truyền trong môi trường có vận tốc <i>v</i> = 340 m/s. Biết tần số của sóng âm là <i>f</i> = 1000 Hz. Bước sóng &lambda; của sóng âm này bằng:',
      options: [
        { key: 'A', text: '&lambda; = 34 cm' },
        { key: 'B', text: '&lambda; = 3,4 m' },
        { key: 'C', text: '&lambda; = 0,34 m' },
        { key: 'D', text: '&lambda; = 34 m' }
      ],
      correctKey: 'C',
      explanation: 'Bước sóng &lambda; là quãng đường sóng truyền đi được trong một chu kỳ:<br/>&lambda; = <i>v</i> &middot; <i>T</i> = <i>v</i> / <i>f</i>.<br/>Thay số: &lambda; = 340 / 1000 = 0,34 m = 34 cm. Trong các đáp án, &lambda; = 0,34 m tương ứng với đáp án C.'
    },
    {
      id: 'QP3',
      subject: 'Physics',
      question: 'Đặt vào hai đầu đoạn mạch RLC nối tiếp một điện áp xoay chiều <i>u</i> = <i>U</i><sub>0</sub>cos(100&pi;<i>t</i>) V. Biết điện trở <i>R</i> = 50 &Omega;, cuộn cảm thuần có <i>L</i> = 1/(2&pi;) H, tụ điện có <i>C</i> = 10<sup>-4</sup>/&pi; F. Tính tổng trở <i>Z</i> của đoạn mạch.',
      options: [
        { key: 'A', text: '<i>Z</i> = 50&radic;2 &Omega;' },
        { key: 'B', text: '<i>Z</i> = 50 &Omega;' },
        { key: 'C', text: '<i>Z</i> = 100 &Omega;' },
        { key: 'D', text: '<i>Z</i> = 100&radic;2 &Omega;' }
      ],
      correctKey: 'A',
      explanation: 'Ta tính cảm kháng và dung kháng của mạch:<br/>- Tần số góc: &omega; = 100&pi; rad/s.<br/>- Cảm kháng: <i>Z</i><sub>L</sub> = &omega;<i>L</i> = 100&pi; &middot; 1/(2&pi;) = 50 &Omega;.<br/>- Dung kháng: <i>Z</i><sub>C</sub> = 1/(&omega;<i>C</i>) = 1 / (100&pi; &middot; 10<sup>-4</sup>/&pi;) = 10<sup>2</sup> = 100 &Omega;.<br/>- Tổng trở: <i>Z</i> = &radic;[<i>R</i><sup>2</sup> + (<i>Z</i><sub>L</sub> - <i>Z</i><sub>C</sub>)<sup>2</sup>] = &radic;[50<sup>2</sup> + (50 - 100)<sup>2</sup>] = &radic;[50<sup>2</sup> + (-50)<sup>2</sup>] = 50&radic;2 &Omega;. Chọn A.'
    },
    {
      id: 'QP4',
      subject: 'Physics',
      question: 'Biết khối lượng của proton, neutron và hạt nhân Heli (<sup>4</sup><sub>2</sub>He) lần lượt là 1,0073u; 1,0087u và 4,0015u. Lấy 1u = 931,5 MeV/<i>c</i><sup>2</sup>. Năng lượng liên kết riêng của hạt nhân Heli bằng:',
      options: [
        { key: 'A', text: '<i>E</i><sub>lk riêng</sub> = 28,41 MeV/nuclôn' },
        { key: 'B', text: '<i>E</i><sub>lk riêng</sub> = 7,10 MeV/nuclôn' },
        { key: 'C', text: '<i>E</i><sub>lk riêng</sub> = 14,20 MeV/nuclôn' },
        { key: 'D', text: '<i>E</i><sub>lk riêng</sub> = 5,68 MeV/nuclôn' }
      ],
      correctKey: 'B',
      explanation: 'Độ hụt khối của hạt nhân Heli (<sup>4</sup><sub>2</sub>He có <i>Z</i>=2 proton, <i>A</i>-<i>Z</i>=2 neutron):<br/>&Delta;<i>m</i> = 2<i>m</i><sub>p</sub> + 2<i>m</i><sub>n</sub> - <i>m</i><sub>He</sub> = 2(1,0073) + 2(1,0087) - 4,0015 = 2,0146 + 2,0174 - 4,0015 = 0,0305 u.<br/>Năng lượng liên kết: <i>E</i><sub>lk</sub> = &Delta;<i>m</i> &middot; 931,5 MeV = 0,0305 &middot; 931,5 &asymp; 28,41 MeV.<br/>Năng lượng liên kết riêng: <i>E</i><sub>lk riêng</sub> = <i>E</i><sub>lk</sub> / <i>A</i> = 28,41 / 4 &asymp; 7,10 MeV/nuclôn. Chọn B.'
    },
    {
      id: 'QP5',
      subject: 'Physics',
      question: 'Trong thí nghiệm giao thoa ánh sáng Y-âng, khoảng cách giữa hai khe là <i>a</i> = 1 mm, khoảng cách từ mặt phẳng chứa hai khe đến màn là <i>D</i> = 2 m. Chiếu sáng hai khe bằng ánh sáng đơn sắc có bước sóng &lambda; = 0,5 &mu;m. Khoảng vân giao thoa <i>i</i> đo được trên màn bằng:',
      options: [
        { key: 'A', text: '<i>i</i> = 1 mm' },
        { key: 'B', text: '<i>i</i> = 0,5 mm' },
        { key: 'C', text: '<i>i</i> = 2 mm' },
        { key: 'D', text: '<i>i</i> = 1,5 mm' }
      ],
      correctKey: 'A',
      explanation: 'Công thức khoảng vân giao thoa: <i>i</i> = &lambda;<i>D</i> / <i>a</i>.<br/>Đổi đơn vị: &lambda; = 0,5 &mu;m = 0,5 &middot; 10<sup>-3</sup> mm; <i>D</i> = 2 m = 2000 mm; <i>a</i> = 1 mm.<br/>Tính toán: <i>i</i> = (0,5 &middot; 10<sup>-3</sup> &middot; 2000) / 1 = 1 mm. Chọn A.'
    }
  ],
  Chemistry: [
    {
      id: 'QC1',
      subject: 'Chemistry',
      question: 'Este <i>E</i> có công thức phân tử C<sub>4</sub>H<sub>8</sub>O<sub>2</sub>. Thủy phân hoàn toàn <i>E</i> trong dung dịch NaOH đun nóng thu được muối natri axetat. Công thức cấu tạo thu gọn của este <i>E</i> là:',
      options: [
        { key: 'A', text: 'HCOOCH<sub>2</sub>CH<sub>2</sub>CH<sub>3</sub>' },
        { key: 'B', text: 'CH<sub>3</sub>COOCH<sub>2</sub>CH<sub>3</sub>' },
        { key: 'C', text: 'CH<sub>3</sub>CH<sub>2</sub>COOCH<sub>3</sub>' },
        { key: 'D', text: 'CH<sub>3</sub>COOCH<sub>3</sub>' }
      ],
      correctKey: 'B',
      explanation: 'Phản ứng thủy phân este đơn chức trong dung dịch kiềm:<br/><i>R</i>COOR\' + NaOH &rarr; <i>R</i>COONa + R\'OH.<br/>Muối thu được là natri axetat (CH<sub>3</sub>COONa) nên gốc axit <i>R</i>- phải là CH<sub>3</sub>-.<br/>Công thức của este có dạng CH<sub>3</sub>COOR\'. Vì tổng số nguyên tử carbon trong este là 4, gốc R\' chứa 4 - 2 = 2 carbon. Vậy R\' là gốc etyl (-CH<sub>2</sub>CH<sub>3</sub>).<br/>Công thức este là CH<sub>3</sub>COOCH<sub>2</sub>CH<sub>3</sub> (etyl axetat). Chọn B.'
    },
    {
      id: 'QC2',
      subject: 'Chemistry',
      question: 'Hòa tan hoàn toàn 5,4 gam bột nhôm (Al) bằng một lượng dư dung dịch axit clohiđric HCl. Sau phản ứng thu được thể tích khí H<sub>2</sub> (ở đktc) bằng:',
      options: [
        { key: 'A', text: '<i>V</i> = 6,72 lít' },
        { key: 'B', text: '<i>V</i> = 4,48 lít' },
        { key: 'C', text: '<i>V</i> = 8,96 lít' },
        { key: 'D', text: '<i>V</i> = 2,24 lít' }
      ],
      correctKey: 'A',
      explanation: 'Số mol Al phản ứng: <i>n</i><sub>Al</sub> = 5,4 / 27 = 0,2 mol.<br/>Phương trình hóa học xảy ra:<br/>2Al + 6HCl &rarr; 2AlCl<sub>3</sub> + 3H<sub>2</sub> &uarr;<br/>Theo phương trình phản ứng: <i>n</i><sub>H2</sub> = (3/2) &middot; <i>n</i><sub>Al</sub> = 1,5 &middot; 0,2 = 0,3 mol.<br/>Thể tích khí H<sub>2</sub> ở đktc: <i>V</i> = 0,3 &middot; 22,4 = 6,72 lít. Chọn A.'
    },
    {
      id: 'QC3',
      subject: 'Chemistry',
      question: 'Cho phản ứng ở trạng thái cân bằng trong bình kín: N<sub>2</sub>(k) + 3H<sub>2</sub>(k) &rightleftharpoons; 2NH<sub>3</sub>(k), &Delta;<i>H</i> < 0. Để cân bằng chuyển dịch theo chiều thuận (chiều tạo ra NH<sub>3</sub>), tác động nào sau đây là đúng?',
      options: [
        { key: 'A', text: 'Tăng nhiệt độ của hệ phản ứng' },
        { key: 'B', text: 'Giảm áp suất chung của hệ phản ứng' },
        { key: 'C', text: 'Tăng áp suất chung của hệ phản ứng' },
        { key: 'D', text: 'Sử dụng thêm chất xúc tác bột sắt Fe' }
      ],
      correctKey: 'C',
      explanation: 'Theo nguyên lý chuyển dịch cân bằng Le Chatelier:<br/>1. Phản ứng thuận tỏa nhiệt (&Delta;<i>H</i> < 0), nên muốn chuyển dịch theo chiều thuận ta phải giảm nhiệt độ.<br/>2. Phản ứng thuận làm giảm số mol khí (từ 1+3=4 mol khí xuống còn 2 mol khí), nên khi tăng áp suất, cân bằng sẽ dịch chuyển về phía có số mol khí nhỏ hơn (chiều thuận). Do đó chọn C.<br/>Chất xúc tác chỉ làm tăng tốc độ đạt trạng thái cân bằng chứ không làm dịch chuyển vị trí cân bằng.'
    },
    {
      id: 'QC4',
      subject: 'Chemistry',
      question: 'Thuốc thử nào sau đây có thể dùng để phân biệt dung dịch glucozơ và dung dịch fructozơ ở điều kiện thường?',
      options: [
        { key: 'A', text: 'Dung dịch AgNO<sub>3</sub> trong NH<sub>3</sub> đun nóng' },
        { key: 'B', text: 'Cu(OH)<sub>2</sub> trong môi trường kiềm đun nóng' },
        { key: 'C', text: 'Nước brom (dung dịch Br<sub>2</sub>)' },
        { key: 'D', text: 'Dung dịch axit H<sub>2</sub>SO<sub>4</sub> loãng' }
      ],
      correctKey: 'C',
      explanation: 'Glucozơ có nhóm chức anđehit (-CHO) nên dễ dàng bị oxi hóa bởi nước brom làm mất màu dung dịch brom tạo axit gluconic:<br/>CH<sub>2</sub>OH[CHOH]<sub>4</sub>CHO + Br<sub>2</sub> + H<sub>2</sub>O &rarr; CH<sub>2</sub>OH[CHOH]<sub>4</sub>COOH + 2HBr.<br/>Fructozơ có nhóm chức xeton (-CO-) không phản ứng và không làm mất màu nước brom.<br/>(Lưu ý: Trong môi trường kiềm của phản ứng tráng gương hoặc Cu(OH)<sub>2</sub>/OH<sup>-</sup>, fructozơ chuyển hóa thành glucozơ nên cả hai đều phản ứng tương tự nhau, không dùng phân biệt được). Chọn C.'
    },
    {
      id: 'QC5',
      subject: 'Chemistry',
      question: 'Kim loại nào sau đây có nhiệt độ nóng chảy cao nhất, thường được dùng làm dây tóc bóng đèn sợi đốt?',
      options: [
        { key: 'A', text: 'Đồng (Cu)' },
        { key: 'B', text: 'Sắt (Fe)' },
        { key: 'C', text: 'Volfram (W)' },
        { key: 'D', text: 'Crom (Cr)' }
      ],
      correctKey: 'C',
      explanation: 'Volfram (kí hiệu hóa học: W) là kim loại có nhiệt độ nóng chảy cao nhất trong các kim loại (khoảng 3422 &deg;C). Nhờ tính chất chịu nhiệt cực tốt này, Volfram được dùng để làm sợi đốt trong bóng đèn. Chọn C.'
    }
  ],
  Biology: [
    {
      id: 'QB1',
      subject: 'Biology',
      question: 'Ở cấp độ phân tử, thông tin di truyền được truyền đạt từ ADN mạch kép sang phân tử ARN thông tin (mARN) thông qua quá trình nào?',
      options: [
        { key: 'A', text: 'Quá trình nhân đôi ADN' },
        { key: 'B', text: 'Quá trình phiên mã' },
        { key: 'C', text: 'Quá trình dịch mã' },
        { key: 'D', text: 'Quá trình tự nhân đôi nhiễm sắc thể' }
      ],
      correctKey: 'B',
      explanation: 'Thông tin di truyền từ mạch khuôn ADN được tổng hợp thành mARN qua quá trình phiên mã (transcription). Quá trình dịch mã (translation) là tổng hợp chuỗi polipeptit (protein) dựa trên thông tin mARN. Nhân đôi ADN là tạo ra ADN con. Chọn B.'
    },
    {
      id: 'QB2',
      subject: 'Biology',
      question: 'Theo quy luật phân ly độc lập của Men-đen, phép lai bố mẹ <i>P</i>: AaBb &times; AaBb ở thế hệ lai F<sub>1</sub> cho tỉ lệ kiểu hình lý thuyết là:',
      options: [
        { key: 'A', text: '9 : 3 : 3 : 1' },
        { key: 'B', text: '3 : 1' },
        { key: 'C', text: '1 : 2 : 1' },
        { key: 'D', text: '1 : 1 : 1 : 1' }
      ],
      correctKey: 'A',
      explanation: 'Phép lai giữa hai cá thể dị hợp hai cặp gen (AaBb &times; AaBb):<br/>Xét riêng từng cặp gen lai độc lập:<br/>- Aa &times; Aa &rarr; F<sub>1</sub> phân ly kiểu hình: 3 trội : 1 lặn.<br/>- Bb &times; Bb &rarr; F<sub>1</sub> phân ly kiểu hình: 3 trội : 1 lặn.<br/>Kết hợp hai tính trạng: (3 trội : 1 lặn) &times; (3 trội : 1 lặn) = 9 trội-trội : 3 trội-lặn : 3 lặn-trội : 1 lặn-lặn. Vậy tỉ lệ kiểu hình là 9:3:3:1. Chọn A.'
    },
    {
      id: 'QB3',
      subject: 'Biology',
      question: 'Một quần thể ngẫu phối đang ở trạng thái cân bằng di truyền Hardy-Weinberg, xét một locus gen có 2 alen A và a. Biết tần số alen trội A là <i>p</i> = 0,6. Hãy tính tần số kiểu gen dị hợp Aa trong quần thể này.',
      options: [
        { key: 'A', text: '0,36' },
        { key: 'B', text: '0,16' },
        { key: 'C', text: '0,48' },
        { key: 'D', text: '0,24' }
      ],
      correctKey: 'C',
      explanation: 'Tần số alen lặn a trong quần thể là: <i>q</i> = 1 - <i>p</i> = 1 - 0,6 = 0,4.<br/>Khi quần thể đạt cân bằng Hardy-Weinberg, cấu trúc di truyền của quần thể tuân theo biểu thức:<br/><i>p</i><sup>2</sup> AA + 2<i>pq</i> Aa + <i>q</i><sup>2</sup> aa = 1.<br/>Tần số kiểu gen dị hợp Aa = 2<i>pq</i> = 2 &middot; 0,6 &middot; 0,4 = 0,48 (tức là 48%). Chọn C.'
    },
    {
      id: 'QB4',
      subject: 'Biology',
      question: 'Xét chuỗi thức ăn đơn giản sau: Cỏ &rarr; Châu chấu &rarr; Ếch &rarr; Rắn. Sinh vật tiêu thụ bậc 2 trong chuỗi thức ăn này là:',
      options: [
        { key: 'A', text: 'Cỏ' },
        { key: 'B', text: 'Châu chấu' },
        { key: 'C', text: 'Ếch' },
        { key: 'D', text: 'Rắn' }
      ],
      correctKey: 'C',
      explanation: 'Trong chuỗi thức ăn trên:<br/>- Cỏ là sinh vật sản xuất (bậc dinh dưỡng 1).<br/>- Châu chấu (ăn cỏ) là sinh vật tiêu thụ bậc 1 (bậc dinh dưỡng 2).<br/>- Ếch (ăn châu chấu) là sinh vật tiêu thụ bậc 2 (bậc dinh dưỡng 3).<br/>- Rắn (ăn ếch) là sinh vật tiêu thụ bậc 3 (bậc dinh dưỡng 4).<br/>Do đó, ếch là sinh vật tiêu thụ bậc 2. Chọn C.'
    },
    {
      id: 'QB5',
      subject: 'Biology',
      question: 'Cơ quan nào sau đây ở các loài động vật khác nhau đại diện cho cơ quan tương tự (analogous structures)?',
      options: [
        { key: 'A', text: 'Cánh chim và cánh dơi' },
        { key: 'B', text: 'Cánh côn trùng và cánh chim' },
        { key: 'C', text: 'Chi trước của mèo và vây ngực cá voi' },
        { key: 'D', text: 'Tuyến nước bọt của người và tuyến nọc độc của rắn' }
      ],
      correctKey: 'B',
      explanation: 'Cơ quan tương tự là những cơ quan có nguồn gốc tiến hóa hoàn toàn khác nhau nhưng do thích nghi với môi trường sống giống nhau nên biến đổi để thực hiện chức năng như nhau:<br/>- Cánh côn trùng cấu tạo từ lớp màng chitin của vỏ cơ thể.<br/>- Cánh chim cấu tạo từ chi trước có bộ xương trong.<br/>Cả hai có cùng chức năng là bay nhưng nguồn gốc khác nhau. Các cơ quan khác là cơ quan tương đồng (homologous structures) vì có cùng nguồn gốc phôi thai. Chọn B.'
    }
  ],
  English: [
    {
      id: 'QE1',
      subject: 'English',
      question: 'Choose the word whose underlined part differs from the other three in pronunciation: (A) peak<u>s</u> (B) cap<u>s</u> (C) bag<u>s</u> (D) bat<u>s</u>',
      options: [
        { key: 'A', text: 'peak<u>s</u>' },
        { key: 'B', text: 'cap<u>s</u>' },
        { key: 'C', text: 'bag<u>s</u>' },
        { key: 'D', text: 'bat<u>s</u>' }
      ],
      correctKey: 'C',
      explanation: 'Quy tắc phát âm đuôi "-s":<br/>- Đuôi "-s" được phát âm là /s/ khi từ kết thúc bằng các âm vô thanh /p/, /t/, /k/, /f/, /&theta;/. Trong đó: peak<u>s</u> (/k/), cap<u>s</u> (/p/), bat<u>s</u> (/t/) đều kết thúc bằng âm vô thanh.<br/>- Đuôi "-s" được phát âm là /z/ khi từ kết thúc bằng nguyên âm và âm hữu thanh còn lại. Ở đây bag<u>s</u> kết thúc bằng âm hữu thanh /g/, phát âm là /z/.<br/>Do đó chọn C.'
    },
    {
      id: 'QE2',
      subject: 'English',
      question: 'Complete the sentence with the correct subjunctive form: "If I <u>were</u> you, I would take that English preparation course immediately."',
      options: [
        { key: 'A', text: 'am' },
        { key: 'B', text: 'was' },
        { key: 'C', text: 'were' },
        { key: 'D', text: 'had been' }
      ],
      correctKey: 'C',
      explanation: 'Đây là câu điều kiện loại 2 (Conditional Sentences Type 2) diễn tả giả định trái ngược với thực tế ở hiện tại.<br/>Cấu trúc mệnh đề If: <i>If + S + V-ed / V2</i> (với động từ to be, ta dùng "were" cho tất cả các ngôi chủ ngữ để thể hiện tính chất giả định). Do đó ta chọn "were". Đáp án C.'
    },
    {
      id: 'QE3',
      subject: 'English',
      question: 'Choose the correct verb to complete the collocation: "Students are encouraged to ______ a habit of reading books every day to broaden their horizons."',
      options: [
        { key: 'A', text: 'make' },
        { key: 'B', text: 'do' },
        { key: 'C', text: 'form' },
        { key: 'D', text: 'take' }
      ],
      correctKey: 'C',
      explanation: 'Cụm từ cố định (Collocation) thông dụng trong Tiếng Anh là "form / develop a habit of doing something" có nghĩa là hình thành hoặc bắt đầu một thói quen làm việc gì đó. Vì vậy, động từ "form" là phù hợp nhất. Chọn C.'
    },
    {
      id: 'QE4',
      subject: 'English',
      question: 'Choose the correct passive voice sentence corresponding to: <i>"They are building a new university mock testing application."</i>',
      options: [
        { key: 'A', text: 'A new university mock testing application is built by them.' },
        { key: 'B', text: 'A new university mock testing application is being built.' },
        { key: 'C', text: 'A new university mock testing application was being built.' },
        { key: 'D', text: 'A new university mock testing application has been built.' }
      ],
      correctKey: 'B',
      explanation: 'Câu gốc dùng thì Hiện tại tiếp diễn chủ động: <i>S + am/is/are + V-ing + O</i>.<br/>Chuyển sang câu bị động tương ứng: <i>O + am/is/are + being + V-ed/V3 + (by S)</i>.<br/>"A new university mock testing application" là chủ ngữ số ít nên dùng động từ to be "is". Cấu trúc bị động là "is being built". Đáp án B.'
    },
    {
      id: 'QE5',
      subject: 'English',
      question: 'Read the sentence and answer the question: <i>"The Internet has played a vital role in education, giving students access to countless resources."</i> According to this sentence, the Internet:',
      options: [
        { key: 'A', text: 'has no impact on students\' studies.' },
        { key: 'B', text: 'is crucial for educational resource accessibility.' },
        { key: 'C', text: 'only serves entertainment purposes.' },
        { key: 'D', text: 'hinders the reading habits of students.' }
      ],
      correctKey: 'B',
      explanation: 'Câu trích đoạn khẳng định Internet đóng vai trò sống còn ("played a vital role") trong giáo dục bằng cách giúp học sinh tiếp cận vô số tài nguyên ("giving students access to countless resources"). Điều này tương thích hoàn toàn với đáp án B: "is crucial for educational resource accessibility" (quan trọng cho việc tiếp cận tài liệu giáo dục).'
    }
  ],
  History: [
    {
      id: 'QH1',
      subject: 'History',
      question: 'Chiến thắng quân sự nào của quân dân Việt Nam đã đập tan hoàn toàn kế hoạch Navarre của thực dân Pháp, xoay chuyển cục diện chiến tranh Đông Dương và buộc Pháp ký Hiệp định Giơ-ne-vơ năm 1954?',
      options: [
        { key: 'A', text: 'Chiến dịch Việt Bắc thu - đông (1947)' },
        { key: 'B', text: 'Chiến dịch Biên giới thu - đông (1950)' },
        { key: 'C', text: 'Chiến dịch lịch sử Điện Biên Phủ (1954)' },
        { key: 'D', text: 'Cuộc tổng tiến công và nổi dậy Tết Mậu Thân (1968)' }
      ],
      correctKey: 'C',
      explanation: 'Chiến dịch Điện Biên Phủ (kéo dài 56 ngày đêm từ 13/3 đến 7/5/1954) giành thắng lợi vẻ vang, đập tan tập đoàn cứ điểm mạnh nhất của thực dân Pháp tại Đông Dương, kết liễu hoàn toàn kế hoạch Navarre. Đây là thắng lợi quân sự quyết định xoay chuyển cục diện chiến tranh, tạo tiền đề ngoại giao buộc Pháp ký Hiệp định Giơ-ne-vơ lập lại hòa bình ở Đông Dương. Chọn C.'
    },
    {
      id: 'QH2',
      subject: 'History',
      question: 'Tại Hội nghị hợp nhất thành lập Đảng Cộng sản Việt Nam (đầu năm 1930) do Nguyễn Ái Quốc chủ trì, ba tổ chức cộng sản nào đã được thống nhất thành một đảng duy nhất?',
      options: [
        { key: 'A', text: 'Đông Dương Cộng sản đảng, An Nam Cộng sản đảng, Đông Dương Cộng sản Liên đoàn' },
        { key: 'B', text: 'Hội Việt Nam Cách mạng Thanh niên, Tân Việt Cách mạng đảng, Việt Nam Quốc dân đảng' },
        { key: 'C', text: 'Đông Dương Cộng sản đảng, Hội Việt Nam Cách mạng Thanh niên, An Nam Cộng sản đảng' },
        { key: 'D', text: 'Đông Dương Cộng sản đảng, An Nam Cộng sản đảng và Đông Dương Cộng sản Liên đoàn (gia nhập sau)' }
      ],
      correctKey: 'A',
      explanation: 'Hội nghị hợp nhất đầu năm 1930 đã thống nhất Đông Dương Cộng sản đảng và An Nam Cộng sản đảng thành Đảng Cộng sản Việt Nam. Sau đó ít lâu, ngày 24/2/1930, Đông Dương Cộng sản Liên đoàn nộp đơn xin gia nhập và chính thức được chấp thuận. Vì vậy, về tiến trình và lịch sử, cả ba tổ chức cộng sản ở Việt Nam đều được quy tụ thống nhất vào Đảng Cộng sản Việt Nam. Chọn A.'
    },
    {
      id: 'QH3',
      subject: 'History',
      question: 'Phong trào cách mạng đầu tiên do Đảng Cộng sản Việt Nam lãnh đạo ngay sau khi ra đời là phong trào cách mạng nào?',
      options: [
        { key: 'A', text: 'Phong trào cách mạng 1930 - 1931 với đỉnh cao Xô viết Nghệ - Tĩnh' },
        { key: 'B', text: 'Phong trào dân chủ 1936 - 1939' },
        { key: 'C', text: 'Phong trào giải phóng dân tộc 1939 - 1945' },
        { key: 'D', text: 'Phong trào đấu tranh bảo vệ chính quyền cách mạng 1945 - 1946' }
      ],
      correctKey: 'A',
      explanation: 'Ngay sau khi thành lập vào đầu năm 1930, Đảng Cộng sản Việt Nam đã lãnh đạo phong trào cách mạng 1930-1931, đỉnh cao là các Xô viết ở Nghệ An và Hà Tĩnh (Xô viết Nghệ - Tĩnh). Đây là đợt diễn tập đầu tiên chuẩn bị cho Cách mạng tháng Tám. Chọn A.'
    },
    {
      id: 'QH4',
      subject: 'History',
      question: 'Sự kiện lịch sử nào đánh dấu bước ngoặt quyết định của cách mạng Việt Nam, mở ra kỷ nguyên mới: Kỷ nguyên độc lập, tự do và đi lên chủ nghĩa xã hội?',
      options: [
        { key: 'A', text: 'Thành lập Đảng Cộng sản Việt Nam năm 1930' },
        { key: 'B', text: 'Cách mạng tháng Tám năm 1945 thành công và khai sinh nước VNDCCH' },
        { key: 'C', text: 'Chiến thắng chiến dịch lịch sử Điện Biên Phủ năm 1954' },
        { key: 'D', text: 'Đại thắng mùa Xuân năm 1975 giải phóng hoàn toàn miền Nam' }
      ],
      correctKey: 'B',
      explanation: 'Thành công của Cách mạng tháng Tám năm 1945, dẫn tới việc Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập ngày 2/9/1945 khai sinh nước Việt Nam Dân chủ Cộng hòa, đã đánh đổ ách thống trị của thực dân Pháp và phát xít Nhật, xóa bỏ chế độ phong kiến lỗi thời. Sự kiện vĩ đại này mở ra kỷ nguyên mới độc lập, tự do cho dân tộc Việt Nam. Chọn B.'
    },
    {
      id: 'QH5',
      subject: 'History',
      question: 'Hiến chương Liên Hợp Quốc chính thức có hiệu lực vào ngày 24/10/1945. Đây là văn kiện nền tảng được thông qua chính thức tại hội nghị quốc tế nào?',
      options: [
        { key: 'A', text: 'Hội nghị Y-an-ta (Yalta)' },
        { key: 'B', text: 'Hội nghị Xan Phran-xi-cô (San Francisco)' },
        { key: 'C', text: 'Hội nghị Pốt-đam (Potsdam)' },
        { key: 'D', text: 'Hội nghị Véc-xai (Versailles)' }
      ],
      correctKey: 'B',
      explanation: 'Hiến chương Liên Hợp Quốc được thông qua bởi đại biểu của 50 quốc gia tham dự Hội nghị Xan Phran-xi-cô (Mỹ) diễn ra từ ngày 25/4 đến ngày 26/6/1945, và sau đó chính thức có hiệu lực vào ngày 24/10/1945. Chọn B.'
    }
  ],
  Geography: [
    {
      id: 'QG1',
      subject: 'Geography',
      question: 'Đặc điểm nổi bật nào sau đây đúng với cấu trúc địa hình vùng núi Đông Bắc nước ta?',
      options: [
        { key: 'A', text: 'Là vùng địa hình núi cao đồ sộ và hiểm trở nhất nước ta.' },
        { key: 'B', text: 'Gồm bốn cánh cung núi lớn chụm đầu lại ở ngọn núi Tam Đảo.' },
        { key: 'C', text: 'Địa hình có hướng chạy chủ yếu là tây bắc - đông nam.' },
        { key: 'D', text: 'Địa hình gồm các dãy núi chạy song song và so le nhau theo hướng tây-đông.' }
      ],
      correctKey: 'B',
      explanation: 'Vùng núi Đông Bắc nổi bật với địa hình đồi núi thấp chiếm ưu thế và cấu trúc địa hình hướng vòng cung với 4 cánh cung núi lớn chạy từ tây sang đông: Sông Gâm, Ngân Sơn, Bắc Sơn, Đông Triều quy tụ chụm đầu ở Tam Đảo. Hướng tây bắc - đông nam là hướng của vùng núi Tây Bắc. Vùng núi cao nhất nước ta cũng là Tây Bắc (dãy Hoàng Liên Sơn). Chọn B.'
    },
    {
      id: 'QG2',
      subject: 'Geography',
      question: 'Quá trình đô thị hóa ở nước ta hiện nay có đặc điểm nổi bật nào dưới đây?',
      options: [
        { key: 'A', text: 'Tốc độ đô thị hóa diễn ra rất nhanh và trình độ đô thị hóa đã ở mức cao.' },
        { key: 'B', text: 'Tỷ lệ dân cư sinh sống ở thành thị có xu hướng giảm liên tục.' },
        { key: 'C', text: 'Trình độ đô thị hóa còn thấp nhưng tốc độ đô thị hóa đang tiến triển nhanh.' },
        { key: 'D', text: 'Mạng lưới đô thị phân bố đồng đều giữa các vùng địa lý.' }
      ],
      correctKey: 'C',
      explanation: 'Đô thị hóa ở Việt Nam hiện nay có đặc trưng: Trình độ đô thị hóa còn thấp so với thế giới (hạ tầng xã hội, giao thông và công trình công cộng chưa phát triển hoàn chỉnh), tuy nhiên tốc độ đô thị hóa đang diễn ra khá nhanh cùng sự gia tăng số lượng đô thị và quy mô dân số thành thị. Chọn C.'
    },
    {
      id: 'QG3',
      subject: 'Geography',
      question: 'Đồng bằng nào sau đây là vùng trọng điểm sản xuất lương thực (đặc biệt là trồng lúa gạo) lớn nhất nước ta hiện nay?',
      options: [
        { key: 'A', text: 'Đồng bằng sông Hồng' },
        { key: 'B', text: 'Đồng bằng sông Cửu Long' },
        { key: 'C', text: 'Đồng bằng duyên hải miền Trung' },
        { key: 'D', text: 'Đồng bằng Thanh Hóa' }
      ],
      correctKey: 'B',
      explanation: 'Đồng bằng sông Cửu Long là vùng sản xuất lương thực thực phẩm lớn nhất cả nước, đóng góp trên 50% sản lượng lúa toàn quốc và trên 90% sản lượng gạo xuất khẩu của Việt Nam. Đồng bằng sông Hồng đứng vị trí thứ hai. Chọn B.'
    },
    {
      id: 'QG4',
      subject: 'Geography',
      question: 'Khó khăn lớn nhất về mặt tự nhiên ảnh hưởng trực tiếp đến việc sản xuất cây công nghiệp lâu năm ở vùng Tây Nguyên là:',
      options: [
        { key: 'A', text: 'Địa hình đồi núi chia cắt mạnh gây ra lũ quét và xói mòn đất.' },
        { key: 'B', text: 'Mùa khô kéo dài sâu sắc dẫn đến tình trạng thiếu nước tưới nghiêm trọng.' },
        { key: 'C', text: 'Thường xuyên gánh chịu hậu quả nặng nề từ các cơn bão nhiệt đới.' },
        { key: 'D', text: 'Đất đai chủ yếu là đất feralit bị bạc màu nhanh chóng.' }
      ],
      correctKey: 'B',
      explanation: 'Khí hậu Tây Nguyên phân hóa thành hai mùa mưa - khô rõ rệt. Mùa khô kéo dài sâu sắc (từ tháng 11 đến tháng 4 năm sau) gây bốc hơi mạnh và mực nước ngầm sụt giảm, dẫn tới thiếu hụt nguồn nước nghiêm trọng cho đời sống và tưới tiêu nông nghiệp, đặc biệt cho các vùng trồng cà phê, hồ tiêu. Chọn B.'
    },
    {
      id: 'QG5',
      subject: 'Geography',
      question: 'Biển Đông có tác động sâu sắc đến khí hậu nước ta, làm giảm tính chất khắc nghiệt và mang lại cho khí hậu Việt Nam đặc tính chủ đạo nào?',
      options: [
        { key: 'A', text: 'Mang đặc tính chất khô hạn nóng bức giống sa mạc.' },
        { key: 'B', text: 'Mang đặc tính nhiệt đới ẩm gió mùa, điều hòa và lượng mưa dồi dào hơn.' },
        { key: 'C', text: 'Khí hậu ôn đới lạnh giá quanh năm.' },
        { key: 'D', text: 'Tạo ra kiểu thời tiết cực đoan khô hanh lục địa.' }
      ],
      correctKey: 'B',
      explanation: 'Nhờ có Biển Đông ôm trọn phía đông và nam, các khối khí di chuyển qua biển được nhận thêm một lượng nhiệt ẩm dồi dào. Nhờ đó, khí hậu nước ta không bị khô hạn như các khu vực khác cùng vĩ độ ở Tây Á hay Bắc Phi, mà mang tính chất hải dương điều hòa, ẩm ướt với lượng mưa lớn. Chọn B.'
    }
  ],
  Literature: [
    {
      id: 'QL1',
      subject: 'Literature',
      question: 'Đọc đoạn thơ sau: <br/><i>"Dốc lên khúc khuỷu dốc thăm thẳm<br/>Heo hút cồn mây, súng ngửi trời<br/>Ngàn thước lên cao, ngàn thước xuống<br/>Nhà ai Pha Luông mưa xa khơi"</i><br/>Đoạn thơ trên được trích trong bài thơ nào và của nhà thơ nào?',
      options: [
        { key: 'A', text: 'Bài thơ <i>"Đồng chí"</i> - Nhà thơ Chính Hữu' },
        { key: 'B', text: 'Bài thơ <i>"Tây Tiến"</i> - Nhà thơ Quang Dũng' },
        { key: 'C', text: 'Bài thơ <i>"Việt Bắc"</i> - Nhà thơ Tố Hữu' },
        { key: 'D', text: 'Bài thơ <i>"Đất Nước"</i> - Nhà thơ Nguyễn Khoa Điềm' }
      ],
      correctKey: 'B',
      explanation: 'Đoạn thơ trên trích từ tác phẩm <i>"Tây Tiến"</i> của nhà thơ Quang Dũng, sáng tác năm 1948 tại Phù Lưu Chanh. Những câu thơ vẽ nên bức tranh thiên nhiên miền Tây Bắc hiểm trở, heo hút nhưng vô cùng kỳ vĩ và lãng mạn, phản ánh chặng đường hành quân gian khổ của những người lính Tây Tiến hào hoa. Chọn B.'
    },
    {
      id: 'QL2',
      subject: 'Literature',
      question: 'Trong truyện ngắn <i>"Vợ Nhặt"</i> của nhà văn Kim Lân, hình ảnh "lá cờ đỏ bay phấp phới" xuất hiện trong tâm trí nhân vật Tràng ở cuối tác phẩm thể hiện thông điệp nghệ thuật gì?',
      options: [
        { key: 'A', text: 'Sự bế tắc, tuyệt vọng của người nông dân trước nạn đói thê thảm năm 1945.' },
        { key: 'B', text: 'Niềm tin, khát vọng sống và định hướng cách mạng giải phóng số phận con người.' },
        { key: 'C', text: 'Sự oán hận giai cấp phong kiến địa chủ bóc lột sức lao động.' },
        { key: 'D', text: 'Nỗi nhớ da diết về quê hương và những ngày tháng bình yên cũ.' }
      ],
      correctKey: 'B',
      explanation: 'Hình ảnh lá cờ đỏ của Việt Minh xuất hiện cuối truyện ngắn <i>"Vợ Nhặt"</i> biểu trưng cho tương lai tươi sáng và sự đổi đời của người nông dân nghèo khổ. Nó nhen nhóm niềm tin và định hướng hành động cách mạng (cướp kho thóc Nhật) để tự cứu sống bản thân và gia đình. Chọn B.'
    },
    {
      id: 'QL3',
      subject: 'Literature',
      question: 'Nhân vật nghệ sĩ Phùng trong truyện ngắn <i>"Chiếc thuyền ngoài xa"</i> của Nguyễn Minh Châu đã ngộ ra chân lý nghệ thuật và cuộc sống nào sau khi chứng kiến bi kịch của gia đình người đàn bà hàng chài?',
      options: [
        { key: 'A', text: 'Nghệ thuật chỉ cần hướng tới cái đẹp hoàn mỹ bên ngoài là đủ.' },
        { key: 'B', text: 'Nghệ sĩ phải nhìn nhận cuộc đời và con người một cách đa diện, đa chiều; không thể vội vã đánh giá sự việc qua vẻ bề ngoài.' },
        { key: 'C', text: 'Tránh xa những mâu thuẫn phức tạp của cuộc sống thực tế để giữ cho tâm hồn nghệ sĩ trong sạch.' },
        { key: 'D', text: 'Các bức ảnh chụp đen trắng luôn giàu giá trị nghệ thuật hơn ảnh màu.' }
      ],
      correctKey: 'B',
      explanation: 'Sau những phát hiện nghịch lý tại bãi biển (cảnh chiếc thuyền thơ mộng trong sương đối lập với cảnh bạo lực gia đình ngay sau đó), Phùng nhận ra rằng cuộc sống vốn chứa đựng nhiều góc khuất phức tạp. Người nghệ sĩ không thể đơn giản hóa hiện thực hay nhìn đời bằng lăng kính lãng mạn một chiều, mà phải đi sâu tìm hiểu bản chất đa diện của con người và cuộc đời. Chọn B.'
    },
    {
      id: 'QL4',
      subject: 'Literature',
      question: 'Nhận định nào sau đây phác họa chính xác nhất phong cách nghệ thuật thơ của Xuân Quỳnh thể hiện qua bài thơ <i>"Sóng"</i>?',
      options: [
        { key: 'A', text: 'Giọng thơ hào hoa, bay bổng mang đậm màu sắc bi tráng của thời kỳ kháng chiến.' },
        { key: 'B', text: 'Giọng thơ triết lý sâu sắc, giàu tính suy tưởng về cội nguồn của tự nhiên.' },
        { key: 'C', text: 'Tiếng lòng tha thiết yêu thương của một tâm hồn phụ nữ hồn nhiên, chân thành, giàu lòng vị tha nhưng cũng đầy lo âu phấp phỏng.' },
        { key: 'D', text: 'Giọng thơ trữ tình chính trị, đậm đà tính dân tộc và ngọt ngào sâu lắng.' }
      ],
      correctKey: 'C',
      explanation: 'Thơ tình Xuân Quỳnh nói chung và bài thơ <i>"Sóng"</i> nói riêng là tiếng lòng vô cùng chân thành, đắm thắm của người phụ nữ khi yêu. Ở đó có sự tự nguyện hiến dâng, khát vọng thủy chung son sắt đi kèm với những lo âu, nhạy cảm trước sự hữu hạn của đời người và tình yêu. Chọn C.'
    },
    {
      id: 'QL5',
      subject: 'Literature',
      question: 'Trong tùy bút <i>"Người lái đò Sông Đà"</i> của Nguyễn Tuân, dòng sông Đà được khắc họa qua hai tính cách đối lập, độc đáo nào?',
      options: [
        { key: 'A', text: 'Dòng nước nông cạn bình yên và mùa lũ đục ngầu phù sa.' },
        { key: 'B', text: 'Hung bạo, dữ dằn như kẻ thù số một và trữ tình, gợi cảm như một cố nhân.' },
        { key: 'C', text: 'Dòng chảy êm đềm ở thượng nguồn và thác ghềnh cuồn cuộn ở hạ lưu.' },
        { key: 'D', text: 'Màu nước xanh ngọc bích mùa xuân và đỏ lừ mùa thu.' }
      ],
      correctKey: 'B',
      explanation: 'Nguyễn Tuân đã biến dòng sông Đà vô tri thành một sinh thể có cá tính mạnh mẽ với hai nét tính cách đối lập song hành: một mặt là "hung bạo" với thác đá, trùng vây thạch trận đe dọa con người; mặt khác lại cực kỳ "trữ tình", dịu dàng như một áng tóc trữ tình tuôn dài, nước sông đổi màu theo mùa đầy gợi cảm. Chọn B.'
    }
  ]
};

// Assemble sequential block exams
export const SYSTEM_BLOCK_EXAMS = [
  {
    id: 'SYS_A00_01',
    block: 'A00',
    title: 'Đề thi thử liên môn Khối A00 (Toán - Lý - Hóa) - Đề số 1',
    duration: 45, // Simulation duration in minutes
    questions: [
      ...QUESTIONS.Math,
      ...QUESTIONS.Physics,
      ...QUESTIONS.Chemistry
    ]
  },
  {
    id: 'SYS_A01_01',
    block: 'A01',
    title: 'Đề thi thử liên môn Khối A01 (Toán - Lý - Anh) - Đề số 1',
    duration: 45,
    questions: [
      ...QUESTIONS.Math,
      ...QUESTIONS.Physics,
      ...QUESTIONS.English
    ]
  },
  {
    id: 'SYS_B00_01',
    block: 'B00',
    title: 'Đề thi thử liên môn Khối B00 (Toán - Hóa - Sinh) - Đề số 1',
    duration: 45,
    questions: [
      ...QUESTIONS.Math,
      ...QUESTIONS.Chemistry,
      ...QUESTIONS.Biology
    ]
  },
  {
    id: 'SYS_C00_01',
    block: 'C00',
    title: 'Đề thi thử liên môn Khối C00 (Văn - Sử - Địa) - Đề số 1',
    duration: 45,
    questions: [
      ...QUESTIONS.Literature,
      ...QUESTIONS.History,
      ...QUESTIONS.Geography
    ]
  },
  {
    id: 'SYS_D01_01',
    block: 'D01',
    title: 'Đề thi thử liên môn Khối D01 (Toán - Văn - Anh) - Đề số 1',
    duration: 45,
    questions: [
      ...QUESTIONS.Math,
      ...QUESTIONS.Literature,
      ...QUESTIONS.English
    ]
  }
];

export const INITIAL_MOCK_EXAM_HISTORY = [
  {
    id: 'MEH001',
    studentId: 'HS001',
    studentName: 'Nguyễn Hoàng Nam',
    class: '12A1',
    block: 'A00',
    title: 'Đề thi thử liên môn Khối A00 (Toán - Lý - Hóa) - Đề số 1',
    score: 8.0,
    totalQuestions: 15,
    correctAnswers: 12,
    timeSpent: '35:40',
    date: '2026-06-01',
    subjectBreakdown: {
      Math: { correct: 4, total: 5 },
      Physics: { correct: 4, total: 5 },
      Chemistry: { correct: 4, total: 5 }
    },
    selectedAnswers: {
      'QM1': 'A', 'QM2': 'B', 'QM3': 'A', 'QM4': 'A', 'QM5': 'B',
      'QP1': 'A', 'QP2': 'C', 'QP3': 'A', 'QP4': 'B', 'QP5': 'B',
      'QC1': 'B', 'QC2': 'A', 'QC3': 'C', 'QC4': 'C', 'QC5': 'A'
    }
  },
  {
    id: 'MEH002',
    studentId: 'HS001',
    studentName: 'Nguyễn Hoàng Nam',
    class: '12A1',
    block: 'A01',
    title: 'Đề thi thử liên môn Khối A01 (Toán - Lý - Anh) - Đề số 1',
    score: 9.3,
    totalQuestions: 15,
    correctAnswers: 14,
    timeSpent: '28:15',
    date: '2026-06-02',
    subjectBreakdown: {
      Math: { correct: 5, total: 5 },
      Physics: { correct: 4, total: 5 },
      English: { correct: 5, total: 5 }
    },
    selectedAnswers: {
      'QM1': 'A', 'QM2': 'B', 'QM3': 'A', 'QM4': 'A', 'QM5': 'A',
      'QP1': 'A', 'QP2': 'C', 'QP3': 'A', 'QP4': 'B', 'QP5': 'B',
      'QE1': 'C', 'QE2': 'C', 'QE3': 'C', 'QE4': 'B', 'QE5': 'B'
    }
  },
  {
    id: 'MEH003',
    studentId: 'HS002',
    studentName: 'Lê Mai Chi',
    class: '12A1',
    block: 'D01',
    title: 'Đề thi thử liên môn Khối D01 (Toán - Văn - Anh) - Đề số 1',
    score: 8.7,
    totalQuestions: 15,
    correctAnswers: 13,
    timeSpent: '42:10',
    date: '2026-06-02',
    subjectBreakdown: {
      Math: { correct: 5, total: 5 },
      Literature: { correct: 4, total: 5 },
      English: { correct: 4, total: 5 }
    },
    selectedAnswers: {
      'QM1': 'A', 'QM2': 'B', 'QM3': 'A', 'QM4': 'A', 'QM5': 'A',
      'QL1': 'B', 'QL2': 'B', 'QL3': 'B', 'QL4': 'C', 'QL5': 'C',
      'QE1': 'C', 'QE2': 'C', 'QE3': 'C', 'QE4': 'A', 'QE5': 'B'
    }
  },
  {
    id: 'MEH004',
    studentId: 'HS003',
    studentName: 'Phan Minh Triết',
    class: '12A1',
    block: 'B00',
    title: 'Đề thi thử liên môn Khối B00 (Toán - Hóa - Sinh) - Đề số 1',
    score: 6.7,
    totalQuestions: 15,
    correctAnswers: 10,
    timeSpent: '38:50',
    date: '2026-06-03',
    subjectBreakdown: {
      Math: { correct: 3, total: 5 },
      Chemistry: { correct: 4, total: 5 },
      Biology: { correct: 3, total: 5 }
    },
    selectedAnswers: {
      'QM1': 'A', 'QM2': 'C', 'QM3': 'A', 'QM4': 'B', 'QM5': 'A',
      'QC1': 'B', 'QC2': 'A', 'QC3': 'C', 'QC4': 'C', 'QC5': 'A',
      'QB1': 'B', 'QB2': 'B', 'QB3': 'C', 'QB4': 'B', 'QB5': 'B'
    }
  },
  {
    id: 'MEH005',
    studentId: 'HS004',
    studentName: 'Lê Minh Đăng',
    class: '12A2',
    block: 'A00',
    title: 'Đề thi thử liên môn Khối A00 (Toán - Lý - Hóa) - Đề số 1',
    score: 8.0,
    totalQuestions: 15,
    correctAnswers: 12,
    timeSpent: '31:22',
    date: '2026-06-03',
    subjectBreakdown: {
      Math: { correct: 4, total: 5 },
      Physics: { correct: 4, total: 5 },
      Chemistry: { correct: 4, total: 5 }
    },
    selectedAnswers: {
      'QM1': 'A', 'QM2': 'B', 'QM3': 'A', 'QM4': 'A', 'QM5': 'B',
      'QP1': 'A', 'QP2': 'C', 'QP3': 'A', 'QP4': 'B', 'QP5': 'B',
      'QC1': 'B', 'QC2': 'A', 'QC3': 'C', 'QC4': 'C', 'QC5': 'A'
    }
  }
];
