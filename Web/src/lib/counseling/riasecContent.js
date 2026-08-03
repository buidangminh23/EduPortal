/**
 * Content for the RIASEC (Holland) career interest inventory.
 *
 * Kept apart from `riasec.js` so the scoring maths can be read and tested
 * without scrolling past several hundred lines of Vietnamese copy.
 */

/** Questions per trait. Four is the smallest count that still averages out a
 *  single misread item, which a one-question-per-trait survey cannot do. */
export const QUESTIONS_PER_TRAIT = 4;

/** Highest value on the answer scale shown to the student. */
export const MAX_ANSWER = 5;

/**
 * Trait scores are published on a 0–10 scale.
 *
 * `AiAdvisorTab` already writes 0–10 into `careerTestScores` and the radar
 * charts, the university matchmaker and the principal report all read that same
 * row, so anything written here has to speak the same scale or those screens
 * silently render half-height polygons.
 */
export const MAX_TRAIT_SCORE = 10;

export const TRAIT_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];

export const RIASEC_TRAITS = {
  R: {
    key: 'R',
    name: 'Kỹ thuật',
    english: 'Realistic',
    emoji: '🔧',
    color: '#0ea5e9',
    summary: 'Học qua tay: thích chạm vào, tháo ra, lắp lại và nhìn thấy kết quả cụ thể.',
    strengths: 'Tư duy thực hành, khéo tay, bền bỉ với việc cần độ chính xác vật lý.',
    watchOut: 'Dễ ngại các môn nặng lý thuyết thuần tuý hoặc công việc bàn giấy kéo dài.'
  },
  I: {
    key: 'I',
    name: 'Nghiên cứu',
    english: 'Investigative',
    emoji: '🔬',
    color: '#6366f1',
    summary: 'Bị cuốn bởi câu hỏi "tại sao": quan sát, đặt giả thuyết, kiểm chứng bằng dữ liệu.',
    strengths: 'Tư duy logic, kiên nhẫn với bài khó, làm việc độc lập tốt.',
    watchOut: 'Dễ sa đà vào chi tiết và trì hoãn quyết định vì "chưa đủ dữ liệu".'
  },
  A: {
    key: 'A',
    name: 'Nghệ thuật',
    english: 'Artistic',
    emoji: '🎨',
    color: '#ec4899',
    summary: 'Cần không gian để làm theo cách riêng, diễn đạt ý tưởng bằng hình ảnh, chữ hoặc âm thanh.',
    strengths: 'Sáng tạo, nhạy cảm thẩm mỹ, nhìn ra góc nhìn mà người khác bỏ qua.',
    watchOut: 'Khó chịu với quy trình cứng nhắc; cần rèn kỷ luật thời hạn.'
  },
  S: {
    key: 'S',
    name: 'Xã hội',
    english: 'Social',
    emoji: '🤝',
    color: '#22c55e',
    summary: 'Nạp năng lượng từ việc giúp người khác hiểu ra, khá lên và thấy được lắng nghe.',
    strengths: 'Đồng cảm, giao tiếp, giữ nhóm gắn kết.',
    watchOut: 'Dễ nhận quá nhiều việc của người khác rồi bỏ quên nhu cầu của mình.'
  },
  E: {
    key: 'E',
    name: 'Quản lý',
    english: 'Enterprising',
    emoji: '🚀',
    color: '#f59e0b',
    summary: 'Thích khởi xướng, thuyết phục, dẫn dắt và chịu trách nhiệm về kết quả.',
    strengths: 'Quyết đoán, đàm phán, biến ý tưởng thành kế hoạch có người theo.',
    watchOut: 'Dễ ôm việc quá sức và nóng ruột với những việc cần thời gian.'
  },
  C: {
    key: 'C',
    name: 'Nghiệp vụ',
    english: 'Conventional',
    emoji: '📊',
    color: '#8b5cf6',
    summary: 'Thấy dễ chịu khi mọi thứ có quy trình, số liệu khớp và hồ sơ ngăn nắp.',
    strengths: 'Cẩn thận, đáng tin, phát hiện sai sót mà người khác lướt qua.',
    watchOut: 'Dễ căng thẳng khi kế hoạch bị thay đổi đột ngột.'
  }
};

/** Labels for the 1–5 answer scale, shown on hover and read by screen readers. */
export const ANSWER_LABELS = {
  1: 'Không thích',
  2: 'Ít thích',
  3: 'Bình thường',
  4: 'Thích',
  5: 'Rất thích'
};

/**
 * The inventory itself: 24 statements, four per trait, interleaved so the
 * student cannot guess which trait a block of questions is measuring and answer
 * to a pattern.
 */
export const RIASEC_QUESTIONS = [
  { id: 'q01', trait: 'R', text: 'Tự tay sửa xe đạp, thay bóng đèn, lắp ráp đồ đạc trong nhà.' },
  { id: 'q02', trait: 'I', text: 'Ngồi lì với một bài toán khó cho đến khi tìm ra lời giải.' },
  { id: 'q03', trait: 'A', text: 'Vẽ, thiết kế, dựng video hoặc chỉnh ảnh theo ý tưởng của riêng mình.' },
  { id: 'q04', trait: 'S', text: 'Giảng lại bài cho bạn cho đến khi bạn thật sự hiểu.' },
  { id: 'q05', trait: 'E', text: 'Nhận làm nhóm trưởng, chia việc và chịu trách nhiệm kết quả chung.' },
  { id: 'q06', trait: 'C', text: 'Ghi chép, sắp xếp tài liệu và giữ mọi thứ đúng chỗ của nó.' },

  { id: 'q07', trait: 'R', text: 'Học trong phòng thí nghiệm hoặc xưởng thực hành hơn là ngồi nghe lý thuyết.' },
  { id: 'q08', trait: 'I', text: 'Tìm hiểu vì sao một hiện tượng lại xảy ra, dù không có trong bài kiểm tra.' },
  { id: 'q09', trait: 'A', text: 'Viết truyện, làm thơ, viết kịch bản hoặc sáng tác nhạc.' },
  { id: 'q10', trait: 'S', text: 'Ngồi nghe một người bạn kể chuyện buồn mà không thấy mệt.' },
  { id: 'q11', trait: 'E', text: 'Thuyết phục người khác đồng ý với ý tưởng của mình.' },
  { id: 'q12', trait: 'C', text: 'Làm theo một quy trình rõ ràng, chính xác từng bước.' },

  { id: 'q13', trait: 'R', text: 'Chế tạo mô hình, robot, drone hoặc lắp mạch điện tử.' },
  { id: 'q14', trait: 'I', text: 'Thiết kế thí nghiệm, thu thập số liệu rồi rút ra kết luận.' },
  { id: 'q15', trait: 'A', text: 'Biểu diễn trước đám đông: hát, nhảy, diễn kịch hoặc dẫn chương trình.' },
  { id: 'q16', trait: 'S', text: 'Tham gia tình nguyện, hoạt động vì cộng đồng.' },
  { id: 'q17', trait: 'E', text: 'Tổ chức sự kiện, chiến dịch hoặc gian hàng gây quỹ của lớp.' },
  { id: 'q18', trait: 'C', text: 'Giữ sổ quỹ lớp, theo dõi thu chi và thống kê số liệu.' },

  { id: 'q19', trait: 'R', text: 'Làm việc cần vận động và sự khéo léo của đôi tay hơn là ngồi bàn giấy.' },
  { id: 'q20', trait: 'I', text: 'Tranh luận dựa trên bằng chứng và phản biện bằng logic.' },
  { id: 'q21', trait: 'A', text: 'Được tự do làm theo cách riêng thay vì đi theo khuôn mẫu có sẵn.' },
  { id: 'q22', trait: 'S', text: 'Làm việc nhóm và gắn kết mọi người lại với nhau.' },
  { id: 'q23', trait: 'E', text: 'Kinh doanh nhỏ, tính toán lời lãi, tìm cách bán được hàng.' },
  { id: 'q24', trait: 'C', text: 'Kiểm tra lại số liệu nhiều lần để chắc chắn không có sai sót.' }
];

/**
 * Career guidance keyed by the two dominant traits, order-insensitive.
 *
 * Fifteen unordered pairs cover every possible top-two result, so no student
 * ever lands on a generic "nhiều ngành đa dạng" answer the way the old
 * eight-entry lookup did.
 */
export const CAREER_PAIRS = {
  RI: {
    label: 'Kỹ thuật – Nghiên cứu',
    majors: ['Kỹ thuật Cơ điện tử', 'Kỹ thuật Điều khiển & Tự động hoá', 'Kỹ thuật Ô tô', 'Khoa học Máy tính'],
    jobs: ['Kỹ sư robotics', 'Kỹ sư phần mềm nhúng', 'Kỹ sư R&D', 'Chuyên gia tự động hoá'],
    blocks: ['A00 (Toán–Lý–Hoá)', 'A01 (Toán–Lý–Anh)'],
    unis: ['ĐH Bách khoa Hà Nội', 'ĐH Bách khoa TP.HCM', 'ĐH Công nghệ – ĐHQGHN']
  },
  RA: {
    label: 'Kỹ thuật – Nghệ thuật',
    majors: ['Kiến trúc', 'Thiết kế công nghiệp', 'Thiết kế nội thất', 'Kỹ thuật xây dựng'],
    jobs: ['Kiến trúc sư', 'Nhà thiết kế sản phẩm', 'Chuyên viên dựng hình 3D'],
    blocks: ['V00 (Toán–Lý–Vẽ)', 'H00 (Văn–Vẽ)', 'A01 (Toán–Lý–Anh)'],
    unis: ['ĐH Kiến trúc Hà Nội', 'ĐH Xây dựng', 'ĐH Mỹ thuật Công nghiệp']
  },
  RS: {
    label: 'Kỹ thuật – Xã hội',
    majors: ['Kỹ thuật Y sinh', 'Vật lý trị liệu & Phục hồi chức năng', 'Sư phạm Kỹ thuật', 'Điều dưỡng'],
    jobs: ['Kỹ thuật viên thiết bị y tế', 'Kỹ thuật viên phục hồi chức năng', 'Giáo viên kỹ thuật'],
    blocks: ['B00 (Toán–Hoá–Sinh)', 'A00 (Toán–Lý–Hoá)'],
    unis: ['ĐH Bách khoa Hà Nội (Kỹ thuật Y sinh)', 'ĐH Y Dược TP.HCM', 'ĐH Sư phạm Kỹ thuật']
  },
  RE: {
    label: 'Kỹ thuật – Quản lý',
    majors: ['Logistics & Quản lý chuỗi cung ứng', 'Quản lý công nghiệp', 'Kỹ thuật hệ thống công nghiệp'],
    jobs: ['Quản lý sản xuất', 'Kỹ sư vận hành nhà máy', 'Chuyên viên logistics'],
    blocks: ['A00 (Toán–Lý–Hoá)', 'A01 (Toán–Lý–Anh)', 'D01 (Toán–Văn–Anh)'],
    unis: ['ĐH Bách khoa TP.HCM', 'ĐH Giao thông Vận tải', 'ĐH Ngoại thương (Logistics)']
  },
  RC: {
    label: 'Kỹ thuật – Nghiệp vụ',
    majors: ['Công nghệ Kỹ thuật Điện – Điện tử', 'Kỹ thuật Trắc địa', 'Quản lý chất lượng'],
    jobs: ['Kỹ thuật viên kiểm định', 'Chuyên viên QA/QC', 'Kỹ sư bảo trì hệ thống'],
    blocks: ['A00 (Toán–Lý–Hoá)', 'A01 (Toán–Lý–Anh)'],
    unis: ['ĐH Sư phạm Kỹ thuật', 'ĐH Công nghiệp Hà Nội', 'ĐH Mỏ – Địa chất']
  },
  IA: {
    label: 'Nghiên cứu – Nghệ thuật',
    majors: ['Khoa học Dữ liệu', 'Trí tuệ nhân tạo', 'Truyền thông đa phương tiện', 'Thiết kế trải nghiệm số'],
    jobs: ['Nhà khoa học dữ liệu', 'Nghiên cứu viên AI', 'Chuyên viên UX Research'],
    blocks: ['A01 (Toán–Lý–Anh)', 'D01 (Toán–Văn–Anh)', 'A00 (Toán–Lý–Hoá)'],
    unis: ['ĐH Công nghệ – ĐHQGHN', 'ĐH Bách khoa Hà Nội', 'ĐH FPT']
  },
  IS: {
    label: 'Nghiên cứu – Xã hội',
    majors: ['Y đa khoa', 'Dược học', 'Tâm lý học', 'Công nghệ Sinh học'],
    jobs: ['Bác sĩ', 'Dược sĩ lâm sàng', 'Nhà tâm lý học lâm sàng', 'Nghiên cứu viên y sinh'],
    blocks: ['B00 (Toán–Hoá–Sinh)', 'D01 (Toán–Văn–Anh)'],
    unis: ['ĐH Y Hà Nội', 'ĐH Y Dược TP.HCM', 'ĐH KHXH&NV – ĐHQG (Tâm lý học)']
  },
  IE: {
    label: 'Nghiên cứu – Quản lý',
    majors: ['Khoa học Dữ liệu trong Kinh tế', 'Tài chính định lượng', 'Hệ thống thông tin quản lý'],
    jobs: ['Chuyên viên phân tích dữ liệu kinh doanh', 'Chuyên gia đầu tư định lượng', 'Product Manager mảng công nghệ'],
    blocks: ['A00 (Toán–Lý–Hoá)', 'A01 (Toán–Lý–Anh)', 'D01 (Toán–Văn–Anh)'],
    unis: ['ĐH Kinh tế Quốc dân', 'ĐH Ngoại thương', 'ĐH Kinh tế TP.HCM']
  },
  IC: {
    label: 'Nghiên cứu – Nghiệp vụ',
    majors: ['Toán ứng dụng', 'Thống kê', 'An toàn thông tin', 'Kế toán – Kiểm toán phân tích'],
    jobs: ['Chuyên viên thống kê', 'Kỹ sư an ninh mạng', 'Chuyên viên phân tích rủi ro'],
    blocks: ['A00 (Toán–Lý–Hoá)', 'A01 (Toán–Lý–Anh)'],
    unis: ['ĐH Khoa học Tự nhiên – ĐHQG', 'Học viện Kỹ thuật Mật mã', 'Học viện Tài chính']
  },
  AS: {
    label: 'Nghệ thuật – Xã hội',
    majors: ['Sư phạm Ngữ văn', 'Báo chí', 'Công tác xã hội', 'Thiết kế giáo dục'],
    jobs: ['Giáo viên Ngữ văn', 'Nhà báo', 'Chuyên viên truyền thông cộng đồng', 'Biên tập viên'],
    blocks: ['C00 (Văn–Sử–Địa)', 'D01 (Toán–Văn–Anh)'],
    unis: ['ĐH Sư phạm Hà Nội', 'Học viện Báo chí & Tuyên truyền', 'ĐH KHXH&NV – ĐHQG']
  },
  AE: {
    label: 'Nghệ thuật – Quản lý',
    majors: ['Marketing', 'Truyền thông đa phương tiện', 'Quản trị sự kiện', 'Quan hệ công chúng'],
    jobs: ['Giám đốc sáng tạo', 'Chuyên viên marketing', 'Nhà sản xuất nội dung', 'Quản lý thương hiệu'],
    blocks: ['D01 (Toán–Văn–Anh)', 'C00 (Văn–Sử–Địa)'],
    unis: ['ĐH Ngoại thương', 'ĐH RMIT', 'Học viện Báo chí & Tuyên truyền']
  },
  AC: {
    label: 'Nghệ thuật – Nghiệp vụ',
    majors: ['Thiết kế đồ hoạ', 'Xuất bản', 'Kiến trúc nội thất', 'Biên tập – Biên dịch'],
    jobs: ['Nhà thiết kế đồ hoạ', 'Biên tập viên xuất bản', 'Chuyên viên dàn trang – nhận diện thương hiệu'],
    blocks: ['H00 (Văn–Vẽ)', 'D01 (Toán–Văn–Anh)'],
    unis: ['ĐH Mỹ thuật Công nghiệp', 'ĐH Kiến trúc', 'ĐH Văn hoá Hà Nội']
  },
  SE: {
    label: 'Xã hội – Quản lý',
    majors: ['Quản trị Nhân lực', 'Quản trị Kinh doanh', 'Luật', 'Quan hệ Quốc tế'],
    jobs: ['Quản trị nhân sự', 'Chuyên viên phát triển cộng đồng', 'Luật sư', 'Chuyên viên đối ngoại'],
    blocks: ['D01 (Toán–Văn–Anh)', 'C00 (Văn–Sử–Địa)', 'A01 (Toán–Lý–Anh)'],
    unis: ['ĐH Kinh tế Quốc dân', 'ĐH Luật Hà Nội', 'Học viện Ngoại giao']
  },
  SC: {
    label: 'Xã hội – Nghiệp vụ',
    majors: ['Sư phạm Tiểu học', 'Quản lý giáo dục', 'Hành chính công', 'Điều dưỡng'],
    jobs: ['Giáo viên', 'Chuyên viên hành chính – nhân sự', 'Điều dưỡng viên', 'Quản lý học vụ'],
    blocks: ['D01 (Toán–Văn–Anh)', 'C00 (Văn–Sử–Địa)', 'B00 (Toán–Hoá–Sinh)'],
    unis: ['ĐH Sư phạm Hà Nội', 'Học viện Hành chính Quốc gia', 'ĐH Điều dưỡng Nam Định']
  },
  EC: {
    label: 'Quản lý – Nghiệp vụ',
    majors: ['Tài chính – Ngân hàng', 'Kế toán – Kiểm toán', 'Luật Kinh tế', 'Bảo hiểm'],
    jobs: ['Chuyên viên tài chính', 'Kiểm toán viên', 'Chuyên viên phân tích tín dụng', 'Luật sư doanh nghiệp'],
    blocks: ['A01 (Toán–Lý–Anh)', 'D01 (Toán–Văn–Anh)', 'A00 (Toán–Lý–Hoá)'],
    unis: ['Học viện Tài chính', 'Học viện Ngân hàng', 'ĐH Kinh tế Quốc dân']
  }
};

/** Single-trait fallback, used when a profile is too flat to read a pair from. */
export const CAREER_SINGLE = {
  R: { majors: ['Kỹ thuật Cơ khí', 'Điện – Điện tử'], jobs: ['Kỹ sư cơ khí', 'Kỹ thuật viên điện tử'], blocks: ['A00 (Toán–Lý–Hoá)'] },
  I: { majors: ['Khoa học Máy tính', 'Vật lý học'], jobs: ['Lập trình viên', 'Nghiên cứu viên'], blocks: ['A00 (Toán–Lý–Hoá)', 'A01 (Toán–Lý–Anh)'] },
  A: { majors: ['Thiết kế đồ hoạ', 'Truyền thông đa phương tiện'], jobs: ['Nhà thiết kế', 'Nhà sáng tạo nội dung'], blocks: ['H00 (Văn–Vẽ)', 'D01 (Toán–Văn–Anh)'] },
  S: { majors: ['Sư phạm', 'Tâm lý học'], jobs: ['Giáo viên', 'Chuyên viên tham vấn'], blocks: ['C00 (Văn–Sử–Địa)', 'D01 (Toán–Văn–Anh)'] },
  E: { majors: ['Quản trị Kinh doanh', 'Marketing'], jobs: ['Chuyên viên kinh doanh', 'Quản lý dự án'], blocks: ['D01 (Toán–Văn–Anh)', 'A01 (Toán–Lý–Anh)'] },
  C: { majors: ['Kế toán', 'Hệ thống thông tin quản lý'], jobs: ['Kế toán viên', 'Chuyên viên dữ liệu'], blocks: ['A01 (Toán–Lý–Anh)', 'D01 (Toán–Văn–Anh)'] }
};
