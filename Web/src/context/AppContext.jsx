import { createContext, useState, useEffect } from 'react';
import { INITIAL_MOCK_EXAM_HISTORY } from '../data/mockExamsData';

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();

// Portrait Placeholders using professional Unsplash faces
const initialTeachers = [
  { 
    id: 'T01', 
    name: 'Nguyễn Minh Triết', 
    subject: 'Toán học', 
    email: 'triet.nm@school.edu.vn', 
    phone: '0901234567', 
    classJoined: '12A1',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'T02', 
    name: 'Trần Thị Hồng Vân', 
    subject: 'Ngữ văn', 
    email: 'van.tth@school.edu.vn', 
    phone: '0912345678', 
    classJoined: '12A2',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'T03', 
    name: 'Phạm Đức Duy', 
    subject: 'Vật lý', 
    email: 'duy.pd@school.edu.vn', 
    phone: '0923456789', 
    classJoined: '11A1',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'T04', 
    name: 'Lê Thu Hà', 
    subject: 'Tiếng Anh', 
    email: 'ha.lt@school.edu.vn', 
    phone: '0934567890', 
    classJoined: '10A1',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
];

const initialStudents = [
  { 
    id: 'HS001', 
    name: 'Nguyễn Hoàng Nam', 
    class: '12A1', 
    grade: '12',
    parentName: 'Nguyễn Văn Hùng', 
    parentPhone: '0987654321',
    gradesSem1: { Math: 8.2, Literature: 7.5, Physics: 8.8, English: 8.0 },
    grades: { Math: 8.5, Literature: 7.8, Physics: 9.0, English: 8.2 },
    feeStatus: [
      { id: 'F01', name: 'Học phí tháng 6/2026', amount: 2500000, paid: false, deadline: '2026-06-15' },
      { id: 'F02', name: 'Tiền ăn bán trú tháng 6/2026', amount: 950000, paid: false, deadline: '2026-06-15' },
      { id: 'F03', name: 'Quỹ hội phụ huynh năm học', amount: 300000, paid: true, deadline: '2026-06-05' }
    ],
    parentSignature: null,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'HS002', 
    name: 'Lê Mai Chi', 
    class: '12A1', 
    grade: '12',
    parentName: 'Lê Minh Tuấn', 
    parentPhone: '0976543210',
    gradesSem1: { Math: 9.0, Literature: 8.8, Physics: 8.0, English: 9.5 },
    grades: { Math: 9.5, Literature: 9.0, Physics: 8.5, English: 9.8 },
    feeStatus: [
      { id: 'F01', name: 'Học phí tháng 6/2026', amount: 2500000, paid: true, deadline: '2026-06-15' },
      { id: 'F02', name: 'Tiền ăn bán trú tháng 6/2026', amount: 950000, paid: true, deadline: '2026-06-15' },
      { id: 'F03', name: 'Quỹ hội phụ huynh năm học', amount: 300000, paid: true, deadline: '2026-06-05' }
    ],
    parentSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M10 20 C 30 10, 40 10, 90 20" stroke="blue" fill="transparent"/></svg>',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'HS003', 
    name: 'Phan Minh Triết', 
    class: '12A1', 
    grade: '12',
    parentName: 'Phan Quốc Bảo', 
    parentPhone: '0965432109',
    gradesSem1: { Math: 6.8, Literature: 7.5, Physics: 6.5, English: 7.0 },
    grades: { Math: 7.2, Literature: 8.0, Physics: 6.8, English: 7.5 },
    feeStatus: [
      { id: 'F01', name: 'Học phí tháng 6/2026', amount: 2500000, paid: false, deadline: '2026-06-15' },
      { id: 'F02', name: 'Tiền ăn bán trú tháng 6/2026', amount: 950000, paid: true, deadline: '2026-06-15' },
      { id: 'F03', name: 'Quỹ hội phụ huynh năm học', amount: 300000, paid: false, deadline: '2026-06-05' }
    ],
    parentSignature: null,
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'HS004', 
    name: 'Lê Minh Đăng', 
    class: '12A2', 
    grade: '12',
    parentName: 'Lê Văn Tuấn', 
    parentPhone: '0956789123',
    gradesSem1: { Math: 7.8, Literature: 8.0, Physics: 7.0, English: 7.8 },
    grades: { Math: 8.0, Literature: 8.2, Physics: 7.5, English: 8.0 },
    feeStatus: [
      { id: 'F01', name: 'Học phí tháng 6/2026', amount: 2500000, paid: true, deadline: '2026-06-15' },
      { id: 'F02', name: 'Tiền ăn bán trú tháng 6/2026', amount: 950000, paid: false, deadline: '2026-06-15' }
    ],
    parentSignature: null,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'HS005', 
    name: 'Trần Thị Hương', 
    class: '11A1', 
    grade: '11',
    parentName: 'Trần Đại Nghĩa', 
    parentPhone: '0912345111',
    gradesSem1: { Math: 8.5, Literature: 8.2, Physics: 7.8, English: 8.8 },
    grades: { Math: 8.8, Literature: 8.5, Physics: 8.0, English: 9.0 },
    feeStatus: [
      { id: 'F01', name: 'Học phí tháng 6/2026', amount: 2500000, paid: false, deadline: '2026-06-15' }
    ],
    parentSignature: null,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'HS006', 
    name: 'Phạm Tuấn Anh', 
    class: '10A1', 
    grade: '10',
    parentName: 'Phạm Văn Nam', 
    parentPhone: '0912345000',
    gradesSem1: { Math: 6.0, Literature: 6.5, Physics: 6.8, English: 6.2 },
    grades: { Math: 6.5, Literature: 7.0, Physics: 7.2, English: 6.8 },
    feeStatus: [
      { id: 'F01', name: 'Học phí tháng 6/2026', amount: 2500000, paid: true, deadline: '2026-06-15' }
    ],
    parentSignature: null,
    avatarUrl: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=150&auto=format&fit=crop&q=80'
  }
];

const initialAnnouncements = [
  { id: 'A01', date: '2026-06-02', sender: 'Ban Giám Hiệu', title: 'Kế hoạch thi học kỳ 2 bổ sung và tổng kết năm học', content: 'Ban giám hiệu thông báo kế hoạch ôn tập và kiểm tra bổ sung cho khối 10, 11, 12 bắt đầu từ ngày 08/06. Đề nghị các giáo viên bộ môn lên đề cương chi tiết.' },
  { id: 'A02', date: '2026-06-01', sender: 'GVCN Lớp 12A1', title: 'Thông báo nộp các khoản phí tháng 6 và hoàn thiện hồ sơ thi tốt nghiệp', content: 'Kính gửi quý phụ huynh lớp 12A1, đề nghị phụ huynh kiểm tra các khoản học phí chưa đóng và hoàn tất trước ngày 15/06 để nhà trường chuẩn bị thủ tục thi tốt nghiệp.' }
];

const initialJournalEntries = [
  { id: 'J01', date: '2026-06-01', week: 35, day: 'Thứ Hai', period: 1, subject: 'Toán học', teacher: 'Nguyễn Minh Triết', content: 'Khảo sát và vẽ đồ thị hàm số (Luyện đề số 5)', rating: 'A', comment: 'Lớp trật tự, xây dựng bài tốt. Khen ngợi em Nam phát biểu giải bài khó.', signed: true, signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="20"><text x="5" y="15" fill="purple">Triet</text></svg>', class: '12A1' },
  { id: 'J02', date: '2026-06-01', week: 35, day: 'Thứ Hai', period: 2, subject: 'Ngữ văn', teacher: 'Trần Thị Hồng Vân', content: 'Phân tích nhân vật Mị trong Vợ Chồng A Phủ', rating: 'A', comment: 'Lớp ghi chép bài đầy đủ. Có chuẩn bị bài trước.', signed: true, signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="20"><text x="5" y="15" fill="purple">Van</text></svg>', class: '12A1' },
  { id: 'J03', date: '2026-06-02', week: 35, day: 'Thứ Ba', period: 3, subject: 'Vật lý', teacher: 'Phạm Đức Duy', content: 'Bài tập dòng điện xoay chiều có RLC thay đổi', rating: 'B', comment: 'Lớp còn vài bạn ngủ gật trong giờ (Nam, Triết). Mức độ tiếp thu bài khá.', signed: true, signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="20"><text x="5" y="15" fill="purple">Duy</text></svg>', class: '12A1' }
];

const initialParentQAs = [
  { id: 'Q01', studentName: 'Nguyễn Hoàng Nam', parentName: 'Nguyễn Văn Hùng', question: 'Cô ơi, điểm Ngữ văn kiểm tra 1 tiết vừa rồi của cháu Nam thế nào ạ? Cháu bảo chưa có điểm.', reply: 'Chào anh, bài kiểm tra 1 tiết của Nam vừa rồi đạt 7.8 điểm. Cháu làm bài khá tốt tuy nhiên phần phân tích thơ còn hơi sơ sài. Tôi sẽ gửi bài kiểm tra cho cháu mang về nhé.', status: 'resolved', date: '2026-06-02' },
  { id: 'Q02', studentName: 'Phan Minh Triết', parentName: 'Phan Quốc Bảo', question: 'Mấy hôm nay cháu Triết ở lớp có tập trung học không thầy? Tôi thấy về nhà cháu mải chơi điện thoại quá.', reply: '', status: 'pending', date: '2026-06-03' }
];

const initialVideoLessons = [
  { id: 'V01', title: 'Ôn tập chuyên đề Tích Phân & Ứng Dụng (Toán 12)', subject: 'Toán học', teacher: 'Thầy Nguyễn Minh Triết', duration: '45 phút', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: '⚡' },
  { id: 'V02', title: 'Phân tích giá trị nhân đạo tác phẩm "Vợ nhặt" (Văn 12)', subject: 'Ngữ văn', teacher: 'Cô Trần Thị Hồng Vân', duration: '50 phút', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnail: '📖' },
  { id: 'V03', title: 'Lý thuyết hạt nhân nguyên tử & Phóng xạ (Vật lý 12)', subject: 'Vật lý', teacher: 'Thầy Phạm Đức Duy', duration: '40 phút', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: '⚛️' }
];

const initialTutorChat = [
  { sender: 'tutor', text: 'Xin chào! Mình là Gia sư AI 24/7. Hôm nay bạn cần trợ giúp giải quyết bài toán, câu hỏi khoa học hay bài văn nào? Cứ nhập đề bài vào đây nhé! 📝' }
];

// NEW DATA: Absent / Leave Requests
const initialLeaveRequests = [
  { id: 'L01', studentId: 'HS001', studentName: 'Nguyễn Hoàng Nam', class: '12A1', parentName: 'Nguyễn Văn Hùng', date: '2026-06-04', reason: 'Cháu bị sốt xuất huyết phải nhập viện truyền dịch truyền theo dõi.', status: 'pending' }
];

const initialTeacherLeaveRequests = [
  { id: 'TL01', teacherId: 'T01', teacherName: 'Nguyễn Minh Triết', date: '2026-06-05', reason: 'Tôi đi khám sức khỏe định kỳ tại bệnh viện.', substituteTeacherId: 'T02', substituteTeacherName: 'Trần Thị Hồng Vân', status: 'pending' }
];

// NEW DATA: Lesson plans submitted by teachers
const initialLessonPlans = [
  { id: 'LP01', teacherName: 'Nguyễn Minh Triết', subject: 'Toán học', title: 'Giáo án Ôn tập Tích phân từng phần nâng cao lớp 12', date: '2026-06-02', status: 'pending', feedback: '' },
  { id: 'LP02', teacherName: 'Trần Thị Hồng Vân', subject: 'Ngữ văn', title: 'Giáo án Phân tích tác phẩm Chiếc Thuyền Ngoài Xa', date: '2026-05-28', status: 'approved', feedback: 'Nội dung rất chi tiết, hình ảnh minh họa sinh động.' }
];

// NEW DATA: Student deadlines (school events, exams, personal tasks)
const initialDeadlines = [
  { id: 'DL01', type: 'exam',     title: 'Kiểm tra 1 tiết Toán học',         subject: 'Toán học',  date: '2026-06-12', classTarget: '12A1', desc: 'Chương: Tích phân, Nguyên hàm. Hình thức: Tự luận 45 phút.', priority: 'high',   color: '#ef4444' },
  { id: 'DL02', type: 'exam',     title: 'Kiểm tra Hóa học học kỳ II',       subject: 'Hóa học',   date: '2026-06-15', classTarget: '12A1', desc: 'Ôn toàn bộ chương trình học kỳ II. Hình thức: Trắc nghiệm 60 câu.', priority: 'high',   color: '#f97316' },
  { id: 'DL03', type: 'exam',     title: 'Thi thử THPT Quốc gia đợt 2',      subject: 'Tổng hợp',  date: '2026-06-20', classTarget: '12A1', desc: 'Thi thử 3 môn tổ hợp. Làm bài thi chính thức tại trường.', priority: 'urgent', color: '#dc2626' },
  { id: 'DL04', type: 'event',    title: 'Nộp hồ sơ xét tuyển đại học',      subject: 'Hướng nghiệp', date: '2026-06-30', classTarget: '12A1', desc: 'Hạn chót nộp hồ sơ nguyện vọng qua cổng VNPT. Chuẩn bị đầy đủ học bạ.', priority: 'urgent', color: '#7c3aed' },
  { id: 'DL05', type: 'event',    title: 'Ngày hội hướng nghiệp 2026',       subject: 'Hướng nghiệp', date: '2026-06-17', classTarget: '12A1', desc: 'Tham quan các gian hàng trường đại học, nghe tư vấn ngành nghề.', priority: 'medium', color: '#0891b2' },
  { id: 'DL06', type: 'event',    title: 'Lễ trưởng thành khối 12',          subject: 'Sự kiện',    date: '2026-06-25', classTarget: '12A1', desc: 'Lễ tri ân thầy cô và trưởng thành cho học sinh lớp 12. Đồng phục áo dài trắng.', priority: 'medium', color: '#059669' },
  { id: 'DL07', type: 'homework', title: 'Nộp bài Luyện đề Toán số 6',       subject: 'Toán học',   date: '2026-06-10', classTarget: '12A1', desc: 'Giải toàn bộ đề thi thử số 6. Trình bày chi tiết lời giải.', priority: 'high',   color: '#ef4444', assignmentId: 'A01' },
  { id: 'DL08', type: 'homework', title: 'Nộp bài Nghị luận Ngữ văn',        subject: 'Ngữ văn',   date: '2026-06-08', classTarget: '12A1', desc: 'Viết nghị luận 200 chữ về tinh thần tự học.', priority: 'high',   color: '#ec4899', assignmentId: 'A02' },
];

// NEW DATA: Homework assignments
const initialAssignments = [
  { id: 'A01', teacherId: 'T01', teacherName: 'Nguyễn Minh Triết', subject: 'Toán học', classTarget: '12A1', title: 'Luyện đề thi tốt nghiệp THPT số 6', content: 'Hãy giải toàn bộ đề thi thử số 6 đính kèm trong tệp học liệu môn Toán. Chú ý các câu hỏi từ 40 đến 50 về phương trình hàm số và hình học không gian. Trình bày chi tiết lời giải ra giấy hoặc soạn thảo văn bản.', deadline: '2026-06-10', dateCreated: '2026-06-03' },
  { id: 'A02', teacherId: 'T02', teacherName: 'Trần Thị Hồng Vân', subject: 'Ngữ văn', classTarget: '12A1', title: 'Nghị luận xã hội về tinh thần tự học', content: 'Viết bài văn nghị luận ngắn khoảng 200 từ trình bày suy nghĩ của em về tầm quan trọng của tinh thần tự học đối với học sinh cuối cấp THPT.', deadline: '2026-06-08', dateCreated: '2026-06-02' }
];

// NEW DATA: Homework submissions
const initialSubmissions = [
  { id: 'S01', assignmentId: 'A02', studentId: 'HS001', studentName: 'Nguyễn Hoàng Nam', class: '12A1', submissionText: 'Tinh thần tự học là yếu tố then chốt quyết định sự thành bại của mỗi học sinh, đặc biệt là học sinh cuối cấp THPT. Tự học giúp chúng ta làm chủ kiến thức, ghi nhớ sâu sắc hơn và không bị thụ động trước những kỳ thi cam go. Đối với bản thân em, em thường dành 2 tiếng mỗi tối tự làm đề và tự đối chiếu đáp án.', submittedAt: '2026-06-03', status: 'graded', grade: 8.5, feedback: 'Bài viết lập luận tốt, liên hệ thực tế sinh động. Cần trau chuốt thêm các từ ngữ diễn đạt.' },
  { id: 'S02', assignmentId: 'A01', studentId: 'HS002', studentName: 'Lê Mai Chi', class: '12A1', submissionText: 'Em gửi thầy lời giải chi tiết cho 50 câu trắc nghiệm đề số 6. Riêng câu 48 và 50 em có làm thêm 2 cách giải khác bằng phương pháp tọa độ hóa để tối ưu thời gian làm bài trắc nghiệm...', submittedAt: '2026-06-03', status: 'submitted', grade: null, feedback: '' }
];

// NEW DATA: Attendance logs for RFID/Check-in simulation
const initialAttendance = [
  { id: 'AT01', studentId: 'HS001', studentName: 'Nguyễn Hoàng Nam', status: 'present', checkInTime: '07:12', date: '2026-06-01' },
  { id: 'AT02', studentId: 'HS001', studentName: 'Nguyễn Hoàng Nam', status: 'present', checkInTime: '07:18', date: '2026-06-02' },
  { id: 'AT03', studentId: 'HS001', studentName: 'Nguyễn Hoàng Nam', status: 'present', checkInTime: '07:15', date: '2026-06-03' },
  { id: 'AT04', studentId: 'HS002', studentName: 'Lê Mai Chi', status: 'present', checkInTime: '07:05', date: '2026-06-03' },
  { id: 'AT05', studentId: 'HS003', studentName: 'Phan Minh Triết', status: 'late', checkInTime: '07:35', date: '2026-06-03' }
];

// NEW DATA: Clubs and events lists
const initialClubs = [
  { id: 'C-ROB', name: 'CLB Robotics & AI', membersCount: 15, budgetExpected: 15000000, budgetApproved: 12000000, status: 'active', desc: 'Nghiên cứu chế tạo robot, tham gia Robocon và ứng dụng trí tuệ nhân tạo.' },
  { id: 'C-ART', name: 'CLB Mỹ thuật & Truyền thông', membersCount: 22, budgetExpected: 8000000, budgetApproved: 8000000, status: 'active', desc: 'Sáng tạo nghệ thuật, vẽ tranh tường cổ động và chụp ảnh sự kiện trường.' },
  { id: 'C-ENG', name: 'CLB Tranh biện Tiếng Anh', membersCount: 18, budgetExpected: 5000000, budgetApproved: 0, status: 'pending', desc: 'Rèn luyện khả năng nói, tư duy phản biện và tham gia các giải đấu hùng biện.' },
  { id: 'C-SPO', name: 'CLB Bóng đá học sinh', membersCount: 30, budgetExpected: 12000000, budgetApproved: 10000000, status: 'active', desc: 'Tập luyện bóng đá hàng tuần và tổ chức giải bóng đá thường niên toàn trường.' }
];

// NEW DATA: Club applications
const initialClubApps = [
  { id: 'CA01', studentId: 'HS002', studentName: 'Lê Mai Chi', clubId: 'C-ROB', clubName: 'CLB Robotics & AI', status: 'approved', introduction: 'Em rất đam mê tự động hóa và lập trình vi điều khiển.' },
  { id: 'CA02', studentId: 'HS001', studentName: 'Nguyễn Hoàng Nam', clubId: 'C-ENG', clubName: 'CLB Tranh biện Tiếng Anh', status: 'pending', introduction: 'Em muốn cải thiện khả năng nói trước đám đông và kỹ năng phản biện xã hội.' }
];

// NEW DATA: Learning resources
const initialResources = [
  { id: 'R01', subject: 'Toán học', title: 'Chuyên đề Tích phân lượng giác nâng cao (PDF)', fileType: 'pdf', teacherName: 'Nguyễn Minh Triết', dateUploaded: '2026-06-01' },
  { id: 'R02', subject: 'Ngữ văn', title: 'Tổng hợp sơ đồ tư duy phân tích Vợ Nhặt (PPTX)', fileType: 'pptx', teacherName: 'Trần Thị Hồng Vân', dateUploaded: '2026-06-02' }
];

// NEW DATA: Flashcards
const initialFlashcards = [
  { id: 'FC01', studentId: 'HS001', front: 'Công thức Tích phân từng phần', back: '∫u dv = u*v - ∫v du\nMẹo đặt u: Nhất lô, nhì đa, tam lượng, tứ mũ.' },
  { id: 'FC02', studentId: 'HS001', front: 'Định luật ôm cho toàn mạch', back: 'I = E / (R + r)\nE: Suất điện động, R: Điện trở ngoài, r: Điện trở trong.' },
  { id: 'FC03', studentId: 'HS001', front: 'Trạng thái Mị trong "Vợ chồng A Phủ"', back: 'Mị bị đè nén, chai sạm ("lùi lũi như con rùa nuôi trong xó cửa"). Nhưng ẩn chứa sức sống tiềm tàng.' }
];

// NEW DATA: RIASEC Career Scores presets
const initialCareerScores = [
  { studentId: 'HS001', R: 4, I: 9, A: 7, S: 8, E: 5, C: 3 }
];

// Presets of avatar lists for new members
const teacherAvatars = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80'
];

const studentAvatars = [
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80'
];

// NEW DATA: Cafeteria menus
const initialCafeteriaMenu = [
  { id: 'M01', date: '2026-06-03', name: 'Thực đơn thứ Tư (Hôm nay)', items: [{ name: 'Cơm sườn nướng mật ong', cal: 520, p: '24g', c: '65g', f: '18g' }, { name: 'Canh chua cá lóc Nam Bộ', cal: 180, p: '12g', c: '15g', f: '6g' }, { name: 'Dưa hấu ngọt tráng miệng', cal: 60, p: '1g', c: '14g', f: '0g' }], totalCal: 760, protein: '37g', carbs: '94g', fat: '24g' },
  { id: 'M02', date: '2026-06-04', name: 'Thực đơn thứ Năm', items: [{ name: 'Phở bò chín Hà Nội', cal: 480, p: '22g', c: '60g', f: '16g' }, { name: 'Bánh su kem Đà Lạt', cal: 150, p: '3g', c: '18g', f: '8g' }], totalCal: 630, protein: '25g', carbs: '78g', fat: '24g' },
  { id: 'M03', date: '2026-06-05', name: 'Thực đơn thứ Sáu', items: [{ name: 'Cá hồi sốt Teriyaki Nhật Bản', cal: 450, p: '30g', c: '8g', f: '18g' }, { name: 'Cơm gạo lứt hữu cơ', cal: 200, p: '5g', c: '44g', f: '2g' }, { name: 'Canh bí đao nấu thịt bằm', cal: 110, p: '8g', c: '6g', f: '4g' }], totalCal: 760, protein: '43g', carbs: '58g', fat: '24g' }
];

// NEW DATA: Cafeteria meal registrations
const initialCafeteriaRegistrations = [
  { id: 'R-HS001-03', studentId: 'HS001', date: '2026-06-03', status: 'registered', mealType: 'Standard', price: 35000, paid: true },
  { id: 'R-HS002-03', studentId: 'HS002', date: '2026-06-03', status: 'registered', mealType: 'Standard', price: 35000, paid: true },
  { id: 'R-HS003-03', studentId: 'HS003', date: '2026-06-03', status: 'registered', mealType: 'Standard', price: 35000, paid: true }
];

// NEW DATA: Cafeteria meal feedback
const initialCafeteriaFeedback = [
  { id: 'CF01', studentId: 'HS001', studentName: 'Nguyễn Hoàng Nam', date: '2026-06-03', rating: 5, comment: 'Cơm sườn ngon đậm đà, canh chua rất thanh ngọt ạ!' },
  { id: 'CF02', studentId: 'HS002', studentName: 'Lê Mai Chi', date: '2026-06-03', rating: 4, comment: 'Đồ ăn rất vừa vị nhưng cơm sườn hơi khô một chút.' }
];

// NEW DATA: Student cashless wallets
const initialStudentWallets = {
  'HS001': { balance: 450000, dailyLimit: 100000, transactions: [
    { id: 'TX01', date: '2026-06-03', amount: 35000, type: 'spend', description: 'Đóng tiền cơm bán trú ngày 03/06' },
    { id: 'TX02', date: '2026-06-02', amount: 20000, type: 'spend', description: 'Mua trà sữa tại Canteen trường' },
    { id: 'TX03', date: '2026-06-01', amount: 500000, type: 'topup', description: 'Phụ huynh nạp tiền vào ví' }
  ]},
  'HS002': { balance: 820000, dailyLimit: 150000, transactions: [
    { id: 'TX04', date: '2026-06-03', amount: 35000, type: 'spend', description: 'Đóng tiền cơm bán trú ngày 03/06' },
    { id: 'TX05', date: '2026-06-01', amount: 1000000, type: 'topup', description: 'Phụ huynh nạp tiền trực tuyến' }
  ]},
  'HS003': { balance: 120000, dailyLimit: 50000, transactions: [
    { id: 'TX06', date: '2026-06-03', amount: 35000, type: 'spend', description: 'Đóng tiền cơm bán trú ngày 03/06' }
  ]},
  'HS004': { balance: 250000, dailyLimit: 100000, transactions: [] },
  'HS005': { balance: 300000, dailyLimit: 100000, transactions: [] },
  'HS006': { balance: 150000, dailyLimit: 50000, transactions: [] }
};

// NEW DATA: Learning heatmaps (Competencies per student)
const initialStudentCompetencies = {
  'HS001': [
    { subject: 'Toán học', topic: 'Hàm số & Đồ thị', score: 85, color: '#10b981', desc: 'Thành thạo khảo sát hàm số, tương giao đồ thị và tiệm cận.' },
    { subject: 'Toán học', topic: 'Tích phân & Đạo hàm', score: 45, color: '#ef4444', desc: 'Gặp khó khăn ở các bài toán tích phân từng phần nâng cao và ứng dụng hình học.', resourceId: 'R01' },
    { subject: 'Toán học', topic: 'Hình học không gian Oxyz', score: 72, color: '#f59e0b', desc: 'Nắm được khái niệm nhưng lúng túng khi giải toán cực trị khoảng cách Oxyz.', resourceId: 'R01' },
    { subject: 'Toán học', topic: 'Số phức', score: 92, color: '#10b981', desc: 'Hiểu rất sâu phần biểu diễn hình học số phức và tìm min-max.' },
    { subject: 'Vật lý', topic: 'Dao động cơ học', score: 90, color: '#10b981', desc: 'Làm tốt các bài tập con lắc lò xo ghép, con lắc đơn chịu lực lạ.' },
    { subject: 'Vật lý', topic: 'Dòng điện xoay chiều RLC', score: 55, color: '#f59e0b', desc: 'Chưa nhớ công thức khi cuộn cảm hoặc tụ điện có thông số thay đổi.', resourceId: 'R01' },
    { subject: 'Vật lý', topic: 'Hạt nhân nguyên tử', score: 80, color: '#10b981', desc: 'Nắm chắc công thức tính năng lượng liên kết và phóng xạ.' },
    { subject: 'Ngữ văn', topic: 'Nghị luận xã hội', score: 85, color: '#10b981', desc: 'Có vốn từ phong phú, cấu trúc bài viết chặt chẽ và logic.' },
    { subject: 'Ngữ văn', topic: 'Văn học hiện thực (Vợ Nhặt)', score: 50, color: '#f59e0b', desc: 'Phần viết giá trị hiện thực và nhân đạo còn nông, chưa sâu sắc.', resourceId: 'R02' },
    { subject: 'Ngữ văn', topic: 'Thơ ca kháng chiến (Tây Tiến)', score: 78, color: '#10b981', desc: 'Cảm nhận thơ tốt, tuy nhiên cần chú ý phân tích sâu các biện pháp nghệ thuật.' }
  ],
  'HS002': [
    { subject: 'Toán học', topic: 'Hàm số & Đồ thị', score: 95, color: '#10b981', desc: 'Xuất sắc.' },
    { subject: 'Toán học', topic: 'Tích phân & Đạo hàm', score: 90, color: '#10b981', desc: 'Nắm chắc kiến thức.' },
    { subject: 'Toán học', topic: 'Hình học không gian Oxyz', score: 88, color: '#10b981', desc: 'Làm tốt các bài cực trị.' },
    { subject: 'Toán học', topic: 'Số phức', score: 96, color: '#10b981', desc: 'Xuất sắc.' },
    { subject: 'Vật lý', topic: 'Dao động cơ học', score: 86, color: '#10b981', desc: 'Khá tốt.' },
    { subject: 'Vật lý', topic: 'Dòng điện xoay chiều RLC', score: 88, color: '#10b981', desc: 'Hiểu rõ các công thức cực trị RLC.' },
    { subject: 'Vật lý', topic: 'Hạt nhân nguyên tử', score: 92, color: '#10b981', desc: 'Xuất sắc.' },
    { subject: 'Ngữ văn', topic: 'Nghị luận xã hội', score: 94, color: '#10b981', desc: 'Lập luận sắc bén, thuyết phục.' },
    { subject: 'Ngữ văn', topic: 'Văn học hiện thực (Vợ Nhặt)', score: 90, color: '#10b981', desc: 'Cảm thụ tác phẩm rất tốt.' },
    { subject: 'Ngữ văn', topic: 'Thơ ca kháng chiến (Tây Tiến)', score: 92, color: '#10b981', desc: 'Rất hay.' }
  ],
  'HS003': [
    { subject: 'Toán học', topic: 'Hàm số & Đồ thị', score: 68, color: '#f59e0b', desc: 'Còn sai sót trong các câu biến đổi tiệm cận đồ thị.' },
    { subject: 'Toán học', topic: 'Tích phân & Đạo hàm', score: 38, color: '#ef4444', desc: 'Mất gốc phương pháp đổi biến số và tích phân từng phần.', resourceId: 'R01' },
    { subject: 'Toán học', topic: 'Hình học không gian Oxyz', score: 60, color: '#f59e0b', desc: 'Cần ôn tập kỹ các công thức viết phương trình mặt phẳng.', resourceId: 'R01' },
    { subject: 'Toán học', topic: 'Số phức', score: 72, color: '#f59e0b', desc: 'Nắm được các công thức cộng trừ nhân chia số phức.' },
    { subject: 'Vật lý', topic: 'Dao động cơ học', score: 65, color: '#f59e0b', desc: 'Trung bình, cần luyện tập nhiều bài con lắc cơ bản.' },
    { subject: 'Vật lý', topic: 'Dòng điện xoay chiều RLC', score: 42, color: '#ef4444', desc: 'Mắc nhiều lỗi khi tính toán dung kháng và cảm kháng.', resourceId: 'R01' },
    { subject: 'Vật lý', topic: 'Hạt nhân nguyên tử', score: 70, color: '#f59e0b', desc: 'Khá tốt phần lý thuyết phóng xạ.' },
    { subject: 'Ngữ văn', topic: 'Nghị luận xã hội', score: 75, color: '#10b981', desc: 'Bố cục rõ ràng, lập luận trung bình khá.' },
    { subject: 'Ngữ văn', topic: 'Văn học hiện thực (Vợ Nhặt)', score: 55, color: '#f59e0b', desc: 'Bài viết sơ sài, thiếu dẫn chứng cụ thể.', resourceId: 'R02' },
    { subject: 'Ngữ văn', topic: 'Thơ ca kháng chiến (Tây Tiến)', score: 72, color: '#f59e0b', desc: 'Trung bình khá.' }
  ]
};

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────
const initialNotifications = [
  { id: 'N01', type: 'grade', title: 'Điểm kiểm tra mới', body: 'Bài kiểm tra Toán học của Nam đã có điểm: 8.5/10', targetRole: 'parent', targetId: 'HS001', read: false, date: '2026-06-03', icon: 'award' },
  { id: 'N02', type: 'assignment', title: 'Bài tập mới được giao', body: 'Thầy Triết đã giao bài Luyện đề số 6 - hạn nộp 10/06', targetRole: 'student', targetId: 'HS001', read: false, date: '2026-06-03', icon: 'file' },
  { id: 'N03', type: 'fee', title: 'Học phí sắp đến hạn', body: 'Học phí tháng 6/2026 của Nam sẽ đến hạn vào 15/06/2026', targetRole: 'parent', targetId: 'HS001', read: false, date: '2026-06-02', icon: 'dollar' },
  { id: 'N04', type: 'approval', title: 'Đơn xin nghỉ phép đã được duyệt', body: 'Đơn xin nghỉ ngày 04/06 của Nguyễn Hoàng Nam đã được BGH phê duyệt', targetRole: 'parent', targetId: 'HS001', read: true, date: '2026-06-01', icon: 'check' },
  { id: 'N05', type: 'bulletin', title: 'Thông báo mới từ BGH', body: 'Kế hoạch thi học kỳ 2 bổ sung và tổng kết năm học', targetRole: 'all', read: false, date: '2026-06-02', icon: 'bell' },
  { id: 'N06', type: 'grade', title: 'Giáo án đã được duyệt', body: 'Giáo án Ôn tập Tích phân của bạn đã được BGH phê duyệt', targetRole: 'teacher', targetId: 'T01', read: false, date: '2026-06-03', icon: 'check' },
  { id: 'N07', type: 'meeting', title: 'Yêu cầu gặp mặt mới', body: 'Phụ huynh em Nguyễn Hoàng Nam muốn đặt lịch gặp bạn ngày 05/06', targetRole: 'teacher', targetId: 'T01', read: false, date: '2026-06-03', icon: 'calendar' },
];

// ── DIRECT MESSAGES ────────────────────────────────────────────────────────
const initialDirectMessages = [
  { id: 'DM01', fromId: 'parent_HS001', fromName: 'Nguyễn Văn Hùng (PH Nam)', fromRole: 'parent', toId: 'T01', toName: 'Nguyễn Minh Triết', toRole: 'teacher', text: 'Thầy ơi, cháu Nam gần đây học có tiến bộ không thầy?', date: '2026-06-03', time: '08:30', read: true },
  { id: 'DM02', fromId: 'T01', fromName: 'Nguyễn Minh Triết', fromRole: 'teacher', toId: 'parent_HS001', toName: 'Nguyễn Văn Hùng (PH Nam)', toRole: 'parent', text: 'Chào anh, bé Nam có tiến bộ rõ rệt trong tuần này. Điểm kiểm tra tăng đáng kể ạ!', date: '2026-06-03', time: '09:15', read: true },
  { id: 'DM03', fromId: 'parent_HS001', fromName: 'Nguyễn Văn Hùng (PH Nam)', fromRole: 'parent', toId: 'T01', toName: 'Nguyễn Minh Triết', toRole: 'teacher', text: 'Cảm ơn thầy nhiều! Gia đình mừng lắm. Thầy có thể cho cháu học thêm buổi chiều được không ạ?', date: '2026-06-03', time: '09:20', read: false },
];

// ── BULLETIN BOARD ─────────────────────────────────────────────────────────
const initialBulletins = [
  { id: 'B01', authorId: 'admin', authorName: 'Ban Giám Hiệu', title: 'Kế hoạch thi học kỳ II và tổng kết năm học 2025-2026', content: 'Nhà trường thông báo lịch thi học kỳ II như sau:\n- Khối 12: Thi từ 08/06 đến 13/06/2026\n- Khối 11: Thi từ 09/06 đến 14/06/2026\n- Khối 10: Thi từ 10/06 đến 15/06/2026\n\nĐề nghị giáo viên bộ môn hoàn thành đề cương trước 05/06. Học sinh ôn tập theo đề cương được đăng trên hệ thống.', type: 'academic', priority: 'urgent', targetRoles: ['all'], date: '2026-06-02', readBy: ['T01', 'T02'] },
  { id: 'B02', authorId: 'admin', authorName: 'Ban Giám Hiệu', title: 'Thông báo thu học phí tháng 6/2026', content: 'Phụ huynh vui lòng hoàn thành đóng học phí tháng 6 trước ngày 15/06/2026. Nhà trường sẽ xem xét các trường hợp khó khăn theo đề nghị của gia đình. Liên hệ phòng kế toán (phòng 105) để được hỗ trợ.', type: 'finance', priority: 'high', targetRoles: ['parent'], date: '2026-06-01', readBy: [] },
  { id: 'B03', authorId: 'T01', authorName: 'GV Nguyễn Minh Triết', title: 'Đề cương ôn tập Toán học kỳ II - Lớp 12A1', content: 'Các em học sinh lớp 12A1 chú ý:\n\nNội dung ôn tập HK2 Toán học:\n1. Tích phân và ứng dụng (30%)\n2. Hàm số mũ và logarit (20%)\n3. Hình học trong không gian Oxyz (30%)\n4. Số phức (20%)\n\nTài liệu ôn tập đã được upload lên hệ thống. Thầy sẽ tổ chức ôn tập online qua EduMeet vào tối thứ 5 và thứ 6 lúc 19:30.', type: 'academic', priority: 'medium', targetRoles: ['student', 'parent'], date: '2026-06-01', readBy: ['HS001'] },
  { id: 'B04', authorId: 'admin', authorName: 'Ban Giám Hiệu', title: 'Lễ tri ân thầy cô và trưởng thành khối 12 - 25/06/2026', content: 'Ban giám hiệu trân trọng thông báo: Lễ tri ân thầy cô và trưởng thành dành cho học sinh khối 12 sẽ được tổ chức vào ngày 25/06/2026 tại Hội trường lớn.\n\nYêu cầu:\n- Học sinh: Mặc đồng phục áo dài trắng\n- Có mặt tại trường lúc 07:00\n- Mời phụ huynh tham dự', type: 'event', priority: 'medium', targetRoles: ['all'], date: '2026-05-30', readBy: ['T01', 'T02', 'HS001', 'HS002'] },
];

// ── MEETING BOOKINGS ───────────────────────────────────────────────────────
const initialMeetingBookings = [
  { id: 'MB01', parentId: 'parent_HS001', parentName: 'Nguyễn Văn Hùng', studentId: 'HS001', studentName: 'Nguyễn Hoàng Nam', teacherId: 'T01', teacherName: 'Nguyễn Minh Triết', date: '2026-06-05', timeSlot: '15:00 - 15:30', reason: 'Trao đổi về định hướng ôn thi đại học cho con và phương pháp học tập phù hợp.', status: 'confirmed', note: 'Gặp tại phòng giáo viên tầng 2' },
  { id: 'MB02', parentId: 'parent_HS003', parentName: 'Phan Quốc Bảo', studentId: 'HS003', studentName: 'Phan Minh Triết', teacherId: 'T01', teacherName: 'Nguyễn Minh Triết', date: '2026-06-07', timeSlot: '14:00 - 14:30', reason: 'Con gần đây có vẻ mất tập trung học, muốn trao đổi với thầy về tình hình học tập.', status: 'pending', note: '' },
];

// ── COMMUNITY EXAMS ────────────────────────────────────────────────────────
const initialCommunityExams = [
  { id: 'CE01', authorId: 'T01', authorName: 'Nguyễn Minh Triết', title: 'Đề Toán luyện thi THPT QG - Chuyên đề Tích phân nâng cao', subject: 'Toán học', grade: '12', difficulty: 'Khó', questionCount: 20, usedCount: 145, upvotes: 38, downvotes: 2, date: '2026-05-28', description: 'Bộ đề 20 câu tập trung vào tích phân từng phần, tích phân đổi biến và ứng dụng tính diện tích thể tích.' },
  { id: 'CE02', authorId: 'T02', authorName: 'Trần Thị Hồng Vân', title: 'Đề cương Nghị luận văn học - 10 tác phẩm trọng tâm lớp 12', subject: 'Ngữ văn', grade: '12', difficulty: 'Trung bình', questionCount: 10, usedCount: 212, upvotes: 55, downvotes: 4, date: '2026-05-25', description: 'Tổng hợp 10 đề nghị luận về các tác phẩm: Vợ Nhặt, Tây Tiến, Việt Bắc, Rừng Xà Nu...' },
  { id: 'CE03', authorId: 'T03', authorName: 'Phạm Đức Duy', title: 'Bài tập điện xoay chiều RLC - 30 câu trắc nghiệm chuẩn đại học', subject: 'Vật lý', grade: '12', difficulty: 'Khó', questionCount: 30, usedCount: 98, upvotes: 24, downvotes: 1, date: '2026-05-30', description: 'Toàn bộ dạng bài RLC cơ bản đến nâng cao. Có đáp án và hướng dẫn giải chi tiết.' },
  { id: 'CE04', authorId: 'T04', authorName: 'Lê Thu Hà', title: 'Bộ đề Reading Comprehension THPT 2026 - Cấu trúc đề thi mới', subject: 'Tiếng Anh', grade: '12', difficulty: 'Trung bình', questionCount: 40, usedCount: 176, upvotes: 42, downvotes: 3, date: '2026-06-01', description: 'Cấu trúc đề thi theo format mới nhất Bộ GD&ĐT 2026. Có từ vựng gợi ý và từng bước phân tích đoạn văn.' },
];

// ── SCHOOL ASSETS ──────────────────────────────────────────────────────────
const initialSchoolAssets = [
  { id: 'SA01', name: 'Phòng máy tính 101', type: 'room', capacity: 30, location: 'Tầng 1, Dãy A', status: 'available', bookings: [
    { id: 'AB01', teacherId: 'T01', teacherName: 'Nguyễn Minh Triết', date: '2026-06-05', period: '3-4', purpose: 'Học sinh làm bài thi trực tuyến môn Toán', approved: true }
  ]},
  { id: 'SA02', name: 'Phòng Lab Vật lý', type: 'lab', capacity: 25, location: 'Tầng 2, Dãy B', status: 'available', bookings: [] },
  { id: 'SA03', name: 'Máy chiếu di động #1', type: 'equipment', capacity: 1, location: 'Phòng GV', status: 'available', bookings: [
    { id: 'AB02', teacherId: 'T02', teacherName: 'Trần Thị Hồng Vân', date: '2026-06-04', period: '1-2', purpose: 'Chiếu phim tư liệu văn học', approved: true }
  ]},
  { id: 'SA04', name: 'Sân bóng đá', type: 'outdoor', capacity: 50, location: 'Khuôn viên trường', status: 'available', bookings: [] },
  { id: 'SA05', name: 'Hội trường lớn', type: 'room', capacity: 300, location: 'Tầng 1, Dãy D', status: 'booked', bookings: [
    { id: 'AB03', teacherId: 'admin', teacherName: 'Ban Giám Hiệu', date: '2026-06-25', period: 'Cả ngày', purpose: 'Lễ tri ân thầy cô và trưởng thành khối 12', approved: true }
  ]},
  { id: 'SA06', name: 'Phòng Lab Hóa học', type: 'lab', capacity: 25, location: 'Tầng 2, Dãy C', status: 'available', bookings: [] },
];

// ── TEACHER ATTENDANCE ─────────────────────────────────────────────────────
const initialTeacherAttendance = [
  { id: 'TA01', teacherId: 'T01', teacherName: 'Nguyễn Minh Triết', date: '2026-06-01', checkInTime: '07:15', status: 'ontime', pin: '2341' },
  { id: 'TA02', teacherId: 'T01', teacherName: 'Nguyễn Minh Triết', date: '2026-06-02', checkInTime: '07:08', status: 'ontime', pin: '5678' },
  { id: 'TA03', teacherId: 'T01', teacherName: 'Nguyễn Minh Triết', date: '2026-06-03', checkInTime: '07:32', status: 'late', pin: '9012' },
  { id: 'TA04', teacherId: 'T02', teacherName: 'Trần Thị Hồng Vân', date: '2026-06-01', checkInTime: '06:58', status: 'ontime', pin: '3456' },
  { id: 'TA05', teacherId: 'T02', teacherName: 'Trần Thị Hồng Vân', date: '2026-06-02', checkInTime: '07:20', status: 'ontime', pin: '7890' },
  { id: 'TA06', teacherId: 'T02', teacherName: 'Trần Thị Hồng Vân', date: '2026-06-03', checkInTime: '07:12', status: 'ontime', pin: '1234' },
  { id: 'TA07', teacherId: 'T03', teacherName: 'Phạm Đức Duy', date: '2026-06-01', checkInTime: '07:40', status: 'late', pin: '5679' },
  { id: 'TA08', teacherId: 'T03', teacherName: 'Phạm Đức Duy', date: '2026-06-02', checkInTime: '07:05', status: 'ontime', pin: '3457' },
  { id: 'TA09', teacherId: 'T04', teacherName: 'Lê Thu Hà', date: '2026-06-01', checkInTime: '07:10', status: 'ontime', pin: '8901' },
  { id: 'TA10', teacherId: 'T04', teacherName: 'Lê Thu Hà', date: '2026-06-02', checkInTime: '07:18', status: 'ontime', pin: '2345' },
];

export const AppProvider = ({ children }) => {
  const [theme] = useState('light');
  
  const [userSession, setUserSession] = useState(() => {
    const saved = localStorage.getItem('userSession');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentRole, setCurrentRole] = useState(() => {
    const savedSession = localStorage.getItem('userSession');
    return savedSession ? JSON.parse(savedSession).role : '';
  });

  // Shared student sub-tab state (controlled from Sidebar)
  const [studentSubTab, setStudentSubTab] = useState('overview');
  
  const [selectedStudentId, setSelectedStudentId] = useState('HS001');

  const [teachers, setTeachers] = useState(() => {
    const saved = localStorage.getItem('teachers');
    return saved ? JSON.parse(saved) : initialTeachers;
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('students');
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [announcements, setAnnouncements] = useState(() => {
    const saved = localStorage.getItem('announcements');
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });

  const [journalEntries, setJournalEntries] = useState(() => {
    const saved = localStorage.getItem('journalEntries');
    return saved ? JSON.parse(saved) : initialJournalEntries;
  });

  const [parentQAs, setParentQAs] = useState(() => {
    const saved = localStorage.getItem('parentQAs');
    return saved ? JSON.parse(saved) : initialParentQAs;
  });

  const [tutorChat, setTutorChat] = useState(() => {
    const saved = localStorage.getItem('tutorChat');
    return saved ? JSON.parse(saved) : initialTutorChat;
  });

  // NEW STATES: Leaves & Lesson plans
  const [leaveRequests, setLeaveRequests] = useState(() => {
    const saved = localStorage.getItem('leaveRequests');
    return saved ? JSON.parse(saved) : initialLeaveRequests;
  });

  const [teacherLeaveRequests, setTeacherLeaveRequests] = useState(() => {
    const saved = localStorage.getItem('teacherLeaveRequests');
    return saved ? JSON.parse(saved) : initialTeacherLeaveRequests;
  });

  const [lessonPlans, setLessonPlans] = useState(() => {
    const saved = localStorage.getItem('lessonPlans');
    return saved ? JSON.parse(saved) : initialLessonPlans;
  });

  const [conductLogs, setConductLogs] = useState(() => {
    const saved = localStorage.getItem('conductLogs');
    return saved ? JSON.parse(saved) : [
      { id: 'C01', studentId: 'HS001', studentName: 'Nguyễn Hoàng Nam', class: '12A1', points: 10, reason: 'Hăng hái phát biểu xây dựng bài học môn Toán', date: '2026-06-01', teacherName: 'Nguyễn Minh Triết' },
      { id: 'C02', studentId: 'HS003', studentName: 'Phan Minh Triết', class: '12A1', points: -5, reason: 'Nói chuyện riêng trong tiết Vật lý', date: '2026-06-02', teacherName: 'Phạm Đức Duy' }
    ];
  });

  const [teacherEvaluations, setTeacherEvaluations] = useState(() => {
    const saved = localStorage.getItem('teacherEvaluations');
    return saved ? JSON.parse(saved) : [
      { id: 'E01', teacherId: 'T01', teacherName: 'Nguyễn Minh Triết', raterRole: 'student', raterName: 'Nguyễn Hoàng Nam', rating: 5, comment: 'Thầy Triết giảng Toán rất dễ hiểu, nhiệt tình hướng dẫn bài tập nâng cao cho lớp học.', date: '2026-06-02' },
      { id: 'E02', teacherId: 'T02', teacherName: 'Trần Thị Hồng Vân', raterRole: 'parent', raterName: 'Nguyễn Văn Hùng', rating: 4, comment: 'Cô giảng Văn sâu sắc, giúp các cháu tiếp thu tốt bài viết nghị luận xã hội.', date: '2026-06-01' }
    ];
  });

  const [assignments, setAssignments] = useState(() => {
    const saved = localStorage.getItem('assignments');
    return saved ? JSON.parse(saved) : initialAssignments;
  });

  const [deadlines, setDeadlines] = useState(() => {
    const saved = localStorage.getItem('deadlines');
    return saved ? JSON.parse(saved) : initialDeadlines;
  });

  // Save deadlines to localStorage when changed
  useEffect(() => { localStorage.setItem('deadlines', JSON.stringify(deadlines)); }, [deadlines]);

  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem('submissions');
    return saved ? JSON.parse(saved) : initialSubmissions;
  });

  const [attendanceLogs, setAttendanceLogs] = useState(() => {
    const saved = localStorage.getItem('attendanceLogs');
    return saved ? JSON.parse(saved) : initialAttendance;
  });

  const [clubs, setClubs] = useState(() => {
    const saved = localStorage.getItem('clubs');
    return saved ? JSON.parse(saved) : initialClubs;
  });

  const [clubApplications, setClubApplications] = useState(() => {
    const saved = localStorage.getItem('clubApplications');
    return saved ? JSON.parse(saved) : initialClubApps;
  });

  const [learningResources, setLearningResources] = useState(() => {
    const saved = localStorage.getItem('learningResources');
    return saved ? JSON.parse(saved) : initialResources;
  });

  const [flashcards, setFlashcards] = useState(() => {
    const saved = localStorage.getItem('flashcards');
    return saved ? JSON.parse(saved) : initialFlashcards;
  });

  const [careerTestScores, setCareerTestScores] = useState(() => {
    const saved = localStorage.getItem('careerTestScores');
    return saved ? JSON.parse(saved) : initialCareerScores;
  });

  const [cafeteriaMenu] = useState(() => {
    const saved = localStorage.getItem('cafeteriaMenu');
    return saved ? JSON.parse(saved) : initialCafeteriaMenu;
  });

  const [cafeteriaRegistrations, setCafeteriaRegistrations] = useState(() => {
    const saved = localStorage.getItem('cafeteriaRegistrations');
    return saved ? JSON.parse(saved) : initialCafeteriaRegistrations;
  });

  const [cafeteriaFeedback, setCafeteriaFeedback] = useState(() => {
    const saved = localStorage.getItem('cafeteriaFeedback');
    return saved ? JSON.parse(saved) : initialCafeteriaFeedback;
  });

  const [studentWallets, setStudentWallets] = useState(() => {
    const saved = localStorage.getItem('studentWallets');
    return saved ? JSON.parse(saved) : initialStudentWallets;
  });

  const [studentCompetencies] = useState(() => {
    const saved = localStorage.getItem('studentCompetencies');
    return saved ? JSON.parse(saved) : initialStudentCompetencies;
  });

  const [mockExamHistory, setMockExamHistory] = useState(() => {
    const saved = localStorage.getItem('mockExamHistory');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_EXAM_HISTORY;
  });

  useEffect(() => {
    localStorage.setItem('mockExamHistory', JSON.stringify(mockExamHistory));
  }, [mockExamHistory]);

  const [customExams, setCustomExams] = useState(() => {
    const saved = localStorage.getItem('customExams');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('customExams', JSON.stringify(customExams));
  }, [customExams]);

  // ── New Feature States ───────────────────────────────────────────────────
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [directMessages, setDirectMessages] = useState(() => {
    const saved = localStorage.getItem('directMessages');
    return saved ? JSON.parse(saved) : initialDirectMessages;
  });

  const [bulletins, setBulletins] = useState(() => {
    const saved = localStorage.getItem('bulletins');
    return saved ? JSON.parse(saved) : initialBulletins;
  });

  const [meetingBookings, setMeetingBookings] = useState(() => {
    const saved = localStorage.getItem('meetingBookings');
    return saved ? JSON.parse(saved) : initialMeetingBookings;
  });

  const [communityExams, setCommunityExams] = useState(() => {
    const saved = localStorage.getItem('communityExams');
    return saved ? JSON.parse(saved) : initialCommunityExams;
  });

  const [schoolAssets, setSchoolAssets] = useState(() => {
    const saved = localStorage.getItem('schoolAssets');
    return saved ? JSON.parse(saved) : initialSchoolAssets;
  });

  const [teacherAttendance, setTeacherAttendance] = useState(() => {
    const saved = localStorage.getItem('teacherAttendance');
    return saved ? JSON.parse(saved) : initialTeacherAttendance;
  });

  // Sync html attribute for theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  useEffect(() => {
    if (userSession) {
      localStorage.setItem('userSession', JSON.stringify(userSession));
    } else {
      localStorage.removeItem('userSession');
    }
  }, [userSession]);

  // Sync selectedStudentId with logged-in user profile automatically
  useEffect(() => {
    if (currentRole === 'student' && userSession && students) {
      const student = students.find(s => s.name === userSession.displayName);
      if (student && selectedStudentId !== student.id) {
        const timer = setTimeout(() => {
          setSelectedStudentId(student.id);
        }, 0);
        return () => clearTimeout(timer);
      }
    } else if (currentRole === 'parent' && userSession && students) {
      const parentNameClean = userSession.displayName.replace(/^PH\.\s+/, '');
      const student = students.find(s => s.parentName === parentNameClean);
      if (student && selectedStudentId !== student.id) {
        const timer = setTimeout(() => {
          setSelectedStudentId(student.id);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [currentRole, userSession, students, selectedStudentId]);

  useEffect(() => {
    localStorage.setItem('teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem('parentQAs', JSON.stringify(parentQAs));
  }, [parentQAs]);

  useEffect(() => {
    localStorage.setItem('tutorChat', JSON.stringify(tutorChat));
  }, [tutorChat]);

  // Sync leaves & lesson plans
  useEffect(() => {
    localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('teacherLeaveRequests', JSON.stringify(teacherLeaveRequests));
  }, [teacherLeaveRequests]);

  useEffect(() => {
    localStorage.setItem('lessonPlans', JSON.stringify(lessonPlans));
  }, [lessonPlans]);

  useEffect(() => {
    localStorage.setItem('conductLogs', JSON.stringify(conductLogs));
  }, [conductLogs]);

  useEffect(() => {
    localStorage.setItem('teacherEvaluations', JSON.stringify(teacherEvaluations));
  }, [teacherEvaluations]);

  useEffect(() => {
    localStorage.setItem('assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('attendanceLogs', JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  useEffect(() => {
    localStorage.setItem('clubs', JSON.stringify(clubs));
  }, [clubs]);

  useEffect(() => {
    localStorage.setItem('clubApplications', JSON.stringify(clubApplications));
  }, [clubApplications]);

  useEffect(() => {
    localStorage.setItem('learningResources', JSON.stringify(learningResources));
  }, [learningResources]);

  useEffect(() => {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem('careerTestScores', JSON.stringify(careerTestScores));
  }, [careerTestScores]);

  useEffect(() => {
    localStorage.setItem('cafeteriaMenu', JSON.stringify(cafeteriaMenu));
  }, [cafeteriaMenu]);

  useEffect(() => {
    localStorage.setItem('cafeteriaRegistrations', JSON.stringify(cafeteriaRegistrations));
  }, [cafeteriaRegistrations]);

  useEffect(() => {
    localStorage.setItem('cafeteriaFeedback', JSON.stringify(cafeteriaFeedback));
  }, [cafeteriaFeedback]);

  useEffect(() => {
    localStorage.setItem('studentWallets', JSON.stringify(studentWallets));
  }, [studentWallets]);

  useEffect(() => {
    localStorage.setItem('studentCompetencies', JSON.stringify(studentCompetencies));
  }, [studentCompetencies]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('directMessages', JSON.stringify(directMessages));
  }, [directMessages]);

  useEffect(() => {
    localStorage.setItem('bulletins', JSON.stringify(bulletins));
  }, [bulletins]);

  useEffect(() => {
    localStorage.setItem('meetingBookings', JSON.stringify(meetingBookings));
  }, [meetingBookings]);

  useEffect(() => {
    localStorage.setItem('communityExams', JSON.stringify(communityExams));
  }, [communityExams]);

  useEffect(() => {
    localStorage.setItem('schoolAssets', JSON.stringify(schoolAssets));
  }, [schoolAssets]);

  useEffect(() => {
    localStorage.setItem('teacherAttendance', JSON.stringify(teacherAttendance));
  }, [teacherAttendance]);

  // Actions
  const logout = () => {
    localStorage.removeItem('userSession');
    setUserSession(null);
    setCurrentRole('');
    window.location.reload();
  };

  const addStudent = (student) => {
    const randAvatar = studentAvatars[Math.floor(Math.random() * studentAvatars.length)];
    const grade = student.class ? student.class.substring(0, 2) : '12';

    setStudents(prev => [
      ...prev,
      {
        ...student,
        id: `HS${String(prev.length + 1).padStart(3, '0')}`,
        grade,
        grades: student.grades || { Math: 0, Literature: 0, Physics: 0, English: 0 },
        gradesSem1: student.gradesSem1 || { Math: 0, Literature: 0, Physics: 0, English: 0 },
        feeStatus: [
          { id: 'F01', name: 'Học phí tháng 6/2026', amount: 2500000, paid: false, deadline: '2026-06-15' },
          { id: 'F02', name: 'Tiền ăn bán trú tháng 6/2026', amount: 950000, paid: false, deadline: '2026-06-15' },
          { id: 'F03', name: 'Quỹ hội phụ huynh năm học', amount: 300000, paid: false, deadline: '2026-06-05' }
        ],
        parentSignature: null,
        avatarUrl: randAvatar
      }
    ]);
  };

  const editStudentGrades = (studentId, subject, grade) => {
    setStudents(prev => prev.map(std => {
      if (std.id === studentId) {
        return {
          ...std,
          grades: {
            ...std.grades,
            [subject]: parseFloat(grade)
          }
        };
      }
      return std;
    }));
  };

  const addTeacher = (teacher) => {
    const randAvatar = teacherAvatars[Math.floor(Math.random() * teacherAvatars.length)];
    setTeachers(prev => [
      ...prev,
      { 
        ...teacher, 
        id: `T${String(prev.length + 1).padStart(2, '0')}`,
        avatarUrl: randAvatar
      }
    ]);
  };

  const addAnnouncement = (title, content, sender) => {
    setAnnouncements(prev => [
      {
        id: `A${String(prev.length + 1).padStart(2, '0')}`,
        date: new Date().toISOString().split('T')[0],
        sender,
        title,
        content
      },
      ...prev
    ]);
  };

  const addJournalEntry = (entry) => {
    setJournalEntries(prev => [
      ...prev,
      {
        ...entry,
        id: `J${String(prev.length + 1).padStart(2, '0')}`,
        date: new Date().toISOString().split('T')[0],
        signed: false,
        signature: null
      }
    ]);
  };

  const signJournalEntry = (id, signatureDataUrl) => {
    setJournalEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        return { ...entry, signed: true, signature: signatureDataUrl };
      }
      return entry;
    }));
  };

  const signParentReport = (studentId, signatureDataUrl) => {
    setStudents(prev => prev.map(std => {
      if (std.id === studentId) {
        return { ...std, parentSignature: signatureDataUrl };
      }
      return std;
    }));
  };

  const payStudentFee = (studentId, feeId) => {
    setStudents(prev => prev.map(std => {
      if (std.id === studentId) {
        return {
          ...std,
          feeStatus: std.feeStatus.map(fee => {
            if (fee.id === feeId) {
              return { ...fee, paid: true };
            }
            return fee;
          })
        };
      }
      return std;
    }));
  };

  const createFeeItem = (feeName, amount, classTarget, deadline) => {
    setStudents(prev => prev.map(std => {
      const match = classTarget === 'All' || std.class === classTarget;
      if (match) {
        const hasFee = std.feeStatus.some(f => f.name.toLowerCase() === feeName.toLowerCase());
        if (!hasFee) {
          return {
            ...std,
            feeStatus: [
              ...std.feeStatus,
              {
                id: `F${String(Date.now()).slice(-4)}`,
                name: feeName,
                amount: parseFloat(amount),
                paid: false,
                deadline
              }
            ]
          };
        }
      }
      return std;
    }));
  };

  const askParentQuestion = (studentId, question) => {
    const student = students.find(s => s.id === studentId);
    setParentQAs(prev => [
      ...prev,
      {
        id: `Q${String(prev.length + 1).padStart(2, '0')}`,
        studentName: student.name,
        parentName: student.parentName,
        question,
        reply: '',
        status: 'pending',
        date: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  const answerParentQuestion = (qaId, reply) => {
    setParentQAs(prev => prev.map(qa => {
      if (qa.id === qaId) {
        return { ...qa, reply, status: 'resolved' };
      }
      return qa;
    }));
  };

  // NEW ACTION: Submit Leave Request
  const submitLeaveRequest = (studentId, date, reason) => {
    const student = students.find(s => s.id === studentId);
    setLeaveRequests(prev => [
      ...prev,
      {
        id: `L${String(Date.now()).slice(-4)}`,
        studentId,
        studentName: student.name,
        class: student.class,
        parentName: student.parentName,
        date,
        reason,
        status: 'pending'
      }
    ]);
  };

  // NEW ACTION: Approve Leave Request
  const approveLeaveRequest = (requestId, status) => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status };
      }
      return req;
    }));
  };

  const submitTeacherLeaveRequest = (teacherId, date, reason, substituteTeacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    const subTeacher = teachers.find(t => t.id === substituteTeacherId);
    setTeacherLeaveRequests(prev => [
      ...prev,
      {
        id: `TL${String(Date.now()).slice(-4)}`,
        teacherId,
        teacherName: teacher ? teacher.name : '',
        date,
        reason,
        substituteTeacherId,
        substituteTeacherName: subTeacher ? subTeacher.name : '',
        status: 'pending'
      }
    ]);
  };

  const approveTeacherLeaveRequest = (requestId, status) => {
    setTeacherLeaveRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status };
      }
      return req;
    }));
  };

  // NEW ACTION: Submit Lesson Plan
  const submitLessonPlan = (teacherName, subject, title) => {
    setLessonPlans(prev => [
      ...prev,
      {
        id: `LP${String(Date.now()).slice(-4)}`,
        teacherName,
        subject,
        title,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        feedback: ''
      }
    ]);
  };

  // NEW ACTION: Review Lesson Plan (Approve/Reject + Feedback)
  const reviewLessonPlan = (planId, status, feedback) => {
    setLessonPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        return { ...plan, status, feedback };
      }
      return plan;
    }));
  };

  const addConductLog = (studentId, points, reason, teacherName) => {
    const student = students.find(s => s.id === studentId);
    setConductLogs(prev => [
      ...prev,
      {
        id: `C${String(Date.now()).slice(-4)}`,
        studentId,
        studentName: student.name,
        class: student.class,
        points: parseInt(points),
        reason,
        date: new Date().toISOString().split('T')[0],
        teacherName
      }
    ]);
  };

  const submitTeacherEvaluation = (teacherId, rating, comment, raterRole, raterName) => {
    const teacher = teachers.find(t => t.id === teacherId);
    setTeacherEvaluations(prev => [
      ...prev,
      {
        id: `E${String(Date.now()).slice(-4)}`,
        teacherId,
        teacherName: teacher.name,
        raterRole,
        raterName,
        rating: parseInt(rating),
        comment,
        date: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  const createAssignment = (teacherId, teacherName, subject, classTarget, title, content, deadline) => {
    setAssignments(prev => [
      ...prev,
      {
        id: `A${String(Date.now()).slice(-4)}`,
        teacherId,
        teacherName,
        subject,
        classTarget,
        title,
        content,
        deadline,
        dateCreated: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  const submitAssignment = (assignmentId, studentId, submissionText) => {
    const student = students.find(s => s.id === studentId);
    setSubmissions(prev => {
      const exists = prev.some(sub => sub.assignmentId === assignmentId && sub.studentId === studentId);
      if (exists) {
        return prev.map(sub => {
          if (sub.assignmentId === assignmentId && sub.studentId === studentId) {
            return {
              ...sub,
              submissionText,
              submittedAt: new Date().toISOString().split('T')[0],
              status: 'submitted',
              grade: null,
              feedback: ''
            };
          }
          return sub;
        });
      }
      return [
        ...prev,
        {
          id: `S${String(Date.now()).slice(-4)}`,
          assignmentId,
          studentId,
          studentName: student.name,
          class: student.class,
          submissionText,
          submittedAt: new Date().toISOString().split('T')[0],
          status: 'submitted',
          grade: null,
          feedback: ''
        }
      ];
    });
  };

  const gradeSubmission = (submissionId, grade, feedback) => {
    setSubmissions(prev => prev.map(sub => {
      if (sub.id === submissionId) {
        return {
          ...sub,
          grade: parseFloat(grade),
          feedback,
          status: 'graded'
        };
      }
      return sub;
    }));
  };

  const sendTutorMessage = (text) => {
    const userMsg = { sender: 'user', text };
    setTutorChat(prev => [...prev, userMsg]);

    setTimeout(() => {
      let replyText = 'Mình chưa rõ câu hỏi lắm, bạn có thể đưa thêm chi tiết về bài tập được không?';
      const normalized = text.toLowerCase();
      
      if (normalized.includes('toán') || normalized.includes('phương trình') || normalized.includes('tích phân')) {
        replyText = `### 📐 Giải đáp môn Toán học:\n\nĐể giải bài tập về Tích phân lớp 12, bạn cần ghi nhớ phương pháp **Tích phân từng phần**:\n$$\\int u \\, dv = u \\cdot v - \\int v \\, du$$\n\n**Mẹo nhỏ đặt u:** *"Nhất lô, nhì đa, tam lượng, tứ mũ"*. \n\n*Ví dụ:* Với $\\int x \\ln(x) \\, dx$, ta đặt $u = \\ln(x)$ và $dv = x \\, dx$. Cần gia sư giải chi tiết bài toán cụ thể nào không, nhắn đề bài cho mình nhé!`;
      } else if (normalized.includes('văn') || normalized.includes('phân tích') || normalized.includes('vợ nhặt') || normalized.includes('vợ chồng a phủ')) {
        replyText = `### 📖 Gợi ý làm văn môn Ngữ Văn:\n\nKhi làm bài phân tích tác phẩm **"Vợ chồng A Phủ"** (Tô Hoài), bạn cần chú ý triển khai các luận điểm cốt lõi sau:\n\n1. **Sự thống trị tàn bạo của thế lực phong kiến miền núi** (Nhà thống lý Pá Tra dìm cuộc đời Mị và A Phủ vào kiếp nô lệ, áp bức bằng thần quyền và cường quyền).\n2. **Sức sống tiềm tàng mạnh mẽ của Mị** (Mặc dù bị tê liệt tinh thần, Mị vẫn khát khao tự do trong đêm tình mùa xuân và hành động cởi trói cứu A Phủ, cứu chính mình).\n3. **Giá trị hiện thực và giá trị nhân đạo sâu sắc**.\n\nHãy lập dàn ý chi tiết từng bước để bài viết có chiều sâu bạn nhé!`;
      } else if (normalized.includes('lý') || normalized.includes('vật lý') || normalized.includes('xoay chiều') || normalized.includes('rlc')) {
        replyText = `### ⚛️ Giải đáp môn Vật lý:\n\nĐối với mạch điện xoay chiều RLC nối tiếp, công thức tính **Tổng trở** toàn mạch là:\n$$Z = \\sqrt{R^2 + (Z_L - Z_C)^2}$$\n\n- Khi có cộng hưởng điện ($Z_L = Z_C$), tổng trở cực tiểu $Z_{min} = R$, dòng điện trong mạch đạt cực đại $I_{max} = U/R$.\n- Độ lệch pha giữa u và i: $\\tan \\varphi = \\frac{Z_L - Z_C}{R}$.\n\nBạn hãy kiểm tra xem bài toán có đang xảy ra cộng hưởng không nhé!`;
      } else if (normalized.includes('hóa') || normalized.includes('phản ứng') || normalized.includes('kim loại')) {
        replyText = `### 🧪 Hỗ trợ học tập môn Hóa học:\n\nPhương trình phản ứng tổng quát của kim loại kiềm tác dụng với nước:\n$$2\\text{M} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{MOH} + \\text{H}_2\\uparrow$$\n\n- Các kim loại hoạt động hóa học mạnh nhóm IA (Na, K, Li...) phản ứng mãnh liệt tỏa nhiều nhiệt, sinh khí Hydro phản ứng cháy nổ trong không khí.\n- Dung dịch thu được làm quỳ tím hóa xanh (môi trường kiềm).`;
      } else {
        replyText = `### 🤖 Gia sư AI 24/7 phản hồi:\n\nChào bạn, mình đã ghi nhận câu hỏi. Để giúp bạn học tốt nhất, bạn có thể gửi đề bài cụ thể (chép nguyên văn đề bài hoặc công thức) được không? \n\nMình có thể hỗ trợ các môn học cấp THPT như **Toán, Lý, Hóa, Văn, Anh**. Rất vui được đồng hành cùng bạn!`;
      }

      setTutorChat(prev => [...prev, { sender: 'tutor', text: replyText }]);
    }, 1200);
  };

  // Actions for RFID Điểm Danh
  const logAttendance = (studentId, status, checkInTime) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    setAttendanceLogs(prev => [
      ...prev,
      {
        id: `AT${String(Date.now()).slice(-4)}`,
        studentId,
        studentName: student.name,
        status,
        checkInTime,
        date: '2026-06-03' // Mock today date
      }
    ]);
  };

  // Actions for Câu Lạc Bộ
  const submitClubApplication = (studentId, clubId, introduction) => {
    const student = students.find(s => s.id === studentId);
    const club = clubs.find(c => c.id === clubId);
    if (!student || !club) return;
    setClubApplications(prev => [
      ...prev,
      {
        id: `CA${String(Date.now()).slice(-4)}`,
        studentId,
        studentName: student.name,
        clubId,
        clubName: club.name,
        status: 'pending',
        introduction
      }
    ]);
  };

  const reviewClubApplication = (applicationId, status) => {
    setClubApplications(prev => prev.map(app => {
      if (app.id === applicationId) {
        if (status === 'approved') {
          setClubs(cPrev => cPrev.map(c => {
            if (c.id === app.clubId) {
              return { ...c, membersCount: c.membersCount + 1 };
            }
            return c;
          }));
        }
        return { ...app, status };
      }
      return app;
    }));
  };

  const approveClubBudget = (clubId, budgetApproved) => {
    setClubs(prev => prev.map(c => {
      if (c.id === clubId) {
        return { ...c, budgetApproved: parseFloat(budgetApproved), status: 'active' };
      }
      return c;
    }));
  };

  // Actions for Học Liệu
  const uploadResource = (subject, title, fileType, teacherName) => {
    setLearningResources(prev => [
      ...prev,
      {
        id: `R${String(Date.now()).slice(-4)}`,
        subject,
        title,
        fileType,
        teacherName,
        dateUploaded: '2026-06-03'
      }
    ]);
  };

  // Actions for Flashcards
  const createFlashcard = (studentId, front, back) => {
    setFlashcards(prev => [
      ...prev,
      {
        id: `FC${String(Date.now()).slice(-4)}`,
        studentId,
        front,
        back
      }
    ]);
  };

  const deleteFlashcard = (flashcardId) => {
    setFlashcards(prev => prev.filter(fc => fc.id !== flashcardId));
  };

  // Actions for Career Tests
  const saveCareerTest = (studentId, scoreRiasec) => {
    setCareerTestScores(prev => {
      const exists = prev.some(s => s.studentId === studentId);
      if (exists) {
        return prev.map(s => s.studentId === studentId ? { ...s, ...scoreRiasec } : s);
      }
      return [...prev, { studentId, ...scoreRiasec }];
    });
  };

  const saveMockExamResult = (result) => {
    setMockExamHistory(prev => {
      const newResult = {
        id: 'MEH' + String(prev.length + 1).padStart(3, '0') + '_' + Math.floor(Math.random() * 1000),
        ...result,
        date: new Date().toISOString().split('T')[0]
      };
      return [newResult, ...prev];
    });
  };

  const addCustomExam = (exam) => {
    setCustomExams(prev => {
      const newExam = {
        id: 'EXAM_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        ...exam,
        createdDate: new Date().toISOString().split('T')[0]
      };
      return [newExam, ...prev];
    });
  };

  // Actions for Cafeteria & Wallet
  const registerCafeteriaMeal = (studentId, date, mealType, payViaWallet) => {
    const price = 35000;
    if (payViaWallet) {
      const wallet = studentWallets[studentId] || { balance: 0, dailyLimit: 100000, transactions: [] };
      const todaySpend = wallet.transactions
        .filter(t => t.date === date && t.type === 'spend')
        .reduce((sum, t) => sum + t.amount, 0);
      if (wallet.balance < price) {
        alert('Số dư ví điện tử của học sinh không đủ để thanh toán!');
        return false;
      }
      if (todaySpend + price > wallet.dailyLimit) {
        alert('Vượt quá hạn mức tiêu dùng hôm nay của học sinh!');
        return false;
      }
      setStudentWallets(prev => {
        const w = prev[studentId] || { balance: 0, dailyLimit: 100000, transactions: [] };
        const updated = {
          ...w,
          balance: w.balance - price,
          transactions: [
            {
              id: `TX${String(Date.now()).slice(-4)}`,
              date,
              amount: price,
              type: 'spend',
              description: `Đăng ký bán trú ngày ${date.split('-').reverse().join('/')}`
            },
            ...w.transactions
          ]
        };
        return { ...prev, [studentId]: updated };
      });
    }
    setCafeteriaRegistrations(prev => {
      const existsIdx = prev.findIndex(r => r.studentId === studentId && r.date === date);
      if (existsIdx > -1) {
        return prev.map((r, i) => i === existsIdx ? { ...r, status: 'registered', mealType, paid: payViaWallet } : r);
      }
      return [
        ...prev,
        {
          id: `R-${studentId}-${Date.now().toString().slice(-4)}`,
          studentId,
          date,
          status: 'registered',
          mealType,
          price,
          paid: payViaWallet
        }
      ];
    });
    return true;
  };

  const cancelCafeteriaMeal = (studentId, date) => {
    setCafeteriaRegistrations(prev => prev.map(r => {
      if (r.studentId === studentId && r.date === date) {
        if (r.paid && r.status === 'registered') {
          setStudentWallets(wPrev => {
            const w = wPrev[studentId] || { balance: 0, dailyLimit: 100000, transactions: [] };
            const updated = {
              ...w,
              balance: w.balance + r.price,
              transactions: [
                {
                  id: `TX${String(Date.now()).slice(-4)}`,
                  date,
                  amount: r.price,
                  type: 'topup',
                  description: `Hoàn tiền hủy bán trú ngày ${date.split('-').reverse().join('/')}`
                },
                ...w.transactions
              ]
            };
            return { ...wPrev, [studentId]: updated };
          });
        }
        return { ...r, status: 'cancelled', paid: false };
      }
      return r;
    }));
  };

  const submitMealFeedback = (studentId, rating, comment) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    setCafeteriaFeedback(prev => [
      {
        id: `CF${String(Date.now()).slice(-4)}`,
        studentId,
        studentName: student.name,
        date: '2026-06-03',
        rating: parseInt(rating),
        comment
      },
      ...prev
    ]);
  };

  const topUpStudentWallet = (studentId, amount) => {
    const cleanAmount = parseFloat(amount);
    setStudentWallets(prev => {
      const w = prev[studentId] || { balance: 0, dailyLimit: 100000, transactions: [] };
      const updated = {
        ...w,
        balance: w.balance + cleanAmount,
        transactions: [
          {
            id: `TX${String(Date.now()).slice(-4)}`,
            date: '2026-06-03',
            amount: cleanAmount,
            type: 'topup',
            description: 'Phụ huynh nạp tiền vào ví'
          },
          ...w.transactions
        ]
      };
      return { ...prev, [studentId]: updated };
    });
  };

  const updateStudentWalletLimit = (studentId, limit) => {
    const cleanLimit = parseFloat(limit);
    setStudentWallets(prev => {
      const w = prev[studentId] || { balance: 0, dailyLimit: 100000, transactions: [] };
      return { ...prev, [studentId]: { ...w, dailyLimit: cleanLimit } };
    });
  };

  const spendStudentWallet = (studentId, amount, description) => {
    const cleanAmount = parseFloat(amount);
    const wallet = studentWallets[studentId] || { balance: 0, dailyLimit: 100000, transactions: [] };
    const todaySpend = wallet.transactions
      .filter(t => t.date === '2026-06-03' && t.type === 'spend')
      .reduce((sum, t) => sum + t.amount, 0);
    if (wallet.balance < cleanAmount) {
      alert('Số dư ví không đủ để thanh toán!');
      return false;
    }
    if (todaySpend + cleanAmount > wallet.dailyLimit) {
      alert('Giao dịch vượt quá hạn mức chi tiêu hôm nay!');
      return false;
    }
    setStudentWallets(prev => {
      const w = prev[studentId] || { balance: 0, dailyLimit: 100000, transactions: [] };
      const updated = {
        ...w,
        balance: w.balance - cleanAmount,
        transactions: [
          {
            id: `TX${String(Date.now()).slice(-4)}`,
            date: '2026-06-03',
            amount: cleanAmount,
            type: 'spend',
            description
          },
          ...w.transactions
        ]
      };
      return { ...prev, [studentId]: updated };
    });
    alert('Thanh toán thành công qua ví điện tử!');
    return true;
  };

  const addDeadline = (deadline) => {
    const newItem = {
      id: `DL${Date.now()}`,
      type: 'personal',
      color: '#6366f1',
      priority: 'medium',
      classTarget: 'personal',
      done: false,
      ...deadline
    };
    setDeadlines(prev => [...prev, newItem]);
  };

  const toggleDeadlineDone = (id) => {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, done: !d.done } : d));
  };

  const deleteDeadline = (id) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
  };

  // ── Notification Actions ─────────────────────────────────────────────────
  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const addNotification = (notif) => {
    const id = 'N' + Date.now();
    setNotifications(prev => [{ ...notif, id, read: false, date: new Date().toISOString().split('T')[0] }, ...prev]);
  };

  // ── Direct Message Actions ───────────────────────────────────────────────
  const sendDirectMessage = (fromId, fromName, fromRole, toId, toName, toRole, text) => {
    const id = 'DM' + Date.now();
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const date = now.toISOString().split('T')[0];
    setDirectMessages(prev => [...prev, { id, fromId, fromName, fromRole, toId, toName, toRole, text, date, time, read: false }]);
  };
  const markMessageRead = (conversationPartners) => {
    setDirectMessages(prev => prev.map(m => conversationPartners.includes(m.fromId) ? { ...m, read: true } : m));
  };

  // ── Bulletin Actions ─────────────────────────────────────────────────────
  const addBulletin = (bulletin) => {
    const id = 'B' + Date.now();
    setBulletins(prev => [{ ...bulletin, id, readBy: [], date: new Date().toISOString().split('T')[0] }, ...prev]);
  };
  const confirmBulletinRead = (userId, bulletinId) => {
    setBulletins(prev => prev.map(b => b.id === bulletinId && !b.readBy.includes(userId)
      ? { ...b, readBy: [...b.readBy, userId] } : b));
  };

  // ── Meeting Booking Actions ──────────────────────────────────────────────
  const requestMeeting = (booking) => {
    const id = 'MB' + Date.now();
    setMeetingBookings(prev => [...prev, { ...booking, id, status: 'pending', note: '' }]);
    addNotification({ type: 'meeting', title: 'Yêu cầu gặp mặt mới', body: `${booking.parentName} muốn đặt lịch gặp ngày ${booking.date}`, targetRole: 'teacher', targetId: booking.teacherId });
  };
  const confirmMeeting = (id, note) => {
    setMeetingBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed', note: note || '' } : b));
  };
  const cancelMeeting = (id) => {
    setMeetingBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  // ── Community Exam Actions ───────────────────────────────────────────────
  const addToRepository = (exam) => {
    const id = 'CE' + Date.now();
    setCommunityExams(prev => [{ ...exam, id, usedCount: 0, upvotes: 0, downvotes: 0, date: new Date().toISOString().split('T')[0] }, ...prev]);
  };
  const voteExam = (id, voteType) => {
    setCommunityExams(prev => prev.map(e => e.id === id
      ? { ...e, upvotes: voteType === 'up' ? e.upvotes + 1 : e.upvotes, downvotes: voteType === 'down' ? e.downvotes + 1 : e.downvotes }
      : e));
  };

  // ── School Asset Actions ─────────────────────────────────────────────────
  const bookAsset = (assetId, booking) => {
    const id = 'AB' + Date.now();
    setSchoolAssets(prev => prev.map(a => a.id === assetId
      ? { ...a, bookings: [...a.bookings, { ...booking, id, approved: false }] } : a));
  };
  const approveAssetBooking = (assetId, bookingId) => {
    setSchoolAssets(prev => prev.map(a => a.id === assetId
      ? { ...a, bookings: a.bookings.map(b => b.id === bookingId ? { ...b, approved: true } : b) } : a));
  };

  // ── Teacher Attendance Actions ───────────────────────────────────────────
  const checkInTeacher = (teacherId, teacherName) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const date = now.toISOString().split('T')[0];
    const status = now.getHours() < 7 || (now.getHours() === 7 && now.getMinutes() <= 15) ? 'ontime' : 'late';
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const id = 'TA' + Date.now();
    setTeacherAttendance(prev => [...prev, { id, teacherId, teacherName, date, checkInTime: time, status, pin }]);
  };

  // ── Payment Mock Action ──────────────────────────────────────────────────
  const processPayment = (studentId, feeId) => {
    setStudents(prev => prev.map(s => s.id === studentId
      ? { ...s, feeStatus: s.feeStatus.map(f => f.id === feeId ? { ...f, paid: true } : f) } : s));
    addNotification({ type: 'fee', title: 'Thanh toán thành công', body: `Học phí đã được thanh toán thành công qua VietQR`, targetRole: 'parent', targetId: studentId });
  };

  // ── Global Search ────────────────────────────────────────────────────────
  const globalSearch = (query) => {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const results = [];
    students.forEach(s => {
      if (s.name.toLowerCase().includes(q) || s.class.toLowerCase().includes(q))
        results.push({ type: 'student', id: s.id, title: s.name, subtitle: `Lớp ${s.class}`, tab: 'students' });
    });
    teachers.forEach(t => {
      if (t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))
        results.push({ type: 'teacher', id: t.id, title: t.name, subtitle: t.subject, tab: 'teachers' });
    });
    bulletins.forEach(b => {
      if (b.title.toLowerCase().includes(q) || b.content.toLowerCase().includes(q))
        results.push({ type: 'bulletin', id: b.id, title: b.title, subtitle: b.authorName, tab: 'bulletin' });
    });
    assignments.forEach(a => {
      if (a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q))
        results.push({ type: 'assignment', id: a.id, title: a.title, subtitle: a.subject, tab: 'dashboard' });
    });
    return results.slice(0, 20);
  };

  return (
    <AppContext.Provider value={{
      theme,
      userSession,
      setUserSession,
      currentRole,
      setCurrentRole,
      studentSubTab,
      setStudentSubTab,
      selectedStudentId,
      setSelectedStudentId,
      mockExamHistory,
      saveMockExamResult,
      customExams,
      addCustomExam,
      teachers,
      students,
      announcements,
      journalEntries,
      parentQAs,
      tutorChat,
      videoLessons: initialVideoLessons,
      leaveRequests,
      teacherLeaveRequests,
      submitTeacherLeaveRequest,
      approveTeacherLeaveRequest,
      lessonPlans,
      conductLogs,
      teacherEvaluations,
      assignments,
      deadlines,
      addDeadline,
      toggleDeadlineDone,
      deleteDeadline,
      submissions,
      attendanceLogs,
      clubs,
      clubApplications,
      learningResources,
      flashcards,
      careerTestScores,
      cafeteriaMenu,
      cafeteriaRegistrations,
      cafeteriaFeedback,
      studentWallets,
      studentCompetencies,
      logout,
      addStudent,
      editStudentGrades,
      addTeacher,
      addAnnouncement,
      addJournalEntry,
      signJournalEntry,
      signParentReport,
      payStudentFee,
      createFeeItem,
      askParentQuestion,
      answerParentQuestion,
      submitLeaveRequest,
      approveLeaveRequest,
      submitLessonPlan,
      reviewLessonPlan,
      addConductLog,
      submitTeacherEvaluation,
      createAssignment,
      submitAssignment,
      gradeSubmission,
      sendTutorMessage,
      logAttendance,
      submitClubApplication,
      reviewClubApplication,
      approveClubBudget,
      uploadResource,
      createFlashcard,
      deleteFlashcard,
      saveCareerTest,
      registerCafeteriaMeal,
      cancelCafeteriaMeal,
      submitMealFeedback,
      topUpStudentWallet,
      updateStudentWalletLimit,
      spendStudentWallet,
      notifications, markNotificationRead, markAllNotificationsRead, addNotification,
      directMessages, sendDirectMessage, markMessageRead,
      bulletins, addBulletin, confirmBulletinRead,
      meetingBookings, requestMeeting, confirmMeeting, cancelMeeting,
      communityExams, addToRepository, voteExam,
      schoolAssets, bookAsset, approveAssetBooking,
      teacherAttendance, checkInTeacher,
      processPayment,
      globalSearch,
    }}>
      {children}
    </AppContext.Provider>
  );
};
