import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
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
  ChevronRight,
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
  Sparkles
} from 'lucide-react';

// Sub-nav items for student dashboard
// Nhóm: Tổng quan → Học tập & Học liệu → Điểm danh & Rèn luyện → Giao tiếp & Hoạt động lớp → Hướng nghiệp & Tiện ích
const STUDENT_SUB_ITEMS = [
  { id: 'overview',            label: 'Tổng Quan Học Tập',     icon: LayoutDashboard },
  { id: 'deadlines',           label: 'Deadline & Lịch Thi',    icon: AlarmClock },
  { id: 'assignments',         label: 'Bài Tập Về Nhà',        icon: CheckSquare },
  { id: 'library',             label: 'Học Liệu & Flashcards',  icon: Library },
  { id: 'mock_exams',          label: 'Thi Thử Đại Học',       icon: ClipboardList, studentOnly: true },
  { id: 'study_plan',          label: 'Kế Hoạch Ôn Thi AI',    icon: Target },
  { id: 'competency_heatmap',  label: 'Bản Đồ Năng Lực AI',   icon: Activity },
  { id: 'attendance',          label: 'Điểm Danh Chuyên Cần',  icon: ClipboardCheck },
  { id: 'conduct',             label: 'Rèn Luyện',             icon: Award },
  { id: 'class_chat',          label: 'Chat Nhóm Lớp',         icon: MessageSquare },
  { id: 'tournament',          label: 'Cuộc Thi Thách Đấu',    icon: Trophy },
  { id: 'clubs',               label: 'Câu Lạc Bộ',            icon: UsersRound },
  { id: 'counseling',          label: 'Tư Vấn & Hướng Nghiệp', icon: Brain },
  { id: 'university_matchmaker',  label: 'Định Hướng Đại Học AI', icon: GraduationCap },
  { id: 'cafeteria',           label: 'Bán Trú & Dinh Dưỡng',  icon: UtensilsCrossed },
  { id: 'wallet_id',           label: 'Thẻ HS & Ví Điện Tử',  icon: CreditCard },
];

// Sub-nav items for teacher dashboard
// Nhóm: Học sinh & Điểm → Điểm danh → Rèn luyện → Học liệu & Giáo án → Trợ lý AI → Bài tập → Thi thử → Phụ huynh & Nghỉ phép
const TEACHER_SUB_ITEMS = [
  { id: 'students',            label: 'Học Sinh & Điểm Số',    icon: Users },
  { id: 'attendance',          label: 'Điểm Danh Lớp',         icon: ClipboardCheck },
  { id: 'conduct',             label: 'Điểm Rèn Luyện Lớp',     icon: Award },
  { id: 'resources',           label: 'Học Liệu Bài Giảng',     icon: BookOpen },
  { id: 'lesson_plans',        label: 'Kế Hoạch Giáo Án',       icon: FileText },
  { id: 'ai_planner',          label: 'Trợ Lý Soạn Bài AI',    icon: Sparkles },
  { id: 'assignments',         label: 'Giao Bài Tập',          icon: CheckSquare },
  { id: 'mock_exams',          label: 'Điểm Thi Thử Lớp',      icon: ClipboardList },
  { id: 'qa',                  label: 'Hỏi Đáp Phụ Huynh',     icon: MessageSquare },
  { id: 'leaves',              label: 'Duyệt Nghỉ Phép',       icon: Calendar },
  { id: 'teacher_leaves',      label: 'Nghỉ Phép & Dạy Thay',   icon: Clock },
];

// Sub-nav items for parent dashboard
// Nhóm: Điểm & Chuyên cần → Bài tập → Tài chính → Bán trú & Ví → Hỏi đáp → Xin nghỉ phép → Đánh giá GV → Định hướng AI
const PARENT_SUB_ITEMS = [
  { id: 'grades',              label: 'Bảng Điểm & Ký Nhận',   icon: Award },
  { id: 'attendance',          label: 'Chuyên Cần Của Con',    icon: ClipboardCheck },
  { id: 'assignments',         label: 'Xem Bài Tập',           icon: CheckSquare },
  { id: 'fees',                label: 'Học Phí & Đóng Tiền',   icon: CreditCard },
  { id: 'cafeteria',           label: 'Bán Trú Con',           icon: UtensilsCrossed },
  { id: 'wallet',              label: 'Ví Điện Tử Con',        icon: CreditCard },
  { id: 'qa',                  label: 'Hỏi Đáp Chủ Nhiệm',     icon: MessageSquare },
  { id: 'leaves',              label: 'Xin Nghỉ Phép',         icon: Calendar },
  { id: 'evaluations',         label: 'Đánh Giá Giáo Viên',    icon: Star },
  { id: 'ai_guidance',         label: 'Định Hướng AI',         icon: Sparkles },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const {
    currentRole,
    selectedStudentId,
    students,
    teachers,
    userSession,
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
    lessonPlans
  } = useContext(AppContext);

  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const isStudent = currentRole === 'student';
  const isTeacher = currentRole === 'teacher';
  const isParent = currentRole === 'parent';

  // Badge counts for student sub-items
  const studentConductLogs = conductLogs ? conductLogs.filter(l => l.studentId === activeStudent?.id) : [];
  const myAssignments = assignments ? assignments.filter(a => a.classTarget === activeStudent?.class) : [];
  const myEvaluations = teacherEvaluations
    ? teacherEvaluations.filter(e => e.raterRole === 'student' && e.raterName === activeStudent?.name)
    : [];

  // Deadline badge: upcoming (not done) within 14 days + overdue
  const today = new Date(); today.setHours(0,0,0,0);
  const upcomingDeadlines = deadlines ? deadlines.filter(d => {
    if (d.done) return false;
    if (d.classTarget !== activeStudent?.class && d.classTarget !== 'personal') return false;
    const dl = new Date(d.date); dl.setHours(0,0,0,0);
    const diffDays = Math.ceil((dl - today) / 86400000);
    return diffDays <= 14;
  }) : [];

  // Badge counts for teacher sub-items
  const classStudents = students ? students.filter(s => s.class === '12A1') : [];
  const classLeaves = leaveRequests ? leaveRequests.filter(l => l.class === '12A1') : [];
  const pendingLeavesCount = classLeaves.filter(l => l.status === 'pending').length;
  const myCoverSchedules = teacherLeaveRequests ? teacherLeaveRequests.filter(r => r.substituteTeacherId === 'T01' && r.status === 'approved') : [];
  const myLessonPlans = lessonPlans ? lessonPlans.filter(p => p.teacherName === 'Nguyễn Minh Triết') : [];
  const pendingQAsCount = parentQAs ? parentQAs.filter(q => q.status === 'pending').length : 0;

  const getBadge = (id) => {
    if (isStudent) {
      if (id === 'deadlines')  return upcomingDeadlines.length || null;
      if (id === 'conduct')    return studentConductLogs.length || null;
      if (id === 'assignments') return myAssignments.length || null;
      if (id === 'evaluations') return myEvaluations.length || null;
    } else if (isTeacher) {
      if (id === 'qa') return pendingQAsCount || null;
      if (id === 'leaves') return pendingLeavesCount || null;
      if (id === 'teacher_leaves') return myCoverSchedules.length || null;
      if (id === 'lesson_plans') return myLessonPlans.length || null;
      if (id === 'conduct') return classStudents.length || null;
    } else if (isParent) {
      if (id === 'fees') return (activeStudent?.feeStatus.filter(f => !f.paid).length) || null;
      if (id === 'qa') return (parentQAs && activeStudent ? parentQAs.filter(q => q.parentName === activeStudent.parentName).length : 0) || null;
      if (id === 'leaves') return (leaveRequests && activeStudent ? leaveRequests.filter(l => l.studentId === activeStudent.id).length : 0) || null;
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

  const getNavItems = () => {
    switch (currentRole) {
      case 'admin':
        // Nhóm: Tổng quan → Quản lý & Nhân sự → Tổ chức dạy học → Phân tích AI → Truyền thông & Cơ sở vật chất → Lịch
        return [
          { id: 'dashboard',           label: 'Tổng quan BGH',        icon: LayoutDashboard },
          { id: 'teachers',            label: 'Quản lý Giáo viên',    icon: GraduationCap },
          { id: 'students',            label: 'Quản lý Học sinh',     icon: Users },
          { id: 'portfolio',           label: 'Học Bạ Số & CV',       icon: GraduationCap },
          { id: 'timetable_generator', label: 'Xếp TKB Thông Minh',   icon: Calendar },
          { id: 'journal',             label: 'Sổ đầu bài',           icon: BookOpen },
          { id: 'seating_chart',       label: 'Sơ Đồ Chỗ Ngồi Lớp',   icon: Layers },
          { id: 'class_voting',        label: 'Bầu Chọn Ban Cán Sự',  icon: ClipboardCheck },
          { id: 'exam_repository',     label: 'Kho Đề Thi',           icon: BookMarked },
          { id: 'ai_risk',             label: 'Phân Tích Nguy Cơ AI', icon: AlertTriangle },
          { id: 'class_comparison',    label: 'So Sánh Các Lớp',      icon: Activity },
          { id: 'duty_schedule',       label: 'Phân Công Lịch Trực',  icon: Calendar },
          { id: 'bulletin',            label: 'Bảng Tin Trường',      icon: Megaphone },
          { id: 'school_gallery',      label: 'Album Sự Kiện Trường', icon: Camera },
          { id: 'asset_manager',       label: 'Tài Sản Trường',       icon: Layers },
          { id: 'bus_tracker',         label: 'Xe Bus Học Đường',     icon: Bus },
          { id: 'calendar',            label: 'Thời khóa biểu',       icon: Calendar },
        ];
      case 'teacher':
        // Nhóm: Tổng quan → Nghiệp vụ dạy & Quản lý lớp → Công cụ & Đánh giá → Liên lạc PH → Tiện ích trường → Lịch
        return [
          { id: 'dashboard',           label: 'Tổng quan lớp học',    icon: LayoutDashboard },
          { id: 'journal',             label: 'Ghi sổ đầu bài',      icon: BookOpen },
          { id: 'seating_chart',       label: 'Sơ Đồ Chỗ Ngồi Lớp',   icon: Layers },
          { id: 'class_voting',        label: 'Bầu Chọn Ban Cán Sự',  icon: ClipboardCheck },
          { id: 'exam_repository',     label: 'Kho Đề Thi',           icon: BookMarked },
          { id: 'essay_grader',        label: 'AI Chấm Bài Luận',     icon: FileText },
          { id: 'ai_risk',             label: 'Học Sinh Nguy Cơ AI',  icon: AlertTriangle },
          { id: 'portfolio',           label: 'Học Bạ Số & CV',       icon: GraduationCap },
          { id: 'chat',                label: 'Nhắn Tin Phụ Huynh',   icon: MessageCircle },
          { id: 'meeting_booking',     label: 'Lịch Hẹn Gặp Mặt',    icon: CalendarCheck },
          { id: 'bulletin',            label: 'Bảng Tin Trường',      icon: Megaphone },
          { id: 'school_gallery',      label: 'Album Sự Kiện Trường', icon: Camera },
          { id: 'duty_schedule',       label: 'Lịch Trực Tuần GV',    icon: Calendar },
          { id: 'asset_manager',       label: 'Đặt Phòng/Thiết Bị',   icon: Layers },
          { id: 'meet',                label: 'Phòng học EduMeet',    icon: Video },
          { id: 'calendar',            label: 'Thời khóa biểu',       icon: Calendar },
        ];
      case 'student':
        // Nhóm: Tổng quan → Học tập & Tương tác → Đánh giá & Thành tích → Truyền thông → Đời sống & Tiện ích → Lịch
        return [
          { id: 'dashboard',           label: 'Bảng Điều Khiển HS',   icon: LayoutDashboard },
          { id: 'lectures',            label: 'Video bài giảng',      icon: FileText },
          { id: 'library_hub',         label: 'Thư viện số',         icon: Library },
          { id: 'weblab',              label: 'Phòng Thí Nghiệm ảo',  icon: FlaskConical },
          { id: 'study_group',         label: 'Học nhóm & Gia sư',    icon: Users },
          { id: 'meet',                label: 'Vào lớp EduMeet',      icon: Video },
          { id: 'seating_chart',       label: 'Sơ Đồ Chỗ Ngồi Lớp',  icon: Layers },
          { id: 'exam_repository',     label: 'Kho Đề Thi',           icon: BookMarked },
          { id: 'essay_grader',        label: 'AI Chấm Bài Luận',     icon: FileText },
          { id: 'gamification',        label: 'Thành Tích & Xếp Hạng',icon: Trophy },
          { id: 'portfolio',           label: 'Học Bạ Số & CV',       icon: GraduationCap },
          { id: 'bulletin',            label: 'Bảng Tin Trường',      icon: Megaphone },
          { id: 'school_gallery',      label: 'Album Sự Kiện Trường', icon: Camera },
          { id: 'wellness',            label: 'Hỗ trợ Tâm lý',        icon: Brain },
          { id: 'canteen',             label: 'Căng tin Trường',      icon: UtensilsCrossed },
          { id: 'bus_tracker',         label: 'Xe Bus Học Đường',     icon: Bus },
          { id: 'calendar',            label: 'Thời khóa biểu',       icon: Calendar },
        ];
      case 'parent':
        // Nhóm: Học tập & Lớp học → Giao tiếp & Cuộc hẹn → Thông tin trường & Xe bus → Lịch
        return [
          { id: 'dashboard',           label: 'Bảng điểm của con',    icon: Award },
          { id: 'seating_chart',       label: 'Sơ Đồ Chỗ Ngồi Lớp',  icon: Layers },
          { id: 'chat',                label: 'Nhắn Tin Giáo Viên',   icon: MessageCircle },
          { id: 'meeting_booking',     label: 'Đặt Lịch Gặp Mặt',    icon: CalendarCheck },
          { id: 'bulletin',            label: 'Bảng Tin Trường',      icon: Megaphone },
          { id: 'school_gallery',      label: 'Album Sự Kiện Trường', icon: Camera },
          { id: 'bus_tracker',         label: 'Xe Bus Học Đường',     icon: Bus },
          { id: 'calendar',            label: 'Thời khóa biểu',       icon: Calendar },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems().filter(item => {
    if (item.id === 'dashboard' && (isStudent || isTeacher || isParent)) return false;
    return true;
  });

  const getProfileName = () => {
    if (userSession) return userSession.displayName;
    if (currentRole === 'admin')   return 'Hiệu trưởng';
    if (currentRole === 'teacher') return 'Thầy Minh Triết';
    if (currentRole === 'student') return activeStudent?.name || 'Học sinh';
    if (currentRole === 'parent')  return activeStudent?.parentName ? `PH. ${activeStudent.parentName}` : 'Phụ huynh';
    return 'Người dùng';
  };

  const getProfileSub = () => {
    if (currentRole === 'admin')   return 'Ban Giám Hiệu';
    if (currentRole === 'teacher') return 'Môn Toán - Lớp 12A1';
    if (currentRole === 'student') return `Học sinh - Lớp ${activeStudent?.class}`;
    if (currentRole === 'parent')  return `Phụ huynh lớp ${activeStudent?.class}`;
    return 'EduPortal';
  };

  const getRoleSnapshot = () => {
    if (currentRole === 'admin') return `${students.length} HS · ${(teachers || []).length} GV`;
    if (currentRole === 'teacher') return `${classStudents.length} HS lớp 12A1 · ${pendingQAsCount} Q&A chờ`;
    if (currentRole === 'student') return `${upcomingDeadlines.length} deadline · ${myAssignments.length} bài tập`;
    if (currentRole === 'parent') return `${activeStudent?.name || 'Học sinh'} · ${myAssignments.length} bài tập`;
    return 'Không gian làm việc';
  };

  return (
    <aside className="sidebar" style={{ overflowY: 'auto' }}>
      <div style={{ flex: 1 }}>
        {/* Logo */}
        <div className="logo-container">
          <GraduationCap className="logo-icon" size={32} color="var(--accent)" />
          <span className="logo-text">EduPortal</span>
        </div>

        <div className="sidebar-mission-card">
          <div className="mission-top">
            <span className="mission-dot" />
            <span>Workspace</span>
          </div>
          <strong>{getProfileSub()}</strong>
          <p>{getRoleSnapshot()}</p>
        </div>

        <nav className="nav-links">
          {/* ── Student: "Học Tập" section as main dashboard entry ── */}
          {isStudent && (
            <>
              {/* Dashboard button that just returns to overview */}
              <button
                onClick={() => { setActiveTab('dashboard'); setStudentSubTab('overview'); }}
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                style={{ marginBottom: '2px' }}
              >
                <LayoutDashboard size={18} />
                <span>Bảng Học Tập</span>
              </button>

              {/* Sub-items — always visible for student */}
              <div style={{
                marginLeft: '10px',
                borderLeft: '2px solid var(--accent-soft)',
                paddingLeft: '8px',
                marginBottom: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1px'
              }}>
                {STUDENT_SUB_ITEMS.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === 'dashboard' && studentSubTab === item.id;
                  const badge = getBadge(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab('dashboard'); setStudentSubTab(item.id); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--accent-ink)' : 'var(--text-secondary)',
                        background: isActive
                          ? 'var(--accent-soft)'
                          : 'transparent',
                        transition: 'all 0.15s',
                        position: 'relative'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--accent-soft)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <Icon size={15} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                      {badge !== null && (
                        <span style={{
                          background: isActive 
                            ? (getBadgeColor(item.id) === '#ef4444' ? '#ef4444' : 'var(--accent-ink)')
                            : (getBadgeColor(item.id) === '#ef4444' ? 'rgba(239, 68, 68, 0.15)' : 'var(--accent-soft)'),
                          color: isActive 
                            ? 'white'
                            : (getBadgeColor(item.id) === '#ef4444' ? '#b91c1c' : 'var(--accent-ink)'),
                          borderRadius: '99px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          flexShrink: 0
                        }}>
                          {badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--line)', margin: '4px 8px 6px' }} />
            </>
          )}

          {/* ── Teacher: "Tổng quan lớp học" section as main dashboard entry ── */}
          {isTeacher && (
            <>
              {/* Dashboard button that just returns to students overview */}
              <button
                onClick={() => { setActiveTab('dashboard'); setTeacherSubTab('students'); }}
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                style={{ marginBottom: '2px' }}
              >
                <LayoutDashboard size={18} />
                <span>Tổng quan lớp học</span>
              </button>

              {/* Sub-items — always visible for teacher */}
              <div style={{
                marginLeft: '10px',
                borderLeft: '2px solid var(--accent-soft)',
                paddingLeft: '8px',
                marginBottom: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1px'
              }}>
                {TEACHER_SUB_ITEMS.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === 'dashboard' && teacherSubTab === item.id;
                  const badge = getBadge(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab('dashboard'); setTeacherSubTab(item.id); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--accent-ink)' : 'var(--text-secondary)',
                        background: isActive
                          ? 'var(--accent-soft)'
                          : 'transparent',
                        transition: 'all 0.15s',
                        position: 'relative'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--accent-soft)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <Icon size={15} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                      {badge !== null && (
                        <span style={{
                          background: isActive 
                            ? 'var(--accent-ink)'
                            : 'var(--accent-soft)',
                          color: isActive 
                            ? 'white'
                            : 'var(--accent-ink)',
                          borderRadius: '99px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          flexShrink: 0
                        }}>
                          {badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--line)', margin: '4px 8px 6px' }} />
            </>
          )}

          {/* ── Parent: "Bảng điểm của con" section as main dashboard entry ── */}
          {isParent && (
            <>
              {/* Dashboard button that just returns to grades overview */}
              <button
                onClick={() => { setActiveTab('dashboard'); setParentSubTab('grades'); }}
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                style={{ marginBottom: '2px' }}
              >
                <Award size={18} />
                <span>Bảng điểm của con</span>
              </button>

              {/* Sub-items — always visible for parent */}
              <div style={{
                marginLeft: '10px',
                borderLeft: '2px solid var(--accent-soft)',
                paddingLeft: '8px',
                marginBottom: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1px'
              }}>
                {PARENT_SUB_ITEMS.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === 'dashboard' && parentSubTab === item.id;
                  const badge = getBadge(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab('dashboard'); setParentSubTab(item.id); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--accent-ink)' : 'var(--text-secondary)',
                        background: isActive
                          ? 'var(--accent-soft)'
                          : 'transparent',
                        transition: 'all 0.15s',
                        position: 'relative'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--accent-soft)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <Icon size={15} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                      {badge !== null && (
                        <span style={{
                          background: isActive 
                            ? 'var(--accent-ink)'
                            : 'var(--accent-soft)',
                          color: isActive 
                            ? 'white'
                            : 'var(--accent-ink)',
                          borderRadius: '99px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          flexShrink: 0
                        }}>
                          {badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--line)', margin: '4px 8px 6px' }} />
            </>
          )}

          {/* Other nav items (non-dashboard pages) */}
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {/* Profile widget */}
        <div className="user-profile-widget">
          <div className="avatar" style={{ background: 'var(--accent)' }}>
            {getProfileName().charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {getProfileName()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {getProfileSub()}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
