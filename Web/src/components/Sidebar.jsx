import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  MessageSquare,
  DollarSign,
  FileText,
  GraduationCap,
  Award,
  LogOut,
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
  Bus
} from 'lucide-react';

// Sub-nav items for student dashboard
const STUDENT_SUB_ITEMS = [
  { id: 'overview',            label: 'Tổng Quan Học Tập',     icon: LayoutDashboard },
  { id: 'deadlines',           label: 'Deadline & Lịch Thi',    icon: AlarmClock },
  { id: 'mock_exams',          label: 'Thi Thử Đại Học',       icon: ClipboardList, studentOnly: true },
  { id: 'attendance',          label: 'Điểm Danh Chuyên Cần',  icon: ClipboardCheck },
  { id: 'conduct',             label: 'Rèn Luyện',             icon: Award },
  { id: 'assignments',         label: 'Bài Tập Về Nhà',        icon: CheckSquare },
  { id: 'library',             label: 'Học Liệu & Flashcards',  icon: Library },
  { id: 'clubs',               label: 'Câu Lạc Bộ',            icon: UsersRound },
  { id: 'counseling',          label: 'Tư Vấn & Hướng Nghiệp', icon: Brain, studentOnly: true },
  { id: 'evaluations',         label: 'Khảo Sát Giáo Viên',    icon: Star },
  { id: 'cafeteria',           label: 'Bán Trú & Dinh Dưỡng',  icon: UtensilsCrossed },
  { id: 'competency_heatmap',  label: 'Bản Đồ Năng Lực AI',   icon: Activity },
  { id: 'wallet_id',           label: 'Thẻ HS & Ví Điện Tử',  icon: CreditCard },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const {
    currentRole,
    selectedStudentId,
    students,
    logout,
    userSession,
    studentSubTab,
    setStudentSubTab,
    conductLogs,
    assignments,
    teacherEvaluations,
    deadlines
  } = useContext(AppContext);

  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const isStudent = currentRole === 'student';

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

  const getBadge = (id) => {
    if (id === 'deadlines')  return upcomingDeadlines.length || null;
    if (id === 'conduct')    return studentConductLogs.length || null;
    if (id === 'assignments') return myAssignments.length || null;
    if (id === 'evaluations') return myEvaluations.length || null;
    return null;
  };

  const getBadgeColor = (id) => {
    if (id === 'deadlines') {
      const hasOverdue = upcomingDeadlines.some(d => new Date(d.date) < today);
      return hasOverdue ? '#ef4444' : 'var(--accent-primary)';
    }
    return 'var(--accent-primary)';
  };

  const getNavItems = () => {
    switch (currentRole) {
      case 'admin':
        return [
          { id: 'dashboard',           label: 'Tổng quan BGH',        icon: LayoutDashboard },
          { id: 'students',            label: 'Quản lý Học sinh',     icon: Users },
          { id: 'teachers',            label: 'Quản lý Giáo viên',    icon: GraduationCap },
          { id: 'journal',             label: 'Sổ đầu bài',           icon: BookOpen },
          { id: 'bulletin',            label: 'Bảng Tin Trường',      icon: Megaphone },
          { id: 'exam_repository',     label: 'Kho Đề Thi',           icon: BookMarked },
          { id: 'asset_manager',       label: 'Tài Sản Trường',       icon: Layers },
          { id: 'teacher_attendance',  label: 'Chấm Công Giáo Viên',  icon: Clock },
          { id: 'bus_tracker',         label: 'Xe Bus Học Đường',     icon: Bus },
          { id: 'portfolio',           label: 'Học Bạ Số & CV',       icon: GraduationCap },
          { id: 'timetable_generator', label: 'Xếp TKB Thông Minh',   icon: Calendar },
          { id: 'calendar',            label: 'Thời khóa biểu',       icon: Calendar },
        ];
      case 'teacher':
        return [
          { id: 'dashboard',           label: 'Tổng quan lớp học',    icon: LayoutDashboard },
          { id: 'journal',             label: 'Ghi sổ đầu bài',      icon: BookOpen },
          { id: 'essay_grader',        label: 'AI Chấm Bài Luận',     icon: FileText },
          { id: 'portfolio',           label: 'Học Bạ Số & CV',       icon: GraduationCap },
          { id: 'qas',                 label: 'Hỏi đáp phụ huynh',   icon: MessageSquare },
          { id: 'chat',                label: 'Nhắn Tin Phụ Huynh',   icon: MessageCircle },
          { id: 'meeting_booking',     label: 'Lịch Hẹn Gặp Mặt',    icon: CalendarCheck },
          { id: 'bulletin',            label: 'Bảng Tin Trường',      icon: Megaphone },
          { id: 'exam_repository',     label: 'Kho Đề Thi',           icon: BookMarked },
          { id: 'teacher_attendance',  label: 'Chấm Công Giáo Viên',  icon: Clock },
          { id: 'asset_manager',       label: 'Đặt Phòng/Thiết Bị',   icon: Layers },
          { id: 'meet',                label: 'Phòng học EduMeet',    icon: Video },
          { id: 'calendar',            label: 'Thời khóa biểu',       icon: Calendar },
        ];
      case 'student':
        return [
          { id: 'canteen',             label: 'Căng tin Trường',      icon: UtensilsCrossed },
          { id: 'wellness',            label: 'Hỗ trợ Tâm lý',        icon: Brain },
          { id: 'study_group',         label: 'Học nhóm & Gia sư',    icon: Users },
          { id: 'library_hub',         label: 'Thư viện số',         icon: Library },
          { id: 'weblab',              label: 'Phòng Thí Nghiệm ảo',  icon: FlaskConical },
          { id: 'essay_grader',        label: 'AI Chấm Bài Luận',     icon: FileText },
          { id: 'bus_tracker',         label: 'Xe Bus Học Đường',     icon: Bus },
          { id: 'portfolio',           label: 'Học Bạ Số & CV',       icon: GraduationCap },
          { id: 'lectures',            label: 'Video bài giảng',      icon: FileText },
          { id: 'bulletin',            label: 'Bảng Tin Trường',      icon: Megaphone },
          { id: 'exam_repository',     label: 'Kho Đề Thi',           icon: BookMarked },
          { id: 'gamification',        label: 'Thành Tích & Xếp Hạng',icon: Trophy },
          { id: 'meet',                label: 'Vào lớp EduMeet',      icon: Video },
          { id: 'calendar',            label: 'Thời khóa biểu',       icon: Calendar },
        ];
      case 'parent':
        return [
          { id: 'dashboard',           label: 'Bảng điểm của con',    icon: Award },
          { id: 'bus_tracker',         label: 'Xe Bus Học Đường',     icon: Bus },
          { id: 'fees',                label: 'Đóng học phí',         icon: DollarSign },
          { id: 'qas',                 label: 'Hỏi đáp với GVCN',    icon: MessageSquare },
          { id: 'chat',                label: 'Nhắn Tin Giáo Viên',   icon: MessageCircle },
          { id: 'meeting_booking',     label: 'Đặt Lịch Gặp Mặt',    icon: CalendarCheck },
          { id: 'bulletin',            label: 'Bảng Tin Trường',      icon: Megaphone },
          { id: 'calendar',            label: 'Thời khóa biểu',       icon: Calendar },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

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

  return (
    <aside className="sidebar" style={{ overflowY: 'auto' }}>
      <div style={{ flex: 1 }}>
        {/* Logo */}
        <div className="logo-container">
          <GraduationCap className="logo-icon" size={32} color="var(--accent)" />
          <span className="logo-text">EduPortal</span>
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
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
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
                          background: isActive ? getBadgeColor(item.id) : (getBadgeColor(item.id) === '#ef4444' ? 'rgba(239, 68, 68, 0.15)' : 'var(--accent-soft)'),
                          color: isActive ? 'white' : getBadgeColor(item.id),
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
        {/* Logout */}
        <div style={{ padding: '0 8px 12px 8px' }}>
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{
              width: '100%', padding: '10px',
              display: 'flex', gap: '8px',
              color: 'var(--accent-danger)',
              borderColor: 'rgba(185, 28, 28, 0.15)',
              background: 'rgba(185, 28, 28, 0.04)'
            }}
          >
            <LogOut size={16} />
            <span style={{ fontWeight: 600 }}>Đăng xuất</span>
          </button>
        </div>

        {/* Profile widget */}
        <div className="user-profile-widget">
          <div className="avatar" style={{ background: 'var(--accent)' }}>
            {getProfileName().charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {getProfileName()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {getProfileSub()}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
