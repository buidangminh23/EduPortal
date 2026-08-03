import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  FileText,
  GraduationCap,
  Award,
  Calendar,
  ClipboardCheck,
  CheckSquare,
  Library,
  UsersRound,
  Brain,
  UtensilsCrossed,
  CreditCard,
  Star,
  Activity,
  AlarmClock,
  ClipboardList,
  Megaphone,
  MessageCircle,
  CalendarCheck,
  BookMarked,
  Trophy,
  Layers,
  Clock,
  FlaskConical,
  Bus,
  Target,
  AlertTriangle,
  Camera,
  Sparkles,
  Compass,
  Calculator,
  LogOut
} from 'lucide-react';


// Section-based nav items for Student Dashboard
const STUDENT_SECTIONS = [
  {
    title: 'HỌC TẬP & THÔNG TIN TRƯỜNG',
    items: [
      { id: 'overview',           label: 'Tổng Quan Học Tập',     icon: LayoutDashboard, isSubTab: true },
      { id: 'calendar',           label: 'Thời Khóa Biểu',       icon: Calendar,        isSubTab: false },
      { id: 'bulletin',           label: 'Bảng Tin Trường',      icon: Megaphone,       isSubTab: false },
      { id: 'deadlines',          label: 'Deadline & Lịch Thi',    icon: AlarmClock,      isSubTab: true },
      { id: 'assignments',        label: 'Bài Tập Về Nhà',        icon: CheckSquare,     isSubTab: true },
      { id: 'attendance',         label: 'Điểm Danh Chuyên Cần',  icon: ClipboardCheck,  isSubTab: true },
      { id: 'conduct',            label: 'Điểm Rèn Luyện',        icon: Award,           isSubTab: true },
    ]
  },
  {
    title: 'TRỢ LÝ HỌC TẬP & HỌC LIỆU',
    items: [
      { id: 'library',            label: 'Học Liệu & Flashcards',  icon: Library,         isSubTab: true },
      { id: 'mock_exams',         label: 'Thi Thử Đại Học',       icon: ClipboardList,   isSubTab: true },
      { id: 'study_plan',         label: 'Kế Hoạch Ôn Thi',    icon: Target,          isSubTab: true },
      { id: 'competency_heatmap', label: 'Bản Đồ Năng Lực',   icon: Activity,        isSubTab: true },
      { id: 'essay_grader',       label: 'Chấm Bài Luận Tự Động',     icon: FileText,        isSubTab: false },
      { id: 'weblab',             label: 'Phòng Thí Nghiệm Ảo',  icon: FlaskConical,    isSubTab: false },
      { id: 'casio580',           label: 'Máy Tính Casio fx-580', icon: Calculator,      isSubTab: true },
    ]
  },
  {
    title: 'TƯ VẤN & THÀNH TÍCH',
    items: [
      { id: 'counseling',         label: 'Tư Vấn & Hướng Nghiệp', icon: Brain,           isSubTab: true },
      { id: 'university_matchmaker', label: 'Đối Chiếu Điểm Chuẩn ĐH', icon: GraduationCap, isSubTab: true },
      { id: 'gamification',       label: 'Thành Tích & Xếp Hạng', icon: Trophy,          isSubTab: false },
      { id: 'portfolio',          label: 'Học Bạ Số & CV',       icon: BookMarked,      isSubTab: false },
    ]
  },
  {
    title: 'ĐỜI SỐNG & CỘNG ĐỒNG',
    items: [
      { id: 'class_chat',         label: 'Chat Nhóm Lớp',         icon: MessageSquare,   isSubTab: true },
      { id: 'clubs',              label: 'Câu Lạc Bộ',            icon: UsersRound,      isSubTab: true },
      { id: 'tournament',         label: 'Cuộc Thi Thách Đấu',    icon: Trophy,          isSubTab: true },
      { id: 'cafeteria',          label: 'Bán Trú & Dinh Dưỡng',  icon: UtensilsCrossed, isSubTab: true },
      { id: 'wallet_id',          label: 'Thẻ HS & Ví Điện Tử',  icon: CreditCard,      isSubTab: true },
      { id: 'bus_tracker',        label: 'Xe Bus Học Đường',     icon: Bus,             isSubTab: false },
    ]
  }
];

// Section-based nav items for Teacher Dashboard
const TEACHER_SECTIONS = [
  {
    title: 'QUẢN LÝ LỚP & GIẢNG DẠY',
    items: [
      { id: 'students',           label: 'Học Sinh & Điểm Số',    icon: Users,           isSubTab: true },
      { id: 'calendar',           label: 'Thời Khóa Biểu',       icon: Calendar,        isSubTab: false },
      { id: 'bulletin',           label: 'Bảng Tin Trường',      icon: Megaphone,       isSubTab: false },
      { id: 'attendance',         label: 'Điểm Danh Lớp',         icon: ClipboardCheck,  isSubTab: true },
      { id: 'conduct',            label: 'Điểm Rèn Luyện Lớp',     icon: Award,           isSubTab: true },
      { id: 'journal',            label: 'Ghi Sổ Đầu Bài',       icon: BookOpen,        isSubTab: false },
      { id: 'seating_chart',      label: 'Sơ Đồ Chỗ Ngồi Lớp',   icon: Layers,          isSubTab: false },
      { id: 'class_voting',       label: 'Bầu Chọn Ban Cán Sự',  icon: ClipboardCheck,  isSubTab: false },
    ]
  },
  {
    title: 'CÔNG CỤ HỖ TRỢ & GIÁO ÁN',
    items: [
      { id: 'lesson_plans',       label: 'Kế Hoạch Giáo Án',       icon: FileText,        isSubTab: true },
      { id: 'ai_planner',         label: 'Trợ Lý Soạn Bài',    icon: Sparkles,        isSubTab: true },
      { id: 'ai_tutor_trainer',   label: 'Huấn Luyện Trợ Lý Học Tập',  icon: Compass,         isSubTab: true },
      { id: 'resources',          label: 'Học Liệu Bài Giảng',     icon: BookOpen,        isSubTab: true },
      { id: 'exam_repository',    label: 'Kho Đề Thi',           icon: BookMarked,      isSubTab: false },
      { id: 'essay_grader',       label: 'Chấm Bài Luận Tự Động',     icon: FileText,        isSubTab: false },
      { id: 'casio580',           label: 'Máy Tính Casio fx-580', icon: Calculator,      isSubTab: false },
      { id: 'ai_risk',            label: 'Cảnh Báo Học Sinh Nguy Cơ',  icon: AlertTriangle,   isSubTab: false },
    ]
  },
  {
    title: 'LIÊN LẠC PHỤ HUYNH & HÀNH CHÍNH',
    items: [
      { id: 'chat',               label: 'Nhắn Tin Phụ Huynh',   icon: MessageCircle,   isSubTab: false },
      { id: 'qa',                 label: 'Hỏi Đáp Phụ Huynh',     icon: MessageSquare,   isSubTab: true },
      { id: 'meeting_booking',    label: 'Lịch Hẹn Gặp Mặt',    icon: CalendarCheck,   isSubTab: false },
      { id: 'leaves',             label: 'Duyệt Nghỉ Phép',       icon: Calendar,        isSubTab: true },
      { id: 'teacher_leaves',     label: 'Nghỉ Phép & Dạy Thay',   icon: Clock,           isSubTab: true },
      { id: 'duty_schedule',      label: 'Lịch Trực Tuần GV',    icon: Calendar,        isSubTab: false },
      { id: 'asset_manager',      label: 'Đặt Phòng & Thiết Bị',  icon: Layers,          isSubTab: false },
    ]
  }
];

// Section-based nav items for Principal / Admin
const ADMIN_SECTIONS = [
  {
    title: 'QUẢN TRỊ TRƯỜNG HỌC',
    items: [
      { id: 'dashboard',          label: 'Tổng Quan BGH',        icon: LayoutDashboard, isSubTab: false },
      { id: 'calendar',           label: 'Thời Khóa Biểu',       icon: Calendar,        isSubTab: false },
      { id: 'bulletin',           label: 'Bảng Tin Trường',      icon: Megaphone,       isSubTab: false },
      { id: 'teachers',           label: 'Quản Lý Giáo Viên',    icon: GraduationCap,   isSubTab: false },
      { id: 'students',           label: 'Quản Lý Học Sinh',     icon: Users,           isSubTab: false },
      { id: 'portfolio',          label: 'Học Bạ Số & CV',       icon: BookMarked,      isSubTab: false },
      { id: 'journal',            label: 'Sổ Đầu Bài Điện Tử',   icon: BookOpen,        isSubTab: false },
    ]
  },
  {
    title: 'CÔNG CỤ PHÂN TÍCH',
    items: [
      { id: 'ai_risk',            label: 'Phân Tích Nguy Cơ', icon: AlertTriangle,   isSubTab: false },
      { id: 'class_comparison',   label: 'So Sánh Các Lớp',      icon: Activity,        isSubTab: false },
      { id: 'timetable_generator', label: 'Xếp TKB Thông Minh',  icon: Calendar,        isSubTab: false },
      { id: 'exam_repository',    label: 'Kho Đề Thi Trường',    icon: BookMarked,      isSubTab: false },
    ]
  },
  {
    title: 'VẬN HÀNH & TRUYỀN THÔNG',
    items: [
      { id: 'duty_schedule',      label: 'Phân Công Lịch Trực',  icon: Calendar,        isSubTab: false },
      { id: 'asset_manager',      label: 'Tài Sản & Thiết Bị',   icon: Layers,          isSubTab: false },
      { id: 'bus_tracker',        label: 'Xe Bus Học Đường',     icon: Bus,             isSubTab: false },
      { id: 'school_gallery',     label: 'Album Sự Kiện Trường', icon: Camera,          isSubTab: false },
    ]
  }
];

// Section-based nav items for Parent Dashboard
const PARENT_SECTIONS = [
  {
    title: 'THEO DÕI HỌC TẬP & THÔNG TIN',
    items: [
      { id: 'grades',             label: 'Bảng Điểm & Ký Nhận',   icon: Award,           isSubTab: true },
      { id: 'calendar',           label: 'Thời Khóa Biểu',       icon: Calendar,        isSubTab: false },
      { id: 'bulletin',           label: 'Bảng Tin Trường',      icon: Megaphone,       isSubTab: false },
      { id: 'attendance',         label: 'Chuyên Cần Của Con',    icon: ClipboardCheck,  isSubTab: true },
      { id: 'assignments',        label: 'Xem Bài Tập Về Nhà',    icon: CheckSquare,     isSubTab: true },
      { id: 'seating_chart',      label: 'Sơ Đồ Chỗ Ngồi Lớp',   icon: Layers,          isSubTab: false },
    ]
  },
  {
    title: 'TÀI CHÍNH & BÁN TRÚ',
    items: [
      { id: 'fees',               label: 'Học Phí & Đóng Tiền',   icon: CreditCard,      isSubTab: true },
      { id: 'cafeteria',          label: 'Bán Trú & Dinh Dưỡng',  icon: UtensilsCrossed, isSubTab: true },
      { id: 'wallet',             label: 'Ví Điện Tử Con',        icon: CreditCard,      isSubTab: true },
      { id: 'bus_tracker',        label: 'Xe Bus Học Đường',     icon: Bus,             isSubTab: false },
    ]
  },
  {
    title: 'LIÊN LẠC NHÀ TRƯỜNG',
    items: [
      { id: 'chat',               label: 'Nhắn Tin Giáo Viên',   icon: MessageCircle,   isSubTab: false },
      { id: 'qa',                 label: 'Hỏi Đáp Chủ Nhiệm',     icon: MessageSquare,   isSubTab: true },
      { id: 'meeting_booking',    label: 'Đặt Lịch Gặp Mặt',    icon: CalendarCheck,   isSubTab: false },
      { id: 'leaves',             label: 'Xin Nghỉ Phép',         icon: Calendar,        isSubTab: true },
      { id: 'evaluations',        label: 'Đánh Giá Giáo Viên',    icon: Star,            isSubTab: true },
      { id: 'ai_guidance',        label: 'Định Hướng Nghề Nghiệp',         icon: Sparkles,        isSubTab: true },
    ]
  }
];

const DICT_EN = {
  // Section Headers
  'HỌC TẬP & THÔNG TIN TRƯỜNG': 'ACADEMICS & SCHOOL NEWS',
  'TRỢ LÝ HỌC TẬP & HỌC LIỆU': 'STUDY TOOLS & MATERIALS',
  'TƯ VẤN & THÀNH TÍCH': 'COUNSELING & AWARDS',
  'ĐỜI SỐNG & CỘNG ĐỒNG': 'SCHOOL LIFE & COMMUNITY',
  'QUẢN LÝ LỚP & GIẢNG DẠY': 'CLASS & TEACHING',
  'CÔNG CỤ HỖ TRỢ & GIÁO ÁN': 'TEACHING TOOLS & LESSON PLANS',
  'LIÊN LẠC PHỤ HUYNH & HÀNH CHÍNH': 'PARENT RELATIONS & ADMIN',
  'QUẢN TRỊ TRƯỜNG HỌC': 'SCHOOL ADMINISTRATION',
  'CÔNG CỤ PHÂN TÍCH': 'ACADEMIC ANALYTICS',
  'VẬN HÀNH & TRUYỀN THÔNG': 'OPERATIONS & COMMUNICATIONS',
  'THEO DÕI HỌC TẬP & THÔNG TIN': 'CHILD ACADEMICS & NEWS',
  'TÀI CHÍNH & BÁN TRÚ': 'FINANCES & BOARDING',
  'LIÊN LẠC NHÀ TRƯỜNG': 'SCHOOL COMMUNICATION',

  // Item Labels
  'Tổng Quan Học Tập': 'Academic Overview',
  'Thời Khóa Biểu': 'School Timetable',
  'Bảng Tin Trường': 'School Bulletin',
  'Deadline & Lịch Thi': 'Deadlines & Exams',
  'Bài Tập Về Nhà': 'Homework & Assignments',
  'Học Liệu & Flashcards': 'Materials & Flashcards',
  'Thi Thử Đại Học': 'Mock Entrance Exam',
  'Kế Hoạch Ôn Thi': 'Study Plan',
  'Bản Đồ Năng Lực': 'Competency Heatmap',
  'Điểm Danh Chuyên Cần': 'Attendance Tracking',
  'Điểm Rèn Luyện': 'Conduct & Behavior',
  'Chat Nhóm Lớp': 'Class Group Chat',
  'Cuộc Thi Thách Đấu': 'Challenge Competitions',
  'Câu Lạc Bộ': 'Student Clubs',
  'Tư Vấn & Hướng Nghiệp': 'Counseling & Career',
  'Đối Chiếu Điểm Chuẩn ĐH': 'University Benchmark Match',
  'Bán Trú & Dinh Dưỡng': 'Boarding & Meals',
  'Thẻ HS & Ví Điện Tử': 'Student ID & Wallet',
  'Máy Tính Casio fx-580': 'Casio fx-580 Calculator',
  'Chấm Bài Luận Tự Động': 'Automated Essay Feedback',
  'Phòng Thí Nghiệm Ảo': 'Virtual Science Lab',
  'Thành Tích & Xếp Hạng': 'Leaderboard & Badges',
  'Học Bạ Số & CV': 'Digital Portfolio & CV',
  'Xe Bus Học Đường': 'School Bus Tracker',
  'Học Sinh & Điểm Số': 'Students & Grades',
  'Điểm Danh Lớp': 'Class Attendance',
  'Điểm Rèn Luyện Lớp': 'Class Conduct',
  'Ghi Sổ Đầu Bài': 'Class Journal Entry',
  'Sơ Đồ Chỗ Ngồi Lớp': 'Class Seating Chart',
  'Bầu Chọn Ban Cán Sự': 'Class Officer Voting',
  'Kế Hoạch Giáo Án': 'Lesson Plans',
  'Trợ Lý Soạn Bài': 'Lesson Planning Assistant',
  'Huấn Luyện Trợ Lý Học Tập': 'Tutor Knowledge Training',
  'Học Liệu Bài Giảng': 'Lecture Materials',
  'Kho Đề Thi': 'Exam Repository',
  'Cảnh Báo Học Sinh Nguy Cơ': 'At-Risk Student Alerts',
  'Nhắn Tin Phụ Huynh': 'Parent Messaging',
  'Hỏi Đáp Phụ Huynh': 'Parent Q&A',
  'Lịch Hẹn Gặp Mặt': 'Meeting Schedule',
  'Duyệt Nghỉ Phép': 'Approve Leaves',
  'Nghỉ Phép & Dạy Thay': 'Leaves & Substitutions',
  'Lịch Trực Tuần GV': 'Weekly Duty Schedule',
  'Đặt Phòng & Thiết Bị': 'Asset & Room Booking',
  'Tổng Quan BGH': 'Board Dashboard Overview',
  'Quản Lý Giáo Viên': 'Teacher Management',
  'Quản Lý Học Sinh': 'Student Management',
  'Sổ Đầu Bài Điện Tử': 'Digital Class Journal',
  'Phân Tích Nguy Cơ': 'Risk Analysis',
  'So Sánh Các Lớp': 'Class Comparison',
  'Xếp TKB Thông Minh': 'Smart Timetable Generator',
  'Kho Đề Thi Trường': 'School Exam Repository',
  'Phân Công Lịch Trực': 'Duty Roster Assignment',
  'Tài Sản & Thiết Bị': 'School Assets & Equipment',
  'Album Sự Kiện Trường': 'School Event Gallery',
  'Bảng Điểm & Ký Nhận': 'Report Card & Signature',
  'Chuyên Cần Của Con': 'Child Attendance',
  'Xem Bài Tập Về Nhà': 'View Child Homework',
  'Học Phí & Đóng Tiền': 'Tuition & Payment',
  'Ví Điện Tử Con': 'Child Wallet',
  'Nhắn Tin Giáo Viên': 'Message Teacher',
  'Hỏi Đáp Chủ Nhiệm': 'Homeroom Teacher Q&A',
  'Đặt Lịch Gặp Mặt': 'Book Parent-Teacher Meeting',
  'Xin Nghỉ Phép': 'Request Leave',
  'Đánh Giá Giáo Viên': 'Teacher Evaluation',
  'Định Hướng Nghề Nghiệp': 'Career Guidance'
};

export default function Sidebar({ activeTab, setActiveTab }) {
  const {
    currentRole,
    selectedStudentId,
    students,
    teachers,
    studentSubTab,
    setStudentSubTab,
    teacherSubTab,
    setTeacherSubTab,
    parentSubTab,
    setParentSubTab,
    conductLogs,
    assignments,
    teacherEvaluations,
    deadlines,
    parentQAs,
    leaveRequests,
    teacherLeaveRequests,
    lessonPlans,
    logout,
    t
  } = useContext(AppContext);


  const isStudent = currentRole === 'student';
  const isTeacherSubject = currentRole === 'teacher_subject';
  const isTeacherHomeroom = currentRole === 'teacher_homeroom';
  const isTeacher = currentRole === 'teacher' || isTeacherSubject || isTeacherHomeroom;
  const isParent = currentRole === 'parent';

  const activeStudent = students ? (students.find(s => s.id === selectedStudentId) || students[0]) : null;

  // Badge counts for sub-items
  const studentConductLogs = conductLogs ? conductLogs.filter(l => l.studentId === activeStudent?.id) : [];
  const myAssignments = assignments ? assignments.filter(a => a.classTarget === activeStudent?.class) : [];
  const myEvaluations = teacherEvaluations
    ? teacherEvaluations.filter(e => e.raterRole === 'student' && e.raterName === activeStudent?.name)
    : [];

  const today = new Date(); today.setHours(0,0,0,0);
  const upcomingDeadlines = deadlines ? deadlines.filter(d => {
    if (d.done) return false;
    if (d.classTarget !== activeStudent?.class && d.classTarget !== 'personal') return false;
    const dl = new Date(d.date); dl.setHours(0,0,0,0);
    const diffDays = Math.ceil((dl - today) / 86400000);
    return diffDays <= 14;
  }) : [];

  const classStudents = students ? students.filter(s => s.class === '12A1') : [];
  const classLeaves = leaveRequests ? leaveRequests.filter(l => l.class === '12A1') : [];
  const pendingLeavesCount = classLeaves.filter(l => l.status === 'pending').length;
  const myCoverSchedules = teacherLeaveRequests ? teacherLeaveRequests.filter(r => r.substituteTeacherId === 'T01' && r.status === 'approved') : [];
  const myLessonPlans = lessonPlans ? lessonPlans.filter(p => p.teacherName === 'Nguyễn Minh Triết') : [];
  const pendingQAsCount = parentQAs ? parentQAs.filter(q => q.status === 'pending').length : 0;

  const getBadge = (id) => {
    if (isStudent) {
      if (id === 'deadlines')   return upcomingDeadlines.length || null;
      if (id === 'conduct')     return studentConductLogs.length || null;
      if (id === 'assignments') return myAssignments.length || null;
      if (id === 'evaluations') return myEvaluations.length || null;
    } else if (isTeacher) {
      if (id === 'qa')             return pendingQAsCount || null;
      if (id === 'leaves')         return pendingLeavesCount || null;
      if (id === 'teacher_leaves') return myCoverSchedules.length || null;
      if (id === 'lesson_plans')   return myLessonPlans.length || null;
      if (id === 'conduct')        return classStudents.length || null;
    } else if (isParent) {
      if (id === 'fees')        return (activeStudent?.feeStatus?.filter(f => !f.paid).length) || null;
      if (id === 'qa')          return (parentQAs && activeStudent ? parentQAs.filter(q => q.parentName === activeStudent.parentName).length : 0) || null;
      if (id === 'leaves')      return (leaveRequests && activeStudent ? leaveRequests.filter(l => l.studentId === activeStudent.id).length : 0) || null;
      if (id === 'evaluations') return (teacherEvaluations && activeStudent ? teacherEvaluations.filter(e => e.raterRole === 'parent' && e.raterName === activeStudent.parentName).length : 0) || null;
      if (id === 'assignments') return (assignments && activeStudent ? assignments.filter(a => a.classTarget === activeStudent.class).length : 0) || null;
    }
    return null;
  };

  const getBadgeColor = (id) => {
    if (id === 'deadlines') {
      const hasOverdue = upcomingDeadlines.some(d => new Date(d.date) < today);
      return hasOverdue ? '#ef4444' : 'var(--accent-ink)';
    }
    return 'var(--accent-ink)';
  };

  const getSections = () => {
    if (isStudent) return STUDENT_SECTIONS;
    if (isTeacher) return TEACHER_SECTIONS;
    if (isParent) return PARENT_SECTIONS;
    return ADMIN_SECTIONS;
  };

  const getProfileSub = () => {
    if (currentRole === 'admin')   return 'Ban Giám Hiệu';
    if (currentRole === 'teacher') return 'Môn Toán - Lớp 12A1';
    if (currentRole === 'student') return `Học sinh - Lớp ${activeStudent?.class || '12A1'}`;
    if (currentRole === 'parent')  return `Phụ huynh lớp ${activeStudent?.class || '12A1'}`;
    return 'EduPortal';
  };

  const getRoleSnapshot = () => {
    if (currentRole === 'admin')   return `${students?.length || 0} HS · ${(teachers || []).length} GV`;
    if (currentRole === 'teacher') return `${classStudents.length} HS 12A1 · ${pendingQAsCount} Q&A chờ`;
    if (currentRole === 'student') return `${upcomingDeadlines.length} deadline · ${myAssignments.length} bài tập`;
    if (currentRole === 'parent')  return `${activeStudent?.name || 'Học sinh'} · ${myAssignments.length} bài tập`;
    return 'Không gian làm việc';
  };

  const handleItemClick = (item) => {
    if (item.isSubTab) {
      setActiveTab('dashboard');
      if (isStudent) setStudentSubTab(item.id);
      else if (isTeacher) setTeacherSubTab(item.id);
      else if (isParent) setParentSubTab(item.id);
    } else {
      setActiveTab(item.id);
    }
  };

  const isItemActive = (item) => {
    if (item.isSubTab) {
      if (activeTab !== 'dashboard') return false;
      if (isStudent) return studentSubTab === item.id;
      else if (isTeacher) return teacherSubTab === item.id;
      else if (isParent) return parentSubTab === item.id;
      return false;
    }
    return activeTab === item.id;
  };

  const sections = getSections();

  return (
    <aside className="sidebar" style={{ overflowY: 'auto' }}>
      <div style={{ flex: 1 }}>
        {/* Logo */}
        <div className="logo-container">
          <GraduationCap className="logo-icon" size={32} color="var(--accent)" />
          <span className="logo-text">EduPortal</span>
        </div>

        {/* Workspace Card */}
        <div className="sidebar-mission-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div>
              <div className="mission-top">
                <span className="mission-dot" />
                <span>Workspace</span>
              </div>
              <strong>{getProfileSub()}</strong>
              <p>{getRoleSnapshot()}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Đăng xuất khỏi hệ thống"
              style={{
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                color: '#b91c1c',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
                marginTop: '2px',
                flexShrink: 0
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#dc2626';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                e.currentTarget.style.color = '#b91c1c';
              }}
            >
              <LogOut size={13} />
              <span>Thoát</span>
            </button>
          </div>
        </div>

        {/* Categorized Navigation Menu */}
        <nav className="nav-links" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="nav-section">
              {/* Section Header */}
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-tertiary, #475569)',
                letterSpacing: '0.06em',
                padding: '0 10px',
                marginBottom: '6px',
                textTransform: 'uppercase'
              }}>
                {t(section.title, DICT_EN[section.title] || section.title)}
              </div>

              {/* Items in Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = isItemActive(item);
                  const badge = getBadge(item.id);
                  const displayLabel = t(item.label, DICT_EN[item.label] || item.label);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`nav-item ${active ? 'active' : ''}`}
                      aria-label={displayLabel}
                      style={{
                        position: 'relative',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <Icon size={18} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayLabel}
                        </span>
                      </div>

                      {badge !== null && (
                        <span style={{
                          background: active 
                            ? (getBadgeColor(item.id) === '#dc2626' ? '#dc2626' : 'var(--accent-ink)')
                            : (getBadgeColor(item.id) === '#dc2626' ? 'rgba(220, 38, 38, 0.15)' : 'var(--accent-soft)'),
                          color: active 
                            ? 'white'
                            : (getBadgeColor(item.id) === '#dc2626' ? '#991b1b' : 'var(--accent-ink)'),
                          borderRadius: '99px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          flexShrink: 0
                        }}>
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Logout Button at bottom of Sidebar */}
          <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--line, rgba(255,255,255,0.1))' }}>
            <button
              onClick={logout}
              aria-label="Đăng xuất khỏi hệ thống"
              style={{
                width: '100%',
                color: '#b91c1c',
                fontWeight: 700,
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              <LogOut size={18} />
              <span>{t('Đăng xuất hệ thống', 'Log out system')}</span>
            </button>
          </div>
        </nav>

      </div>
    </aside>
  );
}
